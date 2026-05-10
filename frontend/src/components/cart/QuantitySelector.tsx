"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
}

export function QuantitySelector({
    value,
    onChange,
    min = 1,
    max = 99,
    disabled = false,
    size = "md",
}: QuantitySelectorProps) {
    const handleDecrement = () => {
        if (value > min && !disabled) {
            onChange(value - 1);
        }
    };

    const handleIncrement = () => {
        if (value < max && !disabled) {
            onChange(value + 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value) || min;
        const clampedValue = Math.min(Math.max(newValue, min), max);
        onChange(clampedValue);
    };

    const sizeClasses = {
        sm: "h-7 w-7 text-xs",
        md: "h-9 w-9 text-sm",
        lg: "h-11 w-11 text-base",
    };

    const inputSizeClasses = {
        sm: "h-7 w-12 text-xs",
        md: "h-9 w-14 text-sm",
        lg: "h-11 w-16 text-base",
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className={cn(sizeClasses[size], "rounded-lg")}
            >
                <Minus className="h-4 w-4" />
            </Button>

            <input
                type="number"
                value={value}
                onChange={handleInputChange}
                disabled={disabled}
                min={min}
                max={max}
                className={cn(
                    inputSizeClasses[size],
                    "text-center border border-gray-300 rounded-lg font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "disabled:bg-gray-50 disabled:cursor-not-allowed",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                )}
            />

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className={cn(sizeClasses[size], "rounded-lg")}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
