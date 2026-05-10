"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, User, Phone } from "lucide-react";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { createAddress, updateAddress } from "@/lib/api/address.service";
import type { Address, CreateAddressRequest } from "@/types/address";
import { toast } from "sonner";

interface AddressFormProps {
    address?: Address;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<{ id: number; name: string } | null>(
        address ? { id: address.provinceId || 0, name: address.province } : null
    );
    const [selectedDistrict, setSelectedDistrict] = useState<{ id: number; name: string } | null>(
        address ? { id: address.districtId || 0, name: address.district } : null
    );
    const [selectedWard, setSelectedWard] = useState<{ code: string; name: string } | null>(
        address ? { code: address.wardCode || "", name: address.ward } : null
    );

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateAddressRequest>({
        defaultValues: address
            ? {
                receiverName: address.receiverName,
                phone: address.phone,
                addressLine: address.addressLine,
                isDefault: address.isDefault,
            }
            : undefined,
    });

    const onSubmit = async (data: CreateAddressRequest) => {
        if (!selectedProvince || !selectedDistrict || !selectedWard) {
            toast.error("Vui lòng chọn đầy đủ địa chỉ");
            return;
        }

        try {
            setIsSubmitting(true);

            const addressData = {
                ...data,
                province: selectedProvince.name,
                district: selectedDistrict.name,
                ward: selectedWard.name,
                provinceId: selectedProvince.id,
                districtId: selectedDistrict.id,
                wardCode: selectedWard.code,
                isDefault: data.isDefault || false,
            };

            if (address) {
                await updateAddress(address.id, addressData);
                toast.success("Cập nhật địa chỉ thành công");
            } else {
                await createAddress(addressData);
                toast.success("Thêm địa chỉ thành công");
            }

            onSuccess();
        } catch (error: any) {
            console.error("Address form error:", error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Receiver Name */}
            <div>
                <Label htmlFor="receiverName" className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Họ và tên người nhận
                </Label>
                <Input
                    id="receiverName"
                    {...register("receiverName", { required: "Vui lòng nhập tên người nhận" })}
                    placeholder="Nguyễn Văn A"
                />
                {errors.receiverName && (
                    <p className="text-sm text-red-600 mt-1">{errors.receiverName.message}</p>
                )}
            </div>

            {/* Phone */}
            <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                </Label>
                <Input
                    id="phone"
                    {...register("phone", {
                        required: "Vui lòng nhập số điện thoại",
                        pattern: {
                            value: /^0[0-9]{9}$/,
                            message: "Số điện thoại phải có 10 số và bắt đầu bằng 0",
                        },
                    })}
                    placeholder="0912345678"
                    maxLength={10}
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Location Selects */}
            <div>
                <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Tỉnh/Thành phố, Quận/Huyện, Phường/Xã
                </Label>
                <LocationSelect
                    onProvinceChange={setSelectedProvince}
                    onDistrictChange={setSelectedDistrict}
                    onWardChange={setSelectedWard}
                    defaultProvinceId={address?.provinceId}
                    defaultDistrictId={address?.districtId}
                    defaultWardCode={address?.wardCode}
                />
            </div>

            {/* Address Line */}
            <div>
                <Label htmlFor="addressLine" className="mb-2 block">
                    Địa chỉ cụ thể
                </Label>
                <Input
                    id="addressLine"
                    {...register("addressLine", { required: "Vui lòng nhập địa chỉ cụ thể" })}
                    placeholder="Số nhà, tên đường..."
                />
                {errors.addressLine && (
                    <p className="text-sm text-red-600 mt-1">{errors.addressLine.message}</p>
                )}
            </div>

            {/* Set as Default */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isDefault"
                    {...register("isDefault")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                    Đặt làm địa chỉ mặc định
                </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Hủy
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || !selectedProvince || !selectedDistrict || !selectedWard}
                    className="flex-1"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {address ? "Đang cập nhật..." : "Đang lưu..."}
                        </>
                    ) : address ? (
                        "Cập nhật"
                    ) : (
                        "Lưu địa chỉ"
                    )}
                </Button>
            </div>
        </form>
    );
}
