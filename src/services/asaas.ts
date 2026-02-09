import axios, { AxiosInstance } from 'axios'
import { z } from 'zod'

// ============================================
// Zod Schemas for Input Validation
// ============================================

export const CustomerSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos'),
    phone: z.string().optional(),
    mobilePhone: z.string().optional(),
})

export const PixPaymentSchema = z.object({
    customerId: z.string().min(1, 'ID do cliente é obrigatório'),
    value: z.number().positive('Valor deve ser maior que zero'),
    description: z.string().optional(),
    externalReference: z.string().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
})

export const CardPaymentSchema = z.object({
    customerId: z.string().min(1, 'ID do cliente é obrigatório'),
    value: z.number().positive('Valor deve ser maior que zero'),
    installmentCount: z.number().int().min(1).max(21, 'Parcelas devem ser entre 1 e 21'),
    creditCardToken: z.string().optional(),
    creditCard: z.object({
        holderName: z.string(),
        number: z.string(),
        expiryMonth: z.string(),
        expiryYear: z.string(),
        ccv: z.string(),
    }).optional(),
    creditCardHolderInfo: z.object({
        name: z.string().min(3, 'Nome do titular é obrigatório'),
        email: z.string().email('E-mail do titular inválido'),
        cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ do titular inválido'),
        postalCode: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
        addressNumber: z.string().min(1, 'Número do endereço é obrigatório'),
        phone: z.string().optional(),
    }),
    description: z.string().optional(),
    externalReference: z.string().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
}).refine(data => data.creditCardToken || data.creditCard, {
    message: "É necessário informar o token do cartão ou os dados do cartão.",
    path: ["creditCardToken"]
})

// ============================================
// Types
// ============================================

export type CustomerInput = z.infer<typeof CustomerSchema>
export type PixPaymentInput = z.infer<typeof PixPaymentSchema>
export type CardPaymentInput = z.infer<typeof CardPaymentSchema>

export interface AsaasCustomer {
    id: string
    name: string
    email: string
    cpfCnpj: string
    phone?: string
    mobilePhone?: string
}

export interface AsaasPayment {
    id: string
    status: string
    value: number
    netValue: number
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
    invoiceUrl?: string
    bankSlipUrl?: string
    pixQrCode?: {
        encodedImage: string
        payload: string
        expirationDate: string
    }
}

export interface AsaasPixPaymentResponse extends AsaasPayment {
    pixQrCodeId: string
    pixQrCode: {
        encodedImage: string
        payload: string
        expirationDate: string
    }
}

// ============================================
// Asaas Service Config
// ============================================

export interface AsaasServiceConfig {
    apiKey: string
    apiUrl?: string
}

// ============================================
// Asaas Service
// ============================================

export class AsaasService {
    private client: AxiosInstance

    constructor(config?: AsaasServiceConfig) {
        const apiKey = config?.apiKey || process.env.ASAAS_API_KEY
        let apiUrl = config?.apiUrl || process.env.ASAAS_API_URL

        // 🛡️ Segurança: Forçar URL de produção se estiver em ambiente de produção
        if (process.env.NODE_ENV === 'production') {
            apiUrl = 'https://api.asaas.com/v3'
        } else if (!apiUrl) {
            apiUrl = 'https://sandbox.asaas.com/api/v3'
        }

        if (!apiKey) {
            throw new Error('ASAAS_API_KEY is not configured')
        }

        this.client = axios.create({
            baseURL: apiUrl,
            headers: {
                'access_token': apiKey,
            },
        })

        // ============================================
        // 🛡️ Error Resilience Interceptor
        // ============================================
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (axios.isAxiosError(error) && error.response) {
                    const status = error.response.status
                    const data = error.response.data

                    // Asaas specific error codes
                    const asaasErrorCode = data.errors?.[0]?.code
                    const asaasErrorDesc = data.errors?.[0]?.description

                    // Evitar logar dados sensíveis em produção
                    if (process.env.NODE_ENV !== 'production') {
                        console.error('❌ [Asaas API Error]:', { status, code: asaasErrorCode, desc: asaasErrorDesc })
                    } else {
                        console.error('❌ [Asaas API Error]:', { status, code: asaasErrorCode })
                    }

                    // Enhance error object with friendly message
                    let friendlyMessage = 'Erro ao processar pagamento.'

                    if (status === 401) {
                        friendlyMessage = 'Erro de configuração no servidor (API Key inválida).'
                    } else if (status === 500) {
                        friendlyMessage = 'Erro interno no gateway de pagamento.'
                    } else if (status === 400) {
                        if (asaasErrorCode === 'invalid_credit_card') {
                            friendlyMessage = 'Cartão inválido. Verifique os dados digitados.'
                        } else if (asaasErrorCode === 'credit_card_declined') {
                            friendlyMessage = 'Cartão recusado pelo banco emissor.'
                        } else if (asaasErrorCode === 'insufficient_funds') {
                            friendlyMessage = 'Saldo insuficiente no cartão.' // User requested this specific case
                        } else if (asaasErrorDesc) {
                            friendlyMessage = asaasErrorDesc // Fallback to Asaas message if available
                        }
                    }

                    // Throw enhanced error
                    const enhancedError = new Error(friendlyMessage)
                        ; (enhancedError as any).code = asaasErrorCode || 'UNKNOWN_ERROR'
                        ; (enhancedError as any).status = status
                    throw enhancedError
                }
                throw error
            }
        )
    }

    /**
     * Find existing customer by CPF/CNPJ
     */
    async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
        try {
            const response = await this.client.get('/customers', {
                params: { cpfCnpj },
            })

            if (response.data.data && response.data.data.length > 0) {
                return response.data.data[0] as AsaasCustomer
            }

            return null
        } catch (error) {
            // Sanitize log: do not log the full error object which might contain sensitive headers/data
            console.error('Error finding customer:', error instanceof Error ? error.message : 'Unknown error')
            return null
        }
    }

    /**
     * Update an existing customer
     */
    async updateCustomer(id: string, input: Partial<CustomerInput>): Promise<AsaasCustomer> {
        // We only send fields that are present in input
        const response = await this.client.post(`/customers/${id}`, input)
        return response.data as AsaasCustomer
    }

    /**
     * Create a new customer or return existing one (updating it)
     */
    async createCustomer(input: CustomerInput): Promise<AsaasCustomer> {
        // Validate input
        const validated = CustomerSchema.parse(input)

        // Check if customer already exists
        const existingCustomer = await this.findCustomerByCpfCnpj(validated.cpfCnpj)

        if (existingCustomer) {
            // 🔄 SYNC DATA: Update the existing customer with new data (email, phone, etc)
            // This ensures we don't send notifications to old emails
            try {
                console.log(`[Asaas] Updating existing customer ${existingCustomer.id} with new data...`)
                return await this.updateCustomer(existingCustomer.id, validated)
            } catch (error) {
                console.error('[Asaas] Failed to update customer data, returning existing record:', error)
                return existingCustomer
            }
        }

        // Create new customer
        const response = await this.client.post('/customers', validated)
        return response.data as AsaasCustomer
    }

    /**
     * Create a PIX payment and return QR Code data
     */
    async createPixPayment(input: PixPaymentInput): Promise<AsaasPixPaymentResponse> {
        // Validate input
        const validated = PixPaymentSchema.parse(input)

        // Create payment
        const response = await this.client.post('/payments', {
            customer: validated.customerId,
            billingType: 'PIX',
            value: validated.value,
            description: validated.description || 'Pagamento via PIX',
            externalReference: validated.externalReference,
            dueDate: validated.dueDate,
        })

        const payment = response.data

        // Get PIX QR Code
        const qrCodeResponse = await this.client.get(`/payments/${payment.id}/pixQrCode`)

        return {
            ...payment,
            pixQrCodeId: qrCodeResponse.data.id,
            pixQrCode: {
                encodedImage: qrCodeResponse.data.encodedImage,
                payload: qrCodeResponse.data.payload,
                expirationDate: qrCodeResponse.data.expirationDate,
            },
        } as AsaasPixPaymentResponse
    }

    /**
     * Create a credit card payment using tokenized card
     */
    async createCardPayment(input: CardPaymentInput): Promise<AsaasPayment> {
        // Validate input
        const validated = CardPaymentSchema.parse(input)

        // Calculate installment value
        const installmentValue = validated.value / validated.installmentCount

        // Create payment
        // NOTE: Asaas accepts EITHER creditCardToken OR creditCard object.
        const response = await this.client.post('/payments', {
            customer: validated.customerId,
            billingType: 'CREDIT_CARD',
            value: validated.value,
            installmentCount: validated.installmentCount,
            installmentValue,
            description: validated.description || 'Pagamento via Cartão de Crédito',
            externalReference: validated.externalReference,
            dueDate: validated.dueDate,
            creditCardToken: validated.creditCardToken,
            creditCard: validated.creditCard, // Passing raw card if present
            creditCardHolderInfo: validated.creditCardHolderInfo,
        })

        return response.data as AsaasPayment
    }

    /**
     * Get payment status by ID
     */
    async getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
        const response = await this.client.get(`/payments/${paymentId}`)
        return response.data as AsaasPayment
    }
}

// Lazy-init singleton (only created when accessed in production)
let _asaasServiceInstance: AsaasService | null = null

export function getAsaasService(): AsaasService {
    if (!_asaasServiceInstance) {
        _asaasServiceInstance = new AsaasService()
    }
    return _asaasServiceInstance
}

// For backward compatibility (will throw if env not set)
export const asaasService = typeof process !== 'undefined' && process.env.ASAAS_API_KEY
    ? new AsaasService()
    : (null as unknown as AsaasService)

