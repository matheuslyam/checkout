import { Loader2, CreditCard } from "lucide-react"

interface InstallmentOption {
    installment: number
    label: string
}

interface CardAreaProps {
    isLoading: boolean
    installments: InstallmentOption[]
    selectedInstallment: number
    onSelectInstallment: (installment: number) => void
}

export function CardArea({ isLoading, installments, selectedInstallment, onSelectInstallment }: CardAreaProps) {
    return (
        <div className="mb-6 space-y-4">
            <div className="p-4 bg-[#1A1A1A] rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <CreditCard className="w-5 h-5" />
                    <h3 className="font-semibold text-sm">Parcelamento</h3>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Em quantas vezes deseja pagar?</label>
                        <select
                            className="w-full bg-[#222] border-white/5 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                            value={selectedInstallment}
                            onChange={(e) => onSelectInstallment(Number(e.target.value))}
                        >
                            {installments.map((opt) => (
                                <option key={opt.installment} value={opt.installment}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="p-4 border-2 border-dashed border-white/5 rounded-xl bg-[#1A1A1A]/50">
                <p className="text-center text-sm text-zinc-500">
                    🔒 Dados do cartão serão solicitados na próxima etapa segura.
                </p>
            </div>
        </div>
    )
}
