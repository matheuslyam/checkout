import { NextResponse } from "next/server"
import { getAsaasService } from "@/services/asaas"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const paymentId = searchParams.get('id')

        if (!paymentId) {
            return NextResponse.json(
                { error: "Payment ID is required" },
                { status: 400 }
            )
        }

        // 1. CHECA PRIMEIRO O BANCO DE DADOS LOCAL (HYBRID MOCK SIMULATOR)
        const { getLogByPixId } = await import('@/lib/hybridLogger')
        const localLog = await getLogByPixId(paymentId)

        if (localLog) {
            console.log(`[Polling] Local DB Match Found for ${paymentId}: ${localLog.pixStatus}`)

            // Se o nosso script simulador ja alterou para RECEIVED/CONFIRMED
            if (localLog.pixStatus === 'RECEIVED' || localLog.pixStatus === 'CONFIRMED') {
                return NextResponse.json({
                    id: paymentId,
                    status: 'CONFIRMED',
                })
            }

            // Se ainda é PENDING no DB local e é um Mock de Teste, mantém PENDENTE para esperar o Simulador
            if (process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true' && paymentId.startsWith('pay_pix_hyb_')) {
                return NextResponse.json({
                    id: paymentId,
                    status: 'PENDING',
                })
            }
        }

        // 2. MOCK PAYMENT STATUS (Bypass para PIX Padrão Simples, caso não seja Híbrido)
        if (process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true' && !localLog && (paymentId.startsWith('pay_') || paymentId.startsWith('pay_pix_'))) {
            // Simulate a short delay or return CONFIRMED immediately
            console.log(`[Polling] Mock Default Payment ${paymentId} status: CONFIRMED`)
            return NextResponse.json({
                id: paymentId,
                status: 'CONFIRMED',
            })
        }

        const asaasService = getAsaasService()
        const payment = await asaasService.getPaymentStatus(paymentId)

        return NextResponse.json(payment)
    } catch (error: any) {
        console.error("Error checking payment status:", error)
        return NextResponse.json(
            { error: "Failed to check payment status" },
            { status: 500 }
        )
    }
}
