"use client"

import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Schema definition
const formSchema = z.object({
    name: z.string().min(2, { message: "O nome é obrigatório" }),
    email: z.string().email({ message: "Digite uma informação válida." }),
    phone: z.string().min(10, { message: "Digite uma informação válida." }),
})

type FormData = z.infer<typeof formSchema>

interface Step1FinalizeProps {
    onNext: () => void
}

export function Step1Finalize({ onNext }: Step1FinalizeProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    })

    const onSubmit = (data: FormData) => {
        console.log("Form Data:", data)
        onNext()
    }

    return (
        <div className="w-fit bg-[#212121] rounded-[20px] p-[45px] pt-[20px] pb-[50px] mx-auto text-white flex flex-col items-center shadow-2xl">
            {/* Progress Bar Container - Adjusted padding top to match design spacing */}
            <div className="w-[260px] h-3 bg-black rounded-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-[25%] bg-[#1E90FF] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white pl-1">25%</span>
                </div>
            </div>

            <h1 className="text-2xl font-bold mb-8 font-inter">Finalizar Pedido</h1>

            {/* Product Image */}
            <div className="bg-white rounded-[20px] p-4 mb-4 w-[260px] h-[116px] flex items-center justify-center overflow-hidden">
                <Image
                    src="/images/bike.png"
                    alt="Ambtus Flash"
                    width={260}
                    height={116}
                    className="object-contain"
                    priority
                />
            </div>

            {/* Product Name */}
            <h2 className="font-audiowide text-[28px] text-[#1E90FF] tracking-wide uppercase mb-1 text-center w-[260px]">
                AMBTUS FLASH
            </h2>

            {/* Extras */}
            <div className="flex justify-between items-center w-[260px] px-2 mb-4">
                <span className="text-[10px] font-inter text-[#FFFFFF]">Edição Limitada</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-inter text-[#FFFFFF]">Cor:</span>
                    <div className="w-5 h-5 bg-black rounded-[5px] border-[1px] !border-[#383838]"></div>
                </div>
            </div>

            {/* Price */}
            <div className="text-center mb-10 w-[260px]">
                <div className="text-[40px] font-bold leading-none mb-1">R$ 12.490,00</div>
                <div className="text-[#1E90FF] font-bold text-base">Até 12x de R$ 1.040,83</div>
            </div>

            {/* Personal Data Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="w-[260px] flex flex-col gap-4">
                <h3 className="text-base font-bold text-center mb-2">Dados pessoais:</h3>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-regular">Nome:</label>
                    <input
                        {...register("name")}
                        placeholder="Ex: Pedro da Silva"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] !border-[#383838] rounded-[20px] px-6 text-[#FFFFFF] placeholder:text-[#383838] focus:outline-none focus:border-[#1E90FF] focus:border-[1px]",
                            errors.name && "border-[#FF1E1E] border-[1px]"
                        )}
                    />
                    {errors.name && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.name.message}</span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-regular">G-mail:</label>
                    <input
                        {...register("email")}
                        placeholder="Ex: seugmail@gmail.com"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] !border-[#383838] rounded-[20px] px-6 text-[#FFFFFF] placeholder:text-[#383838] focus:outline-none focus:border-[#1E90FF] focus:border-[1px]",
                            errors.email && "border-[#FF1E1E] border-[1px]"
                        )}
                    />
                    {errors.email && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.email.message}</span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mb-6">
                    <label className="text-sm font-regular">Telefone:</label>
                    <input
                        {...register("phone")}
                        placeholder="Ex: (99)98765-4321"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] !border-[#383838] rounded-[20px] px-6 text-[#FFFFFF] placeholder:text-[#383838] focus:outline-none focus:border-[#1E90FF] focus:border-[1px]",
                            errors.phone && "border-[#FF1E1E] border-[1px]"
                        )}
                    />
                    {errors.phone && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.phone.message}</span>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full h-[53px] rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-base hover:opacity-90 transition-opacity border-none"
                >
                    Continuar para Entrega
                </Button>
            </form>
        </div>
    )
}
