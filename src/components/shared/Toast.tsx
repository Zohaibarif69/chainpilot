"use client";

import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-4 h-4 text-[#15803D]" />,
    error: <AlertCircle className="w-4 h-4 text-[#DC2626]" />,
    info: <Info className="w-4 h-4 text-[#2563EB]" />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-slide-in flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 shadow-lg pointer-events-auto min-w-[280px]"
          >
            {icons[toast.type]}
            <span className="text-[13px] text-[#111827] flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-[#98A2B3] hover:text-[#111827]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
