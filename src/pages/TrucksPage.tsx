import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TruckFormModal from '../components/trucks/TruckFormModal';
import { useToast } from '../contexts/ToastContext';
import { deleteTruck, getTruckProfit, getTrucks } from '../services/store';
import type { Truck } from '../types';
import { TRUCK_STATUS_LABELS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

type TruckStatusBadge = 'green' | 'red' | 'yellow';

interface TruckWithProfit extends Truck {
  income: number;
  expenses: number;
  profit: number;
}

function getStatusColor(status: Truck['status']): TruckStatusBadge {
  if (status === 'active') return 'green';
  if (status === 'inactive') return 'red';
  return 'yellow';
}

export default function TrucksPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trucks, setTrucks] = useState<TruckWithProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Truck | null>(null);
  const [truckModalOpen, setTruckModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);

  const totalProfit = useMemo(() => trucks.reduce((sum, truck) => sum + truck.profit, 0), [trucks]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const truckRows = await getTrucks();
      const profits = await Promise.all(truckRows.map((truck) => getTruckProfit(truck.id)));

      const merged: TruckWithProfit[] = truckRows.map((truck, index) => ({
        ...truck,
        income: profits[index].income,
        expenses: profits[index].expenses,
        profit: profits[index].profit,
      }));

      setTrucks(merged);
    } catch {
      setError('حصل خطأ أثناء تحميل بيانات العربيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      await deleteTruck(deleteTarget.id);
      showToast('تم حذف العربية بنجاح', 'success');
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('فشل حذف العربية', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="العربيات"
        subtitle={`إجمالي الربح الحالي: ${formatCurrency(totalProfit)}`}
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditingTruck(null);
              setTruckModalOpen(true);
            }}
            loading={submitting}
          >
            ➕ إضافة عربية
          </Button>
        }
      />

      {error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      {trucks.length === 0 ? (
        <EmptyState
          icon="🚛"
          message="مفيش عربيات لسه 🚛"
          actionLabel="إضافة عربية"
          onAction={() => {
            setEditingTruck(null);
            setTruckModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trucks.map((truck) => (
            <Card key={truck.id}>
              <CardHeader className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">🚛 {truck.name}</h3>
                <Badge color={getStatusColor(truck.status)}>{TRUCK_STATUS_LABELS[truck.status] || truck.status}</Badge>
              </CardHeader>

              <CardBody className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">رقم اللوحة: {truck.plate_number || '—'}</p>
                <p className="text-gray-700 dark:text-gray-300">نوع العربية: {truck.truck_type || '—'}</p>
                <p className="text-green-700 dark:text-green-400">الدخل: {formatCurrency(truck.income)}</p>
                <p className="text-red-700 dark:text-red-400">المصروفات: {formatCurrency(truck.expenses)}</p>
                <p className={truck.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}>
                  الربح: {formatCurrency(truck.profit)}
                </p>
              </CardBody>

              <CardFooter className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/trucks/${truck.id}`)}>
                  تفاصيل
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTruck(truck);
                    setTruckModalOpen(true);
                  }}
                >
                  تعديل
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(truck)}>
                  حذف
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="هل أنت متأكد من الحذف؟"
        message="الحذف نهائي ومش هينفع ترجعه"
        loading={submitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      <TruckFormModal
        isOpen={truckModalOpen}
        onClose={() => setTruckModalOpen(false)}
        onSaved={loadData}
        truck={editingTruck}
      />
    </div>
  );
}