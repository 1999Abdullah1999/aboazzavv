import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PaymentFormModal from '../components/payments/PaymentFormModal';
import { deletePayment, getCompanies, getPayments } from '../services/store';
import type { Company, CompanyPayment } from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

export default function PaymentsPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CompanyPayment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pageSize = 15;

  const loadData = async () => {
    setLoading(true);
    try {
      const [companyRows, paymentRows] = await Promise.all([
        getCompanies(),
        getPayments({
          company_id: companyFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      ]);
      setCompanies(companyRows);
      setPayments(paymentRows);
      setPage(1);
    } catch {
      showToast('تعذر تحميل المدفوعات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const paginated = useMemo(() => payments.slice((page - 1) * pageSize, page * pageSize), [payments, page]);
  const pagesCount = Math.max(1, Math.ceil(payments.length / pageSize));
  const totalAmount = useMemo(() => payments.reduce((sum, row) => sum + row.amount, 0), [payments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePayment(deleteId);
      showToast('تم حذف الدفعة', 'success');
      setDeleteId(null);
      await loadData();
    } catch {
      showToast('تعذر حذف الدفعة', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="مدفوعات الشركات"
        action={<Button onClick={() => { setEditingPayment(null); setModalOpen(true); }}>➕ تسجيل دفعة</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <Select
          label="الشركة"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          placeholder="الكل"
          options={companies.map((company) => ({ value: company.id, label: company.name }))}
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
              setCompanyFilter('');
              setDateFrom('');
              setDateTo('');
              void loadData();
            }}
          >
            مسح
          </Button>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon="💳" message="لا توجد مدفوعات" />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">الشركة</th>
                  <th className="p-3 text-right">المبلغ</th>
                  <th className="p-3 text-right">طريقة الدفع</th>
                  <th className="p-3 text-right">ملاحظات</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((payment) => (
                  <tr key={payment.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-3">{formatDate(payment.date)}</td>
                    <td className="p-3">{payment.companies?.name || '—'}</td>
                    <td className="p-3">{formatCurrency(payment.amount)}</td>
                    <td className="p-3">{PAYMENT_METHOD_LABELS[payment.payment_method]}</td>
                    <td className="p-3">{payment.notes || '—'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingPayment(payment); setModalOpen(true); }}>تعديل</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteId(payment.id)}>حذف</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid gap-3">
            {paginated.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="font-semibold">{formatDate(payment.date)}</p>
                  <p>{formatCurrency(payment.amount)}</p>
                </div>
                <p>الشركة: {payment.companies?.name || '—'}</p>
                <p>{PAYMENT_METHOD_LABELS[payment.payment_method]}</p>
                <p>{payment.notes || '—'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingPayment(payment); setModalOpen(true); }}>تعديل</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(payment.id)}>حذف</Button>
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

      <PaymentFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadData} payment={editingPayment} />

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
