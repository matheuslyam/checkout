import { NextRequest, NextResponse } from 'next/server'
import { getHybridLog, updateHybridLogStatus } from '@/lib/hybridLogger'
import { getAsaasService } from '@/services/asaas'

// This endpoint is polled by the frontend after a PIX in an HYBRID flow
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const hybridId = request.nextUrl.searchParams.get('id')

    if (!hybridId) {
        return NextResponse.json({ error: 'Missing hybridId' }, { status: 400 })
    }

    try {
        const log = await getHybridLog(hybridId)

        if (!log) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 })
        }

        // If it's already recorded as successful/completed in our DB, return early and unlock frontend!
        if (log.pixStatus === 'RECEIVED' || log.pixStatus === 'CONFIRMED') {
            return NextResponse.json({
                hybridId: log.hybridId,
                status: 'PIX_PAID_AWAITING_CARD',
                pixPaymentId: log.pixPaymentId,
                cardValue: log.cardValue
            })
        }

        // --- MOCK BYPASS PRE-ASAAS ---
        if (process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true' && log.pixPaymentId?.startsWith('pay_pix_hyb_')) {
            // Let it spin PENDING until the user runs the Node.js Script
            return NextResponse.json({
                hybridId: log.hybridId,
                status: 'AWAITING_PIX',
                pixPaymentId: log.pixPaymentId
            })
        }

        // --- REAL PRODUCTION ---
        // Otherwise, poll Asaas
        if (log.pixPaymentId) {
            const asaas = getAsaasService()
            const payment = await asaas.getPaymentStatus(log.pixPaymentId) // This was breaking Mocks because Mock IDs don't exist on Asaas

            // Update log locally if Asaas has a different status
            if (payment.status !== log.pixStatus) {
                await updateHybridLogStatus(hybridId, { pixStatus: payment.status })
            }

            if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
                return NextResponse.json({
                    hybridId: log.hybridId,
                    status: 'PIX_PAID_AWAITING_CARD',
                    pixPaymentId: log.pixPaymentId,
                    cardValue: log.cardValue
                })
            }
        }

        return NextResponse.json({
            hybridId: log.hybridId,
            status: 'AWAITING_PIX',
            pixPaymentId: log.pixPaymentId
        })

    } catch (error: any) {
        console.error('Error fetching hybrid status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
