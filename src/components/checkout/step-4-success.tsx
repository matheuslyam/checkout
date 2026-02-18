"use client"

import Image from "next/image"
import { Check } from "lucide-react"
import { useCheckout } from "@/store/CheckoutContext"

export function Step4Success() {
    const { state, reset } = useCheckout()
    return (
        <div className="w-fit bg-[#212121] rounded-[20px] p-[45px] pt-[20px] pb-[50px] mx-auto text-white flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-500">
            {/* Progress Bar Container */}
            <div className="w-[260px] h-[18px] bg-black rounded-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-[100%] bg-[#32CD32] rounded-full flex items-center justify-end pr-2">
                    <span className="text-[10px] font-bold text-black">100%</span>
                </div>
            </div>

            <h1 className="text-[18px] font-bold mb-6 text-center leading-tight">
                Sua Ambtus está a<br />caminho!
            </h1>

            {/* Product Card */}
            <div className="w-[260px] bg-white rounded-[20px] p-6 flex flex-col items-center mb-6">
                <div className="relative w-full h-[180px] mb-4 flex items-center justify-center">
                    {state.productImage && (
                        <Image
                            src={state.productImage}
                            alt={state.productName}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    )}
                </div>
            </div>

            <div className="w-[260px] flex flex-col mb-8">
                <h3 className="font-audiowide text-[27.5px] text-[#1E90FF] tracking-wide uppercase leading-tight mb-2 text-center">
                    {state.productName}
                </h3>
                <div className="flex justify-between items-center w-full mb-1 px-1">
                    <span className="text-[10px] text-white">Edição Limitada</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white">Cor:</span>
                        <div
                            className="w-4 h-4 rounded-[4px] border-[1px] border-[#383838]"
                            style={{ backgroundColor: state.productColor === 'Padrão' ? 'black' : state.productColor }}
                            title={state.productColor}
                        ></div>
                    </div>
                </div>
            </div>

            {/* PIX Copy/Paste Display */}
            {state.pixPayload && (
                <div className="w-[260px] flex flex-col items-center mb-8 animate-in slide-in-from-bottom-5 duration-700">
                    <p className="text-[14px] text-yellow-400 font-bold mb-3 text-center animate-pulse">
                        Aguardando Pagamento...
                    </p>
                    <p className="text-[12px] text-white font-bold mb-3 text-center">
                        Copie o código abaixo para pagar via PIX:
                    </p>

                    {/* Copy Paste Code */}
                    <div className="w-full relative group">
                        <textarea
                            readOnly
                            value={state.pixPayload}
                            className="w-full h-24 bg-[#2A2A2A] text-[#A0A0A0] text-[10px] p-3 rounded-lg resize-none border border-[#383838] focus:outline-none mb-3 break-all font-mono"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(state.pixPayload || '')
                                const btn = document.getElementById('copy-btn')
                                if (btn) {
                                    btn.innerText = 'Copiado!'
                                    setTimeout(() => btn.innerText = 'Copiar Código Pix', 2000)
                                }
                            }}
                            id="copy-btn"
                            className="w-full bg-[#32CD32] hover:bg-[#28a428] text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 duration-150"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                            Copiar Código Pix
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 mt-3 text-center">
                        Este código expira em 15 minutos.
                    </p>
                </div>
            )}

            {/* Success Message - Only show if NO pending PIX or if confirmed */}
            {!state.pixPayload && (
                <div className="w-[260px] text-center mb-10 animate-in fade-in duration-500 delay-200">
                    <h2 className="text-[14px] font-bold text-[#32CD32] mb-2 uppercase">
                        Pedido realizado com sucesso.
                    </h2>
                    <p className="text-[10px] text-white leading-relaxed">
                        <span className="font-bold">Obrigado pela confiança.</span> Preparamos cada<br />
                        detalhe para que sua experiência seja<br />
                        extraordinária.
                    </p>
                </div>
            )}

            {/* Email Alert - Only for Success */}
            {!state.pixPayload && (
                <div className="w-[260px] text-center animate-in fade-in duration-500 delay-300">
                    <h3 className="text-[14px] font-bold text-[#1E90FF] mb-3">
                        Fique de olho no seu e-mail:
                    </h3>
                    <ul className="text-left space-y-3">
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-white rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-[10px] text-white leading-tight">
                                Enviamos agora o comprovante de pagamento.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-white rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-[10px] text-white leading-tight">
                                Assim que a bike for despachada, você receberá o
                                código de rastreio para acompanhar cada km da
                                entrega.
                            </span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    )
}
