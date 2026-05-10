"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Calendar, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth.store";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
    lastName: z.string().min(2, "Họ phải có ít nhất 2 ký tự"),
    firstName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    dob: z.string().min(1, "Ngày sinh là bắt buộc"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    phone: z.string()
        .regex(/^0[0-9]{9}$/, "Số điện thoại phải có 10 số và bắt đầu bằng 0")
        .optional()
        .or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const router = useRouter();
    const { register: registerUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch("password");

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const { confirmPassword, ...registerData } = data;

            // Remove empty optional fields
            const cleanedData = {
                ...registerData,
                email: registerData.email || undefined,
                phone: registerData.phone || undefined,
            };

            await registerUser(cleanedData);

            // Success animation delay
            await new Promise(resolve => setTimeout(resolve, 500));

            router.push("/login");
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <LoadingOverlay isLoading={isLoading} message="Đang tạo tài khoản..." />

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

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <FloatingLabelInput
                            {...register("lastName")}
                            label="Họ *"
                            type="text"
                            leftIcon={<User className="h-5 w-5" />}
                            error={errors.lastName?.message}
                            value={watch("lastName")}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <FloatingLabelInput
                            {...register("firstName")}
                            label="Tên *"
                            type="text"
                            leftIcon={<User className="h-5 w-5" />}
                            error={errors.firstName?.message}
                            value={watch("firstName")}
                        />
                    </motion.div>
                </div>

                {/* Username */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <FloatingLabelInput
                        {...register("username")}
                        label="Tên đăng nhập *"
                        type="text"
                        leftIcon={<User className="h-5 w-5" />}
                        error={errors.username?.message}
                        value={watch("username")}
                    />
                </motion.div>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <FloatingLabelInput
                            {...register("email")}
                            label="Email"
                            type="email"
                            leftIcon={<Mail className="h-5 w-5" />}
                            error={errors.email?.message}
                            value={watch("email")}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <FloatingLabelInput
                            {...register("phone")}
                            label="Số điện thoại"
                            type="tel"
                            leftIcon={<Phone className="h-5 w-5" />}
                            error={errors.phone?.message}
                            value={watch("phone")}
                        />
                    </motion.div>
                </div>

                {/* Date of Birth */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <FloatingLabelInput
                        {...register("dob")}
                        label="Ngày sinh *"
                        type="date"
                        leftIcon={<Calendar className="h-5 w-5" />}
                        error={errors.dob?.message}
                        value={watch("dob")}
                    />
                </motion.div>

                {/* Password */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                >
                    <FloatingLabelInput
                        {...register("password")}
                        label="Mật khẩu *"
                        type="password"
                        leftIcon={<Lock className="h-5 w-5" />}
                        error={errors.password?.message}
                        value={watch("password")}
                    />

                    {/* Password Strength Meter */}
                    <PasswordStrengthMeter password={password || ""} />
                </motion.div>

                {/* Confirm Password */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <FloatingLabelInput
                        {...register("confirmPassword")}
                        label="Xác nhận mật khẩu *"
                        type="password"
                        leftIcon={<Lock className="h-5 w-5" />}
                        error={errors.confirmPassword?.message}
                        value={watch("confirmPassword")}
                    />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                        disabled={isLoading}
                    >
                        <span>Tạo tài khoản</span>
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                {/* Login Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="text-center pt-4 border-t"
                >
                    <p className="text-sm text-gray-600">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="text-primary font-semibold hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </motion.div>
            </motion.form>
        </>
    );
}
