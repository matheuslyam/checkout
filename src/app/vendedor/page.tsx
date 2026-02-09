"use client"

import { useState } from "react"
import { BIKES_CATALOG } from "@/lib/catalog"
import { Check, Copy } from "lucide-react"

export default function SellerPage() {
    const [selectedModel, setSelectedModel] = useState<string>("ambtus-flash")
    const [color, setColor] = useState("")
    const [generatedLink, setGeneratedLink] = useState("")
    const [copied, setCopied] = useState(false)

    const product = BIKES_CATALOG[selectedModel]

    const handleGenerateValues = () => {
        if (!selectedModel) return

        const baseUrl = window.location.origin
        const url = new URL(`${baseUrl}/`) // Changed from /checkout to root
        url.searchParams.set("bike", selectedModel)

        if (color.trim()) {
            url.searchParams.set("color", color.trim())
        }

        setGeneratedLink(url.toString())
        setCopied(false)
    }

    const handleCopy = async () => {
        if (!generatedLink) return
        await navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[18px] p-6 shadow-2xl">
                <h1 className="text-xl font-semibold mb-6 text-center text-neutral-200">
                    Gerador de Link de Venda
                </h1>

                <div className="space-y-5">
                    {/* Model Selector */}
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400 ml-1">Modelo</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => {
                                setSelectedModel(e.target.value)
                                setGeneratedLink("")
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg h-12 px-4 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                        >
                            {Object.values(BIKES_CATALOG).map((bike) => (
                                <option key={bike.id} value={bike.id}>
                                    {bike.name} - {(bike.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Color Input */}
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400 ml-1">Cor (Opcional)</label>
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => {
                                setColor(e.target.value)
                                setGeneratedLink("")
                            }}
                            placeholder="Ex: Preto Fosco, Vermelho..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg h-12 px-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Preview Details */}
                    {product && (
                        <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800/50 space-y-3">
                            <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-neutral-900">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div>
                                <h3 className="font-medium text-neutral-200">{product.name}</h3>
                                <p className="text-sm text-neutral-500 line-clamp-2">{product.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateValues}
                        disabled={!selectedModel}
                        className="w-full bg-white text-black font-medium h-12 rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Gerar Link
                    </button>

                    {/* Result Area */}
                    {generatedLink && (
                        <div className="mt-6 pt-6 border-t border-neutral-800 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs text-neutral-500 ml-1 mb-2 block uppercase tracking-wider">Link Gerado</label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={generatedLink}
                                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 text-sm text-neutral-400 focus:outline-none select-all"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white w-12 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
