"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stepper } from "@/components/ui/stepper"
import { useState } from "react"
import { ArrowRight, Mail } from "lucide-react"

export default function Home() {
    const [currentStep, setCurrentStep] = useState(0)

    const steps = [
        { label: "Account", description: "Create your account" },
        { label: "Profile", description: "Set up your profile" },
        { label: "Completion", description: "Review and submit" },
    ]

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 md:p-24 selection:bg-primary/20">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    Ambtus UI Kit &nbsp;
                    <code className="font-mono font-bold">src/components/ui</code>
                </p>
            </div>

            <div className="mt-16 grid w-full max-w-4xl gap-12">
                {/* Buttons Section */}
                <section className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                    <h2 className="text-2xl font-semibold tracking-tight">Buttons</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                        <Button size="icon"><ArrowRight className="h-4 w-4" /></Button>
                        <Button>
                            <Mail className="mr-2 h-4 w-4" /> Login with Email
                        </Button>
                    </div>
                </section>

                {/* Inputs Section */}
                <section className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                    <h2 className="text-2xl font-semibold tracking-tight">Inputs</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <Input type="email" id="email" placeholder="Email" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="disabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Disabled</label>
                            <Input disabled type="email" id="disabled" placeholder="Disabled" />
                        </div>
                    </div>
                </section>

                {/* Stepper Section */}
                <section className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                    <h2 className="text-2xl font-semibold tracking-tight">Stepper</h2>
                    <div className="py-4">
                        <Stepper steps={steps} currentStep={currentStep} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>Previous</Button>
                        <Button onClick={nextStep} disabled={currentStep === steps.length - 1}>Next</Button>
                    </div>
                </section>
            </div>
        </main>
    )
}
