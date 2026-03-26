import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import DateRangeFilter from '../components/ui/DateRangeFilter';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TripFormModal from '../components/trips/TripFormModal';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import {
  deleteExpense,
  deleteTrip,
  getExpenses,
  getTruckById,
  getTruckProfit,
  getTrips,
} from '../services/store';
import type { Expense, Trip, Truck } from '../types';
import { EXPENSE_TYPE_LABELS, TRUCK_STATUS_LABELS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

type DeleteTarget = { type: 'trip' | 'expense'; id: string } | null;

function getTripStatus(amount: number, amountPaid: number) {
  if (amountPaid <= 0) return { text: 'غير مدفوعة', color: 'red' as const };
  if (amountPaid < amount) return { text: 'مدفوعة جزئياً', color: 'orange' as const };
  return { text: 'مدفوعة', color: 'green' as const };
}

export default function TruckDetailsPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [truck, setTruck] = useState<Truck | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profit, setProfit] = useState({ income: 0, expenses: 0, profit: 0 });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('trips');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [truckData, tripRows, expenseRows, profitData] = await Promise.all([
        getTruckById(id),
        getTrips({ truck_id: id, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        getExpenses({ truck_id: id, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        getTruckProfit(id),
      ]);
      setTruck(truckData);
      setTrips(tripRows);
      setExpenses(expenseRows);
      setProfit(profitData);
    } catch {
      showToast('تعذر تحميل بيانات العربية', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id, dateFrom, dateTo]);

  const totalTripAmount = useMemo(() => trips.reduce((sum, row) => sum + row.amount, 0), [trips]);
  const totalTripPaid = useMemo(() => trips.reduce((sum, row) => sum + row.amount_paid, 0), [trips]);
  const totalExpenseAmount = useMemo(() => expenses.reduce((sum, row) => sum + row.amount, 0), [expenses]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'trip') {
        await deleteTrip(deleteTarget.id);
        showToast('تم حذف النقلة', 'success');
      } else {
        await deleteExpense(deleteTarget.id);
        showToast('تم حذف المصروف', 'success');
      }
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('تعذر تنفيذ الحذف', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!truck) return <EmptyState icon="🚛" message="العربية غير موجودة" />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{truck.name}</h1>
        <Badge color={truck.status === 'active' ? 'green' : truck.status === 'inactive' ? 'red' : 'yellow'}>
          {TRUCK_STATUS_LABELS[truck.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon="💰" title="الدخل" value={formatCurrency(profit.income)} color="green" />
        <StatCard icon="💸" title="المصروفات" value={formatCurrency(profit.expenses)} color="red" />
        <StatCard icon="📊" title="الربح" value={formatCurrency(profit.profit)} color={profit.profit >= 0 ? 'blue' : 'red'} />
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
          { id: 'expenses', label: 'المصروفات' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'trips' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingTrip(null);
                setTripModalOpen(true);
              }}
            >
              ➕ إضافة نقلة
            </Button>
          </div>

          {trips.length === 0 ? (
            <EmptyState icon="🔄" message="لا توجد نقلات لهذه العربية" />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">الشركة</th>
                      <th className="p-3 text-right">من</th>
                      <th className="p-3 text-right">إلى</th>
                      <th className="p-3 text-right">المبلغ</th>
                      <th className="p-3 text-right">المدفوع</th>
                      <th className="p-3 text-right">الباقي</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => {
                      const status = getTripStatus(trip.amount, trip.amount_paid);
                      return (
                        <tr key={trip.id} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="p-3">{formatDate(trip.date)}</td>
                          <td className="p-3">{trip.companies?.name || trip.company_name_text || 'شغل خارجي'}</td>
                          <td className="p-3">{trip.from_location || '—'}</td>
                          <td className="p-3">{trip.to_location || '—'}</td>
                          <td className="p-3">{formatCurrency(trip.amount)}</td>
                          <td className="p-3">{formatCurrency(trip.amount_paid)}</td>
                          <td className="p-3">{formatCurrency(Math.max(0, trip.amount - trip.amount_paid))}</td>
                          <td className="p-3">
                            <Badge color={status.color}>{status.text}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingTrip(trip);
                                  setTripModalOpen(true);
                                }}
                              >
                                تعديل
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'trip', id: trip.id })}>
                                حذف
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                      <td className="p-3" colSpan={4}>
                        الإجمالي
                      </td>
                      <td className="p-3">{formatCurrency(totalTripAmount)}</td>
                      <td className="p-3">{formatCurrency(totalTripPaid)}</td>
                      <td className="p-3">{formatCurrency(Math.max(0, totalTripAmount - totalTripPaid))}</td>
                      <td className="p-3" colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {trips.map((trip) => {
                  const status = getTripStatus(trip.amount, trip.amount_paid);
                  return (
                    <div key={trip.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                      <div className="flex justify-between">
                        <p className="font-semibold">{formatDate(trip.date)}</p>
                        <Badge color={status.color}>{status.text}</Badge>
                      </div>
                      <p>{trip.companies?.name || trip.company_name_text || 'شغل خارجي'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">من {trip.from_location || '—'} إلى {trip.to_location || '—'}</p>
                      <p className="text-sm">المبلغ: {formatCurrency(trip.amount)}</p>
                      <p className="text-sm">المدفوع: {formatCurrency(trip.amount_paid)}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTrip(trip); setTripModalOpen(true); }}>تعديل</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'trip', id: trip.id })}>حذف</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === 'expenses' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
            >
              ➕ إضافة مصروف
            </Button>
          </div>

          {expenses.length === 0 ? (
            <EmptyState icon="💸" message="لا توجد مصروفات لهذه العربية" />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">النوع</th>
                      <th className="p-3 text-right">المبلغ</th>
                      <th className="p-3 text-right">الوصف</th>
                      <th className="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="p-3">{formatDate(expense.date)}</td>
                        <td className="p-3">{EXPENSE_TYPE_LABELS[expense.expense_type]}</td>
                        <td className="p-3">{formatCurrency(expense.amount)}</td>
                        <td className="p-3">{expense.description || '—'}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingExpense(expense); setExpenseModalOpen(true); }}>تعديل</Button>
                            <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'expense', id: expense.id })}>حذف</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                      <td className="p-3" colSpan={2}>الإجمالي</td>
                      <td className="p-3">{formatCurrency(totalExpenseAmount)}</td>
                      <td className="p-3" colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {expenses.map((expense) => (
                  <div key={expense.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                    <div className="flex justify-between">
                      <p className="font-semibold">{formatDate(expense.date)}</p>
                      <p>{formatCurrency(expense.amount)}</p>
                    </div>
                    <p>{EXPENSE_TYPE_LABELS[expense.expense_type]}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{expense.description || '—'}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingExpense(expense); setExpenseModalOpen(true); }}>تعديل</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'expense', id: expense.id })}>حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <TripFormModal
        isOpen={tripModalOpen}
        onClose={() => setTripModalOpen(false)}
        onSaved={loadData}
        trip={editingTrip}
        defaultTruckId={truck.id}
      />

      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={loadData}
        expense={editingExpense}
        defaultTruckId={truck.id}
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
