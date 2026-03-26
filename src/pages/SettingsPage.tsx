import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getAppSettings, updateAppSettings } from '../services/store';
import type { AppSettings } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLayout, type LayoutMode } from '../contexts/LayoutContext';

function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SLM-${block()}-${block()}`;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const { layoutMode, setLayoutMode } = useLayout();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [motherName, setMotherName] = useState('');
  const [pin, setPin] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const [savingCredentials, setSavingCredentials] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(
    () => localStorage.getItem('showFloatingAddButton') !== 'false',
  );

  const toggleFloatingBtn = useCallback((checked: boolean) => {
    setShowFloatingBtn(checked);
    localStorage.setItem('showFloatingAddButton', String(checked));
    // Notify AppLayout instantly via storage event
    window.dispatchEvent(new Event('storage'));
  }, []);

  const loadData = async () => {
    try {
      const data = await getAppSettings();
      if (!data) return;
      setSettings(data);
      setUsername(data.username);
      setMotherName(data.mother_name || '');
      setPin(data.pin || '');
      setRecoveryCode(data.recovery_code || '');
    } catch {
      showToast('تعذر تحميل الإعدادات', 'error');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const saveCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;

    if (oldPassword !== settings.password) {
      showToast('كلمة المرور القديمة غير صحيحة', 'error');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('تأكيد كلمة المرور غير مطابق', 'error');
      return;
    }

    setSavingCredentials(true);
    try {
      await updateAppSettings({ username: username.trim(), password: newPassword });
      showToast('تم تغيير كلمة المرور ✅', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await loadData();
    } catch {
      showToast('تعذر حفظ بيانات الدخول', 'error');
    } finally {
      setSavingCredentials(false);
    }
  };

  const saveSecurity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin && !/^\d{4}$/.test(pin)) {
      showToast('رقم PIN لازم يكون 4 أرقام', 'error');
      return;
    }

    setSavingSecurity(true);
    try {
      await updateAppSettings({ mother_name: motherName || null, pin: pin || null, recovery_code: recoveryCode || null });
      showToast('تم حفظ إعدادات الأمان ✅', 'success');
      await loadData();
    } catch {
      showToast('تعذر حفظ إعدادات الأمان', 'error');
    } finally {
      setSavingSecurity(false);
    }
  };

  const switchLayoutMode = (mode: LayoutMode) => {
    if (mode === layoutMode) return;
    setLayoutMode(mode);
    showToast('تم تغيير شكل التنقل ✅', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="الإعدادات ⚙️" />

      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900 dark:text-white">وضع التنقل (للهاتف)</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => switchLayoutMode('sidebar')}
              className={`rounded-xl border p-4 text-right transition-all ${
                layoutMode === 'sidebar'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <p className="text-base font-bold text-gray-900 dark:text-white">وضع الكمبيوتر (الشريط الجانبي)</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">الديسكتوب يظل ثابت بنفس الشكل دائمًا.</p>
            </button>

            <button
              type="button"
              onClick={() => switchLayoutMode('bottomnav')}
              className={`rounded-xl border p-4 text-right transition-all ${
                layoutMode === 'bottomnav'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <p className="text-base font-bold text-gray-900 dark:text-white">وضع الهاتف (شريط سفلي ثابت)</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">تنقل سريع من أسفل الشاشة مناسب للموبايل فقط.</p>
            </button>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => switchLayoutMode('sidebar')}
              disabled={layoutMode === 'sidebar'}
            >
              استعادة الوضع الافتراضي
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900 dark:text-white">تغيير بيانات الدخول</h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={saveCredentials}>
            <Input label="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="كلمة المرور القديمة" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <Input label="كلمة المرور الجديدة" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input label="تأكيد كلمة المرور" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <Button type="submit" loading={savingCredentials}>حفظ</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900 dark:text-white">إعدادات الأمان 🔐</h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-3" onSubmit={saveSecurity}>
            <Input label="اسم الأم" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
            <Input
              label="رقم PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
            />
            <div className="space-y-2">
              <Input label="كود الاسترجاع" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setRecoveryCode(generateRecoveryCode())}>إعادة توليد كود الاسترجاع</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(recoveryCode || '');
                    showToast('تم نسخ الكود', 'info');
                  }}
                >
                  نسخ
                </Button>
              </div>
            </div>
            <Button type="submit" loading={savingSecurity}>حفظ</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900 dark:text-white">إعدادات الواجهة</h2>
        </CardHeader>
        <CardBody>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">إظهار زر الإضافة العائم</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">الزر الأخضر (+) الثابت في أسفل الشاشة</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showFloatingBtn}
              onClick={() => toggleFloatingBtn(!showFloatingBtn)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showFloatingBtn ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  showFloatingBtn ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-bold text-gray-900 dark:text-white">معلومات التطبيق</h2>
        </CardHeader>
        <CardBody className="space-y-1 text-sm">
          <p>اسم التطبيق: أولاد سليم للنقل</p>
          <p>الإصدار: 1.0.0</p>
          <p>المطور: Dr Abdullah Abdelrahman 50the</p>
        </CardBody>
      </Card>
    </div>
  );
}
