import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { addPayment, getCompanies, updatePayment } from '../../services/store';
import type { Company, CompanyPayment, PaymentMethod } from '../../types';
import { PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { todayISO } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  payment?: CompanyPayment | null;
  defaultCompanyId?: string;
}

export default function PaymentFormModal({ isOpen, onClose, onSaved, payment, defaultCompanyId }: PaymentFormModalProps) {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(todayISO());
  const [companyId, setCompanyId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void getCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDate(payment?.date || todayISO());
    setCompanyId(payment?.company_id || defaultCompanyId || '');
    setAmount(payment ? String(payment.amount) : '');
    setMethod(payment?.payment_method || 'cash');
    setNotes(payment?.notes || '');
  }, [isOpen, payment, defaultCompanyId]);

  const filteredCompanies = useMemo(
    () => companies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase())),
    [companies, search],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId) {
      showToast('اختار الشركة', 'error');
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
        company_id: companyId,
        amount: Number(amount),
        payment_method: method,
        notes: notes || null,
      };

      if (payment) {
        await updatePayment(payment.id, payload);
        showToast('تم تعديل الدفعة ✅', 'success');
      } else {
        await addPayment(payload);
        showToast('تم تسجيل الدفعة ✅', 'success');
      }

      await onSaved();
      onClose();
    } catch {
      showToast('تعذر حفظ الدفعة', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment ? 'تعديل دفعة' : 'تسجيل دفعة'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input type="date" label="التاريخ" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="بحث عن شركة" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اكتب اسم الشركة" />
        <Select
          label="الشركة"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          required
          placeholder="اختر الشركة"
          options={filteredCompanies.map((company) => ({ value: company.id, label: company.name }))}
        />
        <Input
          label="المبلغ"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          inputMode="numeric"
          required
        />
        <Select
          label="طريقة الدفع"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
        />
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
