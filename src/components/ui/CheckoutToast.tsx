'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

// ============================================
// Types
// ============================================

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface CheckoutToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void
}

// ============================================
// Context
// ============================================

const CheckoutToastContext = createContext<CheckoutToastContextValue | null>(null)

export function useCheckoutToast() {
    const context = useContext(CheckoutToastContext)
    if (!context) {
        throw new Error('useCheckoutToast must be used within a CheckoutToastProvider')
    }
    return context
}

// ============================================
// Provider
// ============================================

export function CheckoutToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9)
        const toast: Toast = { id, message, type, duration }

        setToasts((prev) => [...prev, toast])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <CheckoutToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
                <AnimatePresence mode='popLayout'>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </CheckoutToastContext.Provider>
    )
}

// ============================================
// Toast Component (Internal)
// ============================================

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    }

    const borderColors = {
        success: 'border-green-500/20',
        error: 'border-red-500/20',
        info: 'border-blue-500/20',
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border ${borderColors[toast.type]} shadow-2xl shadow-black/50`}
        >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium text-zinc-100 leading-tight">
                {toast.message}
            </p>
            <button
                onClick={onDismiss}
                className="shrink-0 p-1 -mr-2 -mt-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-300"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    )
}
