import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/formatters';

interface CompanyDue {
  companyId: string;
  companyName: string;
  remaining: number;
  oldestDate: string;
  tripCount: number;
}

type SortKey = 'amount_desc' | 'amount_asc' | 'date' | 'name';

export default function DuePaymentsPage() {
  const [allItems, setAllItems] = useState<CompanyDue[]>([]);
  const [displayed, setDisplayed] = useState<CompanyDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('amount_desc');
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch once on mount
  useEffect(() => {
    let mounted = true;

    const loadDuePayments = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch companies, trips, and company_payments in parallel
        // This mirrors getCompanyBalance but for ALL companies at once
        const [companiesRes, tripsRes, paymentsRes] = await Promise.all([
          supabase.from('companies').select('id, name, previous_balance'),
          supabase.from('trips').select('date, amount, company_id').not('company_id', 'is', null).order('date', { ascending: true }),
          supabase.from('company_payments').select('amount, company_id'),
        ]);

        if (companiesRes.error) throw companiesRes.error;
        if (tripsRes.error) throw tripsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (!mounted) return;

        const companies = companiesRes.data ?? [];
        const trips = tripsRes.data ?? [];
        const payments = paymentsRes.data ?? [];

        // Sum trip amounts per company
        const tripTotals: Record<string, number> = {};
        const tripCounts: Record<string, number> = {};
        const oldestDates: Record<string, string> = {};
        for (const trip of trips) {
          const cid = trip.company_id as string;
          tripTotals[cid] = (tripTotals[cid] ?? 0) + (trip.amount ?? 0);
          tripCounts[cid] = (tripCounts[cid] ?? 0) + 1;
          if (!oldestDates[cid] || trip.date < oldestDates[cid]) {
            oldestDates[cid] = trip.date;
          }
        }

        // Sum company_payments per company
        const paymentTotals: Record<string, number> = {};
        for (const p of payments) {
          const cid = p.company_id as string;
          paymentTotals[cid] = (paymentTotals[cid] ?? 0) + (p.amount ?? 0);
        }

        // Calculate remaining balance per company (same formula as getCompanyBalance)
        const result: CompanyDue[] = [];
        for (const company of companies) {
          const prevBalance = company.previous_balance ?? 0;
          const totalTrips = tripTotals[company.id] ?? 0;
          const totalPaid = paymentTotals[company.id] ?? 0;
          const remaining = prevBalance + totalTrips - totalPaid;

          // Only show companies that still owe money
          if (remaining > 0.001) {
            result.push({
              companyId: company.id,
              companyName: company.name,
              remaining,
              oldestDate: oldestDates[company.id] ?? '',
              tripCount: tripCounts[company.id] ?? 0,
            });
          }
        }

        setAllItems(result);
        applyFilters(result, '', 'amount_desc');
      } catch {
        if (mounted) setError('حصل خطأ أثناء تحميل بيانات المديونيات');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDuePayments();
    return () => { mounted = false; };
  }, []);

  const applyFilters = (source: CompanyDue[], search: string, sort: SortKey) => {
    let result = [...source];

    if (search.trim()) {
      result = result.filter((item) =>
        item.companyName.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    if (sort === 'amount_desc') result.sort((a, b) => b.remaining - a.remaining);
    else if (sort === 'amount_asc') result.sort((a, b) => a.remaining - b.remaining);
    else if (sort === 'date') result.sort((a, b) => a.oldestDate.localeCompare(b.oldestDate));
    else if (sort === 'name') result.sort((a, b) => a.companyName.localeCompare(b.companyName, 'ar'));

    setDisplayed(result);
  };

  const handleApply = () => {
    applyFilters(allItems, searchValue, sortKey);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleApply();
  };

  const handleClear = () => {
    setSearchValue('');
    setSortKey('amount_desc');
    applyFilters(allItems, '', 'amount_desc');
  };

  const totalDue = displayed.reduce((sum, i) => sum + i.remaining, 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="مواعيد السداد 💳" />

      {/* Control bar */}
      <Card>
        <CardBody>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Search input */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">بحث باسم الشركة</label>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="اكتب اسم الشركة..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort dropdown */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ترتيب حسب</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="amount_desc">حسب الأعلى مديونية</option>
                  <option value="amount_asc">حسب المبلغ الأقل</option>
                  <option value="date">حسب الأقدم</option>
                  <option value="name">حسب الشركة</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button onClick={handleApply}>🔍 بحث / تطبيق</Button>
              <Button variant="outline" onClick={handleClear}>مسح</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Total banner */}
      {!loading && !error && displayed.length > 0 && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-600 dark:text-red-400">إجمالي المستحقات الحالية</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(totalDue)}</p>
          </div>
          <span className="text-3xl">⚠️</span>
        </div>
      )}

      {/* States */}
      {loading && <div className="py-10"><LoadingSpinner size="lg" /></div>}
      {!loading && error && <EmptyState icon="⚠️" message={error} />}
      {!loading && !error && displayed.length === 0 && (
        <EmptyState icon="✅" message="لا توجد شركات عليها مستحقات حالياً" />
      )}

      {/* Results */}
      {!loading && !error && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map((item, index) => (
            <Card key={item.companyId}>
              <CardBody>
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-sm font-bold text-red-700 dark:text-red-300">
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-base truncate">{item.companyName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.tripCount} {item.tripCount === 1 ? 'نقلة' : 'نقلات غير مسددة'} · أقدم نقلة: {formatDate(item.oldestDate)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-left">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(item.remaining)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-left">متبقي</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
