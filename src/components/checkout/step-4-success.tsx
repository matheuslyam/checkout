"use client"

import Image from "next/image"
import { Check } from "lucide-react"

export function Step4Success() {
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
                <div className="relative w-full h-[120px] mb-4 flex items-center justify-center">
                    <Image
                        src="/images/bike.png"
                        alt="Ambtus Flash"
                        width={180}
                        height={120}
                        className="object-contain"
                    />
                </div>
            </div>

            <div className="w-[260px] flex flex-col mb-8">
                <h3 className="font-audiowide text-[27.5px] text-[#1E90FF] tracking-wide uppercase leading-none mb-2 text-center whitespace-nowrap">
                    AMBTUS FLASH
                </h3>
                <div className="flex justify-between items-center w-full mb-1 px-1">
                    <span className="text-[10px] text-white">Edição Limitada</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white">Cor:</span>
                        <div className="w-4 h-4 bg-black rounded-[4px] border-[1px] border-[#383838]"></div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            <div className="w-[260px] text-center mb-10">
                <h2 className="text-[14px] font-bold text-[#32CD32] mb-2 uppercase">
                    Pedido realizado com sucesso.
                </h2>
                <p className="text-[10px] text-white leading-relaxed">
                    <span className="font-bold">Obrigado pela confiança.</span> Preparamos cada<br />
                    detalhe para que sua experiência seja<br />
                    extraordinária.
                </p>
            </div>

            {/* Email Alert */}
            <div className="w-[260px] text-center">
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
        </div>
    )
}
