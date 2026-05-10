"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Banknote, Shield, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { PaymentMethod } from "@/types/order";

interface PaymentStepProps {
    selectedMethod: PaymentMethod | null;
    onSelectMethod: (method: PaymentMethod) => void;
}

const paymentMethods = [
    {
        id: "COD" as PaymentMethod,
        name: "Thanh toán khi nhận hàng",
        shortName: "COD",
        description: "Thanh toán bằng tiền mặt khi nhận hàng",
        icon: Banknote,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        gradientFrom: "from-green-500",
        gradientTo: "to-emerald-600",
        features: ["Không cần thanh toán trước", "Kiểm tra hàng trước khi trả tiền", "An toàn & tiện lợi"],
    },
    {
        id: "VNPAY" as PaymentMethod,
        name: "Thanh toán qua VNPay",
        shortName: "VNPay",
        description: "Thanh toán qua cổng VNPay (ATM, Visa, MasterCard)",
        icon: CreditCard,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        gradientFrom: "from-blue-500",
        gradientTo: "to-indigo-600",
        features: ["Bảo mật cao", "Thanh toán nhanh chóng", "Hỗ trợ nhiều ngân hàng"],
    },
];

export function PaymentStep({ selectedMethod, onSelectMethod }: PaymentStepProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl">
                        <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Phương thức thanh toán</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Chọn cách thanh toán phù hợp với bạn</p>
                    </div>
                </div>
            </motion.div>

            {/* Payment Methods */}
            <RadioGroup value={selectedMethod || ""} onValueChange={(value) => onSelectMethod(value as PaymentMethod)}>
                <div className="space-y-4">
                    {paymentMethods.map((method, index) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;

                        return (
                            <motion.div
                                key={method.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.01 }}
                                className={cn(
                                    "bg-white rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden",
                                    isSelected
                                        ? `${method.borderColor} shadow-lg ring-4 ring-${method.color}/10`
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                )}
                                onClick={() => onSelectMethod(method.id)}
                            >
                                {/* Selected Indicator Bar */}
                                {isSelected && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        className={`h-1.5 bg-gradient-to-r ${method.gradientFrom} ${method.gradientTo}`}
                                    />
                                )}

                                <div className="p-4">
                                    <div className="flex items-start gap-4">
                                        <RadioGroupItem value={method.id} id={method.id} className="mt-1.5" />

                                        {/* Payment Icon */}
                                        <div className={cn(
                                            "p-3 rounded-xl border-2 transition-all",
                                            isSelected
                                                ? `bg-gradient-to-br ${method.bgColor} ${method.borderColor}`
                                                : "bg-gray-50 border-gray-200"
                                        )}>
                                            <Icon className={cn("h-6 w-6", isSelected ? method.color : "text-gray-600")} />
                                        </div>

                                        {/* Payment Details */}
                                        <div className="flex-1">
                                            <Label htmlFor={method.id} className="text-base font-bold cursor-pointer text-gray-900 mb-1 block">
                                                {method.name}
                                            </Label>
                                            <p className="text-sm text-gray-600 mb-4">{method.description}</p>

                                            {/* Features - Reserve space to prevent jumping */}
                                            <div className="min-h-[80px]">
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="space-y-2"
                                                    >
                                                        {method.features.map((feature, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <div className={cn("p-1 rounded-full", method.bgColor)}>
                                                                    <CheckCircle2 className={cn("h-4 w-4", method.color)} />
                                                                </div>
                                                                <span className="text-sm text-gray-700">{feature}</span>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selected Badge */}
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring" }}
                                                className="flex-shrink-0"
                                            >
                                                <div className={`w-10 h-10 bg-gradient-to-br ${method.gradientFrom} ${method.gradientTo} rounded-full flex items-center justify-center shadow-lg`}>
                                                    <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={3} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </RadioGroup>

            {/* Security Notice */}
            {selectedMethod && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Thông tin quan trọng
                            </h4>
                            {selectedMethod === "COD" && (
                                <div className="space-y-2 text-sm text-blue-800">
                                    <p>• Vui lòng chuẩn bị đủ tiền mặt khi nhận hàng</p>
                                    <p>• Shipper có thể sẽ không có tiền thối</p>
                                    <p>• Bạn có thể kiểm tra hàng trước khi thanh toán</p>
                                </div>
                            )}
                            {selectedMethod === "VNPAY" && (
                                <div className="space-y-2 text-sm text-blue-800">
                                    <p>• Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn</p>
                                    <p>• Giao dịch được mã hóa và bảo mật tuyệt đối</p>
                                    <p>• Đơn hàng sẽ được xác nhận ngay sau khi thanh toán thành công</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
