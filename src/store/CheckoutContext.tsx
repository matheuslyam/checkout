'use client'

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'

// ============================================
// Types
// ============================================
export type MetodoPagamento = 'pix' | 'cartao' | 'boleto' | null

export interface CheckoutState {
    // Navigation
    step: 1 | 2 | 3

    // Step 1: Customer data
    email: string
    cpf: string
    nome: string
    telefone: string

    // Step 2: Address
    cep: string
    endereco: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string

    // Step 3: Payment
    metodoPagamento: MetodoPagamento
    parcelas: number

    // Shipping
    frete: number
}

type CheckoutAction =
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'GO_TO_STEP'; payload: 1 | 2 | 3 }
    | { type: 'UPDATE_DATA'; payload: { key: keyof CheckoutState; value: CheckoutState[keyof CheckoutState] } }
    | { type: 'HYDRATE'; payload: Partial<CheckoutState> }
    | { type: 'RESET' }

// ============================================
// Initial State
// ============================================
const initialState: CheckoutState = {
    step: 1,
    email: '',
    cpf: '',
    nome: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    metodoPagamento: null,
    parcelas: 1,
    frete: 0,
}

// ============================================
// Reducer
// ============================================
function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
    switch (action.type) {
        case 'NEXT_STEP':
            return {
                ...state,
                step: Math.min(state.step + 1, 3) as 1 | 2 | 3,
            }

        case 'PREV_STEP':
            return {
                ...state,
                step: Math.max(state.step - 1, 1) as 1 | 2 | 3,
            }

        case 'GO_TO_STEP':
            return {
                ...state,
                step: action.payload,
            }

        case 'UPDATE_DATA':
            return {
                ...state,
                [action.payload.key]: action.payload.value,
            }

        case 'HYDRATE':
            return {
                ...state,
                ...action.payload,
            }

        case 'RESET':
            return initialState

        default:
            return state
    }
}

// ============================================
// Context
// ============================================
interface CheckoutContextValue {
    state: CheckoutState
    isHydrated: boolean
    nextStep: () => void
    prevStep: () => void
    goToStep: (step: 1 | 2 | 3) => void
    updateData: <K extends keyof CheckoutState>(key: K, value: CheckoutState[K]) => void
    reset: () => void
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

// ============================================
// Storage Key
// ============================================
const STORAGE_KEY = 'checkout_state'

// ============================================
// Provider
// ============================================
interface CheckoutProviderProps {
    children: ReactNode
}

export function CheckoutProvider({ children }: CheckoutProviderProps) {
    const [state, dispatch] = useReducer(checkoutReducer, initialState)
    const [isHydrated, setIsHydrated] = useState(false)

    // Hydrate state from sessionStorage on mount (client-side only)
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<CheckoutState>
                dispatch({ type: 'HYDRATE', payload: parsed })
            }
        } catch (error) {
            console.error('Failed to hydrate checkout state:', error)
        } finally {
            // Always mark as hydrated after attempting to load
            setIsHydrated(true)
        }
    }, [])

    // Persist state to sessionStorage on changes (only after hydration)
    useEffect(() => {
        // Skip saving until hydration is complete to avoid overwriting stored data
        if (!isHydrated) return

        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        } catch (error) {
            console.error('Failed to persist checkout state:', error)
        }
    }, [state, isHydrated])

    // Actions
    const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), [])
    const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), [])
    const goToStep = useCallback((step: 1 | 2 | 3) => dispatch({ type: 'GO_TO_STEP', payload: step }), [])

    const updateData = useCallback(<K extends keyof CheckoutState>(key: K, value: CheckoutState[K]) => {
        dispatch({ type: 'UPDATE_DATA', payload: { key, value } })
    }, [])

    const reset = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY)
        dispatch({ type: 'RESET' })
    }, [])

    const value = useMemo(() => ({
        state,
        isHydrated,
        nextStep,
        prevStep,
        goToStep,
        updateData,
        reset,
    }), [state, isHydrated, nextStep, prevStep, goToStep, updateData, reset])

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    )
}

// ============================================
// Hook
// ============================================
export function useCheckout() {
    const context = useContext(CheckoutContext)
    if (!context) {
        throw new Error('useCheckout must be used within a CheckoutProvider')
    }
    return context
}

// ============================================
// Loading Skeleton Component
// ============================================
export function CheckoutSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Stepper skeleton */}
            <div className="flex items-center justify-between mb-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center flex-1">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="ml-3 h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded hidden sm:block" />
                        {i < 3 && <div className="flex-1 mx-4 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" />}
                    </div>
                ))}
            </div>

            {/* Title skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Form fields skeleton */}
            <div className="space-y-5">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    </div>
                ))}
            </div>

            {/* Button skeleton */}
            <div className="h-14 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
    )
}
