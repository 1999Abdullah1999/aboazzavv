import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/app-ui/Button';
import Input from '../components/app-ui/Input';
import Tabs from '../components/app-ui/Tabs';
import { useToast } from '../contexts/ToastContext';
import { getAppSettings, updatePassword } from '../services/store';

type VerifyMethod = 'mother' | 'pin' | 'recovery';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeMethod, setActiveMethod] = useState<VerifyMethod>('mother');
  const [motherName, setMotherName] = useState('');
  const [pin, setPin] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'mother', label: 'اسم الأم' },
    { id: 'pin', label: 'رقم PIN' },
    { id: 'recovery', label: 'كود الاسترجاع' },
  ];

  const currentValue = useMemo(() => {
    if (activeMethod === 'mother') return motherName.trim();
    if (activeMethod === 'pin') return pin.trim();
    return recoveryCode.trim();
  }, [activeMethod, motherName, pin, recoveryCode]);

  const handleVerify = async () => {
    setError('');

    if (!currentValue) {
      setError('من فضلك اكتب البيانات أولًا');
      return;
    }

    if (activeMethod === 'pin' && !/^\d{4}$/.test(currentValue)) {
      setError('رقم PIN لازم يكون 4 أرقام');
      return;
    }

    setLoadingVerify(true);
    try {
      const settings = await getAppSettings();
      if (!settings) {
        setError('تعذر تحميل بيانات الحساب');
        return;
      }

      let isMatch = false;

      if (activeMethod === 'mother') {
        isMatch = (settings.mother_name || '').trim() === currentValue;
      }

      if (activeMethod === 'pin') {
        isMatch = (settings.pin || '').trim() === currentValue;
      }

      if (activeMethod === 'recovery') {
        isMatch = (settings.recovery_code || '').trim().toUpperCase() === currentValue.toUpperCase();
      }

      if (!isMatch) {
        setError('البيانات غلط، حاول تاني');
        showToast('البيانات غلط، حاول تاني', 'error');
        return;
      }

      setVerified(true);
      showToast('تم التحقق بنجاح', 'success');
    } catch {
      setError('حدث خطأ أثناء التحقق');
      showToast('حدث خطأ أثناء التحقق', 'error');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleSavePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('من فضلك اكتب كلمة المرور الجديدة وتأكيدها');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق');
      return;
    }

    setLoadingSave(true);
    try {
      await updatePassword(newPassword);
      showToast('تم تغيير كلمة المرور بنجاح ✅', 'success');
      navigate('/login', { replace: true });
    } catch {
      setError('فشل تغيير كلمة المرور، حاول مرة تانية');
      showToast('فشل تغيير كلمة المرور', 'error');
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">استعادة كلمة المرور 🔑</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">اختار طريقة تحقق واحدة، وبعدها عيّن كلمة مرور جديدة.</p>

        {!verified ? (
          <div className="mt-6 space-y-4">
            <Tabs tabs={tabs} activeTab={activeMethod} onChange={(id) => setActiveMethod(id as VerifyMethod)} />

            {activeMethod === 'mother' && (
              <Input
                label="اسم الأم"
                value={motherName}
                onChange={(event) => setMotherName(event.target.value)}
                placeholder="اكتب اسم الأم"
              />
            )}

            {activeMethod === 'pin' && (
              <Input
                label="رقم PIN"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 أرقام"
                inputMode="numeric"
                maxLength={4}
              />
            )}

            {activeMethod === 'recovery' && (
              <Input
                label="كود الاسترجاع"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                placeholder="مثال: SLM-AB12-CD34"
              />
            )}

            {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">{error}</p>}

            <Button onClick={handleVerify} loading={loadingVerify} fullWidth size="lg">
              تحقق
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSavePassword} className="mt-6 space-y-4">
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="اكتب كلمة المرور الجديدة"
              autoComplete="new-password"
              required
            />

            <Input
              label="تأكيد كلمة المرور"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              autoComplete="new-password"
              required
            />

            {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">{error}</p>}

            <Button type="submit" loading={loadingSave} fullWidth size="lg">
              حفظ كلمة المرور
            </Button>
          </form>
        )}

        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}