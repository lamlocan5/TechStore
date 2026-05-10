"use client";

import { useState, useRef, InputHTMLAttributes, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    error?: string;
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
    ({ label, error, type = 'text', leftIcon, rightIcon, className, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);

        const hasValue = props.value !== undefined && props.value !== '';
        // For date inputs, always keep label floating to avoid overlap with placeholder
        const isFloating = isFocused || hasValue || type === 'date';

        const inputType = type === 'password' && showPassword ? 'text' : type;

        return (
            <div className="relative">
                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref || inputRef}
                        type={inputType}
                        {...props}
                        value={props.value ?? ""}
                        className={cn(
                            "peer w-full px-4 py-3 pt-6 pb-2 rounded-lg border-2 transition-all duration-200",
                            "bg-white text-gray-900 placeholder-transparent",
                            "focus:outline-none focus:ring-0",
                            error
                                ? "border-red-500 focus:border-red-600"
                                : "border-gray-300 focus:border-primary",
                            leftIcon && "pl-10",
                            (rightIcon || type === 'password') && "pr-10",
                            className
                        )}
                        placeholder={label}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />

                    {/* Floating Label */}
                    <motion.label
                        initial={false}
                        animate={{
                            top: isFloating ? '0.5rem' : '50%',
                            translateY: isFloating ? '0%' : '-50%',
                            fontSize: isFloating ? '0.75rem' : '1rem',
                            color: error
                                ? '#ef4444'
                                : isFocused
                                    ? 'var(--primary)'
                                    : '#6b7280',
                        }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "absolute left-4 pointer-events-none font-medium",
                            leftIcon && "left-10"
                        )}
                        htmlFor={props.id}
                    >
                        {label}
                    </motion.label>

                    {/* Right Icon or Password Toggle */}
                    {type === 'password' ? (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    ) : rightIcon ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {rightIcon}
                        </div>
                    ) : null}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm text-red-600 mt-1 ml-1"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
