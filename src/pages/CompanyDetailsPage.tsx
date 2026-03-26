import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/app-ui/Button';
import Tabs from '../components/app-ui/Tabs';
import DateRangeFilter from '../components/app-ui/DateRangeFilter';
import EmptyState from '../components/app-ui/EmptyState';
import LoadingSpinner from '../components/app-ui/LoadingSpinner';
import StatCard from '../components/app-ui/StatCard';
import ConfirmDialog from '../components/app-ui/ConfirmDialog';
import TripFormModal from '../components/trips/TripFormModal';
import PaymentFormModal from '../components/payments/PaymentFormModal';
import {
  deletePayment,
  deleteTrip,
  getCompanyBalance,
  getCompanyById,
  getCompanyStatement,
  getPaymentsByCompany,
  getTripsByCompany,
} from '../services/store';
import type { Company, CompanyPayment, StatementRow, Trip } from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

type DeleteTarget = { type: 'trip' | 'payment'; id: string } | null;

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [balance, setBalance] = useState({ totalDue: 0, totalPaid: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingPayment, setEditingPayment] = useState<CompanyPayment | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [companyData, tripsData, paymentsData, statementData, balanceData] = await Promise.all([
        getCompanyById(id),
        getTripsByCompany(id),
        getPaymentsByCompany(id),
        getCompanyStatement(id, dateFrom || undefined, dateTo || undefined),
        getCompanyBalance(id),
      ]);
      setCompany(companyData);
      setTrips(tripsData);
      setPayments(paymentsData);
      setStatement(statementData);
      setBalance(balanceData);
    } catch {
      showToast('تعذر تحميل بيانات الشركة', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id, dateFrom, dateTo]);

  const filteredTrips = useMemo(
    () =>
      trips.filter((trip) => {
        if (dateFrom && trip.date < dateFrom) return false;
        if (dateTo && trip.date > dateTo) return false;
        return true;
      }),
    [trips, dateFrom, dateTo],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        if (dateFrom && payment.date < dateFrom) return false;
        if (dateTo && payment.date > dateTo) return false;
        return true;
      }),
    [payments, dateFrom, dateTo],
  );

  const tripsTotal = useMemo(() => filteredTrips.reduce((sum, row) => sum + row.amount, 0), [filteredTrips]);
  const paymentsTotal = useMemo(() => filteredPayments.reduce((sum, row) => sum + row.amount, 0), [filteredPayments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'trip') {
        await deleteTrip(deleteTarget.id);
        showToast('تم حذف النقلة', 'success');
      } else {
        await deletePayment(deleteTarget.id);
        showToast('تم حذف الدفعة', 'success');
      }
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('تعذر تنفيذ الحذف', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!company) return <EmptyState icon="🏢" message="الشركة غير موجودة" />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon="🏢" title="إجمالي المستحق" value={formatCurrency(balance.totalDue)} color="orange" />
        <StatCard icon="💵" title="المدفوع" value={formatCurrency(balance.totalPaid)} color="green" />
        <StatCard icon="📌" title="المتبقي" value={formatCurrency(balance.remaining)} color={balance.remaining > 0 ? 'red' : 'green'} />
      </div>

      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={() => {
          setDateFrom('');
          setDateTo('');
        }}
      />

      <Tabs
        tabs={[
          { id: 'trips', label: 'النقلات' },
          { id: 'payments', label: 'المدفوعات' },
          { id: 'statement', label: 'كشف حساب' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'trips' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingTrip(null); setTripModalOpen(true); }}>➕ إضافة نقلة</Button>
          </div>
          {filteredTrips.length === 0 ? (
            <EmptyState icon="🔄" message="لا توجد نقلات" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-right">التاريخ</th>
                    <th className="p-3 text-right">العربية</th>
                    <th className="p-3 text-right">من</th>
                    <th className="p-3 text-right">إلى</th>
                    <th className="p-3 text-right">المبلغ</th>
                    <th className="p-3 text-right">المدفوع</th>
                    <th className="p-3 text-right">الباقي</th>
                    <th className="p-3 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-3">{formatDate(trip.date)}</td>
                      <td className="p-3">{trip.trucks?.name || '—'}</td>
                      <td className="p-3">{trip.from_location || '—'}</td>
                      <td className="p-3">{trip.to_location || '—'}</td>
                      <td className="p-3">{formatCurrency(trip.amount)}</td>
                      <td className="p-3">{formatCurrency(trip.amount_paid)}</td>
                      <td className="p-3">{formatCurrency(Math.max(0, trip.amount - trip.amount_paid))}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingTrip(trip); setTripModalOpen(true); }}>تعديل</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'trip', id: trip.id })}>حذف</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                    <td className="p-3" colSpan={4}>الإجمالي</td>
                    <td className="p-3">{formatCurrency(tripsTotal)}</td>
                    <td className="p-3" colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'payments' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => { setEditingPayment(null); setPaymentModalOpen(true); }}>➕ إضافة دفعة</Button>
          </div>
          {filteredPayments.length === 0 ? (
            <EmptyState icon="💳" message="لا توجد دفعات" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-right">التاريخ</th>
                    <th className="p-3 text-right">المبلغ</th>
                    <th className="p-3 text-right">طريقة الدفع</th>
                    <th className="p-3 text-right">ملاحظات</th>
                    <th className="p-3 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-3">{formatDate(payment.date)}</td>
                      <td className="p-3">{formatCurrency(payment.amount)}</td>
                      <td className="p-3">{PAYMENT_METHOD_LABELS[payment.payment_method]}</td>
                      <td className="p-3">{payment.notes || '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingPayment(payment); setPaymentModalOpen(true); }}>تعديل</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'payment', id: payment.id })}>حذف</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                    <td className="p-3">الإجمالي</td>
                    <td className="p-3">{formatCurrency(paymentsTotal)}</td>
                    <td className="p-3" colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'statement' && (
        <section className="space-y-3">
          {statement.length === 0 ? (
            <EmptyState icon="📄" message="لا توجد حركة في كشف الحساب" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-right">التاريخ</th>
                    <th className="p-3 text-right">البيان</th>
                    <th className="p-3 text-right">مدين</th>
                    <th className="p-3 text-right">دائن</th>
                    <th className="p-3 text-right">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((row, index) => (
                    <tr key={`${row.date}-${row.description}-${index}`} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-3">{formatDate(row.date)}</td>
                      <td className="p-3">{row.description}</td>
                      <td className="p-3">{row.debit ? formatCurrency(row.debit) : '—'}</td>
                      <td className="p-3">{row.credit ? formatCurrency(row.credit) : '—'}</td>
                      <td className={`p-3 font-semibold ${row.runningBalance > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                        {formatCurrency(row.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <TripFormModal
        isOpen={tripModalOpen}
        onClose={() => setTripModalOpen(false)}
        onSaved={loadData}
        trip={editingTrip}
        defaultCompanyId={company.id}
      />

      <PaymentFormModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSaved={loadData}
        payment={editingPayment}
        defaultCompanyId={company.id}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
        title="هل أنت متأكد من الحذف؟"
        message="الحذف نهائي ومش هينفع ترجعه"
      />
    </div>
  );
}
