// GlobalAlert.jsx
import { motion } from "motion/react";
import { TbLoader3 } from "react-icons/tb";
import { useAlert } from "@/context/AlertContext";


export default function GlobalAlert() {
  const { alert } = useAlert();
  if (!alert) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-white
        ${alert.type === "error" ? "bg-red-500" : "bg-blue-500"}
      `}
    >
      <div className="flex items-center gap-2">
        {alert.loading && <TbLoader3 className="w-4 h-4 animate-spin" />}
        <span>{alert.message}</span>
      </div>
    </motion.div>
  );
}
