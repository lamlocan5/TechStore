"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { processVNPayReturn } from "@/lib/api/payment.service";
import type { PaymentReturnResponse } from "@/types/payment";
import { toast } from "sonner";

export default function VNPayReturnPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [result, setResult] = useState<PaymentReturnResponse | null>(null);

    useEffect(() => {
        const processPayment = async () => {
            try {
                // Get full query string
                const queryString = searchParams.toString();

                if (!queryString) {
                    setStatus("error");
                    setResult({
                        success: false,
                        message: "Không tìm thấy thông tin thanh toán",
                        orderId: "",
                        responseCode: "99",
                        responseMessage: "Missing payment information"
                    });
                    return;
                }

                // Call backend API to process return
                const response = await processVNPayReturn(queryString);
                setResult(response);

                if (response.success) {
                    setStatus("success");
                    // Redirect to order success page after 2 seconds
                    setTimeout(() => {
                        router.push(`/orders/${response.orderId}/success`);
                    }, 2000);
                } else {
                    setStatus("error");
                    // Redirect to orders page after 3 seconds
                    setTimeout(() => {
                        toast.error(response.message);
                        router.push("/orders");
                    }, 3000);
                }
            } catch (error: any) {
                console.error("Error processing VNPay return:", error);
                setStatus("error");
                setResult({
                    success: false,
                    message: error.response?.data?.message || "Lỗi xử lý kết quả thanh toán",
                    orderId: "",
                    responseCode: "99",
                    responseMessage: error.message
                });

                // Redirect to orders page after 3 seconds
                setTimeout(() => {
                    toast.error("Có lỗi xảy ra khi xử lý thanh toán");
                    router.push("/orders");
                }, 3000);
            }
        };

        processPayment();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    {status === "processing" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                    </div>
                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Đang xử lý thanh toán...
                                </h2>
                                <p className="text-gray-600">
                                    Vui lòng đợi trong giây lát
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === "success" && result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </div>
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute inset-0 bg-green-400 rounded-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-green-600 mb-2">
                                    Thanh toán thành công!
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {result.message}
                                </p>
                                {result.transactionId && (
                                    <p className="text-sm text-gray-500">
                                        Mã giao dịch: {result.transactionId}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-4">
                                    Đang chuyển hướng...
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === "error" && result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="h-10 w-10 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-red-600 mb-2">
                                    Thanh toán thất bại
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {result.message}
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-800 text-left">
                                            <p className="font-semibold mb-1">Chi tiết lỗi:</p>
                                            <p>{result.responseMessage}</p>
                                            {result.responseCode && (
                                                <p className="mt-1 text-xs">Mã lỗi: {result.responseCode}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Đang quay lại trang đơn hàng...
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
