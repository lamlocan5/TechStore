"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Loader2, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/lib/api/auth.service";
import { cn } from "@/lib/utils";

interface ForgotPasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

type DialogState = "input" | "loading" | "success" | "error";

export function ForgotPasswordDialog({ isOpen, onClose }: ForgotPasswordDialogProps) {
    const [username, setUsername] = useState("");
    const [state, setState] = useState<DialogState>("input");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            setErrorMessage("Vui lòng nhập tên đăng nhập");
            return;
        }

        setState("loading");
        setErrorMessage("");

        try {
            await forgotPassword(username);

            // Show loading for 5 seconds as requested
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Store username to check after login - user must change password
            localStorage.setItem("mustChangePassword", username);

            setState("success");

            // Auto close after 3 seconds
            setTimeout(() => {
                handleClose();
            }, 3000);
        } catch (error: any) {
            setState("error");
            setErrorMessage(error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    const handleClose = () => {
        setUsername("");
        setState("input");
        setErrorMessage("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={state === "input" ? handleClose : undefined}
                />

                {/* Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                >
                    {/* Close button (only in input and error states) */}
                    {(state === "input" || state === "error") && (
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    )}

                    {/* Input State */}
                    {state === "input" && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-8"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                    <User className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h2>
                                <p className="text-gray-600 mt-2">
                                    Nhập tên đăng nhập của bạn để nhận mật khẩu mới qua email
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {errorMessage && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Tên đăng nhập"
                                        className={cn(
                                            "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                                            errorMessage ? "border-red-300" : "border-gray-300"
                                        )}
                                        autoFocus
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    Gửi yêu cầu
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {state === "loading" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 text-center"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                >
                                    <Mail className="h-10 w-10 text-primary" />
                                </motion.div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Đang gửi mật khẩu mới...</h3>
                            <p className="text-gray-600">
                                Vui lòng chờ, hệ thống đang xử lý yêu cầu của bạn
                            </p>
                            <div className="mt-6 flex justify-center">
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            </div>

                            {/* Progress bar animation */}
                            <div className="mt-6 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Success State */}
                    {state === "success" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
                            >
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-green-600 mb-2">Gửi thành công!</h3>
                            <p className="text-gray-600">
                                Mật khẩu mới đã được gửi đến email của bạn.<br />
                                Vui lòng kiểm tra hộp thư để đăng nhập.
                            </p>
                            <Button
                                onClick={handleClose}
                                className="mt-6 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Quay lại đăng nhập
                            </Button>
                        </motion.div>
                    )}

                    {/* Error State */}
                    {state === "error" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-8 text-center"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-red-600 mb-2">Có lỗi xảy ra</h3>
                            <p className="text-gray-600 mb-6">{errorMessage}</p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={() => setState("input")}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    Thử lại
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
