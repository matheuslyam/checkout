import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCheckout } from "@/store/CheckoutContext"
import { usePayment } from "@/hooks/usePayment"
// import { isValidCreditCard, isValidCPF } from "@/lib/validation" // Not used directly anymore, relying on Zod
import { Loader2, ChevronDown, ChevronUp, Copy, Check, Clock, AlertCircle } from "lucide-react"
import { getInstallmentOptions } from "@/lib/financial"

// Schema definition for Card
const cardSchema = z.object({
    number: z.string().min(16, { message: "Número inválido" }), // Simple length check
    name: z.string().min(3, { message: "Nome inválido" }),
    expiry: z.string().min(5, { message: "Inválido" }),
    cvv: z.string().min(3, { message: "Inválido" }),
    cpf: z.string().min(11, { message: "CPF inválido" })
})

type CardFormData = z.infer<typeof cardSchema>

export function Step3Payment({ onBack }: { onBack: () => void }) {
    const { state, updateData, setPaymentResult, setPaymentStatus, goToStep } = useCheckout()

    // INTEGRATION: Use the real hook for PIX and Card logic
    const { handleGeneratePix, isGeneratingPix, handleCardPayment, isProcessingCard } = usePayment()

    // Local state for UI feedback
    const [copied, setCopied] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)
    const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false)

    // Form for Card
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<CardFormData>({
        resolver: zodResolver(cardSchema),
        mode: "onChange",
    })

    const cardValues = watch()

    // Calculate Installment Options (Financial Engine)
    const maxInstallment = useMemo(() => {
        const shippingCents = Math.round((state.frete || 0) * 100)
        const isTestProduct = state.productId === 'teste-1'
        const options = getInstallmentOptions(state.productPrice, shippingCents, isTestProduct)
        return options[options.length - 1]
    }, [state.productPrice, state.frete, state.productId])

    const installmentOptions = useMemo(() => {
        const shippingCents = Math.round((state.frete || 0) * 100)
        const isTestProduct = state.productId === 'teste-1'
        return getInstallmentOptions(state.productPrice, shippingCents, isTestProduct)
    }, [state.productPrice, state.frete, state.productId])

    // ============================================
    // 🕒 Timer Logic
    // ============================================
    useEffect(() => {
        if (!state.pixExpiresAt) {
            setTimeLeft(0)
            return
        }

        const calculateTimeLeft = () => {
            const expires = new Date(state.pixExpiresAt).getTime()
            const now = Date.now()
            const diff = Math.max(0, Math.floor((expires - now) / 1000))
            return diff
        }

        setTimeLeft(calculateTimeLeft())

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(interval)
    }, [state.pixExpiresAt])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    // ============================================
    // 🔄 Polling Logic
    // ============================================
    useEffect(() => {
        // Only pool if we have a payment ID, a payload (meaning PIX generated), and it's not confirmed yet
        if (!state.paymentId || !state.pixPayload || state.paymentStatus === 'CONFIRMED' || timeLeft === 0) return

        const checkStatus = async () => {
            try {
                // Ensure we handle the case where fetching might fail gracefully
                const res = await fetch(`/api/asaas/check-payment?id=${state.paymentId}`)
                if (!res.ok) return // Silently fail/retry next tick

                const data = await res.json()

                if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
                    console.log("✅ Payment Confirmed via Polling!")
                    setPaymentStatus('CONFIRMED')

                    // State Purge (session storage)
                    sessionStorage.removeItem('checkout_state_v2')

                    // Transition to Success
                    goToStep(4)
                }
            } catch (e) {
                console.error("Polling error (silent):", e)
            }
        }

        const interval = setInterval(checkStatus, 7000) // 7 seconds
        return () => clearInterval(interval)
    }, [state.paymentId, state.pixPayload, state.paymentStatus, timeLeft, setPaymentStatus, goToStep])


    // Sync accordion state with context method
    const selectedMethod = state.metodoPagamento

    const handleMethodSelect = (method: 'pix' | 'cartao') => {
        if (selectedMethod === method) {
            updateData('metodoPagamento', null)
        } else {
            updateData('metodoPagamento', method)
        }
    }

    const onCopyPix = async () => {
        const code = state.pixPayload || ""
        if (code) {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Format currency
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    const onCardSubmit = (data: CardFormData) => {
        handleCardPayment({
            number: data.number,
            name: data.name,
            expiry: data.expiry,
            cvv: data.cvv,
            cpf: data.cpf
        })
    }

    // Regenerate handler (clears payload so user can generate again)
    const handleResetPix = () => {
        updateData('pixPayload', '')
        updateData('pixExpiresAt', '')
    }

    return (
        <div className="w-fit bg-[#212121] rounded-[20px] p-[45px] pt-[20px] pb-[50px] mx-auto text-white flex flex-col items-center shadow-2xl">
            {/* Progress Bar Container */}
            <div className="w-[260px] h-[18px] bg-black rounded-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-[75%] bg-[#1E90FF] rounded-full flex items-center justify-end pr-2">
                    <span className="text-[10px] font-bold text-white">75%</span>
                </div>
            </div>

            <h1 className="text-[23px] font-bold mb-8">Pagamento</h1>

            {/* Product Summary Card (Reused Design) */}
            <div className="flex gap-4 items-center w-[260px] mb-8">
                <div className="w-[80px] h-[80px] bg-white rounded-[20px] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {state.productImage && (
                        <Image
                            src={state.productImage}
                            alt={state.productName}
                            width={80}
                            height={50}
                            className="object-contain"
                            style={{ width: 'auto', height: 'auto' }}
                        />
                    )}
                </div>
                <div className="flex flex-col w-full">
                    <h3 className="font-audiowide text-[19px] text-[#1E90FF] tracking-wide uppercase leading-tight mb-1">
                        {state.productName}
                    </h3>
                    <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-[9px] text-white">Edição Limitada</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-white">Cor:</span>
                            <div
                                className="w-3 h-3 rounded-[3px] border-[1px] !border-[#383838]"
                                style={{ backgroundColor: state.productColor === 'Padrão' ? 'black' : state.productColor }}
                                title={state.productColor}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-start mt-1 gap-[2px]">
                        <span className="text-[#1E90FF] font-bold text-[10px]">Pagamento Seguro Asaas</span>
                    </div>
                </div>
            </div>

            <h2 className="text-[15px] font-bold text-center mb-6">Escolha um método de pagamento:</h2>

            <div className="w-[260px] flex flex-col gap-4">

                {/* --- CARTÃO ACCORDION --- */}
                <div
                    className={cn(
                        "rounded-[20px] bg-[#191919] transition-all duration-300 border-[1px] relative",
                        selectedMethod === 'cartao' ? "!border-[#1E90FF] overflow-visible" : "!border-[#383838] overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div
                        onClick={() => handleMethodSelect('cartao')}
                        className="p-4 flex items-center justify-between cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[15px] font-bold text-white">Cartão</span>
                                <span className="text-[8px] text-[#585858]">Pague em até 21x com segurança.</span>
                            </div>
                            {/* Card Flags */}
                            <div className="flex gap-2 mt-2">
                                <Image src="/images/payment-flags.png" alt="Bandeiras" width={120} height={20} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
                            </div>
                        </div>
                        {selectedMethod === 'cartao' ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </div>

                    {/* Expanded Content */}
                    {selectedMethod === 'cartao' && (
                        <div className="px-4 pb-6 pt-0 border-t !border-[#383838]/0">
                            <p className="text-[9px] text-[#585858] text-center mb-4 leading-tight">
                                <span className="font-bold">Pagamento Processado pelo Asaas.</span><br />
                                Seus dados estão protegidos por criptografia de ponta a ponta.
                            </p>

                            <div className="flex flex-col gap-3">
                                {/* Card Inputs */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">Número do Cartão</label>
                                    <input
                                        placeholder="Ex: 0000 0000 0000 0000"
                                        className={cn(
                                            "w-full h-[40px] bg-[#121212] border-[1px] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                            errors.number ? "!border-[#FF1E1E]" : "!border-[#383838]"
                                        )}
                                        {...register("number", {
                                            onChange: (e) => {
                                                // Minimal masking (optional)
                                            }
                                        })}
                                    />
                                    {errors.number && <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.number.message}</span>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">Nome Impresso</label>
                                    <input
                                        placeholder="Ex: Pedro da Silva"
                                        className={cn(
                                            "w-full h-[40px] bg-[#121212] border-[1px] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                            errors.name ? "!border-[#FF1E1E]" : "!border-[#383838]"
                                        )}
                                        {...register("name")}
                                    />
                                    {errors.name && <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.name.message}</span>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">Validade (MM/AA)</label>
                                    <input
                                        placeholder="Ex: 01/02"
                                        className={cn(
                                            "w-full h-[40px] bg-[#121212] border-[1px] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                            errors.expiry ? "!border-[#FF1E1E]" : "!border-[#383838]"
                                        )}
                                        {...register("expiry", {
                                            onChange: (e) => {
                                                let v = e.target.value.replace(/\D/g, '')
                                                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4)
                                                setValue("expiry", v)
                                            }
                                        })}
                                        maxLength={5}
                                    />
                                    {errors.expiry && <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.expiry.message}</span>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">CVV (Código de segurança)</label>
                                    <input
                                        placeholder="Ex: 123"
                                        className={cn(
                                            "w-full h-[40px] bg-[#121212] border-[1px] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                            errors.cvv ? "!border-[#FF1E1E]" : "!border-[#383838]"
                                        )}
                                        {...register("cvv")}
                                        maxLength={4}
                                    />
                                    {errors.cvv && <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.cvv.message}</span>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">CPF do Titular</label>
                                    <input
                                        placeholder="000.000.000-00"
                                        className={cn(
                                            "w-full h-[40px] bg-[#121212] border-[1px] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                            errors.cpf ? "!border-[#FF1E1E]" : "!border-[#383838]"
                                        )}
                                        {...register("cpf", {
                                            onChange: (e) => {
                                                let v = e.target.value.replace(/\D/g, '')
                                                if (v.length > 11) v = v.slice(0, 11)
                                                if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
                                                else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
                                                else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2')
                                                setValue("cpf", v)
                                            }
                                        })}
                                        maxLength={14}
                                    />
                                    {errors.cpf && <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.cpf.message}</span>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white hidden">Parcelamento</label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsInstallmentsOpen(!isInstallmentsOpen)}
                                            className={cn(
                                                "w-full h-[40px] bg-[#121212] border-[1px] rounded-[20px] px-4 flex items-center justify-between cursor-pointer group",
                                                isInstallmentsOpen ? "!border-[#1E90FF]" : "!border-[#383838]"
                                            )}
                                        >
                                            <span className="text-[12px] text-white">
                                                {(() => {
                                                    const selected = installmentOptions.find(o => o.installment === state.parcelas)
                                                    return selected
                                                        ? `${selected.installment}x de ${formatCurrency(selected.value / 100)}`
                                                        : "Parcelamento"
                                                })()}
                                            </span>
                                            {isInstallmentsOpen ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                                        </div>

                                        {isInstallmentsOpen && (
                                            <div className="absolute top-[45px] left-0 w-full max-h-[200px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] overflow-hidden z-20 flex flex-col shadow-xl">
                                                <div className="overflow-y-auto custom-scrollbar p-1">
                                                    {installmentOptions.map((option) => (
                                                        <div
                                                            key={option.installment}
                                                            onClick={() => {
                                                                updateData('parcelas', option.installment)
                                                                setIsInstallmentsOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full py-2 px-3 rounded-[15px] cursor-pointer flex justify-between items-center group transition-colors mb-1 last:mb-0",
                                                                state.parcelas === option.installment ? "bg-[#1E90FF]" : "hover:bg-[#1E90FF]/20"
                                                            )}
                                                        >
                                                            <span className={cn(
                                                                "text-[10px] transition-colors flex w-full justify-between",
                                                                state.parcelas === option.installment ? "text-white font-bold" : "text-white group-hover:text-[#1E90FF]"
                                                            )}>
                                                                <span>{option.installment}x</span>
                                                                <span>{formatCurrency(option.value / 100)}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmit(onCardSubmit)}
                                    disabled={isProcessingCard}
                                    className="w-full h-[40px] mt-2 rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-[12px] hover:opacity-90 transition-opacity border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessingCard ? <Loader2 className="animate-spin" /> : "Finalizar Pagamento Seguro"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- PIX ACCORDION --- */}
                <div
                    className={cn(
                        "rounded-[20px] bg-[#191919] overflow-hidden transition-all duration-300 border-[1px]",
                        selectedMethod === 'pix' ? "!border-[#1E90FF]" : "!border-[#383838]"
                    )}
                >
                    {/* Header */}
                    <div
                        onClick={() => handleMethodSelect('pix')}
                        className="p-4 flex items-center justify-between cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-bold text-white">PIX</span>
                            </div>
                            <div className="mt-2">
                                <Image src="/images/pix.png" alt="Pix" width={40} height={15} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
                            </div>
                        </div>
                        {selectedMethod === 'pix' ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </div>

                    {/* Expanded Content */}
                    {selectedMethod === 'pix' && (
                        <div className="px-4 pb-6 pt-0">
                            {!state.pixPayload ? (
                                // STATE 1: GENERATE
                                <div className="flex flex-col gap-4">
                                    <p className="text-[10px] text-white text-center mt-2">
                                        Após clicar no botão, Pix será<br />gerado para o pagamento.
                                    </p>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-regular text-white">CPF ou CNPJ</label>
                                        <input
                                            placeholder="123.456.789-00"
                                            className="w-full h-[40px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF] text-center"
                                            value={state.cpf}
                                            onChange={(e) => updateData('cpf', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleGeneratePix}
                                        disabled={isGeneratingPix || !state.cpf || state.cpf.replace(/\D/g, '').length < 11}
                                        className="w-full h-[40px] rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-[13px] hover:opacity-90 transition-opacity border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingPix ? <Loader2 className="animate-spin" /> : "Gerar Pix"}
                                    </Button>

                                    <p className="text-[9px] text-[#585858] text-center leading-tight mt-2">
                                        <span className="font-bold">Pagamento Processado pelo Asaas.</span><br />
                                        Seus dados estão protegidos por criptografia de ponta a ponta.
                                    </p>
                                </div>
                            ) : (
                                // STATE 2: SUCCESS / COPY / EXPIRED
                                <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                                    {timeLeft > 0 ? (
                                        <>
                                            <p className="text-[9px] text-white text-center font-bold">
                                                O seu código Pix Copia e Cola foi gerado.<br />
                                                <span className="font-regular text-[8px]">Finalize o pagamento agora para garantir sua <span className="text-[#1E90FF]">Ambtus</span>.</span>
                                            </p>

                                            <div className="relative">
                                                <textarea
                                                    readOnly
                                                    value={state.pixPayload}
                                                    className="w-full h-[60px] bg-[#121212] border-[1px] !border-[#383838] rounded-[15px] p-3 text-[#585858] text-[9px] focus:outline-none focus:!border-[#1E90FF] resize-none overflow-hidden"
                                                />
                                                <p className="text-[8px] text-[#585858] text-center mt-1">Copie e cole no seu provedor de pagamento</p>
                                            </div>

                                            <div className="flex items-center justify-center gap-1 text-[#FFC107]">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[9px] font-bold">Esse código expira em: {formatTime(timeLeft)}</span>
                                            </div>

                                            <Button
                                                onClick={onCopyPix}
                                                className={cn(
                                                    "w-full h-[40px] rounded-[20px] transition-colors border-none font-bold text-[13px]",
                                                    copied ? "bg-[#32CD32] text-black hover:bg-[#2db82d]" : "bg-[#1E90FF] text-white hover:bg-[#045CB1]"
                                                )}
                                            >
                                                {copied ? (
                                                    <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Copiado!</span>
                                                ) : (
                                                    <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Copiar Código PIX</span>
                                                )}
                                            </Button>

                                            <div className="flex justify-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#32CD32] animate-pulse" />
                                                    <span className="text-[8px] text-[#585858]">Aguardando pagamento...</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // EXPIRADO
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <div className="w-[50px] h-[50px] rounded-full bg-[#191919] border-[1px] border-[#FF1E1E] flex items-center justify-center">
                                                <AlertCircle className="w-6 h-6 text-[#FF1E1E]" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-bold text-white">Código expirado</p>
                                                <p className="text-[9px] text-[#585858]">O tempo para pagamento se esgotou.</p>
                                            </div>
                                            <Button
                                                onClick={handleResetPix}
                                                className="w-full h-[40px] rounded-[20px] bg-[#1E90FF] text-white font-bold text-[13px] hover:bg-[#045CB1] border-none"
                                            >
                                                Gerar novo PIX
                                            </Button>
                                        </div>
                                    )}

                                    {timeLeft > 0 && (
                                        <p className="text-[9px] text-[#585858] text-center leading-tight mt-2">
                                            <span className="font-bold">Pagamento Processado pelo Asaas.</span><br />
                                            Seus dados estão protegidos por criptografia de ponta a ponta.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-[260px] mt-4">
                <Button
                    onClick={onBack}
                    className="w-full h-[40px] rounded-[20px] bg-[#000000] text-white font-bold text-[13px] hover:bg-[#333] transition-colors border-[1px] !border-[#383838]"
                >
                    Voltar
                </Button>
            </div>

        </div>
    )
}
