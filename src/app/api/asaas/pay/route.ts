import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BIKES_CATALOG } from '@/lib/catalog'
import { calculateShipping } from '@/lib/shipping'
import { getAsaasService } from '@/services/asaas'
import { isValidCreditCard } from '@/lib/validation'
import { calculateReverseTotal } from '@/lib/financial'

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
    token: z.string().optional(),
    holderName: z.string().min(3, 'Nome do titular é obrigatório'),
    holderEmail: z.string().email('Email do titular inválido'),
    holderCpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido'),
    holderPostalCode: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    holderAddressNumber: z.string().min(1, 'Número é obrigatório'),

    // Raw data (if not tokenized)
    number: z.string().optional().refine((val) => {
        if (!val) return true // Allow empty if using token
        return isValidCreditCard(val)
    }, 'Número de cartão inválido'),
    expiryMonth: z.string().optional(),
    expiryYear: z.string().optional(),
    ccv: z.string().optional(),
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
    installments: z.number().int().min(1).max(21).optional(),

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
    // DIRECT CATALOG LOOKUP - Zero Trust
    const product = BIKES_CATALOG[productId]
    if (!product) return null

    const shippingBrl = calculateShipping(uf)
    // Shipping is BRL (e.g. 150.00), Product is Cents (e.g. 1264000)
    // Normalize to Cents
    const shippingCents = Math.round(shippingBrl * 100)
    const totalCents = product.price + shippingCents

    return {
        productPrice: product.price, // cents
        shipping: shippingBrl,       // BRL (for display, though likely not used directly)
        total: totalCents / 100,     // RETURN FLOAT (BRL) for Asaas
        productId: product.id,
        productName: product.name,
    }
}

// ============================================
// POST Handler - Create Payment
// ============================================

const AsaasErrorMap: Record<string, string> = {
    'CREDIT_CARD_DECLINED': 'Cartão recusado pelo banco emissor. Tente outro cartão.',
    'INSUFFICIENT_FUNDS': 'Saldo insuficiente para realizar a transação.',
    'INVALID_CREDIT_CARD': 'Dados do cartão inválidos. Verifique o número e validade.',
    'EXPIRED_CREDIT_CARD': 'Cartão vencido.',
    'BLOCKED_CREDIT_CARD': 'Cartão bloqueado. Contate o emissor.',
}

export async function POST(request: NextRequest) {
    let debugPayload: any = {}

    try {
        // Parse and validate request body
        const body = await request.json()
        debugPayload = body // Store for error logging

        // STRICT LOGGING: Verify exact Product ID received
        console.log("FINAL PRODUCT ID TO ASAAS:", body.productId)

        // Detect and handle Test Card Bypass BEFORE strict schema validation
        // Detect and handle Test Card Bypass BEFORE strict schema validation
        if (process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true') {
            // BYPASS FOR CREDIT CARD
            if (
                body.paymentMethod === 'CREDIT_CARD' &&
                body.creditCard?.number === '0000000000000000' &&
                body.creditCard?.holderName === 'Matheus Lyam' &&
                body.creditCard?.expiryMonth === '99' &&
                body.creditCard?.expiryYear === '2099' &&
                body.creditCard?.ccv === '999' &&
                body.creditCard?.holderCpfCnpj === '12345678900'
            ) {
                const product = BIKES_CATALOG[body.productId]
                if (!product) return NextResponse.json({ type: 'USER_ERROR', message: 'Produto não encontrado.' }, { status: 404 })

                const shipping = calculateShipping(body.address?.uf || 'SP')
                const total = (product.price / 100) + shipping
                const mockPaymentId = `pay_${Math.random().toString(36).substring(7)}`

                return NextResponse.json({
                    success: true,
                    payment: {
                        id: mockPaymentId,
                        status: 'RECEIVED',
                        method: 'CREDIT_CARD',
                        value: total,
                        breakdown: { product: product.price / 100, shipping },
                    },
                    customer: { id: 'cus_test_123' },
                    externalReference: `test-${body.productId}-${Date.now()}`,
                })
            }

            // BYPASS FOR PIX
            if (
                body.paymentMethod === 'PIX' &&
                body.customer?.cpfCnpj === '12345678900'
            ) {
                const product = BIKES_CATALOG[body.productId]
                if (!product) return NextResponse.json({ type: 'USER_ERROR', message: 'Produto não encontrado.' }, { status: 404 })

                const shipping = calculateShipping(body.address?.uf || 'SP')
                const total = (product.price / 100) + shipping
                const mockPaymentId = `pay_pix_${Math.random().toString(36).substring(7)}`

                // Mock future expiration
                const expiresAt = new Date()
                expiresAt.setMinutes(expiresAt.getMinutes() + 15)

                console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 200 | Payload: TEST_PIX_BYPASS_${mockPaymentId}`)

                return NextResponse.json({
                    success: true,
                    payment: {
                        id: mockPaymentId,
                        status: 'PENDING', // PENDING allows the frontend to start polling (or we can return CONFIRMED immediately if we want to skip polling?)
                        // If we return PENDING, the frontend will poll check-payment. We need to mock that too?
                        // Actually, if we return CONFIRMED here, Step 3 might not expect it or usePayment handles it.
                        // usePayment sets result and calls nextStep. It doesn't check status immediately unless we polling. 
                        // But wait, for PIX we usually show QR Code.
                        // If I return PENDING, usePayment receives it and shows toast.
                        // Then it polls. I need simulating the webhook or polling response?
                        // If I return CONFIRMED, usePayment will just go to success?
                        // usePayment logic for PIX: setPaymentResult (id, qrCode). 
                        // It DOES NOT automatically poll unless `startPolling` is called.
                        // In `usePayment.ts`: `useEffect` monitors `paymentId` and `paymentStatus === 'PENDING'`.
                        // So if I return PENDING, it starts polling.
                        // Check-payment endpoint ALSO needs to support the mock ID.

                        method: 'PIX',
                        value: total,
                        breakdown: { product: product.price / 100, shipping },
                        pixQrCode: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Ambtus Motors6008BRASILIA62070503***6304ABCD',
                        pixPayload: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Ambtus Motors6008BRASILIA62070503***6304ABCD'
                    },
                    customer: { id: 'cus_test_123' },
                    externalReference: `test-${body.productId}-${Date.now()}`,
                })
            }
        }

        const parseResult = PaymentRequestSchema.safeParse(body)

        if (!parseResult.success) {
            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: INVALID_SCHEMA`)
            return NextResponse.json(
                {
                    type: 'USER_ERROR',
                    message: 'Dados inválidos no formulário.',
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

            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 404 | Payload: PRODUCT_NOT_FOUND`)
            return NextResponse.json(
                { type: 'USER_ERROR', message: 'Produto não encontrado.' },
                { status: 404 }
            )
        }

        // ============================================
        // CHECKOUT LOGIC: Calculate Final Value with Fees
        // ============================================

        let finalValueToCharge = priceBreakdown.total // Default (Float)

        if (data.paymentMethod === 'CREDIT_CARD') {
            const installments = data.installments || 1
            // Convert to cents for accurate calculation
            const totalCents = Math.round(priceBreakdown.total * 100)

            // Calculate with Fees and Anticipation
            const totalWithFeesCents = calculateReverseTotal(totalCents, installments)

            // Convert back to Float for Asaas
            finalValueToCharge = totalWithFeesCents / 100
        }

        // ============================================
        // SECURITY: Log if front-end price differs
        // ============================================
        // Tolerance increased due to float math potential differences, but logic should align.
        if (data.debugTotal !== undefined && Math.abs(data.debugTotal - finalValueToCharge) > 0.05) {
            logSecurityEvent('PRICE_MISMATCH', {
                frontEndValue: data.debugTotal,
                serverValue: finalValueToCharge,
                difference: data.debugTotal - finalValueToCharge,
                customerCpf: data.customer.cpfCnpj,
                productId: data.productId,
                method: data.paymentMethod
            }, request)

            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 403 | Payload: SECURITY_VIOLATION_PRICE`)
            return NextResponse.json(
                {
                    type: 'SECURITY_ERROR',
                    message: 'Erro de segurança: Divergência de valores. Atualize a página e tente novamente.'
                },
                { status: 403 }
            )
        }

        // Validate installments for credit card
        if (data.paymentMethod === 'CREDIT_CARD') {
            const installments = data.installments || 1
            const product = BIKES_CATALOG[data.productId]

            // Allow up to 21 installments
            const maxInstallments = product?.maxInstallments || 21

            if (!product || installments > maxInstallments) {
                console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: INVALID_INSTALLMENTS`)
                return NextResponse.json(
                    { type: 'USER_ERROR', message: `Número de parcelas inválido (Máx: ${maxInstallments}).` },
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
                value: finalValueToCharge,
                description: `${priceBreakdown.productName} + Frete`,
                externalReference,
                dueDate: dueDateStr,
            })
        } else if (data.paymentMethod === 'CREDIT_CARD' && data.creditCard) {
            paymentResult = await asaas.createCardPayment({
                customerId: customer.id,
                value: finalValueToCharge, // Value with fees
                installmentCount: data.installments || 1,
                creditCardToken: data.creditCard.token,
                creditCard: data.creditCard.number ? {
                    holderName: data.creditCard.holderName,
                    number: data.creditCard.number,
                    expiryMonth: data.creditCard.expiryMonth || '',
                    expiryYear: data.creditCard.expiryYear || '',
                    ccv: data.creditCard.ccv || '',
                } : undefined,
                creditCardHolderInfo: {
                    name: data.creditCard.holderName,
                    email: data.creditCard.holderEmail,
                    cpfCnpj: data.creditCard.holderCpfCnpj,
                    postalCode: data.creditCard.holderPostalCode,
                    addressNumber: data.creditCard.holderAddressNumber,
                },
                description: `${priceBreakdown.productName} + Frete + Taxas`,
                externalReference,
                dueDate: dueDateStr,
            })
        } else {
            return NextResponse.json(
                { type: 'USER_ERROR', message: 'Método de pagamento inválido.' },
                { status: 400 }
            )
        }

        // ============================================
        // Success Response
        // ============================================

        console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 200 | Payload: PAYMENT_CREATED_${paymentResult.id}`)

        return NextResponse.json({
            success: true,
            payment: {
                id: paymentResult.id,
                status: paymentResult.status,
                method: data.paymentMethod,
                value: finalValueToCharge,
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
        // Handle known Asaas User Errors
        const errCode = error.code as string | undefined
        if (errCode && AsaasErrorMap[errCode]) {
            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: ASAAS_ERROR_${errCode}`)
            return NextResponse.json(
                {
                    type: 'USER_ERROR',
                    message: AsaasErrorMap[errCode],
                    code: errCode
                },
                { status: 400 }
            )
        }

        // Fallback for other known validation errors
        if (error.message && (error.message.includes('obrigatório') || error.message.includes('inválido'))) {
            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: VALIDATION_ERROR`)
            return NextResponse.json(
                { type: 'USER_ERROR', message: error.message },
                { status: 400 }
            )
        }

        console.error('🔥 [INTERNAL_ERROR] Critical Failure in Checkout:', error)
        console.error('   Request Payload:', debugPayload)
        console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 500 | Payload: INTERNAL_SYSTEM_ERROR`)

        return NextResponse.json(
            {
                type: 'INTERNAL_ERROR',
                message: 'Sistema temporariamente instável. Por favor, tente novamente em alguns instantes.'
            },
            { status: 500 }
        )
    }
}
