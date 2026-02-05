import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ============================================
// Asaas Webhook Event Types
// ============================================
const PAYMENT_EVENTS = [
    'PAYMENT_CREATED',
    'PAYMENT_AWAITING_RISK_ANALYSIS',
    'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
    'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
    'PAYMENT_AUTHORIZED',
    'PAYMENT_UPDATED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
    'PAYMENT_ANTICIPATED',
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED',
    'PAYMENT_RESTORED',
    'PAYMENT_REFUNDED',
    'PAYMENT_PARTIALLY_REFUNDED',
    'PAYMENT_REFUND_IN_PROGRESS',
    'PAYMENT_RECEIVED_IN_CASH_UNDONE',
    'PAYMENT_CHARGEBACK_REQUESTED',
    'PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
    'PAYMENT_DUNNING_RECEIVED',
    'PAYMENT_DUNNING_REQUESTED',
    'PAYMENT_BANK_SLIP_VIEWED',
    'PAYMENT_CHECKOUT_VIEWED',
] as const

// ============================================
// Zod Schema for Webhook Payload
// ============================================
const WebhookPayloadSchema = z.object({
    event: z.enum(PAYMENT_EVENTS),
    payment: z.object({
        id: z.string(),
        customer: z.string(),
        value: z.number(),
        netValue: z.number(),
        status: z.string(),
        billingType: z.string(),
        externalReference: z.string().nullable().optional(),
        invoiceUrl: z.string().nullable().optional(),
        confirmedDate: z.string().nullable().optional(),
        paymentDate: z.string().nullable().optional(),
    }),
})

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

// ============================================
// POST Handler
// ============================================
export async function POST(request: NextRequest) {
    try {
        // ============================================
        // 🔒 Security Check (Zero Trust)
        // ============================================
        const requestToken = request.headers.get('asaas-access-token')
        const serverToken = process.env.ASAAS_WEBHOOK_TOKEN

        if (!serverToken) {
            console.error('❌ [Asaas Webhook] Critical: ASAAS_WEBHOOK_TOKEN not set in environment variables.')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        if (requestToken !== serverToken) {
            console.warn(`⛔ [Asaas Webhook] Unauthorized access attempt. Token: ${requestToken || 'N/A'}`)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse request body
        const body = await request.json()

        // Validate payload
        const result = WebhookPayloadSchema.safeParse(body)

        if (!result.success) {
            console.error('[Asaas Webhook] Invalid payload:', result.error.issues)
            return NextResponse.json(
                { error: 'Invalid webhook payload' },
                { status: 400 }
            )
        }

        const payload: WebhookPayload = result.data

        // Log the event
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('[Asaas Webhook] Event received:', payload.event)
        console.log('[Asaas Webhook] Payment ID:', payload.payment.id)
        console.log('[Asaas Webhook] Status:', payload.payment.status)
        console.log('[Asaas Webhook] Value:', `R$ ${payload.payment.value.toFixed(2)}`)
        console.log('[Asaas Webhook] Billing Type:', payload.payment.billingType)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Handle specific events
        switch (payload.event) {
            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED':
                console.log('✅ [Asaas Webhook] PAYMENT SUCCESS!')
                console.log('   → Customer:', payload.payment.customer)
                console.log('   → External Reference:', payload.payment.externalReference || 'N/A')
                console.log('   → Confirmed Date:', payload.payment.confirmedDate || 'N/A')

                // TODO: Notify front-end via WebSocket
                // TODO: Update order status in database
                // TODO: Send confirmation email to customer

                break

            case 'PAYMENT_OVERDUE':
                console.log('⚠️ [Asaas Webhook] Payment overdue!')
                break

            case 'PAYMENT_REFUNDED':
            case 'PAYMENT_PARTIALLY_REFUNDED':
                console.log('💸 [Asaas Webhook] Payment refunded!')
                break

            case 'PAYMENT_DELETED':
                console.log('🗑️ [Asaas Webhook] Payment deleted!')
                break

            default:
                console.log(`ℹ️ [Asaas Webhook] Event ${payload.event} logged`)
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json(
            {
                received: true,
                event: payload.event,
                paymentId: payload.payment.id
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('[Asaas Webhook] Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// ============================================
// Other Methods - Not Allowed
// ============================================
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    )
}

export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    )
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    )
}
