import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { CheckoutProvider } from '@/store/CheckoutContext'
import { CheckoutToastProvider } from '@/components/ui/CheckoutToast'
import './globals.css'

const poppins = localFont({
    src: [
        {
            path: './fonts/Poppins-Regular.ttf',
            weight: '400',
            style: 'normal',
        },
        {
            path: './fonts/Poppins-Bold.ttf',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--font-poppins',
})

const audiowide = localFont({
    src: './fonts/Audiowide-Regular.ttf',
    variable: '--font-audiowide',
    weight: '400',
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
            <body className={`${poppins.variable} ${audiowide.variable} font-sans antialiased`}>
                <CheckoutProvider>
                    <CheckoutToastProvider>
                        {children}
                    </CheckoutToastProvider>
                </CheckoutProvider>
            </body>
        </html>
    )
}
