import { z } from 'zod'

// ============================================
// Step 1: Customer Data Schema
// ============================================
export const Step1Schema = z.object({
    email: z.string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
    cpf: z.string().optional(), // CPF moved to payment step
    nome: z.string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter pelo menos 3 caracteres'),
    telefone: z.string().optional(),
})

export type Step1Data = z.infer<typeof Step1Schema>

// ============================================
// Step 2: Delivery Address Schema
// ============================================
export const Step2Schema = z.object({
    cep: z.string()
        .min(1, 'CEP é obrigatório')
        .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    endereco: z.string()
        .min(1, 'Endereço é obrigatório')
        .min(5, 'Endereço muito curto'),
    numero: z.string()
        .min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string()
        .min(1, 'Bairro é obrigatório')
        .min(2, 'Bairro muito curto'),
    cidade: z.string()
        .min(1, 'Cidade é obrigatória')
        .min(2, 'Cidade muito curta'),
    estado: z.string()
        .min(1, 'Estado é obrigatório')
        .length(2, 'Use a sigla do estado (ex: SP)'),
})

export type Step2Data = z.infer<typeof Step2Schema>

// ============================================
// Step 3: Payment Schema
// ============================================
export const Step3Schema = z.object({
    metodoPagamento: z.enum(['pix', 'cartao', 'boleto']),
})

export type Step3Data = z.infer<typeof Step3Schema>

// ============================================
// Validation Types
// ============================================
export type ValidationErrors = Record<string, string>

export interface ValidationResult {
    valid: boolean
    errors: ValidationErrors
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate Step 1 data
 */
export function validateStep1(data: Partial<Step1Data>): ValidationResult {
    const result = Step1Schema.safeParse(data)

    if (result.success) {
        return { valid: true, errors: {} }
    }

    const errors: ValidationErrors = {}
    result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (!errors[field]) {
            errors[field] = issue.message
        }
    })

    return { valid: false, errors }
}

/**
 * Validate Step 2 data
 */
export function validateStep2(data: Partial<Step2Data>): ValidationResult {
    const result = Step2Schema.safeParse(data)

    if (result.success) {
        return { valid: true, errors: {} }
    }

    const errors: ValidationErrors = {}
    result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (!errors[field]) {
            errors[field] = issue.message
        }
    })

    return { valid: false, errors }
}

/**
 * Validate Step 3 data
 */
export function validateStep3(data: Partial<Step3Data>): ValidationResult {
    const result = Step3Schema.safeParse(data)

    if (result.success) {
        return { valid: true, errors: {} }
    }

    const errors: ValidationErrors = {}
    result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (!errors[field]) {
            errors[field] = issue.message
        }
    })

    return { valid: false, errors }
}

// ============================================
// Credit Card Validation (Luhn Algorithm)
// ============================================

export const isValidCreditCard = (value: string) => {
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '')

    // Check strict length (Common cards are 13-19 digits)
    if (cleanValue.length < 13 || cleanValue.length > 19) return false


    // Check for test card
    if (cleanValue === '0000000000000000' && process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true') return true

    // Check for common test patterns (like all zeros)
    if (/^(\d)\1+$/.test(cleanValue)) return false

    // Luhn Algorithm
    let sum = 0
    let shouldDouble = false

    // Loop through values starting at the rightmost digit
    for (let i = cleanValue.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanValue.charAt(i))

        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9
        }

        sum += digit
        shouldDouble = !shouldDouble
    }

    return (sum % 10) === 0
}

// ============================================
// CPF Validation
// ============================================
export const isValidCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')

    // Check strict length
    if (cleanValue.length !== 11) return false

    // Check for test CPF
    if (cleanValue === '12345678900' && process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true') return true

    // Check for common patterns (all same digits)
    if (/^(\d)\1+$/.test(cleanValue)) return false

    // Generate verification digits
    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleanValue.substring(i - 1, i)) * (11 - i)
    }

    remainder = (sum * 10) % 11
    if ((remainder === 10) || (remainder === 11)) remainder = 0
    if (remainder !== parseInt(cleanValue.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleanValue.substring(i - 1, i)) * (12 - i)
    }

    remainder = (sum * 10) % 11
    if ((remainder === 10) || (remainder === 11)) remainder = 0
    if (remainder !== parseInt(cleanValue.substring(10, 11))) return false

    return true
}

