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
  visible: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

interface PageSkeletonProps {
  /** 'cards' for grid pages (trucks, companies), 'table' for list pages (trips, expenses, payments) */
  variant?: 'cards' | 'table';
}

export default function PageSkeleton({ variant = 'cards' }: PageSkeletonProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-5 p-4 md:p-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-40" />
          <Bone className="h-4 w-28" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </motion.div>

      {/* Filters bar */}
      <motion.div variants={item} className="flex gap-3 flex-wrap">
        {Array.from({ length: variant === 'table' ? 4 : 2 }).map((_, i) => (
          <Bone key={i} className="h-11 w-36 rounded-xl" />
        ))}
      </motion.div>

      {variant === 'cards' ? (
        /* Card grid */
        <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} variants={item} className="space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between">
                <Bone className="h-6 w-32" />
                <Bone className="h-6 w-16 rounded-full" />
              </div>
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
              <Bone className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Bone className="h-9 flex-1 rounded-xl" />
                <Bone className="h-9 flex-1 rounded-xl" />
                <Bone className="h-9 flex-1 rounded-xl" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Table skeleton */
        <motion.div variants={item} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bone key={i} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={item} className="flex gap-4 p-3 border-t border-gray-200 dark:border-gray-700">
              {Array.from({ length: 6 }).map((_, j) => (
                <Bone key={j} className="h-4 flex-1" />
              ))}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
