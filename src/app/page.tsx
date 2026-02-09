import { Suspense } from "react"
import { CheckoutPageContent } from "./checkout-page-content"

export default function Home() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-white">
            <Suspense fallback={<div className="text-white">Carregando...</div>}>
                <CheckoutPageContent />
            </Suspense>
        </main>
    )
}
