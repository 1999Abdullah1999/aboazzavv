interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  subtitle?: string;
}

const gradientMap = {
  green: 'from-emerald-500 to-teal-600',
  red: 'from-rose-500 to-pink-600',
  blue: 'from-blue-500 to-indigo-600',
  orange: 'from-amber-500 to-orange-600',
  purple: 'from-purple-500 to-violet-600',
};

const glowMap = {
  green: 'shadow-emerald-500/25',
  red: 'shadow-rose-500/25',
  blue: 'shadow-blue-500/25',
  orange: 'shadow-amber-500/25',
  purple: 'shadow-purple-500/25',
};

export default function StatCard({ icon, title, value, color, subtitle }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientMap[color]} p-5 shadow-lg ${glowMap[color]} transition-transform duration-200 hover:scale-[1.02]`}
    >
      {/* Decorative circles */}
      <div className="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-white/80 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1.5 text-white">{value}</p>
          {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
