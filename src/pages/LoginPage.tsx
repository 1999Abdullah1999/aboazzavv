import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Auto-fill username if previously remembered
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedUsername');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('من فضلك اكتب اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password, rememberMe);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'اسم المستخدم أو كلمة المرور غلط');
      showToast(result.error || 'اسم المستخدم أو كلمة المرور غلط', 'error');
      return;
    }

    // If remember me is NOT checked, clear any previously remembered username
    if (!rememberMe) {
      localStorage.removeItem('rememberedUsername');
    }

    showToast('تم تسجيل الدخول بنجاح', 'success');
    navigate(result.needsSetup ? '/security-setup' : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="mb-6 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">🚛 أولاد سليم للنقل</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">تسجيل الدخول للنظام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم المستخدم"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="اكتب اسم المستخدم"
            autoComplete="username"
            required
          />

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              كلمة المرور
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="اكتب كلمة المرور"
                autoComplete="current-password"
                className="pl-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                👁️
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              تذكرني
            </label>
          </div>

          {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">{error}</p>}

          <Button type="submit" loading={loading} fullWidth size="lg">
            تسجيل الدخول
          </Button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
