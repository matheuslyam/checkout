"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCheckout } from "@/store/CheckoutContext"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

// Schema definition
const formSchema = z.object({
    cep: z.string().min(8, { message: "CEP inválido" }).max(9),
    address: z.string().min(5, { message: "Endereço obrigatório" }),
    number: z.string().min(1, { message: "Número obrigatório" }),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, { message: "Bairro obrigatório" }),
    city: z.string().min(2, { message: "Cidade obrigatória" }),
    state: z.string().length(2, { message: "UF inválida" }),
})

type FormData = z.infer<typeof formSchema>

interface Step2DeliveryProps {
    onNext: () => void
    onBack?: () => void
}

// Shipping cost logic
const ESTADOS_SUL_SUDESTE = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS']
const FRETE_SUL_SUDESTE = 150
const FRETE_OUTRAS_REGIOES = 300

function calcularFrete(uf: string): number {
    if (!uf) return 0
    const upperUf = uf.toUpperCase()
    return ESTADOS_SUL_SUDESTE.includes(upperUf) ? FRETE_SUL_SUDESTE : FRETE_OUTRAS_REGIOES
}

export function Step2Delivery({ onNext, onBack }: Step2DeliveryProps) {
    const { state, updateData } = useCheckout()
    const [isLoadingCep, setIsLoadingCep] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cep: state.cep,
            address: state.endereco,
            number: state.numero,
            complement: state.complemento,
            neighborhood: state.bairro,
            city: state.cidade,
            state: state.estado,
        }
    })

    const cepValue = watch('cep')

    // Update form when context state hydrates
    useEffect(() => {
        if (state.cep || state.endereco) {
            reset({
                cep: state.cep,
                address: state.endereco,
                number: state.numero,
                complement: state.complemento,
                neighborhood: state.bairro,
                city: state.cidade,
                state: state.estado,
            })
        }
    }, [state, reset])

    // Auto-search CEP
    useEffect(() => {
        const fetchCep = async () => {
            const cepLimpo = cepValue?.replace(/\D/g, '')
            if (cepLimpo?.length !== 8) return

            setIsLoadingCep(true)
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
                const data = await response.json()

                if (!data.erro) {
                    setValue('address', data.logradouro)
                    setValue('neighborhood', data.bairro)
                    setValue('city', data.localidade)
                    setValue('state', data.uf)

                    // Update context immediately for better UX
                    updateData('endereco', data.logradouro)
                    updateData('bairro', data.bairro)
                    updateData('cidade', data.localidade)
                    updateData('estado', data.uf)
                    updateData('frete', calcularFrete(data.uf))
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error)
            } finally {
                setIsLoadingCep(false)
            }
        }

        fetchCep()
    }, [cepValue, setValue, updateData])

    const onSubmit = (data: FormData) => {
        updateData('cep', data.cep)
        updateData('endereco', data.address)
        updateData('numero', data.number)
        updateData('complemento', data.complement || '')
        updateData('bairro', data.neighborhood)
        updateData('cidade', data.city)
        updateData('estado', data.state)
        updateData('frete', calcularFrete(data.state))

        onNext()
    }

    return (
        <div className="w-fit bg-[#212121] rounded-[20px] p-[45px] pt-[20px] pb-[50px] mx-auto text-white flex flex-col items-center shadow-2xl">
            {/* Progress Bar Container */}
            <div className="w-[260px] h-[18px] bg-black rounded-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-[50%] bg-[#1E90FF] rounded-full flex items-center justify-end pr-2">
                    <span className="text-[10px] font-bold text-white">50%</span>
                </div>
            </div>

            <h1 className="text-[23px] font-bold mb-[4px]">Entrega</h1>
            <h2 className="text-[13px] font-regular text-[#9E9E9E] mb-8">Onde sua bike vai ser entregue?</h2>

            {/* Product Summary Card */}
            <div className="flex gap-4 items-center w-[260px] mb-8">
                {/* Image */}
                <div className="w-[80px] h-[80px] bg-white rounded-[20px] flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                        src="/images/bike.png"
                        alt="Ambtus Flash"
                        width={80}
                        height={50}
                        className="object-contain"
                    />
                </div>

                {/* Details */}
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

            <form onSubmit={handleSubmit(onSubmit)} className="w-[260px] flex flex-col gap-4">
                <h3 className="text-[15px] font-bold text-center mb-2">Dados de entrega:</h3>

                {/* CEP */}
                <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-regular">CEP:</label>
                    <div className="relative">
                        <input
                            {...register("cep", {
                                onChange: (e) => {
                                    // Mascara simples de CEP se desejar, ou apenas numérico
                                    updateData('cep', e.target.value)
                                }
                            })}
                            placeholder="00000-000"
                            maxLength={9}
                            className={cn(
                                "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                errors.cep ? "!border-[#FF1E1E]" : "!border-[#383838]"
                            )}
                        />
                        {isLoadingCep && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 text-[#1E90FF] animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.cep && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.cep.message}</span>
                    )}
                </div>

                {/* Endereço */}
                <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-regular">Endereço:</label>
                    <input
                        {...register("address", { onChange: (e) => updateData('endereco', e.target.value) })}
                        placeholder="Rua, Avenida..."
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                            errors.address ? "!border-[#FF1E1E]" : "!border-[#383838]"
                        )}
                    />
                    {errors.address && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.address.message}</span>
                    )}
                </div>

                {/* Número e Complemento Row */}
                <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-[40%]">
                        <label className="text-[13px] font-regular">Número:</label>
                        <input
                            {...register("number", { onChange: (e) => updateData('numero', e.target.value) })}
                            placeholder="123"
                            className={cn(
                                "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-4 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                errors.number ? "!border-[#FF1E1E]" : "!border-[#383838]"
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-[60%]">
                        <label className="text-[13px] font-regular">Complemento:</label>
                        <input
                            {...register("complement", { onChange: (e) => updateData('complemento', e.target.value) })}
                            placeholder="Apto"
                            className={cn(
                                "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-4 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                "!border-[#383838]"
                            )}
                        />
                    </div>
                </div>

                {/* Bairro */}
                <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-regular">Bairro:</label>
                    <input
                        {...register("neighborhood", { onChange: (e) => updateData('bairro', e.target.value) })}
                        placeholder="Seu bairro"
                        className={cn(
                            "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                            errors.neighborhood ? "!border-[#FF1E1E]" : "!border-[#383838]"
                        )}
                    />
                    {errors.neighborhood && (
                        <span className="text-[#FF1E1E] text-[8px] text-right px-2">{errors.neighborhood.message}</span>
                    )}
                </div>

                {/* Cidade e UF Row */}
                <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-[70%]">
                        <label className="text-[13px] font-regular">Cidade:</label>
                        <input
                            {...register("city", { onChange: (e) => updateData('cidade', e.target.value) })}
                            placeholder="Cidade"
                            className={cn(
                                "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-6 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                errors.city ? "!border-[#FF1E1E]" : "!border-[#383838]"
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-[30%]">
                        <label className="text-[13px] font-regular">UF:</label>
                        <input
                            {...register("state", { onChange: (e) => updateData('estado', e.target.value) })}
                            placeholder="UF"
                            maxLength={2}
                            className={cn(
                                "w-full h-[53px] bg-[#191919] border-[1px] rounded-[20px] px-4 text-[#FFFFFF] text-[15px] placeholder:text-[#383838] focus:outline-none focus:!border-[#1E90FF]",
                                errors.state ? "!border-[#FF1E1E]" : "!border-[#383838]"
                            )}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    {onBack && (
                        <Button
                            type="button"
                            onClick={onBack}
                            className="w-[30%] h-[53px] rounded-[20px] bg-[#000000] text-white font-bold text-[15px] hover:bg-[#333] transition-colors border-[1px] !border-[#383838]"
                        >
                            Voltar
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="flex-1 h-[53px] rounded-[20px] bg-gradient-to-b from-[#1E90FF] to-[#045CB1] text-white font-bold text-[15px] hover:opacity-90 transition-opacity border-none"
                    >
                        Pagamento
                    </Button>
                </div>
            </form>
        </div>
    )
}
