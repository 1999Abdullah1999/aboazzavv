import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
}

/** Wrap a list of children; each direct child animates in with a stagger delay. */
export function StaggeredList({ children, className = '' }: StaggeredListProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wrap each individual item inside a StaggeredList. */
export function StaggeredItem({ children, className = '' }: StaggeredListProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
