"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Plus, Trash2, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Address } from "@/types";
import {
    mockAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
} from "@/lib/utils/mock-data";

const addressSchema = z.object({
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    phone: z.string().regex(/^0[0-9]{9}$/, "Số điện thoại phải có 10 số và bắt đầu bằng 0"),
    address: z.string().min(5, "Địa chỉ phải có ít nhất 5 ký tự"),
    ward: z.string().min(2, "Phường/Xã là bắt buộc"),
    district: z.string().min(2, "Quận/Huyện là bắt buộc"),
    city: z.string().min(2, "Tỉnh/Thành phố là bắt buộc"),
});

type AddressFormData = z.infer<typeof addressSchema>;

export function AddressManagement() {
    const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
    });

    const onSubmit = (data: AddressFormData) => {
        if (editingId) {
            // Update existing address
            const updated = updateAddress(editingId, {
                ...data,
                isDefault: false,
            });
            if (updated) {
                setAddresses([...mockAddresses]);
                toast.success("Cập nhật địa chỉ thành công!");
            }
            setEditingId(null);
        } else {
            // Add new address
            const newAddress = addAddress({
                userId: "user-id-123",
                ...data,
                isDefault: addresses.length === 0,
            });
            setAddresses([...mockAddresses]);
            toast.success("Thêm địa chỉ thành công!");
        }
        reset();
        setIsAdding(false);
    };

    const handleDelete = (id: number) => {
        if (deleteAddress(id)) {
            setAddresses([...mockAddresses]);
            toast.success("Xóa địa chỉ thành công!");
        }
    };

    const handleSetDefault = (id: number) => {
        updateAddress(id, { isDefault: true });
        setAddresses([...mockAddresses]);
        toast.success("Đã đặt làm địa chỉ mặc định!");
    };

    const handleEdit = (address: Address) => {
        setEditingId(address.id);
        setIsAdding(true);
        reset({
            fullName: address.fullName,
            phone: address.phone,
            address: address.address,
            ward: address.ward,
            district: address.district,
            city: address.city,
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        reset();
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Địa chỉ giao hàng</CardTitle>
                        <CardDescription>Quản lý địa chỉ nhận hàng của bạn</CardDescription>
                    </div>
                    {!isAdding && (
                        <Button onClick={() => setIsAdding(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm địa chỉ
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isAdding && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold">
                            {editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-medium">
                                    Họ và tên
                                </label>
                                <Input id="fullName" placeholder="Nguyễn Văn A" {...register("fullName")} />
                                {errors.fullName && (
                                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium">
                                    Số điện thoại
                                </label>
                                <Input id="phone" placeholder="0123456789" {...register("phone")} />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-medium">
                                Địa chỉ
                            </label>
                            <Input id="address" placeholder="123 Đường ABC" {...register("address")} />
                            {errors.address && (
                                <p className="text-sm text-destructive">{errors.address.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="ward" className="text-sm font-medium">
                                    Phường/Xã
                                </label>
                                <Input id="ward" placeholder="Phường 1" {...register("ward")} />
                                {errors.ward && (
                                    <p className="text-sm text-destructive">{errors.ward.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="district" className="text-sm font-medium">
                                    Quận/Huyện
                                </label>
                                <Input id="district" placeholder="Quận 1" {...register("district")} />
                                {errors.district && (
                                    <p className="text-sm text-destructive">{errors.district.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="city" className="text-sm font-medium">
                                    Tỉnh/Thành phố
                                </label>
                                <Input id="city" placeholder="Hồ Chí Minh" {...register("city")} />
                                {errors.city && (
                                    <p className="text-sm text-destructive">{errors.city.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit">
                                {editingId ? "Cập nhật" : "Thêm địa chỉ"}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Hủy
                            </Button>
                        </div>
                    </form>
                )}

                {addresses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Chưa có địa chỉ nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className={`p-4 border rounded-lg ${address.isDefault ? "border-primary bg-primary/5" : ""
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">{address.fullName}</h4>
                                            {address.isDefault && (
                                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {address.phone}
                                        </p>
                                        <p className="text-sm">
                                            {address.address}, {address.ward}, {address.district}, {address.city}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit(address)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {!address.isDefault && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSetDefault(address.id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(address.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
