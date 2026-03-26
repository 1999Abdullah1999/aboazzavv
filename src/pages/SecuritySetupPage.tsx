import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/app-ui/Button';
import Input from '../components/app-ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAppSettings, updateAppSettings } from '../services/store';

function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const makeBlock = () =>
    Array.from({ length: 4 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');

  return `SLM-${makeBlock()}-${makeBlock()}`;
}

export default function SecuritySetupPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [motherName, setMotherName] = useState('');
  const [pin, setPin] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const settings = await getAppSettings();
        if (!mounted) return;

        if (!settings) {
          setError('تعذر تحميل إعدادات الأمان');
          return;
        }

        if (settings.security_setup_done || user?.security_setup_done) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setMotherName(settings.mother_name || '');
        setRecoveryCode(generateRecoveryCode());
      } catch {
        if (!mounted) return;
        setError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [navigate, user?.security_setup_done]);

  const pinError = useMemo(() => {
    if (!pin) return '';
    return /^\d{4}$/.test(pin) ? '' : 'رقم PIN لازم يكون 4 أرقام';
  }, [pin]);

  const handleCopyCode = async () => {
    if (!recoveryCode) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(recoveryCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = recoveryCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      showToast('تم نسخ كود الاسترجاع', 'info');
    } catch {
      showToast('تعذر نسخ الكود، انسخه يدويًا', 'error');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!motherName.trim()) {
      setError('من فضلك اكتب اسم الأم');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('رقم PIN لازم يكون 4 أرقام');
      return;
    }

    setSaving(true);
    try {
      await updateAppSettings({
        mother_name: motherName.trim(),
        pin,
        recovery_code: recoveryCode,
        security_setup_done: true,
      });

      await refreshUser();
      showToast('تم إعداد الأمان بنجاح ✅', 'success');
      navigate('/dashboard', { replace: true });
    } catch {
      setError('فشل حفظ إعدادات الأمان، حاول مرة تانية');
      showToast('فشل حفظ إعدادات الأمان', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">جاري تحميل إعدادات الأمان...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إعداد الأمان 🔐</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">كمّل الخطوات دي مرة واحدة لحماية الحساب.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="اسم الأم"
            value={motherName}
            onChange={(event) => setMotherName(event.target.value)}
            placeholder="اكتب اسم الأم"
            required
          />

          <Input
            label="رقم PIN (4 أرقام)"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="مثال: 1234"
            inputMode="numeric"
            maxLength={4}
            error={pinError}
            required
          />

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">كود الاسترجاع</p>
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-center font-mono text-lg tracking-wider text-indigo-700 dark:bg-gray-800 dark:text-indigo-300">
              {recoveryCode}
            </p>
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">احفظ الكود ده في مكان آمن - مش هيظهر تاني</p>
            <Button type="button" variant="outline" className="mt-3" onClick={handleCopyCode}>
              نسخ الكود
            </Button>
          </div>

          {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">{error}</p>}

          <Button type="submit" loading={saving} fullWidth size="lg">
            حفظ إعدادات الأمان
          </Button>
        </form>
      </div>
    </div>
  );
}