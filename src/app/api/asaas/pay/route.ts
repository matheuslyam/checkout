import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProductById } from '@/lib/products'
import { calculateShipping } from '@/lib/shipping'
import { getAsaasService, CustomerSchema } from '@/services/asaas'

// ============================================
// Input Validation Schemas
// ============================================

const AddressSchema = z.object({
    cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    endereco: z.string().min(5, 'Endereço é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Bairro é obrigatório'),
    cidade: z.string().min(2, 'Cidade é obrigatória'),
    uf: z.string().length(2, 'UF deve ter 2 caracteres'),
})

const CreditCardInfoSchema = z.object({
    token: z.string().min(1, 'Token do cartão é obrigatório'),
    holderName: z.string().min(3, 'Nome do titular é obrigatório'),
    holderEmail: z.string().email('Email do titular inválido'),
    holderCpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido'),
    holderPostalCode: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    holderAddressNumber: z.string().min(1, 'Número é obrigatório'),
})

const PaymentRequestSchema = z.object({
    // Product identification (NOT the price!)
    productId: z.string().min(1, 'ID do produto é obrigatório'),

    // Customer data
    customer: z.object({
        name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
        email: z.string().email('E-mail inválido'),
        cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF deve ter 11 dígitos'),
        phone: z.string().optional(),
    }),

    // Address (needed for shipping calculation)
    address: AddressSchema,

    // Payment method
    paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO']),

    // Credit card specific (optional)
    creditCard: CreditCardInfoSchema.optional(),
    installments: z.number().int().min(1).max(12).optional(),

    // Optional: For security logging only (not used in calculation)
    debugTotal: z.number().optional(),
})

type PaymentRequest = z.infer<typeof PaymentRequestSchema>

// ============================================
// Security Logger
// ============================================

function logSecurityEvent(
    event: 'PRICE_MISMATCH' | 'PRODUCT_NOT_FOUND' | 'INVALID_INSTALLMENTS',
    details: Record<string, unknown>,
    request: NextRequest
) {
    const timestamp = new Date().toISOString()
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.warn(`🚨 [SECURITY] ${event}`)
    console.warn(`   Timestamp: ${timestamp}`)
    console.warn(`   IP: ${ip}`)
    console.warn(`   User-Agent: ${userAgent}`)
    Object.entries(details).forEach(([key, value]) => {
        console.warn(`   ${key}: ${JSON.stringify(value)}`)
    })
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

// ============================================
// Price Calculation (Server-side only)
// ============================================

interface PriceBreakdown {
    productPrice: number
    shipping: number
    total: number
    productId: string
    productName: string
}

function calculateTotal(productId: string, uf: string): PriceBreakdown | null {
    const product = getProductById(productId)
    if (!product) return null

    const shipping = calculateShipping(uf)
    const total = product.price + shipping

    return {
        productPrice: product.price,
        shipping,
        total,
        productId: product.id,
        productName: product.name,
    }
}

// ============================================
// POST Handler - Create Payment
// ============================================

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json()
        const parseResult = PaymentRequestSchema.safeParse(body)

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: 'Dados inválidos',
                    details: parseResult.error.issues
                },
                { status: 400 }
            )
        }

        const data: PaymentRequest = parseResult.data

        // ============================================
        // ZERO TRUST: Calculate price server-side
        // ============================================

        const priceBreakdown = calculateTotal(data.productId, data.address.uf)

        if (!priceBreakdown) {
            logSecurityEvent('PRODUCT_NOT_FOUND', {
                productId: data.productId,
                customerCpf: data.customer.cpfCnpj,
            }, request)

            return NextResponse.json(
                { error: 'Produto não encontrado' },
                { status: 404 }
            )
        }

        // ============================================
        // SECURITY: Log if front-end price differs
        // ============================================

        if (data.debugTotal !== undefined && data.debugTotal !== priceBreakdown.total) {
            logSecurityEvent('PRICE_MISMATCH', {
                frontEndValue: data.debugTotal,
                serverValue: priceBreakdown.total,
                difference: data.debugTotal - priceBreakdown.total,
                customerCpf: data.customer.cpfCnpj,
                productId: data.productId,
            }, request)
        }

        // Validate installments for credit card
        if (data.paymentMethod === 'CREDIT_CARD') {
            const installments = data.installments || 1
            const product = getProductById(data.productId)

            if (!product || installments > product.maxInstallments) {
                logSecurityEvent('INVALID_INSTALLMENTS', {
                    requested: installments,
                    maxAllowed: product?.maxInstallments || 0,
                    customerCpf: data.customer.cpfCnpj,
                }, request)

                return NextResponse.json(
                    { error: 'Número de parcelas inválido' },
                    { status: 400 }
                )
            }
        }

        // ============================================
        // Create/Find Customer in Asaas
        // ============================================

        const asaas = getAsaasService()

        const customer = await asaas.createCustomer({
            name: data.customer.name,
            email: data.customer.email,
            cpfCnpj: data.customer.cpfCnpj,
            phone: data.customer.phone,
        })

        // ============================================
        // Create Payment with SERVER-CALCULATED value
        // ============================================

        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 3) // 3 days from now
        const dueDateStr = dueDate.toISOString().split('T')[0]

        const externalReference = `${data.productId}-${Date.now()}`

        let paymentResult

        if (data.paymentMethod === 'PIX') {
            paymentResult = await asaas.createPixPayment({
                customerId: customer.id,
                value: priceBreakdown.total, // SERVER-CALCULATED VALUE
                description: `${priceBreakdown.productName} + Frete`,
                externalReference,
                dueDate: dueDateStr,
            })
        } else if (data.paymentMethod === 'CREDIT_CARD' && data.creditCard) {
            paymentResult = await asaas.createCardPayment({
                customerId: customer.id,
                value: priceBreakdown.total, // SERVER-CALCULATED VALUE
                installmentCount: data.installments || 1,
                creditCardToken: data.creditCard.token,
                creditCardHolderInfo: {
                    name: data.creditCard.holderName,
                    email: data.creditCard.holderEmail,
                    cpfCnpj: data.creditCard.holderCpfCnpj,
                    postalCode: data.creditCard.holderPostalCode,
                    addressNumber: data.creditCard.holderAddressNumber,
                },
                description: `${priceBreakdown.productName} + Frete`,
                externalReference,
                dueDate: dueDateStr,
            })
        } else {
            return NextResponse.json(
                { error: 'Método de pagamento não suportado ou dados incompletos' },
                { status: 400 }
            )
        }

        // ============================================
        // Success Response
        // ============================================

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ [Payment] Created successfully')
        console.log(`   Payment ID: ${paymentResult.id}`)
        console.log(`   Method: ${data.paymentMethod}`)
        console.log(`   Product: ${priceBreakdown.productName}`)
        console.log(`   Product Price: R$ ${priceBreakdown.productPrice.toFixed(2)}`)
        console.log(`   Shipping: R$ ${priceBreakdown.shipping.toFixed(2)}`)
        console.log(`   Total: R$ ${priceBreakdown.total.toFixed(2)}`)
        console.log(`   Customer: ${customer.id}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json({
            success: true,
            payment: {
                id: paymentResult.id,
                status: paymentResult.status,
                method: data.paymentMethod,
                value: priceBreakdown.total,
                breakdown: {
                    product: priceBreakdown.productPrice,
                    shipping: priceBreakdown.shipping,
                },
                // PIX specific
                pixQrCode: 'pixQrCode' in paymentResult ? paymentResult.pixQrCode : undefined,
            },
            customer: {
                id: customer.id,
            },
            externalReference,
        })

    } catch (error: any) {
        console.error('[Payment] Error creating payment:', error)

        // Don't expose internal errors to client unless they are friendly Asaas errors
        const message = error.message || 'Erro interno'
        const isValidationError = message.includes('obrigatório') || message.includes('inválido')
        const isAsaasError = error.code && error.status // Check if it's our enhanced error

        // If it's a known Asaas error (like insufficient_funds), return the friendly message
        if (isAsaasError) {
            return NextResponse.json(
                { error: message, code: error.code },
                { status: 400 } // Always return 400 for business logic errors so frontend can handle gracefully
            )
        }

        return NextResponse.json(
            { error: isValidationError ? message : 'Erro ao processar pagamento' },
            { status: isValidationError ? 400 : 500 }
        )
    }
}

// ============================================
// GET Handler - Health Check
// ============================================

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/asaas/pay',
        methods: ['POST'],
        description: 'Create secure payment with server-side price calculation',
    })
}
