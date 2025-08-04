import { IoSparkles } from "react-icons/io5";
import { motion } from "framer-motion";

export default function App() {
  return (
    // Main container with a dark, gradient background
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 p-6">
      
      {/* Background Aurora Effect */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-purple-500/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      {/* Main Card with Glassmorphism effect */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.03, y: -5 }}
        className="relative z-10 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold flex justify-center items-center gap-3 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Welcome!
          <motion.span
            animate={{ scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <IoSparkles className="text-cyan-400" />
          </motion.span>
        </motion.h1>

        <p className="text-slate-400">
          Start editing{" "}
          <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded-md font-mono">
            App.tsx
          </code>{" "}
          to refresh the preview.
        </p>
      </motion.div>
    </div>
  );
}