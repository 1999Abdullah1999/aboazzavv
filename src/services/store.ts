import { supabase } from '../lib/supabaseClient';
import type {
  AppSettings,
  Company,
  CompanyBalance,
  CompanyPayment,
  DashboardStats,
  Expense,
  ExpenseFilters,
  PaymentFilters,
  StatementRow,
  Trip,
  TripFilters,
  Truck,
  TruckProfit,
  TruckSummary,
} from '../types';

// ============ APP SETTINGS ============
export async function getAppSettings(): Promise<AppSettings | null> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

export async function updateAppSettings(updates: Partial<AppSettings>): Promise<void> {
  const { error } = await supabase.from('app_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  await updateAppSettings({ password: newPassword });
}

// ============ TRUCKS ============
export async function getTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from('trucks').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTruckById(id: string): Promise<Truck | null> {
  const { data, error } = await supabase.from('trucks').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function addTruck(truck: Omit<Truck, 'id' | 'created_at'>): Promise<Truck> {
  const { data, error } = await supabase.from('trucks').insert(truck).select().single();
  if (error) throw error;
  return data;
}

export async function updateTruck(id: string, updates: Partial<Truck>): Promise<void> {
  const { error } = await supabase.from('trucks').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTruck(id: string): Promise<void> {
  const { error } = await supabase.from('trucks').delete().eq('id', id);
  if (error) throw error;
}

// ============ COMPANIES ============
export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from('companies').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function addCompany(company: Omit<Company, 'id' | 'created_at'>): Promise<Company> {
  const { data, error } = await supabase.from('companies').insert(company).select().single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<void> {
  const { error } = await supabase.from('companies').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
}

export async function findCompanyByName(name: string): Promise<Company | null> {
  const { data } = await supabase.from('companies').select('*').eq('name', name).single();
  return data || null;
}

export async function createCompanyQuick(name: string): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name, previous_balance: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ TRIPS ============
export async function getTrips(filters?: TripFilters): Promise<Trip[]> {
  let query = supabase
    .from('trips')
    .select('*, trucks(name), companies(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.truck_id) query = query.eq('truck_id', filters.truck_id);
  if (filters?.company_id) query = query.eq('company_id', filters.company_id);
  if (filters?.date_from) query = query.gte('date', filters.date_from);
  if (filters?.date_to) query = query.lte('date', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTripById(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, trucks(name), companies(name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getTripsByTruck(truckId: string): Promise<Trip[]> {
  return getTrips({ truck_id: truckId });
}

export async function getTripsByCompany(companyId: string): Promise<Trip[]> {
  return getTrips({ company_id: companyId });
}

export async function addTrip(trip: Omit<Trip, 'id' | 'created_at' | 'trucks' | 'companies'>): Promise<Trip> {
  // If company_name_text is provided but no company_id, try to find or create company
  let finalTrip = { ...trip };

  if (trip.company_name_text && !trip.company_id) {
    const existing = await findCompanyByName(trip.company_name_text);
    if (existing) {
      finalTrip.company_id = existing.id;
    } else {
      const newCompany = await createCompanyQuick(trip.company_name_text);
      finalTrip.company_id = newCompany.id;
    }
  }

  const { data, error } = await supabase.from('trips').insert(finalTrip).select('*, trucks(name), companies(name)').single();
  if (error) throw error;
  return data;
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<void> {
  const { error } = await supabase.from('trips').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export async function getLastTrips(limit: number): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, trucks(name), companies(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ============ EXPENSES ============
export async function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select('*, trucks(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.truck_id) query = query.eq('truck_id', filters.truck_id);
  if (filters?.expense_type) query = query.eq('expense_type', filters.expense_type);
  if (filters?.date_from) query = query.gte('date', filters.date_from);
  if (filters?.date_to) query = query.lte('date', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase.from('expenses').select('*, trucks(name)').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getExpensesByTruck(truckId: string): Promise<Expense[]> {
  return getExpenses({ truck_id: truckId });
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'trucks'>): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').insert(expense).select('*, trucks(name)').single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
  const { error } = await supabase.from('expenses').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getLastExpenses(limit: number): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, trucks(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ============ COMPANY PAYMENTS ============
export async function getPayments(filters?: PaymentFilters): Promise<CompanyPayment[]> {
  let query = supabase
    .from('company_payments')
    .select('*, companies(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.company_id) query = query.eq('company_id', filters.company_id);
  if (filters?.date_from) query = query.gte('date', filters.date_from);
  if (filters?.date_to) query = query.lte('date', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPaymentById(id: string): Promise<CompanyPayment | null> {
  const { data, error } = await supabase.from('company_payments').select('*, companies(name)').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getPaymentsByCompany(companyId: string): Promise<CompanyPayment[]> {
  return getPayments({ company_id: companyId });
}

export async function addPayment(payment: Omit<CompanyPayment, 'id' | 'created_at' | 'companies'>): Promise<CompanyPayment> {
  const { data, error } = await supabase.from('company_payments').insert(payment).select('*, companies(name)').single();
  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, updates: Partial<CompanyPayment>): Promise<void> {
  const { error } = await supabase.from('company_payments').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('company_payments').delete().eq('id', id);
  if (error) throw error;
}

// ============ CALCULATION HELPERS ============
export async function getDashboardStats(): Promise<DashboardStats> {
  const [trucks, tripsData, expensesData, companiesData, paymentsData] = await Promise.all([
    getTrucks(),
    supabase.from('trips').select('truck_id, amount'),
    supabase.from('expenses').select('truck_id, amount'),
    supabase.from('companies').select('id, previous_balance'),
    supabase.from('company_payments').select('company_id, amount'),
  ]);

  const trips = tripsData.data || [];
  const expenses = expensesData.data || [];
  const companies = companiesData.data || [];
  const payments = paymentsData.data || [];

  const totalIncome = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  // Company debts
  const companyTripsMap: Record<string, number> = {};
  // We need trips by company_id
  const { data: companyTrips } = await supabase.from('trips').select('company_id, amount').not('company_id', 'is', null);
  (companyTrips || []).forEach(t => {
    if (t.company_id) {
      companyTripsMap[t.company_id] = (companyTripsMap[t.company_id] || 0) + (t.amount || 0);
    }
  });

  const companyPaymentsMap: Record<string, number> = {};
  payments.forEach(p => {
    companyPaymentsMap[p.company_id] = (companyPaymentsMap[p.company_id] || 0) + (p.amount || 0);
  });

  let totalCompanyDebt = 0;
  companies.forEach(c => {
    const due = (c.previous_balance || 0) + (companyTripsMap[c.id] || 0);
    const paid = companyPaymentsMap[c.id] || 0;
    const remaining = due - paid;
    if (remaining > 0) totalCompanyDebt += remaining;
  });

  // Truck summaries
  const truckIncomeMap: Record<string, number> = {};
  const truckExpensesMap: Record<string, number> = {};
  trips.forEach(t => {
    truckIncomeMap[t.truck_id] = (truckIncomeMap[t.truck_id] || 0) + (t.amount || 0);
  });
  expenses.forEach(e => {
    truckExpensesMap[e.truck_id] = (truckExpensesMap[e.truck_id] || 0) + (e.amount || 0);
  });

  const truckSummaries: TruckSummary[] = trucks.map(truck => ({
    truck,
    income: truckIncomeMap[truck.id] || 0,
    expenses: truckExpensesMap[truck.id] || 0,
    profit: (truckIncomeMap[truck.id] || 0) - (truckExpensesMap[truck.id] || 0),
  }));

  return { totalIncome, totalExpenses, netProfit, totalCompanyDebt, truckSummaries };
}

export async function getCompanyBalance(companyId: string): Promise<CompanyBalance> {
  const [company, tripsData, paymentsData] = await Promise.all([
    getCompanyById(companyId),
    supabase.from('trips').select('amount').eq('company_id', companyId),
    supabase.from('company_payments').select('amount').eq('company_id', companyId),
  ]);

  const trips = tripsData.data || [];
  const payments = paymentsData.data || [];

  const prevBalance = company?.previous_balance || 0;
  const totalTrips = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDue = prevBalance + totalTrips;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = totalDue - totalPaid;

  return { totalDue, totalPaid, remaining };
}

export async function getTruckProfit(truckId: string): Promise<TruckProfit> {
  const [tripsData, expensesData] = await Promise.all([
    supabase.from('trips').select('amount').eq('truck_id', truckId),
    supabase.from('expenses').select('amount').eq('truck_id', truckId),
  ]);

  const income = (tripsData.data || []).reduce((sum, t) => sum + (t.amount || 0), 0);
  const expenses = (expensesData.data || []).reduce((sum, e) => sum + (e.amount || 0), 0);

  return { income, expenses, profit: income - expenses };
}

export async function getCompanyStatement(
  companyId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<StatementRow[]> {
  const company = await getCompanyById(companyId);
  if (!company) return [];

  let tripsQuery = supabase.from('trips').select('*').eq('company_id', companyId).order('date');
  let paymentsQuery = supabase.from('company_payments').select('*').eq('company_id', companyId).order('date');

  if (dateFrom) {
    tripsQuery = tripsQuery.gte('date', dateFrom);
    paymentsQuery = paymentsQuery.gte('date', dateFrom);
  }
  if (dateTo) {
    tripsQuery = tripsQuery.lte('date', dateTo);
    paymentsQuery = paymentsQuery.lte('date', dateTo);
  }

  const [tripsData, paymentsData] = await Promise.all([tripsQuery, paymentsQuery]);
  const trips = tripsData.data || [];
  const payments = paymentsData.data || [];

  const rows: StatementRow[] = [];
  let runningBalance = 0;

  // Opening balance
  if (!dateFrom && company.previous_balance > 0) {
    runningBalance = company.previous_balance;
    rows.push({
      date: company.created_at.split('T')[0],
      description: 'رصيد سابق',
      debit: company.previous_balance,
      credit: 0,
      runningBalance,
      type: 'opening',
    });
  } else if (!dateFrom) {
    runningBalance = company.previous_balance;
  }

  // Merge and sort by date
  type TripRow = typeof trips[0];
  type PaymentRow = typeof payments[0];
  type MergedItem =
    | { kind: 'trip'; item: TripRow }
    | { kind: 'payment'; item: PaymentRow };

  const merged: MergedItem[] = [
    ...trips.map(t => ({ kind: 'trip' as const, item: t })),
    ...payments.map(p => ({ kind: 'payment' as const, item: p })),
  ];
  merged.sort((a, b) => {
    const da = a.item.date;
    const db = b.item.date;
    return da < db ? -1 : da > db ? 1 : 0;
  });

  merged.forEach(m => {
    if (m.kind === 'trip') {
      const t = m.item as TripRow;
      runningBalance += t.amount || 0;
      rows.push({
        date: t.date,
        description: `نقلة: من ${t.from_location || '—'} إلى ${t.to_location || '—'}`,
        debit: t.amount || 0,
        credit: 0,
        runningBalance,
        type: 'trip',
      });
    } else {
      const p = m.item as PaymentRow;
      runningBalance -= p.amount || 0;
      rows.push({
        date: p.date,
        description: `دفعة: ${p.payment_method === 'cash' ? 'كاش' : p.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}`,
        debit: 0,
        credit: p.amount || 0,
        runningBalance,
        type: 'payment',
      });
    }
  });

  return rows;
}
