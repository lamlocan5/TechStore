"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth.store";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Button } from "@/components/ui/button";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

const loginSchema = z.object({
    username: z.string().min(1, "Tên đăng nhập không được để trống"),
    password: z.string().min(1, "Mật khẩu không được để trống"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            await login(data);

            // Success animation delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if user needs to change password (used forgot password feature)
            const mustChangePassword = localStorage.getItem("mustChangePassword");
            if (mustChangePassword && mustChangePassword === data.username) {
                // Clear the flag
                localStorage.removeItem("mustChangePassword");
                // Set flag to show notification on change password page
                localStorage.setItem("showChangePasswordNotice", "true");
                router.push("/profile/change-password");
            } else {
                router.push("/");
            }
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <LoadingOverlay isLoading={isLoading} message="Đang đăng nhập..." />

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
            >
                {/* Error Message */}
                {errorMessage && (
                    <FormErrorMessage message={errorMessage} type="error" />
                )}

                {/* Email Input */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <FloatingLabelInput
                        {...register("username")}
                        label="Tên đăng nhập"
                        type="text"
                        leftIcon={<User className="h-5 w-5" />}
                        error={errors.username?.message}
                        value={watch("username")}
                    />
                </motion.div>

                {/* Password Input */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <FloatingLabelInput
                        {...register("password")}
                        label="Mật khẩu"
                        type="password"
                        leftIcon={<Lock className="h-5 w-5" />}
                        error={errors.password?.message}
                        value={watch("password")}
                    />
                </motion.div>

                {/* Forgot Password Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-end"
                >
                    <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(true)}
                        className="text-sm text-primary hover:underline"
                    >
                        Quên mật khẩu?
                    </button>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                        disabled={isLoading}
                    >
                        <span>Đăng nhập</span>
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                {/* Register Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center pt-4 border-t"
                >
                    <p className="text-sm text-gray-600">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="text-primary font-semibold hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>
                </motion.div>
            </motion.form>

            {/* Forgot Password Dialog */}
            <ForgotPasswordDialog
                isOpen={forgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
            />
        </>
    );
}
