import { useEffect, useState } from 'react';
import Modal from '../app-ui/Modal';
import Input from '../app-ui/Input';
import Textarea from '../app-ui/Textarea';
import Button from '../app-ui/Button';
import { addCompany, updateCompany } from '../../services/store';
import type { Company } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  company?: Company | null;
}

export default function CompanyFormModal({ isOpen, onClose, onSaved, company }: CompanyFormModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [previousBalance, setPreviousBalance] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(company?.name || '');
    setAddress(company?.address || '');
    setPhone(company?.phone || '');
    setContactPerson(company?.contact_person || '');
    setPreviousBalance(String(company?.previous_balance ?? 0));
    setNotes(company?.notes || '');
  }, [isOpen, company]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      showToast('اسم الشركة مطلوب', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address || null,
        phone: phone || null,
        contact_person: contactPerson || null,
        previous_balance: Number(previousBalance || 0),
        notes: notes || null,
      };

      if (company) {
        await updateCompany(company.id, payload);
        showToast('تم تعديل الشركة بنجاح ✅', 'success');
      } else {
        await addCompany(payload);
        showToast('تم إضافة الشركة بنجاح ✅', 'success');
      }

      await onSaved();
      onClose();
    } catch {
      showToast('تعذر حفظ بيانات الشركة', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={company ? 'تعديل شركة' : 'إضافة شركة'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="اسم الشركة" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="رقم التواصل" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="اسم المسؤول" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        <Input
          label="الرصيد السابق"
          value={previousBalance}
          onChange={(e) => setPreviousBalance(e.target.value.replace(/[^\d.]/g, ''))}
          inputMode="numeric"
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
