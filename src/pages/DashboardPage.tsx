import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/app-ui/Card';
import EmptyState from '../components/app-ui/EmptyState';
import LoadingSpinner from '../components/app-ui/LoadingSpinner';
import StatCard from '../components/app-ui/StatCard';
import Badge from '../components/app-ui/Badge';
import { getDashboardStats, getLastExpenses, getLastTrips } from '../services/store';
import type { DashboardStats, Expense, Trip } from '../types';
import { EXPENSE_TYPE_LABELS } from '../utils/constants';
import { formatArabicDate, formatCurrency, formatDate } from '../utils/formatters';

const CACHE_KEY = 'cachedDashboardData';
const CACHE_TIME_KEY = 'cacheTime';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  stats: DashboardStats;
  lastTrips: Trip[];
  lastExpenses: Expense[];
}

function getCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedData;
    return parsed;
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
    case 'fuel':
      return 'blue';
    case 'maintenance':
      return 'orange';
    case 'tires':
      return 'purple';
    case 'license':
      return 'green';
    case 'insurance':
      return 'yellow';
    case 'oil':
      return 'cyan';
    default:
      return 'gray';
  }
}

export default function DashboardPage() {
  const cached = getCache();

  const [stats, setStats] = useState<DashboardStats | null>(cached?.stats ?? null);
  const [lastTrips, setLastTrips] = useState<Trip[]>(cached?.lastTrips ?? []);
  const [lastExpenses, setLastExpenses] = useState<Expense[]>(cached?.lastExpenses ?? []);
  // Only show full loading spinner if there's no cached data
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      // If no cache or cache is stale, fetch fresh data
      const hasFreshCache = cached && !isCacheStale();
      if (!hasFreshCache) {
        if (!cached) setLoading(true);
        setError('');
        try {
          const [statsData, tripsData, expensesData] = await Promise.all([
            getDashboardStats(),
            getLastTrips(5),
            getLastExpenses(5),
          ]);

          if (!mounted) return;

          setStats(statsData);
          setLastTrips(tripsData);
          setLastExpenses(expensesData);
          saveCache({ stats: statsData, lastTrips: tripsData, lastExpenses: expensesData });
        } catch {
          if (!mounted) return;
          // Only show error if there's no cached data to fall back on
          if (!cached) {
            setError('حصل خطأ أثناء تحميل بيانات الرئيسية');
          }
        } finally {
          if (mounted) setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon="⚠️" message={error || 'تعذر عرض البيانات'} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">أهلاً بيك 👋</h1>
        <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-gray-300">تاريخ اليوم: {formatArabicDate()}</p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="💰" title="إجمالي الدخل" value={formatCurrency(stats.totalIncome)} color="green" />
        <StatCard icon="💸" title="إجمالي المصروفات" value={formatCurrency(stats.totalExpenses)} color="red" />
        <StatCard
          icon="📊"
          title="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          color={stats.netProfit >= 0 ? 'blue' : 'red'}
        />
        <StatCard icon="🏢" title="مستحقات الشركات" value={formatCurrency(stats.totalCompanyDebt)} color="orange" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">ملخص العربيات</h2>
        {stats.truckSummaries.length === 0 ? (
          <EmptyState icon="🚛" message="مفيش عربيات لسه 🚛" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stats.truckSummaries.map((summary) => (
              <Card key={summary.truck.id}>
                <CardHeader className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{summary.truck.name}</h3>
                  <Badge color={summary.profit >= 0 ? 'green' : 'red'}>{summary.profit >= 0 ? 'ربح' : 'خسارة'}</Badge>
                </CardHeader>
                <CardBody className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    الدخل: <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(summary.income)}</span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    المصروفات: <span className="font-semibold text-red-700 dark:text-red-400">{formatCurrency(summary.expenses)}</span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    الربح: <span className={`font-semibold ${summary.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(summary.profit)}</span>
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">آخر النقلات</h2>
          </CardHeader>
          <CardBody>
            {lastTrips.length === 0 ? (
              <EmptyState icon="🔄" message="لا توجد نقلات حالياً" />
            ) : (
              <div className="space-y-3">
                {lastTrips.map((trip) => (
                  <div key={trip.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(trip.date)}</p>
                      <p className="text-sm font-bold text-green-700 dark:text-green-400">{formatCurrency(trip.amount)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">العربية: {trip.trucks?.name || '—'}</p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      الشركة: {trip.companies?.name || trip.company_name_text || 'شغل خارجي'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      من {trip.from_location || '—'} إلى {trip.to_location || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">آخر المصروفات</h2>
          </CardHeader>
          <CardBody>
            {lastExpenses.length === 0 ? (
              <EmptyState icon="💸" message="لا توجد مصروفات حالياً" />
            ) : (
              <div className="space-y-3">
                {lastExpenses.map((expense) => (
                  <div key={expense.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(expense.date)}</p>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">{formatCurrency(expense.amount)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">العربية: {expense.trucks?.name || '—'}</p>
                    <div className="mt-2">
                      <Badge color={getExpenseBadgeColor(expense.expense_type)}>{EXPENSE_TYPE_LABELS[expense.expense_type]}</Badge>
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
