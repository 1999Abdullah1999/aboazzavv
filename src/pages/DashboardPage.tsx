import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardBody, CardHeader } from '../components/app-ui/Card';
import EmptyState from '../components/app-ui/EmptyState';
import LoadingSpinner from '../components/app-ui/LoadingSpinner';
import StatCard from '../components/app-ui/StatCard';
import Badge from '../components/app-ui/Badge';
import { getDashboardStats, getLastExpenses, getLastTrips } from '../services/store';
import type { DashboardStats, Expense, Trip } from '../types';
import { EXPENSE_TYPE_LABELS } from '../utils/constants';
import { formatArabicDate, formatCurrency, formatDate, formatNumber } from '../utils/formatters';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  daily: '📅 يومي',
  weekly: '📆 أسبوعي',
  monthly: '🗓️ شهري',
  yearly: '📊 سنوي',
  all: '🌐 الكل',
};

function getDateRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  switch (period) {
    case 'daily':
      return { from: to, to };
    case 'weekly': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo.toISOString().split('T')[0], to };
    }
    case 'monthly': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { from: monthAgo.toISOString().split('T')[0], to };
    }
    case 'yearly': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return { from: yearAgo.toISOString().split('T')[0], to };
    }
    default:
      return {};
  }
}

const CACHE_KEY = 'cachedDashboardData';
const CACHE_TIME_KEY = 'cacheTime';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

interface CachedData {
  stats: DashboardStats;
  lastTrips: Trip[];
  lastExpenses: Expense[];
}

function getCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedData;
  } catch {
    return null;
  }
}

function isCacheStale(): boolean {
  const ts = localStorage.getItem(CACHE_TIME_KEY);
  if (!ts) return true;
  return Date.now() - Number(ts) > CACHE_MAX_AGE_MS;
}

function saveCache(data: CachedData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch {}
}

function getExpenseBadgeColor(expenseType: Expense['expense_type']): 'blue' | 'orange' | 'purple' | 'green' | 'yellow' | 'cyan' | 'gray' {
  switch (expenseType) {
    case 'fuel': return 'blue';
    case 'maintenance': return 'orange';
    case 'tires': return 'purple';
    case 'license': return 'green';
    case 'insurance': return 'yellow';
    case 'oil': return 'cyan';
    default: return 'gray';
  }
}

const CHART_COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#6b7280'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-lg" dir="rtl">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)} ج.م
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const cached = getCache();
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<DashboardStats | null>(cached?.stats ?? null);
  const [lastTrips, setLastTrips] = useState<Trip[]>(cached?.lastTrips ?? []);
  const [lastExpenses, setLastExpenses] = useState<Expense[]>(cached?.lastExpenses ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const range = getDateRange(period);
      const isAll = period === 'all';
      const hasFreshCache = isAll && cached && !isCacheStale();

      if (!hasFreshCache) {
        if (!cached || !isAll) setLoading(true);
        setError('');
        try {
          const [statsData, tripsData, expensesData] = await Promise.all([
            getDashboardStats(range.from, range.to),
            getLastTrips(5),
            getLastExpenses(5),
          ]);
          if (!mounted) return;
          setStats(statsData);
          setLastTrips(tripsData);
          setLastExpenses(expensesData);
          if (isAll) saveCache({ stats: statsData, lastTrips: tripsData, lastExpenses: expensesData });
        } catch {
          if (!mounted) return;
          if (!cached) setError('حصل خطأ أثناء تحميل بيانات الرئيسية');
        } finally {
          if (mounted) setLoading(false);
        }
      }
    };
    void loadData();
    return () => { mounted = false; };
  }, [period]);

  if (loading) {
    return <div className="p-4 md:p-6"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !stats) {
    return <div className="p-4 md:p-6"><EmptyState icon="⚠️" message={error || 'تعذر عرض البيانات'} /></div>;
  }

  // Prepare chart data
  const truckBarData = stats.truckSummaries.map(s => ({
    name: s.truck.name,
    الدخل: s.income,
    المصروفات: s.expenses,
    الربح: s.profit,
  }));

  const profitPieData = [
    { name: 'الدخل', value: stats.totalIncome },
    { name: 'المصروفات', value: stats.totalExpenses },
  ];

  const profitPercentage = stats.totalIncome > 0 
    ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <section className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            أهلاً بيك 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تاريخ اليوم: {formatArabicDate()}
          </p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            onClick={() => navigate('/trips')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-lg"
          >
            🔄 نقلة جديدة
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            💸 مصروف جديد
          </button>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="💰" title="إجمالي الدخل" value={formatCurrency(stats.totalIncome)} color="green" />
        <StatCard icon="💸" title="إجمالي المصروفات" value={formatCurrency(stats.totalExpenses)} color="red" />
        <StatCard
          icon="📊"
          title="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          color={stats.netProfit >= 0 ? 'blue' : 'red'}
          subtitle={`نسبة الربح: ${profitPercentage}%`}
        />
        <StatCard icon="🏢" title="مستحقات الشركات" value={formatCurrency(stats.totalCompanyDebt)} color="orange" />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Bar Chart - Truck Performance */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">📊 أداء العربيات</h2>
          </CardHeader>
          <CardBody>
            {truckBarData.length === 0 ? (
              <EmptyState icon="🚛" message="مفيش بيانات عربيات لسه" />
            ) : (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={truckBarData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="الدخل" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="المصروفات" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="الربح" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pie Chart - Income vs Expenses */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">💹 الدخل مقابل المصروفات</h2>
          </CardHeader>
          <CardBody>
            {stats.totalIncome === 0 && stats.totalExpenses === 0 ? (
              <EmptyState icon="📉" message="لا توجد بيانات مالية" />
            ) : (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${formatNumber(value)} ج.م`]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        direction: 'rtl',
                      }}
                    />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: '13px' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Truck Summaries */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">🚛 ملخص العربيات</h2>
        {stats.truckSummaries.length === 0 ? (
          <EmptyState icon="🚛" message="مفيش عربيات لسه 🚛" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stats.truckSummaries.map((summary) => (
              <div
                key={summary.truck.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                onClick={() => navigate(`/trucks/${summary.truck.id}`)}
              >
                {/* Profit indicator bar */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1 ${
                    summary.profit >= 0
                      ? 'bg-gradient-to-l from-emerald-400 to-teal-500'
                      : 'bg-gradient-to-l from-rose-400 to-pink-500'
                  }`}
                />
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {summary.truck.name}
                  </h3>
                  <Badge color={summary.profit >= 0 ? 'green' : 'red'}>
                    {summary.profit >= 0 ? '✅ ربح' : '❌ خسارة'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">الدخل</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.income)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">المصروفات</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(summary.expenses)}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">صافي الربح</span>
                    <span className={`font-bold text-lg ${summary.profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatCurrency(summary.profit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔄 آخر النقلات</h2>
            <button
              onClick={() => navigate('/trips')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              عرض الكل ←
            </button>
          </CardHeader>
          <CardBody>
            {lastTrips.length === 0 ? (
              <EmptyState icon="🔄" message="لا توجد نقلات حالياً" />
            ) : (
              <div className="space-y-3">
                {lastTrips.map((trip, i) => (
                  <div
                    key={trip.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-lg">
                      🚛
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {trip.trucks?.name || '—'} → {trip.companies?.name || trip.company_name_text || 'خارجي'}
                        </p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mr-2 whitespace-nowrap">
                          {formatCurrency(trip.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(trip.date)} • {trip.from_location || '—'} → {trip.to_location || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">💸 آخر المصروفات</h2>
            <button
              onClick={() => navigate('/expenses')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              عرض الكل ←
            </button>
          </CardHeader>
          <CardBody>
            {lastExpenses.length === 0 ? (
              <EmptyState icon="💸" message="لا توجد مصروفات حالياً" />
            ) : (
              <div className="space-y-3">
                {lastExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/30 text-lg">
                      💸
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {expense.trucks?.name || '—'}
                          </p>
                          <Badge color={getExpenseBadgeColor(expense.expense_type)}>
                            {EXPENSE_TYPE_LABELS[expense.expense_type]}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mr-2 whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(expense.date)}
                        {expense.description ? ` • ${expense.description}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
