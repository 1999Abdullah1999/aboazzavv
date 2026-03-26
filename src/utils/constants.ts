import type { ExpenseType, PaymentMethod, TripType } from '../types';

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  fuel: '⛽ بنزين/سولار',
  maintenance: '🔧 صيانة',
  tires: '🛞 إطارات',
  license: '📄 رخصة',
  insurance: '🛡️ تأمين',
  oil: '🛢️ زيوت',
  other: '📦 أخرى',
};

export const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  fuel: 'blue',
  maintenance: 'orange',
  tires: 'purple',
  license: 'green',
  insurance: 'yellow',
  oil: 'cyan',
  other: 'gray',
};

export const TRUCK_STATUS_LABELS: Record<string, string> = {
  active: 'شغالة',
  inactive: 'معطلة',
  maintenance: 'صيانة',
};

export const TRUCK_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'red',
  maintenance: 'yellow',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '💵 كاش',
  bank_transfer: '🏦 تحويل بنكي',
  check: '📝 شيك',
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  to_company: 'إلى الشركة',
  from_company: 'من الشركة',
  external: 'شغل خارجي',
};
