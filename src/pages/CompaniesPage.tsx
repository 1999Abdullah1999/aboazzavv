import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/app-ui/PageHeader';
import SearchInput from '../components/app-ui/SearchInput';
import Button from '../components/app-ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '../components/app-ui/Card';
import ConfirmDialog from '../components/app-ui/ConfirmDialog';
import EmptyState from '../components/app-ui/EmptyState';
import PageSkeleton from '../components/layout/PageSkeleton';
import { StaggeredList, StaggeredItem } from '../components/layout/StaggeredList';
import CompanyFormModal from '../components/companies/CompanyFormModal';
import PaymentFormModal from '../components/payments/PaymentFormModal';
import { deleteCompany, getCompanies, getCompanyBalance } from '../services/store';
import type { Company } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

interface CompanyWithBalance extends Company {
  totalDue: number;
  totalPaid: number;
  remaining: number;
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<CompanyWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCompanyId, setPaymentCompanyId] = useState<string | undefined>(undefined);

  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const rows = await getCompanies();
      const balances = await Promise.all(rows.map((company) => getCompanyBalance(company.id)));
      const merged = rows.map((company, index) => ({ ...company, ...balances[index] }));
      setCompanies(merged);
    } catch {
      showToast('تعذر تحميل بيانات الشركات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(
    () => companies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase())),
    [companies, search],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCompany(deleteTarget.id);
      showToast('تم حذف الشركة', 'success');
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('تعذر حذف الشركة', 'error');
    }
  };

  if (loading) return <PageSkeleton variant="cards" />;

  return (
    <StaggeredList className="p-4 md:p-6 space-y-4">
      <StaggeredItem>
      <PageHeader
        title="الشركات"
        action={
          <Button
            onClick={() => {
              setEditingCompany(null);
              setCompanyModalOpen(true);
            }}
          >
            ➕ إضافة شركة
          </Button>
        }
      />

      </StaggeredItem>

      <StaggeredItem>
      <SearchInput value={search} onChange={setSearch} placeholder="🔍 ابحث عن شركة..." />
      </StaggeredItem>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🏢"
          message="لا توجد شركات حالياً"
          actionLabel="إضافة شركة"
          onAction={() => {
            setEditingCompany(null);
            setCompanyModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <StaggeredItem key={company.id}>
            <Card>
              <CardHeader>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">🏢 {company.name}</h3>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                <p>رقم التواصل: {company.phone || '—'}</p>
                <p className="text-orange-700 dark:text-orange-400">إجمالي المستحق: {formatCurrency(company.totalDue)}</p>
                <p className="text-green-700 dark:text-green-400">إجمالي المدفوع: {formatCurrency(company.totalPaid)}</p>
                <p className={company.remaining > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}>
                  المتبقي: {formatCurrency(company.remaining)}
                </p>
              </CardBody>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/companies/${company.id}`)}>تفاصيل</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCompany(company);
                    setCompanyModalOpen(true);
                  }}
                >
                  تعديل
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(company)}>حذف</Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setPaymentCompanyId(company.id);
                    setPaymentModalOpen(true);
                  }}
                >
                  ➕ تسجيل دفعة
                </Button>
              </CardFooter>
            </Card>
            </StaggeredItem>
          ))}
        </div>
      )}

      <CompanyFormModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        onSaved={loadData}
        company={editingCompany}
      />

      <PaymentFormModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSaved={loadData}
        defaultCompanyId={paymentCompanyId}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
        title="هل أنت متأكد من الحذف؟"
        message="الحذف نهائي ومش هينفع ترجعه"
      />
    </StaggeredList>
  );
}
