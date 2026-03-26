import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { addTrip, getCompanies, getTrucks, updateTrip } from '../../services/store';
import type { Company, Trip, TripType, Truck } from '../../types';
import { TRIP_TYPE_LABELS } from '../../utils/constants';
import { todayISO } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  trip?: Trip | null;
  defaultTruckId?: string;
  defaultCompanyId?: string;
}

export default function TripFormModal({
  isOpen,
  onClose,
  onSaved,
  trip,
  defaultTruckId,
  defaultCompanyId,
}: TripFormModalProps) {
  const { showToast } = useToast();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [date, setDate] = useState(todayISO());
  const [truckId, setTruckId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [tripType, setTripType] = useState<TripType>('to_company');
  const [amount, setAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void Promise.all([getTrucks(), getCompanies()])
      .then(([truckRows, companyRows]) => {
        setTrucks(truckRows);
        setCompanies(companyRows);
      })
      .catch(() => {
        setTrucks([]);
        setCompanies([]);
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDate(trip?.date || todayISO());
    setTruckId(trip?.truck_id || defaultTruckId || '');
    setCompanyId(trip?.company_id || defaultCompanyId || '');
    setCompanyInput(trip?.companies?.name || trip?.company_name_text || '');
    setFromLocation(trip?.from_location || '');
    setToLocation(trip?.to_location || '');
    setTripType(trip?.trip_type || 'to_company');
    setAmount(trip ? String(trip.amount) : '');
    setAmountPaid(trip ? String(trip.amount_paid) : '0');
    setNotes(trip?.notes || '');
  }, [isOpen, trip, defaultTruckId, defaultCompanyId]);

  const suggestions = useMemo(() => {
    const value = companyInput.trim().toLowerCase();
    if (!value) return [];
    return companies.filter((company) => company.name.toLowerCase().includes(value)).slice(0, 6);
  }, [companies, companyInput]);

  const hasCompany = Boolean(companyId || companyInput.trim());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!truckId) {
      showToast('اختار العربية', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('اكتب مبلغ صحيح', 'error');
      return;
    }

    setSaving(true);
    try {
      const finalTripType: TripType = hasCompany ? tripType : 'external';
      const payload = {
        date,
        truck_id: truckId,
        company_id: companyId || null,
        company_name_text: companyId ? null : companyInput.trim() || null,
        from_location: fromLocation || null,
        to_location: toLocation || null,
        trip_type: finalTripType,
        amount: Number(amount),
        amount_paid: Number(amountPaid || 0),
        notes: notes || null,
      };

      if (trip) {
        await updateTrip(trip.id, payload);
        showToast('تم تعديل النقلة ✅', 'success');
      } else {
        await addTrip(payload);
        if (!companyId && companyInput.trim()) {
          showToast(`تم إضافة شركة ${companyInput.trim()} تلقائياً`, 'info');
        } else {
          showToast('تم إضافة النقلة ✅', 'success');
        }
      }

      await onSaved();
      onClose();
    } catch {
      showToast('تعذر حفظ النقلة', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trip ? 'تعديل نقلة' : 'إضافة نقلة'} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="date" label="التاريخ" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select
            label="العربية"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            required
            placeholder="اختر العربية"
            options={trucks.map((truck) => ({ value: truck.id, label: truck.name }))}
          />
        </div>

        <div className="space-y-2">
          <Input
            label="الشركة (اكتب للبحث أو الإضافة)"
            value={companyInput}
            onChange={(e) => {
              setCompanyInput(e.target.value);
              setCompanyId('');
            }}
            placeholder="اسم الشركة أو اتركها فارغة للشغل الخارجي"
          />
          {suggestions.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
              {suggestions.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  className="w-full text-right px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  onClick={() => {
                    setCompanyId(company.id);
                    setCompanyInput(company.name);
                  }}
                >
                  {company.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="من أين" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} />
          <Input label="إلى أين" value={toLocation} onChange={(e) => setToLocation(e.target.value)} />
        </div>

        {hasCompany ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">نوع النقلة</p>
            <div className="flex flex-wrap gap-2">
              {(['to_company', 'from_company'] as TripType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTripType(type)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    tripType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {TRIP_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">بدون شركة: سيتم تسجيلها شغل خارجي تلقائياً</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="المبلغ"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="numeric"
            required
          />
          <Input
            label="المبلغ المدفوع"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="numeric"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            حفظ
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
        </div>

        <Textarea label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </form>
    </Modal>
  );
}
