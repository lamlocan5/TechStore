"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Edit, Save, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { updateUser } from "@/lib/api/auth.service";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { uploadAvatarToSupabase, deleteAvatarFromSupabase } from "@/lib/supabase/config";

const profileSchema = z.object({
    lastName: z.string().min(2, "Họ phải có ít nhất 2 ký tự"),
    firstName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    dob: z.string().min(1, "Ngày sinh là bắt buộc"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    phone: z.string()
        .regex(/^0[0-9]{9}$/, "Số điện thoại phải có 10 số và bắt đầu bằng 0")
        .optional()
        .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileInfo() {
    const { user, updateUser: updateUserState, loadUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            lastName: "",
            firstName: "",
            dob: "",
            email: "",
            phone: "",
        },
    });

    // Update form values when user data changes
    useEffect(() => {
        if (user) {
            reset({
                lastName: user.lastName || "",
                firstName: user.firstName || "",
                dob: user.dob || "",
                email: user.email || "",
                phone: user.phone || "",
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        if (!user) return;

        try {
            setIsLoading(true);
            const payload = {
                lastName: data.lastName,
                firstName: data.firstName,
                dob: data.dob,
                email: data.email || undefined,
                phone: data.phone || undefined,
                avatar: user.avatar || undefined,
            };

            await updateUser(user.id, payload);

            await loadUser();
            setIsEditing(false);
            toast.success("Cập nhật thông tin thành công!");
        } catch (error: any) {
            console.error("Update profile error:", error);
            toast.error(error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            reset({
                lastName: user.lastName || "",
                firstName: user.firstName || "",
                dob: user.dob || "",
                email: user.email || "",
                phone: user.phone || "",
            });
        }
    };

    const handleAvatarUpload = async (file: File) => {
        if (!user) return;

        const loadingToast = toast.loading("Đang tải ảnh lên...");

        try {
            // Delete old avatar if exists
            if (user.avatar) {
                try {
                    await deleteAvatarFromSupabase(user.avatar);
                } catch (error) {
                    console.error("Failed to delete old avatar:", error);
                    // Continue with upload even if delete fails
                }
            }

            // Upload new avatar to Supabase
            const avatarUrl = await uploadAvatarToSupabase(file, user.id);

            const payload = {
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                dob: user.dob || "",
                email: user.email || "",
                phone: user.phone || "",
                avatar: avatarUrl,
            };

            // Update user profile with new avatar URL
            await updateUser(user.id, payload);

            // Reload user data to reflect new avatar
            await loadUser();

            toast.success("Cập nhật ảnh đại diện thành công!", { id: loadingToast });
        } catch (error: any) {
            console.error("Avatar upload error:", error);

            // Show specific error message
            let errorMessage = "Tải ảnh lên thất bại. Vui lòng thử lại.";
            if (error.message.includes("Bucket")) {
                errorMessage = "Chưa cấu hình Supabase Storage. Vui lòng xem file FIX_BUCKET_NOT_FOUND.md để setup.";
            }

            toast.error(errorMessage, { id: loadingToast });
        }
    };

    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Thông tin cá nhân</CardTitle>
                            <CardDescription>
                                Quản lý thông tin cá nhân của bạn
                            </CardDescription>
                        </div>
                        {!isEditing && (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                                className="gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Avatar Section */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex justify-center pb-6 border-b"
                        >
                            <AvatarUpload
                                currentAvatar={user.avatar}
                                onUpload={handleAvatarUpload}
                            />
                        </motion.div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Last Name */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <FloatingLabelInput
                                    {...register("lastName")}
                                    label="Họ *"
                                    type="text"
                                    error={errors.lastName?.message}
                                    value={watch("lastName")}
                                    disabled={!isEditing}
                                />
                            </motion.div>

                            {/* First Name */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <FloatingLabelInput
                                    {...register("firstName")}
                                    label="Tên *"
                                    type="text"
                                    error={errors.firstName?.message}
                                    value={watch("firstName")}
                                    disabled={!isEditing}
                                />
                            </motion.div>

                            {/* Email */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <FloatingLabelInput
                                    {...register("email")}
                                    label="Email"
                                    type="email"
                                    error={errors.email?.message}
                                    value={watch("email")}
                                    disabled={!isEditing}
                                />
                            </motion.div>

                            {/* Phone */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <FloatingLabelInput
                                    {...register("phone")}
                                    label="Số điện thoại"
                                    type="tel"
                                    error={errors.phone?.message}
                                    value={watch("phone")}
                                    disabled={!isEditing}
                                />
                            </motion.div>

                            {/* Date of Birth */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="md:col-span-2"
                            >
                                <FloatingLabelInput
                                    {...register("dob")}
                                    label="Ngày sinh *"
                                    type="date"
                                    error={errors.dob?.message}
                                    value={watch("dob")}
                                    disabled={!isEditing}
                                />
                            </motion.div>
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="flex gap-3 justify-end pt-4 border-t"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Save className="h-4 w-4" />
                                            </motion.div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}
