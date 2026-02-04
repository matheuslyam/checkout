'use client'

import { useCheckout } from '@/store/CheckoutContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Truck, ArrowLeft, MapPin, Loader2 } from 'lucide-react'

const schema = z.object({
    cep: z.string().regex(/^\d{8}$/, 'CEP deve conter 8 dígitos'),
    endereco: z.string().min(5, 'Endereço é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Bairro é obrigatório'),
    cidade: z.string().min(2, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
})

type FormData = z.infer<typeof schema>

// Shipping cost by region
const ESTADOS_SUL_SUDESTE = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS']
const FRETE_SUL_SUDESTE = 150
const FRETE_OUTRAS_REGIOES = 300

function calcularFrete(uf: string): number {
    if (!uf) return 0
    const upperUf = uf.toUpperCase()
    return ESTADOS_SUL_SUDESTE.includes(upperUf) ? FRETE_SUL_SUDESTE : FRETE_OUTRAS_REGIOES
}

export function StepEntrega() {
    const { state, updateData, nextStep, prevStep } = useCheckout()
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const [cepError, setCepError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting, isValid },
        trigger,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            cep: state.cep,
            endereco: state.endereco,
            numero: state.numero,
            complemento: state.complemento,
            bairro: state.bairro,
            cidade: state.cidade,
            estado: state.estado,
        },
    })

    const cepValue = watch('cep')
    const estadoValue = watch('estado')
    const formValues = watch()

    // Auto-search CEP when reaches 8 digits
    useEffect(() => {
        const buscarCep = async () => {
            if (cepValue?.length !== 8) return

            setIsLoadingCep(true)
            setCepError(null)

            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`)
                const data = await response.json()

                if (data.erro) {
                    setCepError('CEP não encontrado')
                    return
                }

                setValue('endereco', data.logradouro || '', { shouldValidate: true })
                setValue('bairro', data.bairro || '', { shouldValidate: true })
                setValue('cidade', data.localidade || '', { shouldValidate: true })
                setValue('estado', data.uf || '', { shouldValidate: true })

                // Calculate shipping based on state
                const freteCalculado = calcularFrete(data.uf)
                updateData('frete', freteCalculado)

            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
                setCepError('Erro ao buscar CEP. Tente novamente.')
            } finally {
                setIsLoadingCep(false)
            }
        }

        buscarCep()
    }, [cepValue, setValue, updateData])

    // Update shipping when state changes manually
    useEffect(() => {
        if (estadoValue?.length === 2) {
            const freteCalculado = calcularFrete(estadoValue)
            updateData('frete', freteCalculado)
        }
    }, [estadoValue, updateData])

    // Check if all required fields are filled
    const allFieldsFilled =
        formValues.cep?.length === 8 &&
        formValues.endereco?.length >= 5 &&
        formValues.numero?.length >= 1 &&
        formValues.bairro?.length >= 2 &&
        formValues.cidade?.length >= 2 &&
        formValues.estado?.length === 2

    const onSubmit = (data: FormData) => {
        updateData('cep', data.cep)
        updateData('endereco', data.endereco)
        updateData('numero', data.numero)
        updateData('complemento', data.complemento || '')
        updateData('bairro', data.bairro)
        updateData('cidade', data.cidade)
        updateData('estado', data.estado)
        updateData('frete', calcularFrete(data.estado))
        nextStep()
    }

    const freteAtual = calcularFrete(estadoValue)

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Entrega
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Informe o endereço de entrega
                </p>
            </div>

            {/* Shipping Info */}
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 transition-all duration-300 ${estadoValue?.length === 2
                    ? ESTADOS_SUL_SUDESTE.includes(estadoValue.toUpperCase())
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${estadoValue?.length === 2
                        ? ESTADOS_SUL_SUDESTE.includes(estadoValue.toUpperCase())
                            ? 'bg-green-100 dark:bg-green-900/40'
                            : 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <Truck className={`w-5 h-5 ${estadoValue?.length === 2
                            ? ESTADOS_SUL_SUDESTE.includes(estadoValue.toUpperCase())
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                </div>
                <div>
                    {estadoValue?.length === 2 ? (
                        <>
                            <p className={`font-semibold ${ESTADOS_SUL_SUDESTE.includes(estadoValue.toUpperCase())
                                    ? 'text-green-800 dark:text-green-300'
                                    : 'text-amber-800 dark:text-amber-300'
                                }`}>
                                Frete: R$ {freteAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm ${ESTADOS_SUL_SUDESTE.includes(estadoValue.toUpperCase())
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                {ESTADOS_SUL_SUDESTE.includes(estadoValue.toUpperCase())
                                    ? 'Entrega em 10-15 dias úteis'
                                    : 'Entrega em 15-20 dias úteis'}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                Informe seu CEP
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                para calcular o frete
                            </p>
                        </>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* CEP */}
                <div>
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CEP
                    </label>
                    <div className="relative">
                        <input
                            id="cep"
                            type="text"
                            {...register('cep')}
                            maxLength={8}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="00000000"
                        />
                        {isLoadingCep && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.cep && (
                        <p className="mt-2 text-sm text-red-500">{errors.cep.message}</p>
                    )}
                    {cepError && (
                        <p className="mt-2 text-sm text-red-500">{cepError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Digite o CEP para buscar o endereço automaticamente
                    </p>
                </div>

                {/* Endereço */}
                <div>
                    <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Endereço
                    </label>
                    <input
                        id="endereco"
                        type="text"
                        {...register('endereco')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Rua, Avenida..."
                    />
                    {errors.endereco && (
                        <p className="mt-2 text-sm text-red-500">{errors.endereco.message}</p>
                    )}
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número
                        </label>
                        <input
                            id="numero"
                            type="text"
                            {...register('numero')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="123"
                        />
                        {errors.numero && (
                            <p className="mt-2 text-sm text-red-500">{errors.numero.message}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Complemento
                        </label>
                        <input
                            id="complemento"
                            type="text"
                            {...register('complemento')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Apto, Bloco..."
                        />
                    </div>
                </div>

                {/* Bairro */}
                <div>
                    <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bairro
                    </label>
                    <input
                        id="bairro"
                        type="text"
                        {...register('bairro')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Seu bairro"
                    />
                    {errors.bairro && (
                        <p className="mt-2 text-sm text-red-500">{errors.bairro.message}</p>
                    )}
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cidade
                        </label>
                        <input
                            id="cidade"
                            type="text"
                            {...register('cidade')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Sua cidade"
                        />
                        {errors.cidade && (
                            <p className="mt-2 text-sm text-red-500">{errors.cidade.message}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado
                        </label>
                        <input
                            id="estado"
                            type="text"
                            {...register('estado')}
                            maxLength={2}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                            placeholder="UF"
                        />
                        {errors.estado && (
                            <p className="mt-2 text-sm text-red-500">{errors.estado.message}</p>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !allFieldsFilled || isLoadingCep}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-500"
                    >
                        {isLoadingCep ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Buscando CEP...
                            </span>
                        ) : (
                            'Continuar para pagamento'
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    )
}
