"use client"

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { validateStep1, validateStep2, validateStep3, type ValidationErrors, type ValidationResult } from '@/lib/validation'

// ... (existing imports/types remain, but we only replace up to the effect)

// ============================================
// Types
// ============================================
// ... (omitting lines to keep replacement concise is hard with replacement tool, I will just target the specific blocks)


// ============================================
// Types
// ============================================
export type MetodoPagamento = 'pix' | 'cartao' | 'boleto' | null

export interface CheckoutState {
    // Navigation (1=Data, 2=Delivery, 3=Payment, 4=Success)
    step: 1 | 2 | 3 | 4

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

    // Product Data (Dynamic)
    productId: string
    productName: string
    productImage: string
    productDescription: string
    productPrice: number
    productOriginalPrice: number
    productColor: string

    // Payment Result (from Asaas)
    paymentId: string
    paymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | null
    pixQrCode: string      // Base64 encoded QR Code image
    pixPayload: string     // Copy-paste PIX code
    pixExpiresAt: string   // ISO date string

    // Installments
    installmentOptions: Array<{
        installment: number
        value: number
        total: number
        fee: number
        label: string
    }>

    // Shipping
    frete: number
}

type CheckoutAction =
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'GO_TO_STEP'; payload: 1 | 2 | 3 | 4 }
    | { type: 'UPDATE_DATA'; payload: { key: keyof CheckoutState; value: CheckoutState[keyof CheckoutState] } }
    | { type: 'SET_PAYMENT_RESULT'; payload: { paymentId: string; pixQrCode: string; pixPayload: string; pixExpiresAt: string } }
    | { type: 'SET_PAYMENT_STATUS'; payload: 'PENDING' | 'CONFIRMED' | 'FAILED' }
    | { type: 'SET_INSTALLMENT_OPTIONS'; payload: CheckoutState['installmentOptions'] }
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
    productId: 'ambtus-flash', // Default fallback
    productName: 'AMBTUS FLASH',
    productImage: '/images/bike.png',
    productDescription: '', // Added description
    productPrice: 1249000, // Default price
    productOriginalPrice: 1400000,
    productColor: 'Padrão',
    installmentOptions: [],
    paymentId: '',
    paymentStatus: null,
    pixQrCode: '',
    pixPayload: '',
    pixExpiresAt: '',
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
                step: Math.min(state.step + 1, 4) as 1 | 2 | 3 | 4,
            }

        case 'PREV_STEP':
            return {
                ...state,
                step: Math.max(state.step - 1, 1) as 1 | 2 | 3 | 4,
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

        case 'SET_PAYMENT_RESULT':
            return {
                ...state,
                paymentId: action.payload.paymentId,
                pixQrCode: action.payload.pixQrCode,
                pixPayload: action.payload.pixPayload,
                pixExpiresAt: action.payload.pixExpiresAt,
                paymentStatus: 'PENDING',
            }

        case 'SET_PAYMENT_STATUS':
            return {
                ...state,
                paymentStatus: action.payload,
            }

        case 'SET_INSTALLMENT_OPTIONS':
            return {
                ...state,
                installmentOptions: action.payload,
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
    validationErrors: ValidationErrors
    nextStep: () => boolean  // Returns true if validation passed
    prevStep: () => void
    goToStep: (step: 1 | 2 | 3 | 4) => void
    updateData: <K extends keyof CheckoutState>(key: K, value: CheckoutState[K]) => void
    setPaymentResult: (data: { paymentId: string; pixQrCode: string; pixPayload: string; pixExpiresAt: string }) => void
    setInstallmentOptions: (options: CheckoutState['installmentOptions']) => void
    setPaymentStatus: (status: 'PENDING' | 'CONFIRMED' | 'FAILED') => void
    validateCurrentStep: () => ValidationResult
    clearValidationErrors: () => void
    reset: () => void
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

// ============================================
// Storage Key
// ============================================
const STORAGE_KEY = 'checkout_state_v2'

// ============================================
// Provider
// ============================================
interface CheckoutProviderProps {
    children: ReactNode
}

export function CheckoutProvider({ children }: CheckoutProviderProps) {
    const [state, dispatch] = useReducer(checkoutReducer, initialState)
    const [isHydrated, setIsHydrated] = useState(false)
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

    const searchParams = useSearchParams()

    // Hydrate state from sessionStorage on mount (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') return

        const urlBike = searchParams.get('bike')
        const urlColor = searchParams.get('cor')

        try {
            const stored = sessionStorage.getItem(STORAGE_KEY)

            if (stored) {
                const parsed = JSON.parse(stored) as Partial<CheckoutState>

                // Security Check: If URL has new product/color, PURGE session
                // This prevents PII from previous sessions leaking into a new sale
                const isDifferentProduct =
                    (urlBike && urlBike !== parsed.productId) ||
                    (urlColor && urlColor !== parsed.productColor)

                if (isDifferentProduct) {
                    console.log('🔄 [Checkout] New product detected in URL. Purging old session for security.')
                    sessionStorage.removeItem(STORAGE_KEY)

                    // Initialize with new data from URL
                    if (urlBike) dispatch({ type: 'UPDATE_DATA', payload: { key: 'productId', value: urlBike } })
                    if (urlColor) dispatch({ type: 'UPDATE_DATA', payload: { key: 'productColor', value: urlColor } })

                    // Do NOT hydrate the old state (it's gone)
                } else {
                    // Same product or no URL params -> Safe to restore
                    dispatch({ type: 'HYDRATE', payload: parsed })
                    console.log('✅ [Checkout] State restored from session storage')
                }
            } else {
                // No session stored -> Just use URL params if any
                if (urlBike) dispatch({ type: 'UPDATE_DATA', payload: { key: 'productId', value: urlBike } })
                if (urlColor) dispatch({ type: 'UPDATE_DATA', payload: { key: 'productColor', value: urlColor } })
            }
        } catch (error) {
            console.error('❌ [Checkout] Failed to hydrate state:', error)
            // If corrupt, clear it
            sessionStorage.removeItem(STORAGE_KEY)
        } finally {
            // Always mark as hydrated after attempting to load
            setIsHydrated(true)
        }
    }, [searchParams])

    // Persist state to sessionStorage on changes (only after hydration)
    useEffect(() => {
        // Skip saving until hydration is complete to avoid overwriting stored data
        if (!isHydrated) return

        try {
            const data = JSON.stringify(state)
            sessionStorage.setItem(STORAGE_KEY, data)
            // console.log('💾 [Checkout] State saved') // debug only
        } catch (error) {
            console.error('❌ [Checkout] Failed to persist state:', error)
        }
    }, [state, isHydrated])

    // Validate current step data
    const validateCurrentStep = useCallback((): ValidationResult => {
        switch (state.step) {
            case 1:
                return validateStep1({
                    email: state.email,
                    // cpf: state.cpf.replace(/\D/g, ''), // CPF moved to payment
                    nome: state.nome,
                    telefone: state.telefone,
                })
            case 2:
                return validateStep2({
                    cep: state.cep.replace(/\D/g, ''),
                    endereco: state.endereco,
                    numero: state.numero,
                    complemento: state.complemento,
                    bairro: state.bairro,
                    cidade: state.cidade,
                    estado: state.estado,
                })
            case 3:
                return validateStep3({
                    metodoPagamento: state.metodoPagamento || undefined,
                })
            default:
                return { valid: true, errors: {} }
        }
    }, [state])

    // Clear validation errors
    const clearValidationErrors = useCallback(() => {
        setValidationErrors({})
    }, [])

    // Actions with validation
    const nextStep = useCallback((): boolean => {
        const result = validateCurrentStep()
        if (!result.valid) {
            setValidationErrors(result.errors)
            console.log('[Validation] Step', state.step, 'failed:', result.errors)
            return false
        }
        setValidationErrors({})
        dispatch({ type: 'NEXT_STEP' })
        return true
    }, [validateCurrentStep, state.step])

    const prevStep = useCallback(() => {
        setValidationErrors({})
        dispatch({ type: 'PREV_STEP' })
    }, [])

    const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
        setValidationErrors({})
        dispatch({ type: 'GO_TO_STEP', payload: step })
    }, [])

    const updateData = useCallback(<K extends keyof CheckoutState>(key: K, value: CheckoutState[K]) => {
        // Clear the specific field error when user updates it
        setValidationErrors(prev => {
            if (prev[key as string]) {
                const updated = { ...prev }
                delete updated[key as string]
                return updated
            }
            return prev
        })
        dispatch({ type: 'UPDATE_DATA', payload: { key, value } })
    }, [])

    const setPaymentResult = useCallback((data: { paymentId: string; pixQrCode: string; pixPayload: string; pixExpiresAt: string }) => {
        dispatch({ type: 'SET_PAYMENT_RESULT', payload: data })
    }, [])

    const setPaymentStatus = useCallback((status: 'PENDING' | 'CONFIRMED' | 'FAILED') => {
        dispatch({ type: 'SET_PAYMENT_STATUS', payload: status })
    }, [])

    const setInstallmentOptions = useCallback((options: CheckoutState['installmentOptions']) => {
        dispatch({ type: 'SET_INSTALLMENT_OPTIONS', payload: options })
    }, [])

    const reset = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY)
        setValidationErrors({})
        dispatch({ type: 'RESET' })
    }, [])

    const value = useMemo(() => ({
        state,
        isHydrated,
        validationErrors,
        nextStep,
        prevStep,
        goToStep,
        updateData,
        setPaymentResult,
        setPaymentStatus,
        setInstallmentOptions,
        validateCurrentStep,
        clearValidationErrors,
        reset,
    }), [state, isHydrated, validationErrors, nextStep, prevStep, goToStep, updateData, setPaymentResult, setPaymentStatus, validateCurrentStep, clearValidationErrors, reset])

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
