import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AnimatedOutlet from './AnimatedOutlet';
import TripFormModal from '../trips/TripFormModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLayout } from '../../contexts/LayoutContext';

type MobileNavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { layoutMode } = useLayout();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(
    () => localStorage.getItem('showFloatingAddButton') !== 'false',
  );

  useEffect(() => {
    const onStorage = () => {
      setShowFloatingBtn(localStorage.getItem('showFloatingAddButton') !== 'false');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const mobileNavItems = useMemo<MobileNavItem[]>(
    () => [
      { to: '/', label: 'الرئيسية', icon: '🏠', end: true },
      { to: '/trucks', label: 'العربيات', icon: '🚛' },
      { to: '/companies', label: 'الشركات', icon: '🏢' },
      { to: '/trips', label: 'النقلات', icon: '🔄' },
    ],
    [],
  );

  const moreNavItems = useMemo<MobileNavItem[]>(
    () => [
      { to: '/expenses', label: 'المصروفات', icon: '💸' },
      { to: '/payments', label: 'المدفوعات', icon: '💳' },
      { to: '/reports', label: 'التقارير', icon: '📊' },
      { to: '/due-payments', label: 'مواعيد السداد', icon: '⏰' },
      { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
    ],
    [],
  );

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActiveRoute = (to: string) => {
    if (to === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <div className="hidden md:flex h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-auto">
          <main>
            <AnimatedOutlet />
          </main>
        </div>
      </div>

      {layoutMode === 'bottomnav' ? (
        <div className="md:hidden h-full">
          <header className="fixed top-0 left-0 right-0 h-12 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm no-print">
            <div className="flex h-full items-center justify-between px-4">
              <h1 className="text-xs font-bold text-gray-900 dark:text-white">🚛 أولاد سليم</h1>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                aria-label="تبديل الوضع الليلي"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          <main className="pt-12 pb-20">
            <AnimatedOutlet />
          </main>

          {isMoreMenuOpen ? (
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsMoreMenuOpen(false)}
              aria-hidden="true"
            />
          ) : null}

          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 h-16 shadow-[0_-6px_18px_rgba(0,0,0,0.10)]">
            <div className="grid h-full grid-cols-5" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              {mobileNavItems.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                    isActiveRoute(item.to) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                  (isMoreMenuOpen || moreNavItems.some((item) => isActiveRoute(item.to)))
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="text-base leading-none">⋯</span>
                <span>المزيد</span>
              </button>
            </div>
          </div>

          <div
            className={`fixed bottom-[72px] left-3 right-3 z-50 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:bg-gray-900 dark:border-gray-700 transition-all duration-200 ${
              isMoreMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
            style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
          >
            <div className="space-y-1">
              {moreNavItems.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    navigate(item.to);
                    setIsMoreMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors ${
                    isActiveRoute(item.to)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{item.label}</span>
                  <span>{item.icon}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setIsMoreMenuOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                <span>{isDark ? '☀️' : '🌙'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setIsMoreMenuOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <span>تسجيل الخروج</span>
                <span>↩</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="md:hidden h-full">
          <header className="fixed top-0 left-0 right-0 h-12 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm no-print">
            <div className="flex h-full items-center justify-between px-4">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="rounded-lg p-2 text-lg leading-none text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="فتح القائمة"
              >
                ☰
              </button>
              <h1 className="text-xs font-bold text-gray-900 dark:text-white">🚛 أولاد سليم</h1>
            </div>
          </header>

          <main className="pt-12">
            <AnimatedOutlet />
          </main>

          {isMobileSidebarOpen ? (
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-hidden="true"
            />
          ) : null}

          <aside
            className={`fixed right-0 top-0 h-full z-50 transform transition-transform duration-300 w-[280px] bg-white dark:bg-gray-900 shadow-2xl ${
              isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">القائمة</h2>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-lg p-2 text-lg leading-none text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="إغلاق القائمة"
              >
                ✕
              </button>
            </div>

            <nav className="p-3 overflow-y-auto h-[calc(100%-48px)]">
              <ul className="space-y-1">
                {[...mobileNavItems, ...moreNavItems].map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`
                      }
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-gray-200 dark:border-gray-800 pt-2 space-y-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                  <span>{isDark ? '☀️' : '🌙'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <span>تسجيل الخروج</span>
                  <span>↩</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}
      {/* Floating quick-add trip button — visibility controlled from Settings */}
      {showFloatingBtn && (
        <button
          type="button"
          onClick={() => setIsQuickAddOpen(true)}
          className="no-print fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white text-2xl shadow-lg hover:bg-green-600 active:scale-95 transition-all md:bottom-6"
          aria-label="إضافة نقلة سريعة"
          title="إضافة نقلة سريعة"
        >
          +
        </button>
      )}

      <TripFormModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSaved={() => {}}
      />
    </div>
  );
}
