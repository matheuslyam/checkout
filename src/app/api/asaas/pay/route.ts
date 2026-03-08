import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BIKES_CATALOG } from '@/lib/catalog'
import { calculateShipping } from '@/lib/shipping'
import { getAsaasService } from '@/services/asaas'
import { isValidCreditCard } from '@/lib/validation'
import { calculateReverseTotal, calculateHybridTotal } from '@/lib/financial'

// ============================================
// Input Validation Schemas
// ============================================

const AddressSchema = z.object({
    cep: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 8, 'CEP deve ter 8 dígitos'),
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
    holderCpfCnpj: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 11 || v.length === 14, 'CPF/CNPJ inválido'),
    holderPostalCode: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 8, 'CEP deve ter 8 dígitos'),
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
        cpfCnpj: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 11 || v.length === 14, 'CPF/CNPJ deve ter 11 ou 14 dígitos'),
        phone: z.string().optional(),
    }),

    // Address (needed for shipping calculation)
    address: AddressSchema,

    // Payment method
    paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO', 'HYBRID']),

    // Credit card specific (optional)
    creditCard: CreditCardInfoSchema.optional(),
    installments: z.number().int().min(1).max(21).optional(),

    // Hybrid specific
    pixEntry: z.number().min(1000, 'Entrada PIX deve ser no mínimo R$ 1.000,00').optional(),
    isHybridCard: z.boolean().optional(),
    hybridId: z.string().optional(),

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

    const isTestProduct = productId === 'teste-1'
    const shippingBrl = isTestProduct ? 0 : calculateShipping(uf)
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
        console.log("[DEBUG] Env Check:", {
            NODE_ENV: process.env.NODE_ENV,
            API_KEY_PRESENT: !!process.env.ASAAS_API_KEY,
            API_KEY_VALUE_DEBUG: process.env.ASAAS_API_KEY ? `${process.env.ASAAS_API_KEY.substring(0, 5)}...` : 'UNDEFINED',
            API_URL: process.env.ASAAS_API_URL
        })

        console.log("[BYPASS DEBUG]", {
            ENV_TEST_CARD: process.env.NEXT_PUBLIC_ENABLE_TEST_CARD,
            METHOD: body.paymentMethod,
            RAW_CPF: body.customer?.cpfCnpj,
            CLEAN_CPF: body.customer?.cpfCnpj?.replace(/\D/g, '')
        })

        const isTestMode = process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true' || process.env.NODE_ENV === 'development'

        // Detect and handle Test Card Bypass BEFORE strict schema validation
        if (isTestMode) {
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
                body.customer?.cpfCnpj?.replace(/\D/g, '') === '12345678900'
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
                        status: 'PENDING',
                        method: 'PIX',
                        value: total,
                        breakdown: { product: product.price / 100, shipping },
                        pixQrCode: {
                            encodedImage: '',
                            payload: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Ambtus Motors6008BRASILIA62070503***6304ABCD',
                            expirationDate: expiresAt.toISOString()
                        }
                    },
                    customer: { id: 'cus_test_123' },
                    externalReference: `test-${body.productId}-${Date.now()}`,
                })
            }

            // BYPASS FOR HYBRID
            if (
                body.paymentMethod === 'HYBRID' &&
                !body.isHybridCard &&
                body.customer?.cpfCnpj?.replace(/\D/g, '') === '12345678900'
            ) {
                const product = BIKES_CATALOG[body.productId]
                if (!product) return NextResponse.json({ type: 'USER_ERROR', message: 'Produto não encontrado.' }, { status: 404 })

                const shipping = calculateShipping(body.address?.uf || 'SP')
                const total = (product.price / 100) + shipping
                const mockPixId = `pay_pix_hyb_${Math.random().toString(36).substring(7)}`

                const expiresAt = new Date()
                expiresAt.setMinutes(expiresAt.getMinutes() + 15)

                console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 200 | Payload: TEST_HYBRID_BYPASS_${mockPixId}`)

                return NextResponse.json({
                    success: true,
                    payment: {
                        id: mockPixId,
                        status: 'PENDING',
                        method: 'PIX',
                        value: body.pixEntry,
                        breakdown: { product: product.price / 100, shipping },
                        pixQrCode: {
                            encodedImage: '',
                            payload: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Ambtus Motors6008BRASILIA62070503***6304ABCD',
                            expirationDate: expiresAt.toISOString()
                        }
                    },
                    customer: { id: 'cus_test_123' },
                    hybridId: `hyb_test_${Date.now()}`,
                    externalReference: `test-hyb-${body.productId}-${Date.now()}`,
                })
            }

            // BYPASS FOR HYBRID CARD (FASE 2) Ou CREDIT CARD Normal (com num 0000)
            if (
                (body.paymentMethod === 'CREDIT_CARD' || body.paymentMethod === 'HYBRID') &&
                body.creditCard?.number === '0000000000000000'
            ) {
                const product = BIKES_CATALOG[body.productId]
                if (!product) return NextResponse.json({ type: 'USER_ERROR', message: 'Produto não encontrado.' }, { status: 404 })

                const mockPaymentId = `pay_card_mock_${Math.random().toString(36).substring(7)}`
                const shipping = calculateShipping(body.address?.uf || 'SP')

                let finalValue = (product.price / 100) + shipping;
                if (body.paymentMethod === 'HYBRID' && body.isHybridCard && body.hybridId) {
                    const { getHybridLog } = await import('@/lib/hybridLogger')
                    const log = await getHybridLog(body.hybridId)
                    if (log && log.pixValue) {
                        finalValue -= log.pixValue;
                    }
                }

                console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 200 | Payload: TEST_MOCK_CARD_APPROVED_${mockPaymentId}`)

                return NextResponse.json({
                    success: true,
                    payment: {
                        id: mockPaymentId,
                        status: 'RECEIVED',
                        method: 'CREDIT_CARD',
                        value: finalValue,
                        breakdown: { product: product.price / 100, shipping },
                    },
                    customer: { id: 'cus_test_123' },
                    hybridId: body.hybridId,
                    externalReference: `test-card-${body.productId}-${Date.now()}`,
                })
            }
        }

        const parseResult = PaymentRequestSchema.safeParse(body)

        if (!parseResult.success) {
            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: INVALID_SCHEMA`)
            console.error(`[ZOD ERRORS]`, JSON.stringify(parseResult.error.issues, null, 2))
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

        // HYBRID Validation
        if (data.paymentMethod === 'HYBRID') {
            if (!data.pixEntry || data.pixEntry < 1000) {
                return NextResponse.json(
                    { type: 'USER_ERROR', message: 'Para pagamento híbrido, a entrada mínima via PIX é de R$ 1.000,00.' },
                    { status: 400 }
                )
            }
        }

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

            // Bypass fees if it's the test product
            const totalWithFeesCents = data.productId === 'teste-1'
                ? totalCents
                : calculateReverseTotal(totalCents, installments)

            // Convert back to Float for Asaas
            finalValueToCharge = totalWithFeesCents / 100
        } else if (data.paymentMethod === 'HYBRID') {
            const installments = data.installments || 1
            const totalCents = Math.round(priceBreakdown.total * 100)

            let pixEntryCents = Math.round((data.pixEntry || 0) * 100)

            // FASE 2: Busca dinamicamente do DB o valor real da entrada que o usuário deu no Step 1
            if (data.isHybridCard && data.hybridId) {
                const { getHybridLog } = await import('@/lib/hybridLogger')
                const log = await getHybridLog(data.hybridId)
                if (log && log.pixValue) {
                    pixEntryCents = Math.round(log.pixValue * 100)
                }
            }

            // Bypass fees if it's the test product
            const totalWithFeesCents = data.productId === 'teste-1'
                ? totalCents - pixEntryCents
                : calculateHybridTotal(totalCents, pixEntryCents, installments) // Assumes function is imported

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

        // Validate installments for credit card / hybrid
        if (data.paymentMethod === 'CREDIT_CARD' || data.paymentMethod === 'HYBRID') {
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
        let hybridEntryId = null
        const { saveHybridLog } = await import('@/lib/hybridLogger')

        if (data.paymentMethod === 'PIX') {
            paymentResult = await asaas.createPixPayment({
                customerId: customer.id,
                value: finalValueToCharge,
                description: `${priceBreakdown.productName} + Frete`,
                externalReference,
                dueDate: dueDateStr,
            })
        } else if (data.paymentMethod === 'HYBRID') {
            if (data.isHybridCard && data.creditCard && data.hybridId) {
                // HYBRID Phase 2: Create Card Payment for remaining balance
                paymentResult = await asaas.createCardPayment({
                    customerId: customer.id,
                    value: finalValueToCharge,
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
                        phone: data.customer.phone,
                    },
                    description: `Cartão Resíduo Híbrido: ${priceBreakdown.productName}`,
                    externalReference: `${externalReference}-CARD-${data.hybridId}`,
                    dueDate: dueDateStr,
                })

                // Update Log
                const { updateHybridLogStatus } = await import('@/lib/hybridLogger')
                await updateHybridLogStatus(data.hybridId, {
                    cardPaymentId: paymentResult.id,
                    cardStatus: paymentResult.status
                })
                hybridEntryId = data.hybridId

            } else {
                // HYBRID Phase 1: Create PIX Entry
                paymentResult = await asaas.createPixPayment({
                    customerId: customer.id,
                    value: data.pixEntry || 0,
                    description: `Entrada PIX: ${priceBreakdown.productName}`,
                    externalReference: `${externalReference}-PIX`,
                    dueDate: dueDateStr,
                })

                hybridEntryId = `hyb_${Math.random().toString(36).substring(2, 11)}`
                const userAgent = request.headers.get('user-agent') || 'unknown'

                await saveHybridLog({
                    hybridId: hybridEntryId,
                    customerId: customer.id,
                    pixPaymentId: paymentResult.id,
                    pixStatus: paymentResult.status,
                    pixValue: data.pixEntry || 0,
                    cardPaymentId: null,
                    cardStatus: null,
                    cardValue: finalValueToCharge,
                    userAgent,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Valid for 24h
                })

                console.log(`[CHECKOUT_FLOW] HYBRID Log Saved: ${hybridEntryId}`)
            }
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
                    phone: data.customer.phone, // Assuming we fall back to customer phone 
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
                // Hybrid specific
                hybridId: hybridEntryId,
            },
            customer: {
                id: customer.id,
            },
            externalReference,
        })

    } catch (error: any) {
        // Handle known Asaas User Errors
        const errCode = error.code as string | undefined

        // Use normalized code for the map, or rely on Asaas.ts friendlyMessage
        const normalizedCode = errCode?.toUpperCase()
        if (normalizedCode && AsaasErrorMap[normalizedCode]) {
            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: ASAAS_ERROR_${normalizedCode}`)
            return NextResponse.json(
                {
                    type: 'USER_ERROR',
                    message: AsaasErrorMap[normalizedCode],
                    code: normalizedCode
                },
                { status: 400 }
            )
        }

        // Pass-through 400 errors formatted by Asaas Service
        if (error.status === 400 && error.message) {
            console.log(`[CHECKOUT_FLOW] Step: SERVER | Status: 400 | Payload: ASAAS_ERROR_${errCode}`)
            return NextResponse.json(
                { type: 'USER_ERROR', message: error.message, code: errCode },
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
                message: process.env.NODE_ENV === 'development' ? `Erro Interno: ${error.message}` : 'Sistema temporariamente instável. Por favor, tente novamente em alguns instantes.',
                debug: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : undefined
            },
            { status: 500 }
        )
    }
}
