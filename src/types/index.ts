export interface AppSettings {
  id: number;
  username: string;
  password: string;
  mother_name: string | null;
  pin: string | null;
  recovery_code: string | null;
  security_setup_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface Truck {
  id: string;
  name: string;
  plate_number: string | null;
  truck_type: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  notes: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  contact_person: string | null;
  previous_balance: number;
  notes: string | null;
  created_at: string;
}

export type TripType = 'to_company' | 'from_company' | 'external';

export interface Trip {
  id: string;
  date: string;
  truck_id: string;
  company_id: string | null;
  company_name_text: string | null;
  from_location: string | null;
  to_location: string | null;
  trip_type: TripType;
  amount: number;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  trucks?: { name: string } | null;
  companies?: { name: string } | null;
}

export type ExpenseType = 'fuel' | 'maintenance' | 'tires' | 'license' | 'insurance' | 'oil' | 'other';

export interface Expense {
  id: string;
  date: string;
  truck_id: string;
  expense_type: ExpenseType;
  amount: number;
  description: string | null;
  notes: string | null;
  created_at: string;
  trucks?: { name: string } | null;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'check';

export interface CompanyPayment {
  id: string;
  date: string;
  company_id: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  companies?: { name: string } | null;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalCompanyDebt: number;
  truckSummaries: TruckSummary[];
}

export interface TruckSummary {
  truck: Truck;
  income: number;
  expenses: number;
  profit: number;
}

export interface CompanyBalance {
  totalDue: number;
  totalPaid: number;
  remaining: number;
}

export interface TruckProfit {
  income: number;
  expenses: number;
  profit: number;
}

export interface StatementRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  type: 'opening' | 'trip' | 'payment';
}

export interface TripFilters {
  truck_id?: string;
  company_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ExpenseFilters {
  truck_id?: string;
  expense_type?: ExpenseType;
  date_from?: string;
  date_to?: string;
}

export interface PaymentFilters {
  company_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuthUser {
  username: string;
  security_setup_done: boolean;
}
