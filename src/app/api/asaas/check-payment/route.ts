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
