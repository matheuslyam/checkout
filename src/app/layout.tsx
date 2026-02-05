import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CheckoutProvider } from '@/store/CheckoutContext'
import { CheckoutToastProvider } from '@/components/ui/CheckoutToast'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

export const metadata: Metadata = {
    title: 'Checkout | Pagamento Seguro',
    description: 'Finalize sua compra com segurança',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className={`${inter.variable} font-sans antialiased`}>
                <CheckoutProvider>
                    <CheckoutToastProvider>
                        {children}
                    </CheckoutToastProvider>
                </CheckoutProvider>
            </body>
        </html>
    )
}
