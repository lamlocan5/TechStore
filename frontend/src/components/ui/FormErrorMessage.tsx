"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, XCircle, CheckCircle, Info } from "lucide-react";

interface FormErrorMessageProps {
    message?: string;
    type?: 'error' | 'warning' | 'success' | 'info';
    className?: string;
}

export function FormErrorMessage({ message, type = 'error', className = '' }: FormErrorMessageProps) {
    if (!message) return null;

    const config = {
        error: {
            icon: XCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-500',
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-500',
        },
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800',
            iconColor: 'text-green-500',
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-500',
        },
    };

    const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-2 p-3 rounded-lg border ${bgColor} ${borderColor} ${className}`}
            >
                <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <p className={`text-sm ${textColor} flex-1`}>{message}</p>
            </motion.div>
        </AnimatePresence>
    );
}
