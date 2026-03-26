import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { addTruck, updateTruck } from '../../services/store';
import type { Truck } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface TruckFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  truck?: Truck | null;
}

export default function TruckFormModal({ isOpen, onClose, onSaved, truck }: TruckFormModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [truckType, setTruckType] = useState('');
  const [status, setStatus] = useState<Truck['status']>('active');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(truck?.name || '');
    setPlateNumber(truck?.plate_number || '');
    setTruckType(truck?.truck_type || '');
    setStatus(truck?.status || 'active');
    setNotes(truck?.notes || '');
  }, [isOpen, truck]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      showToast('اسم العربية مطلوب', 'error');
      return;
    }

    setSaving(true);
    try {
      if (truck) {
        await updateTruck(truck.id, {
          name: name.trim(),
          plate_number: plateNumber || null,
          truck_type: truckType || null,
          status,
          notes: notes || null,
        });
        showToast('تم تعديل العربية بنجاح ✅', 'success');
      } else {
        await addTruck({
          name: name.trim(),
          plate_number: plateNumber || null,
          truck_type: truckType || null,
          status,
          notes: notes || null,
        });
        showToast('تم إضافة العربية بنجاح ✅', 'success');
      }

      await onSaved();
      onClose();
    } catch {
      showToast('تعذر حفظ بيانات العربية', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={truck ? 'تعديل عربية' : 'إضافة عربية'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="اسم العربية" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="رقم اللوحة" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        <Input label="نوع العربية" value={truckType} onChange={(e) => setTruckType(e.target.value)} />
        <Select
          label="الحالة"
          value={status}
          onChange={(e) => setStatus(e.target.value as Truck['status'])}
          options={[
            { value: 'active', label: 'شغالة' },
            { value: 'inactive', label: 'معطلة' },
            { value: 'maintenance', label: 'صيانة' },
          ]}
        />
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
