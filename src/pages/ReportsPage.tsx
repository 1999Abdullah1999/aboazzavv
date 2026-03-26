import { useEffect, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { getCompanies, getCompanyBalance, getCompanyStatement, getExpenses, getPayments, getTrips, getTrucks } from '../services/store';
import type { Company, Expense, Trip, Truck } from '../types';
import { exportToCSV } from '../utils/exportCSV';
import { printReport } from '../utils/printReport';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

type ReportType = 'truck' | 'company' | 'daily' | 'monthly';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [type, setType] = useState<ReportType>('truck');
  const [truckId, setTruckId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dailyDate, setDailyDate] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [resultTitle, setResultTitle] = useState('');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([getTrucks(), getCompanies()])
      .then(([truckRows, companyRows]) => {
        setTrucks(truckRows);
        setCompanies(companyRows);
      })
      .catch(() => {
        setTrucks([]);
        setCompanies([]);
      });
  }, []);

  const runReport = async () => {
    setLoading(true);
    try {
      if (type === 'truck') {
        if (!truckId) {
          showToast('اختار عربية', 'error');
          return;
        }
        const [tripRows, expenseRows] = await Promise.all([
          getTrips({ truck_id: truckId, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
          getExpenses({ truck_id: truckId, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        ]);
        const income = tripRows.reduce((sum, row) => sum + row.amount, 0);
        const expenses = expenseRows.reduce((sum, row) => sum + row.amount, 0);
        const truckName = trucks.find((truck) => truck.id === truckId)?.name || 'عربية';

        setResultTitle(`تقرير عربية: ${truckName}`);
        setSummary([
          `عدد النقلات: ${tripRows.length}`,
          `إجمالي الدخل: ${formatCurrency(income)}`,
          `إجمالي المصروفات: ${formatCurrency(expenses)}`,
          `صافي الربح: ${formatCurrency(income - expenses)}`,
        ]);
        setRows([
          ...tripRows.map((row) => ({
            النوع: 'نقلة',
            التاريخ: formatDate(row.date),
            البيان: `من ${row.from_location || '—'} إلى ${row.to_location || '—'}`,
            المبلغ: row.amount,
          })),
          ...expenseRows.map((row: Expense) => ({
            النوع: 'مصروف',
            التاريخ: formatDate(row.date),
            البيان: row.description || row.expense_type,
            المبلغ: row.amount,
          })),
        ]);
      }

      if (type === 'company') {
        if (!companyId) {
          showToast('اختار شركة', 'error');
          return;
        }
        const [statementRows, balance] = await Promise.all([
          getCompanyStatement(companyId, dateFrom || undefined, dateTo || undefined),
          getCompanyBalance(companyId),
        ]);
        const companyName = companies.find((company) => company.id === companyId)?.name || 'شركة';
        setResultTitle(`تقرير شركة: ${companyName}`);
        setSummary([
          `إجمالي المستحق: ${formatCurrency(balance.totalDue)}`,
          `إجمالي المدفوع: ${formatCurrency(balance.totalPaid)}`,
          `المتبقي: ${formatCurrency(balance.remaining)}`,
        ]);
        setRows(
          statementRows.map((row) => ({
            التاريخ: formatDate(row.date),
            البيان: row.description,
            مدين: row.debit,
            دائن: row.credit,
            الرصيد: row.runningBalance,
          })),
        );
      }

      if (type === 'daily') {
        if (!dailyDate) {
          showToast('اختار تاريخ', 'error');
          return;
        }
        const [tripRows, expenseRows, paymentRows] = await Promise.all([
          getTrips({ date_from: dailyDate, date_to: dailyDate }),
          getExpenses({ date_from: dailyDate, date_to: dailyDate }),
          getPayments({ date_from: dailyDate, date_to: dailyDate }),
        ]);
        const income = tripRows.reduce((sum, row) => sum + row.amount, 0);
        const expenses = expenseRows.reduce((sum, row) => sum + row.amount, 0);
        setResultTitle(`تقرير يومي: ${formatDate(dailyDate)}`);
        setSummary([
          `دخل اليوم: ${formatCurrency(income)}`,
          `مصروفات اليوم: ${formatCurrency(expenses)}`,
          `صافي اليوم: ${formatCurrency(income - expenses)}`,
          `مدفوعات الشركات: ${formatCurrency(paymentRows.reduce((sum, row) => sum + row.amount, 0))}`,
        ]);
        setRows([
          ...tripRows.map((row: Trip) => ({ النوع: 'نقلة', البيان: `${row.trucks?.name || '—'} - من ${row.from_location || '—'} إلى ${row.to_location || '—'}`, المبلغ: row.amount })),
          ...expenseRows.map((row: Expense) => ({ النوع: 'مصروف', البيان: `${row.trucks?.name || '—'} - ${row.description || row.expense_type}`, المبلغ: row.amount })),
          ...paymentRows.map((row) => ({ النوع: 'دفعة', البيان: row.companies?.name || '—', المبلغ: row.amount })),
        ]);
      }

      if (type === 'monthly') {
        const monthNum = Number(month);
        const yearNum = Number(year);
        const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
        const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-31`;

        const [tripRows, expenseRows, paymentRows] = await Promise.all([
          getTrips({ date_from: startDate, date_to: endDate }),
          getExpenses({ date_from: startDate, date_to: endDate }),
          getPayments({ date_from: startDate, date_to: endDate }),
        ]);

        const byTruck = trucks.map((truck) => {
          const income = tripRows.filter((row) => row.truck_id === truck.id).reduce((sum, row) => sum + row.amount, 0);
          const expenses = expenseRows.filter((row) => row.truck_id === truck.id).reduce((sum, row) => sum + row.amount, 0);
          return {
            العربية: truck.name,
            الدخل: income,
            المصروفات: expenses,
            الربح: income - expenses,
          };
        });

        setResultTitle(`تقرير شهري: ${month}/${year}`);
        setSummary([
          `إجمالي دخل الشهر: ${formatCurrency(tripRows.reduce((sum, row) => sum + row.amount, 0))}`,
          `إجمالي مصروفات الشهر: ${formatCurrency(expenseRows.reduce((sum, row) => sum + row.amount, 0))}`,
          `إجمالي دفعات الشركات: ${formatCurrency(paymentRows.reduce((sum, row) => sum + row.amount, 0))}`,
        ]);
        setRows(byTruck);
      }
    } catch {
      showToast('تعذر إنشاء التقرير', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="التقارير 📊" />

      <div className="flex flex-wrap gap-2">
        <Button variant={type === 'truck' ? 'primary' : 'outline'} onClick={() => setType('truck')}>تقرير عربية 🚛</Button>
        <Button variant={type === 'company' ? 'primary' : 'outline'} onClick={() => setType('company')}>تقرير شركة 🏢</Button>
        <Button variant={type === 'daily' ? 'primary' : 'outline'} onClick={() => setType('daily')}>تقرير يومي 📅</Button>
        <Button variant={type === 'monthly' ? 'primary' : 'outline'} onClick={() => setType('monthly')}>تقرير شهري 📆</Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900 dark:text-white">إعدادات التقرير</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {(type === 'truck' || type === 'company') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {type === 'truck' ? (
                <Select
                  label="العربية"
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  placeholder="اختار العربية"
                  options={trucks.map((truck) => ({ value: truck.id, label: truck.name }))}
                />
              ) : (
                <Select
                  label="الشركة"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="اختار الشركة"
                  options={companies.map((company) => ({ value: company.id, label: company.name }))}
                />
              )}
              <div>
                <label className="text-sm font-semibold">من تاريخ</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="text-sm font-semibold">إلى تاريخ</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
              </div>
            </div>
          )}

          {type === 'daily' && (
            <div>
              <label className="text-sm font-semibold">التاريخ</label>
              <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="w-full md:w-72 mt-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            </div>
          )}

          {type === 'monthly' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select
                label="الشهر"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              />
              <Select
                label="السنة"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                options={Array.from({ length: 5 }, (_, i) => {
                  const y = String(new Date().getFullYear() - i);
                  return { value: y, label: y };
                })}
              />
            </div>
          )}

          <Button onClick={() => void runReport()} loading={loading}>عرض التقرير</Button>
        </CardBody>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white">{resultTitle}</h3>
              <div className="flex gap-2 no-print">
                <Button variant="outline" onClick={() => printReport(resultTitle, summary, rows)}>🖨️ طباعة / تصدير</Button>
                <Button variant="outline" onClick={() => exportToCSV(rows, resultTitle.split(' ').join('_'))}>📥 تصدير CSV</Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-3 print-container">
            {summary.map((line) => (
              <p key={line} className="text-sm">• {line}</p>
            ))}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {Object.keys(rows[0]).map((key) => (
                      <th key={key} className="p-3 text-right">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={valueIndex} className="p-3">{String(value ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
