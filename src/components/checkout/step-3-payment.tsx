"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCheckout } from "@/store/CheckoutContext"
import { usePayment } from "@/hooks/usePayment"
import { Loader2, ChevronDown, ChevronUp, Copy, Check, Clock } from "lucide-react"

export function Step3Payment({ onBack }: { onBack: () => void }) {
    const { state, updateData, setPaymentResult } = useCheckout()
    // const { handleGeneratePix, isGeneratingPix } = usePayment() // We are simulating locally

    // Local state for UI feedback
    const [copied, setCopied] = useState(false)
    const [isSimulatingPix, setIsSimulatingPix] = useState(false)
    const [timeLeft, setTimeLeft] = useState(600) // Default 10 min
    const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false)
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' })

    const isCardValid = cardData.number.replace(/\D/g, '').length >= 13 &&
        cardData.name.length > 3 &&
        cardData.expiry.length >= 5 &&
        cardData.cvv.length >= 3

    // Timer logic
    useEffect(() => {
        if (!state.pixExpiresAt || !state.pixPayload) return

        const interval = setInterval(() => {
            const expires = new Date(state.pixExpiresAt).getTime()
            const now = Date.now()
            const diff = Math.max(0, Math.floor((expires - now) / 1000))
            setTimeLeft(diff)
        }, 1000)

        return () => clearInterval(interval)
    }, [state.pixExpiresAt, state.pixPayload])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const handleGeneratePix = async () => {
        setIsSimulatingPix(true)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Mock success
        setPaymentResult({
            paymentId: 'simulated_id',
            pixQrCode: '',
            pixPayload: '00020101021226850014br.gov.bcb.pix2563pix.exem.simulacao.123',
            pixExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
        })
        setIsSimulatingPix(false)
    }

    // Sync accordion state with context method
    const selectedMethod = state.metodoPagamento

    const handleMethodSelect = (method: 'pix' | 'cartao') => {
        if (selectedMethod === method) {
            // Optional: Allow collapsing? Design suggests radio behavior.
            // Keep expanded if clicked again? Usually accordions toggle.
            // let's keep it simple: click expands and selects.
            return
        }
        updateData('metodoPagamento', method)
    }

    const onCopyPix = async () => {
        const code = state.pixPayload || "00020101021226850014br.gov.bcb.pix2563pix.exem" // Fallback simulation
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Format currency
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

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
                    <Image
                        src="/images/bike.png"
                        alt="Ambtus Flash"
                        width={80}
                        height={50}
                        className="object-contain"
                    />
                </div>
                <div className="flex flex-col w-full">
                    <h3 className="font-audiowide text-[19px] text-[#1E90FF] tracking-wide uppercase leading-none mb-1 whitespace-nowrap">
                        AMBTUS FLASH
                    </h3>
                    <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-[9px] text-white">Edição Limitada</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-white">Cor:</span>
                            <div className="w-3 h-3 bg-black rounded-[3px] border-[1px] !border-[#383838]"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] text-white whitespace-nowrap">Total a pagar: R$ 12.490,00</span>
                        <span className="text-[10px] font-bold text-[#1E90FF] whitespace-nowrap">Até 12x de R$ 1.040,83</span>
                    </div>
                </div>
            </div>

            <h2 className="text-[15px] font-bold text-center mb-6">Escolha um método de pagamento:</h2>

            <div className="w-[260px] flex flex-col gap-4">

                {/* --- CARTÃO ACCORDION --- */}
                <div
                    onClick={() => handleMethodSelect('cartao')}
                    className={cn(
                        "rounded-[20px] bg-[#191919] transition-all duration-300 border-[1px] cursor-pointer relative",
                        selectedMethod === 'cartao' ? "!border-[#1E90FF] overflow-visible" : "!border-[#383838] overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[15px] font-bold text-white">Cartão</span>
                                <span className="text-[8px] text-[#585858]">Pague em até 12x com segurança.</span>
                            </div>
                            {/* Card Flags */}
                            <div className="flex gap-2 mt-2">
                                <Image src="/images/payment-flags.png" alt="Bandeiras" width={120} height={20} className="object-contain" />
                            </div>
                        </div>
                        {selectedMethod === 'cartao' ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </div>

                    {/* Expanded Content */}
                    {selectedMethod === 'cartao' && (
                        <div className="px-4 pb-6 pt-0 border-t !border-[#383838]/0"> {/* border transparent mostly */}
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
                                        className="w-full h-[40px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]"
                                        value={cardData.number}
                                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">Nome Impresso</label>
                                    <input
                                        placeholder="Ex: Pedro da Silva"
                                        className="w-full h-[40px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]"
                                        value={cardData.name}
                                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">Validade (MM/AA)</label>
                                    <input
                                        placeholder="Ex: 01/02"
                                        className="w-full h-[40px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]"
                                        value={cardData.expiry}
                                        maxLength={5}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, '')
                                            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4)
                                            setCardData({ ...cardData, expiry: v })
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-regular text-white">CVV (Código de segurança)</label>
                                    <input
                                        placeholder="Ex: 123"
                                        className="w-full h-[40px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] px-4 text-white text-[12px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]"
                                        value={cardData.cvv}
                                        maxLength={4}
                                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                    />
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
                                                {state.parcelas
                                                    ? `${state.parcelas} ${state.parcelas === 1 ? 'mês' : 'meses'} - ${formatCurrency(12490 / state.parcelas)}`
                                                    : "Parcelamento"}
                                            </span>
                                            {isInstallmentsOpen ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                                        </div>

                                        {isInstallmentsOpen && (
                                            <div className="absolute top-[45px] left-0 w-full max-h-[150px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] overflow-hidden z-20 flex flex-col shadow-xl">
                                                <div className="overflow-y-auto custom-scrollbar p-1">
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((months) => (
                                                        <div
                                                            key={months}
                                                            onClick={() => {
                                                                updateData('parcelas', months)
                                                                setIsInstallmentsOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full py-2 px-3 rounded-[15px] cursor-pointer flex justify-between items-center group transition-colors mb-1 last:mb-0",
                                                                state.parcelas === months ? "bg-[#1E90FF]" : "hover:bg-[#1E90FF]/20"
                                                            )}
                                                        >
                                                            <span className={cn(
                                                                "text-[11px] transition-colors",
                                                                state.parcelas === months ? "text-white font-bold" : "text-white group-hover:text-[#1E90FF]"
                                                            )}>
                                                                {months} {months === 1 ? 'mês' : 'meses'} - {formatCurrency(12490 / months)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    disabled={!isCardValid}
                                    onClick={() => {
                                        // Simulate successful payment
                                        setPaymentResult({
                                            paymentId: 'card_simulated_id',
                                            pixQrCode: '',
                                            pixPayload: '',
                                            pixExpiresAt: ''
                                        })
                                        updateData('step', 4) // Force navigation to step 4
                                    }}
                                    className="w-full h-[40px] mt-2 rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-[12px] hover:opacity-90 transition-opacity border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Finalizar Pagamento Seguro
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- PIX ACCORDION --- */}
                <div
                    onClick={() => handleMethodSelect('pix')}
                    className={cn(
                        "rounded-[20px] bg-[#191919] overflow-hidden transition-all duration-300 border-[1px] cursor-pointer",
                        selectedMethod === 'pix' ? "!border-[#1E90FF]" : "!border-[#383838]"
                    )}
                >
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-bold text-white">PIX</span>
                            </div>
                            <div className="mt-2">
                                <Image src="/images/pix.png" alt="Pix" width={40} height={15} className="object-contain" />
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
                                        disabled={isSimulatingPix || !state.cpf || state.cpf.replace(/\D/g, '').length < 11}
                                        className="w-full h-[40px] rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-[13px] hover:opacity-90 transition-opacity border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSimulatingPix ? <Loader2 className="animate-spin" /> : "Gerar Pix"}
                                    </Button>

                                    <p className="text-[9px] text-[#585858] text-center leading-tight mt-2">
                                        <span className="font-bold">Pagamento Processado pelo Asaas.</span><br />
                                        Seus dados estão protegidos por criptografia de ponta a ponta.
                                    </p>
                                </div>
                            ) : (
                                // STATE 2: SUCCESS / COPY
                                <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                                    <p className="text-[9px] text-white text-center font-bold">
                                        O seu código Pix Copia e Cola foi gerado.<br />
                                        <span className="font-regular text-[8px]">Finalize o pagamento agora para garantir sua <span className="text-[#1E90FF]">Ambtus</span>.</span>
                                    </p>

                                    <div className="relative">
                                        <input
                                            readOnly
                                            value={state.pixPayload}
                                            className="w-full h-[40px] bg-[#121212] border-[1px] !border-[#383838] rounded-[20px] px-4 text-[#585858] text-[9px] focus:outline-none focus:!border-[#1E90FF] text-center overflow-hidden text-ellipsis"
                                        />
                                        <p className="text-[8px] text-[#585858] text-center mt-1">Copie e cole no seu provedor de pagamento</p>
                                    </div>

                                    <div className="flex items-center justify-center gap-1 text-[#FFC107]">
                                        <span className="text-[9px] font-bold">Esse código expira em: {formatTime(timeLeft)}</span>
                                    </div>

                                    <Button
                                        onClick={onCopyPix}
                                        className="w-full h-[40px] rounded-[20px] bg-[#32CD32] text-black font-bold text-[13px] hover:bg-[#2db82d] transition-colors border-none"
                                    >
                                        {copied ? "Código pix copiado!" : "Copiar código Pix"}
                                    </Button>

                                    <p className="text-[9px] text-[#585858] text-center leading-tight mt-2">
                                        <span className="font-bold">Pagamento Processado pelo Asaas.</span><br />
                                        Seus dados estão protegidos por criptografia de ponta a ponta.
                                    </p>
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
