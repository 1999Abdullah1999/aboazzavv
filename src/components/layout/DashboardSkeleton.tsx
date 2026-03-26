import { motion } from 'framer-motion';

const shimmer = {
  initial: { backgroundPosition: '200% 0' },
  animate: {
    backgroundPosition: '-200% 0',
    transition: { repeat: Infinity, duration: 1.8, ease: 'linear' as const },
  },
};

function Bone({ className = '' }: { className?: string }) {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      className={`rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] ${className}`}
    />
  );
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardSkeleton() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header skeleton */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-32" />
      </motion.div>

      {/* Period pills */}
      <motion.div variants={item} className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-10 w-20 rounded-xl" />
        ))}
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-28 rounded-2xl" />
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Bone className="h-72 xl:col-span-2 rounded-2xl" />
        <Bone className="h-72 rounded-2xl" />
      </motion.div>

      {/* Truck summaries */}
      <motion.div variants={item} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-40 rounded-2xl" />
        ))}
      </motion.div>
    </motion.div>
  );
}
