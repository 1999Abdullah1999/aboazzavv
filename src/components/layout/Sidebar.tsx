import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, Truck, Building2, ArrowLeftRight,
  Receipt, CreditCard, BarChart3, Settings, LogOut, Moon, Sun, AlarmClock
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/trucks', label: 'العربيات', icon: Truck },
  { to: '/companies', label: 'الشركات', icon: Building2 },
  { to: '/trips', label: 'النقلات', icon: ArrowLeftRight },
  { to: '/expenses', label: 'المصروفات', icon: Receipt },
  { to: '/payments', label: 'المدفوعات', icon: CreditCard },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/due-payments', label: 'مواعيد السداد', icon: AlarmClock },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-screen sticky top-0 no-print">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚛</span>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">أولاد سليم</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">للنقل والمقاولات</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
