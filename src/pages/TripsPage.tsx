import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TripFormModal from '../components/trips/TripFormModal';
import { deleteTrip, getCompanies, getTrips, getTrucks } from '../services/store';
import type { Company, Trip, Truck } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

type SortKey = 'date' | 'amount' | 'amount_paid';

function getStatus(amount: number, paid: number) {
  if (paid >= amount) return { label: 'مدفوعة بالكامل', color: 'green' as const };
  if (paid > 0) return { label: 'مدفوعة جزئياً', color: 'orange' as const };
  return { label: 'غير مدفوعة', color: 'red' as const };
}

export default function TripsPage() {
  const { showToast } = useToast();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [truckFilter, setTruckFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pageSize = 15;

  const loadData = async () => {
    setLoading(true);
    try {
      const [truckRows, companyRows, tripRows] = await Promise.all([
        getTrucks(),
        getCompanies(),
        getTrips({
          truck_id: truckFilter || undefined,
          company_id: companyFilter && companyFilter !== 'external' ? companyFilter : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      ]);
      setTrucks(truckRows);
      setCompanies(companyRows);
      setTrips(companyFilter === 'external' ? tripRows.filter((trip) => !trip.company_id) : tripRows);
      setPage(1);
    } catch {
      showToast('تعذر تحميل النقلات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sortedTrips = useMemo(() => {
    const rows = [...trips];
    rows.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'date') return a.date.localeCompare(b.date) * direction;
      return ((a[sortKey] as number) - (b[sortKey] as number)) * direction;
    });
    return rows;
  }, [trips, sortKey, sortDirection]);

  const paginatedTrips = useMemo(() => sortedTrips.slice((page - 1) * pageSize, page * pageSize), [sortedTrips, page]);
  const pagesCount = Math.max(1, Math.ceil(sortedTrips.length / pageSize));
  const totalAmount = useMemo(() => sortedTrips.reduce((sum, trip) => sum + trip.amount, 0), [sortedTrips]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTrip(deleteId);
      showToast('تم حذف النقلة', 'success');
      setDeleteId(null);
      await loadData();
    } catch {
      showToast('تعذر حذف النقلة', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="النقلات"
        action={<Button variant="success" onClick={() => { setEditingTrip(null); setModalOpen(true); }}>➕ إضافة نقلة</Button>}
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
          label="الشركة"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          placeholder="الكل"
          options={[{ value: 'external', label: 'شغل خارجي' }, ...companies.map((company) => ({ value: company.id, label: company.name }))]}
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

      {sortedTrips.length === 0 ? (
        <EmptyState icon="🔄" message="لا توجد نقلات" />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('date')}>التاريخ</th>
                  <th className="p-3 text-right">العربية</th>
                  <th className="p-3 text-right">الشركة</th>
                  <th className="p-3 text-right">من ← إلى</th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('amount')}>المبلغ</th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('amount_paid')}>المدفوع</th>
                  <th className="p-3 text-right">الباقي</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrips.map((trip) => {
                  const status = getStatus(trip.amount, trip.amount_paid);
                  return (
                    <tr key={trip.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-3">{formatDate(trip.date)}</td>
                      <td className="p-3">{trip.trucks?.name || '—'}</td>
                      <td className="p-3">{trip.companies?.name || trip.company_name_text || 'شغل خارجي'}</td>
                      <td className="p-3">من {trip.from_location || '—'} إلى {trip.to_location || '—'}</td>
                      <td className="p-3">{formatCurrency(trip.amount)}</td>
                      <td className="p-3">{formatCurrency(trip.amount_paid)}</td>
                      <td className="p-3">{formatCurrency(Math.max(0, trip.amount - trip.amount_paid))}</td>
                      <td className="p-3"><Badge color={status.color}>{status.label}</Badge></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingTrip(trip); setModalOpen(true); }}>✏️</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteId(trip.id)}>🗑️</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid gap-3">
            {paginatedTrips.map((trip) => {
              const status = getStatus(trip.amount, trip.amount_paid);
              return (
                <div key={trip.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                  <div className="flex justify-between">
                    <p className="font-semibold">{formatDate(trip.date)}</p>
                    <Badge color={status.color}>{status.label}</Badge>
                  </div>
                  <p>العربية: {trip.trucks?.name || '—'}</p>
                  <p>الشركة: {trip.companies?.name || trip.company_name_text || 'شغل خارجي'}</p>
                  <p>من {trip.from_location || '—'} إلى {trip.to_location || '—'}</p>
                  <p>المبلغ: {formatCurrency(trip.amount)}</p>
                  <p>المدفوع: {formatCurrency(trip.amount_paid)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingTrip(trip); setModalOpen(true); }}>✏️ تعديل</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(trip.id)}>🗑️ حذف</Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 dark:text-white">الإجمالي: {formatCurrency(totalAmount)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>السابق</Button>
              <span className="text-sm px-2 py-1">{page} / {pagesCount}</span>
              <Button variant="outline" size="sm" disabled={page >= pagesCount} onClick={() => setPage((prev) => prev + 1)}>التالي</Button>
            </div>
          </div>
        </>
      )}

      <TripFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadData} trip={editingTrip} />

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
