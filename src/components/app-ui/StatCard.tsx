interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  subtitle?: string;
}

const colorMap = {
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
};

const textColorMap = {
  green: 'text-green-700 dark:text-green-400',
  red: 'text-red-700 dark:text-red-400',
  blue: 'text-blue-700 dark:text-blue-400',
  orange: 'text-orange-700 dark:text-orange-400',
  purple: 'text-purple-700 dark:text-purple-400',
};

export default function StatCard({ icon, title, value, color, subtitle }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColorMap[color]}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
