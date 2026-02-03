'use client'

import { useCheckout } from '@/store/CheckoutContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'

const schema = z.object({
    email: z.string().email('Digite um e-mail válido'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function StepIdentificacao() {
    const { state, updateData, nextStep } = useCheckout()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: state.email,
            cpf: state.cpf,
            nome: state.nome,
            telefone: state.telefone,
        },
    })

    const onSubmit = (data: FormData) => {
        updateData('email', data.email)
        updateData('cpf', data.cpf)
        updateData('nome', data.nome)
        updateData('telefone', data.telefone || '')
        nextStep()
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Identificação
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Informe seus dados para continuar
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Nome */}
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome completo
                    </label>
                    <input
                        id="nome"
                        type="text"
                        {...register('nome')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Seu nome completo"
                    />
                    {errors.nome && (
                        <p className="mt-2 text-sm text-red-500">{errors.nome.message}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        E-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="seu@email.com"
                    />
                    {errors.email && (
                        <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                {/* CPF */}
                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CPF
                    </label>
                    <input
                        id="cpf"
                        type="text"
                        {...register('cpf')}
                        maxLength={11}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="00000000000"
                    />
                    {errors.cpf && (
                        <p className="mt-2 text-sm text-red-500">{errors.cpf.message}</p>
                    )}
                </div>

                {/* Telefone */}
                <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone <span className="text-gray-400">(opcional)</span>
                    </label>
                    <input
                        id="telefone"
                        type="tel"
                        {...register('telefone')}
                        maxLength={11}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="11999999999"
                    />
                    {errors.telefone && (
                        <p className="mt-2 text-sm text-red-500">{errors.telefone.message}</p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    Continuar para entrega
                </button>
            </form>
        </motion.div>
    )
}
