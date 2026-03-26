import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import { deleteExpense, getExpenses, getTrucks } from '../services/store';
import type { Expense, ExpenseType, Truck } from '../types';
import { EXPENSE_TYPE_COLORS, EXPENSE_TYPE_LABELS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [truckFilter, setTruckFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pageSize = 15;

  const loadData = async () => {
    setLoading(true);
    try {
      const [truckRows, expenseRows] = await Promise.all([
        getTrucks(),
        getExpenses({
          truck_id: truckFilter || undefined,
          expense_type: (typeFilter || undefined) as ExpenseType | undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      ]);
      setTrucks(truckRows);
      setExpenses(expenseRows);
      setPage(1);
    } catch {
      showToast('تعذر تحميل المصروفات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const paginated = useMemo(() => expenses.slice((page - 1) * pageSize, page * pageSize), [expenses, page]);
  const pagesCount = Math.max(1, Math.ceil(expenses.length / pageSize));
  const totalAmount = useMemo(() => expenses.reduce((sum, row) => sum + row.amount, 0), [expenses]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId);
      showToast('تم حذف المصروف', 'success');
      setDeleteId(null);
      await loadData();
    } catch {
      showToast('تعذر حذف المصروف', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="المصروفات"
        action={<Button variant="danger" onClick={() => { setEditingExpense(null); setModalOpen(true); }}>➕ إضافة مصروف</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <Select
          label="العربية"
          value={truckFilter}
          onChange={(e) => setTruckFilter(e.target.value)}
          placeholder="الكل"
          options={trucks.map((truck) => ({ value: truck.id, label: truck.name }))}
        />
        <Select
          label="نوع المصروف"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="الكل"
          options={Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">من تاريخ</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">إلى تاريخ</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => void loadData()}>بحث</Button>
          <Button
            variant="outline"
            onClick={() => {
              setTruckFilter('');
              setTypeFilter('');
              setDateFrom('');
              setDateTo('');
              void loadData();
            }}
          >
            مسح
          </Button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon="💸" message="لا توجد مصروفات" />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">العربية</th>
                  <th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">المبلغ</th>
                  <th className="p-3 text-right">الوصف</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((expense) => (
                  <tr key={expense.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-3">{formatDate(expense.date)}</td>
                    <td className="p-3">{expense.trucks?.name || '—'}</td>
                    <td className="p-3">
                      <Badge color={(EXPENSE_TYPE_COLORS[expense.expense_type] as 'blue' | 'orange' | 'purple' | 'green' | 'yellow' | 'cyan' | 'gray')}>
                        {EXPENSE_TYPE_LABELS[expense.expense_type]}
                      </Badge>
                    </td>
                    <td className="p-3">{formatCurrency(expense.amount)}</td>
                    <td className="p-3">{expense.description || '—'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingExpense(expense); setModalOpen(true); }}>تعديل</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteId(expense.id)}>حذف</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid gap-3">
            {paginated.map((expense) => (
              <div key={expense.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="font-semibold">{formatDate(expense.date)}</p>
                  <p>{formatCurrency(expense.amount)}</p>
                </div>
                <p>العربية: {expense.trucks?.name || '—'}</p>
                <Badge color={(EXPENSE_TYPE_COLORS[expense.expense_type] as 'blue' | 'orange' | 'purple' | 'green' | 'yellow' | 'cyan' | 'gray')}>
                  {EXPENSE_TYPE_LABELS[expense.expense_type]}
                </Badge>
                <p>{expense.description || '—'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingExpense(expense); setModalOpen(true); }}>تعديل</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(expense.id)}>حذف</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">الإجمالي: {formatCurrency(totalAmount)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>السابق</Button>
              <span className="text-sm px-2 py-1">{page} / {pagesCount}</span>
              <Button variant="outline" size="sm" disabled={page >= pagesCount} onClick={() => setPage((prev) => prev + 1)}>التالي</Button>
            </div>
          </div>
        </>
      )}

      <ExpenseFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadData} expense={editingExpense} />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteId(null)}
        title="هل أنت متأكد من الحذف؟"
        message="الحذف نهائي ومش هينفع ترجعه"
      />
    </div>
  );
}
