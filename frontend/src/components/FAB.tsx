import { Plus } from "lucide-react";
import { motion } from "motion/react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30 flex items-center justify-center z-40 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Plus className="w-6 h-6 md:w-7 md:h-7" />
    </motion.button>
  );
}
