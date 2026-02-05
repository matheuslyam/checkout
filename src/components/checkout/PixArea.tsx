import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, Loader2, Clock, Check, Copy } from "lucide-react"

interface PixAreaProps {
    pixPayload: string
    isPolling: boolean
}

export function PixArea({ pixPayload, isPolling }: PixAreaProps) {
    const [copied, setCopied] = useState(false)

    // Copy PIX code
    const handleCopyPix = async () => {
        if (!pixPayload) return

        try {
            await navigator.clipboard.writeText(pixPayload)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            console.error('Failed to copy')
        }
    }

    if (!pixPayload) return null

    return (
        <div className="mb-6 p-6 bg-[#1A1A1A] rounded-2xl border border-white/5">
            {/* PIX Instructions */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                    Código PIX Gerado!
                </h3>
                <p className="text-sm text-zinc-400">
                    Copie o código abaixo e cole no app do seu banco
                </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-zinc-800/50 rounded-xl">
                {isPolling ? (
                    <>
                        <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                        <span className="text-sm text-green-400">Aguardando pagamento...</span>
                    </>
                ) : (
                    <>
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-400">Válido por 15 minutos</span>
                    </>
                )}
            </div>

            {/* Copy Button - Main CTA */}
            <Button
                onClick={handleCopyPix}
                className={`w-full h-14 rounded-xl text-lg font-semibold transition-all ${copied
                    ? 'bg-green-600 hover:bg-green-600'
                    : 'bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    }`}
            >
                {copied ? (
                    <>
                        <Check className="w-5 h-5 mr-2" />
                        Código Copiado!
                    </>
                ) : (
                    <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copiar Código PIX
                    </>
                )}
            </Button>

            {/* Helper Text */}
            <p className="text-center text-xs text-zinc-500 mt-4">
                Após o pagamento, a tela atualizará automaticamente
            </p>
        </div>
    )
}
