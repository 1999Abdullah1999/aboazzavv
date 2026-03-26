import { useEffect, useState } from 'react';
import Modal from '../app-ui/Modal';
import Input from '../app-ui/Input';
import Select from '../app-ui/Select';
import Textarea from '../app-ui/Textarea';
import Button from '../app-ui/Button';
import { addExpense, getTrucks, updateExpense } from '../../services/store';
import type { Expense, ExpenseType, Truck } from '../../types';
import { EXPENSE_TYPE_LABELS } from '../../utils/constants';
import { todayISO } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  expense?: Expense | null;
  defaultTruckId?: string;
}

export default function ExpenseFormModal({ isOpen, onClose, onSaved, expense, defaultTruckId }: ExpenseFormModalProps) {
  const { showToast } = useToast();
  const [trucks, setTrucks] = useState<Truck[]>([]);

  const [date, setDate] = useState(todayISO());
  const [truckId, setTruckId] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('fuel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void getTrucks().then(setTrucks).catch(() => setTrucks([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDate(expense?.date || todayISO());
    setTruckId(expense?.truck_id || defaultTruckId || '');
    setExpenseType(expense?.expense_type || 'fuel');
    setAmount(expense ? String(expense.amount) : '');
    setDescription(expense?.description || '');
    setNotes(expense?.notes || '');
  }, [isOpen, expense, defaultTruckId]);

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
      const payload = {
        date,
        truck_id: truckId,
        expense_type: expenseType,
        amount: Number(amount),
        description: description || null,
        notes: notes || null,
      };

      if (expense) {
        await updateExpense(expense.id, payload);
        showToast('تم تعديل المصروف ✅', 'success');
      } else {
        await addExpense(payload);
        showToast('تم إضافة المصروف ✅', 'success');
      }

      await onSaved();
      onClose();
    } catch {
      showToast('تعذر حفظ المصروف', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'تعديل مصروف' : 'إضافة مصروف'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input type="date" label="التاريخ" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select
          label="العربية"
          value={truckId}
          onChange={(e) => setTruckId(e.target.value)}
          required
          placeholder="اختر العربية"
          options={trucks.map((truck) => ({ value: truck.id, label: truck.name }))}
        />
        <Select
          label="نوع المصروف"
          value={expenseType}
          onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
          options={Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Input
          label="المبلغ"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          inputMode="numeric"
          required
        />
        <Input label="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            حفظ
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
}
