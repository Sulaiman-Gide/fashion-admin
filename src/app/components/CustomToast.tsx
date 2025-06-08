"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";
import clsx from "clsx";

type ToastProps = {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onHide: () => void;
};

export default function CustomToast({
  message,
  type,
  visible,
  onHide,
}: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const icon =
    type === "success" ? (
      <AiFillCheckCircle className="text-green-600 text-xl" />
    ) : (
      <AiFillCloseCircle className="text-red-600 text-xl" />
    );

  const textColor = type === "success" ? "text-green-600" : "text-red-600";
  const borderColor =
    type === "success" ? "border-green-600" : "border-red-600";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-6 right-10 transform z-[1000]"
        >
          <div
            className={clsx(
              "rounded-2xl px-4 py-3 flex items-center shadow-md bg-white",
              textColor
            )}
          >
            {icon}
            <p className={clsx("ml-2 text-sm font-medium", textColor)}>
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
