'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'

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

    // Hydrate state from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<CheckoutState>
                dispatch({ type: 'HYDRATE', payload: parsed })
            }
        } catch (error) {
            console.error('Failed to hydrate checkout state:', error)
        }
    }, [])

    // Persist state to sessionStorage on changes
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        } catch (error) {
            console.error('Failed to persist checkout state:', error)
        }
    }, [state])

    // Actions
    const nextStep = () => dispatch({ type: 'NEXT_STEP' })
    const prevStep = () => dispatch({ type: 'PREV_STEP' })
    const goToStep = (step: 1 | 2 | 3) => dispatch({ type: 'GO_TO_STEP', payload: step })
    const updateData = <K extends keyof CheckoutState>(key: K, value: CheckoutState[K]) => {
        dispatch({ type: 'UPDATE_DATA', payload: { key, value } })
    }
    const reset = () => {
        sessionStorage.removeItem(STORAGE_KEY)
        dispatch({ type: 'RESET' })
    }

    return (
        <CheckoutContext.Provider
            value={{
                state,
                nextStep,
                prevStep,
                goToStep,
                updateData,
                reset,
            }}
        >
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
