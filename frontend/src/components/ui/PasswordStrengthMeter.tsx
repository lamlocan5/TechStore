"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import zxcvbn from "zxcvbn";

interface PasswordStrengthMeterProps {
    password: string;
    showCriteria?: boolean;
}

export function PasswordStrengthMeter({ password, showCriteria = true }: PasswordStrengthMeterProps) {
    const [strength, setStrength] = useState(0);
    const [feedback, setFeedback] = useState<string[]>([]);

    useEffect(() => {
        if (!password) {
            setStrength(0);
            setFeedback([]);
            return;
        }

        const result = zxcvbn(password);
        setStrength(result.score);
        setFeedback(result.feedback.suggestions || []);
    }, [password]);

    const criteria = [
        { label: "Ít nhất 6 ký tự", met: password.length >= 6 },
        { label: "Chứa chữ thường", met: /[a-z]/.test(password) },
        { label: "Chứa số", met: /\d/.test(password) },
    ];

    const strengthConfig = [
        { label: "Rất yếu", color: "bg-red-500", textColor: "text-red-600" },
        { label: "Yếu", color: "bg-orange-500", textColor: "text-orange-600" },
        { label: "Trung bình", color: "bg-yellow-500", textColor: "text-yellow-600" },
        { label: "Mạnh", color: "bg-green-500", textColor: "text-green-600" },
        { label: "Rất mạnh", color: "bg-emerald-500", textColor: "text-emerald-600" },
    ];

    const currentStrength = strengthConfig[strength];
    const strengthPercentage = password ? ((strength + 1) / 5) * 100 : 0;

    if (!password) return null;

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Độ mạnh mật khẩu:</span>
                    <span className={`font-semibold ${currentStrength.textColor}`}>
                        {currentStrength.label}
                    </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strengthPercentage}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full ${currentStrength.color} rounded-full`}
                    />
                </div>
            </div>

            {/* Criteria Checklist */}
            {showCriteria && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                >
                    {criteria.map((criterion, index) => (
                        <motion.div
                            key={criterion.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 text-xs"
                        >
                            {criterion.met ? (
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                                <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={criterion.met ? "text-green-600" : "text-gray-500"}>
                                {criterion.label}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Feedback Suggestions */}
            {feedback.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                >
                    <p className="text-xs font-semibold text-yellow-800 mb-1">Gợi ý:</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                        {feedback.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}
