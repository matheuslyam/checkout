import type { Metadata } from 'next'
import { Inter, Audiowide } from 'next/font/google'
import { CheckoutProvider } from '@/store/CheckoutContext'
import { CheckoutToastProvider } from '@/components/ui/CheckoutToast'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const audiowide = Audiowide({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-audiowide',
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
            <body className={`${inter.variable} ${audiowide.variable} font-sans antialiased`}>
                <CheckoutProvider>
                    <CheckoutToastProvider>
                        {children}
                    </CheckoutToastProvider>
                </CheckoutProvider>
            </body>
        </html>
    )
}
