"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    label: string;
    icon: React.ReactNode;
}

interface CheckoutStepperProps {
    currentStep: number;
    steps: Step[];
}

export function CheckoutStepper({ currentStep, steps }: CheckoutStepperProps) {
    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isUpcoming = stepNumber > currentStep;

                    return (
                        <div key={index} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                        isCompleted && "bg-primary border-primary text-white",
                                        isCurrent && "bg-primary border-primary text-white scale-110 shadow-lg",
                                        isUpcoming && "bg-gray-100 border-gray-300 text-gray-400"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-6 w-6" />
                                    ) : (
                                        <span className="text-lg font-semibold">{stepNumber}</span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "mt-2 text-sm font-medium transition-colors",
                                        (isCompleted || isCurrent) && "text-primary",
                                        isUpcoming && "text-gray-400"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-4 relative top-[-20px]">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-300",
                                            stepNumber < currentStep ? "bg-primary" : "bg-gray-300"
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
