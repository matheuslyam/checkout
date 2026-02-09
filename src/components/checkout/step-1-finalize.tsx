"use client"

import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useCheckout } from "@/store/CheckoutContext"
import { useEffect, useMemo } from "react"
import { getInstallmentOptions } from "@/lib/financial"

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
    const { state, updateData } = useCheckout()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: state.nome,
            email: state.email,
            phone: state.telefone || '',
        }
    })

    // Update form when context state hydrates (e.g. from session storage)
    useEffect(() => {
        if (state.nome || state.email || state.telefone) {
            reset({
                name: state.nome,
                email: state.email,
                phone: state.telefone || '',
            })
        }
    }, [state.nome, state.email, state.telefone, reset])

    // Sync state updates
    // Sync state updates
    const onSubmit = (data: FormData) => {
        // Data is already synced via onChange handlers
        // But to be safe (e.g. autofill without event), we can update again
        updateData('nome', data.name)
        updateData('email', data.email)
        updateData('telefone', data.phone)

        // Wait a microtask to ensure state is propagated before nextStep validation check
        setTimeout(() => {
            onNext()
        }, 0)
    }

    const maxInstallment = useMemo(() => {
        const options = getInstallmentOptions(state.productPrice, 0)
        return options[options.length - 1]
    }, [state.productPrice])

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100)

    return (
        <div className="w-fit bg-[#212121] rounded-[20px] p-[45px] pt-[20px] pb-[50px] mx-auto text-white flex flex-col items-center shadow-2xl">
            {/* Progress Bar Container */}
            <div className="w-[260px] h-[18px] bg-black rounded-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-[25%] bg-[#1E90FF] rounded-full flex items-center justify-end pr-2">
                    <span className="text-[10px] font-bold text-white">25%</span>
                </div>
            </div>

            <h1 className="text-[23px] font-bold mb-8">Finalizar Pedido</h1>

            {/* Product Image */}
            <div className="bg-white rounded-[20px] p-4 mb-4 w-[260px] h-[116px] flex items-center justify-center overflow-hidden">
                <Image
                    src={state.productImage}
                    alt={state.productName}
                    width={260}
                    height={116}
                    className="object-contain"
                    priority
                />
            </div>

            {/* Product Name */}
            <h2 className="font-audiowide text-[27.5px] text-[#1E90FF] tracking-wide uppercase mb-1 w-[260px] whitespace-nowrap text-center">
                {state.productName}
            </h2>

            {/* Extras */}
            <div className="flex justify-between items-center w-[260px] mb-4">
                <span className="text-[11px] text-[#FFFFFF]">Edição Limitada</span>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#FFFFFF]">Cor:</span>
                    <div
                        className="w-5 h-5 rounded-[5px] border-[1px] !border-[#383838]"
                        style={{ backgroundColor: state.productColor === 'Padrão' ? 'black' : state.productColor }}
                        title={state.productColor}
                    />
                </div>
            </div>

            {/* Price */}
            <div className="mb-10 w-[260px] text-center">
                <div className="text-[41px] font-bold leading-none mb-1">{formatCurrency(state.productPrice)}</div>
                <div className="text-[#1E90FF] font-bold text-[15px]">Até {maxInstallment.installment}x de {formatCurrency(maxInstallment.value)}</div>
            </div>

            {/* Personal Data Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="w-[260px] flex flex-col gap-4">
                <h3 className="text-[15px] font-bold text-center mb-2">Dados pessoais:</h3>

                <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-regular">Nome:</label>
                    <input
                        {...register("name", {
                            onChange: (e) => updateData('nome', e.target.value)
                        })}
                        placeholder="Ex: Pedro da Silva"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                            errors.name ? "!border-[#FF1E1E]" : "!border-[#383838]"
                        )}
                    />
                    {errors.name && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.name.message}</span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-regular">G-mail:</label>
                    <input
                        {...register("email", {
                            onChange: (e) => updateData('email', e.target.value)
                        })}
                        placeholder="Ex: seugmail@gmail.com"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                            errors.email ? "!border-[#FF1E1E]" : "!border-[#383838]"
                        )}
                    />
                    {errors.email && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.email.message}</span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mb-6">
                    <label className="text-[13px] font-regular">Telefone:</label>
                    <input
                        {...register("phone", {
                            onChange: (e) => updateData('telefone', e.target.value)
                        })}
                        placeholder="Ex: (99)98765-4321"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                            errors.phone ? "!border-[#FF1E1E]" : "!border-[#383838]"
                        )}
                    />
                    {errors.phone && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.phone.message}</span>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full h-[53px] rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-[15px] hover:opacity-90 transition-opacity border-none"
                >
                    Continuar para Entrega
                </Button>
            </form>
        </div>
    )
}
