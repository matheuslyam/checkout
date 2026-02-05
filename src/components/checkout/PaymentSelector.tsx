import { Smartphone, Check, CreditCard } from "lucide-react"

interface PaymentSelectorProps {
    method: 'pix' | 'cartao' | 'boleto' | null | undefined
    onSelect: (method: 'pix' | 'cartao') => void
    frete: number
}

export function PaymentSelector({ method, onSelect, frete }: PaymentSelectorProps) {
    return (
        <div className="space-y-4 mb-6">
            {/* PIX Option */}
            <button
                type="button"
                onClick={() => onSelect('pix')}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${method === 'pix'
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-white/5 bg-[#1A1A1A] hover:border-white/10'
                    }`}
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'pix' ? 'bg-green-500' : 'bg-[#222]'
                    }`}>
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">PIX</span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-900/40 text-green-400 rounded-full">
                            Aprovação Instantânea
                        </span>
                    </div>
                    <p className="text-sm text-zinc-400">
                        R$ {(frete + 12490).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                {method === 'pix' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                )}
            </button>

            {/* Card Option */}
            <button
                type="button"
                onClick={() => onSelect('cartao')}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${method === 'cartao'
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-white/5 bg-[#1A1A1A] hover:border-white/10'
                    }`}
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'cartao' ? 'bg-blue-500' : 'bg-[#222]'
                    }`}>
                    <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <span className="font-semibold text-white">Cartão de Crédito</span>
                    <p className="text-sm text-zinc-400">Em até 21x</p>
                </div>
                {method === 'cartao' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                )}
            </button>
        </div>
    )
}
