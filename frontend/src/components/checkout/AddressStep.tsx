"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAddressStore } from "@/lib/store/address.store";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Check, Home, Phone, User, MapPinned, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Address } from "@/types/address";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddressForm } from "@/components/profile/AddressForm";
import { Badge } from "@/components/ui/badge";

interface AddressStepProps {
    selectedAddressId: number | null;
    onSelectAddress: (addressId: number) => void;
}

export function AddressStep({ selectedAddressId, onSelectAddress }: AddressStepProps) {
    const router = useRouter();
    const { addresses, fetchAddresses, isLoading } = useAddressStore();
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    // Handle successful address addition
    const handleAddressSuccess = async () => {
        setShowAddForm(false);
        await fetchAddresses(); // Refresh the addresses list
    };

    // Auto-select default address if none selected
    useEffect(() => {
        if (!selectedAddressId && addresses.length > 0) {
            const defaultAddress = addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                onSelectAddress(defaultAddress.id);
            } else {
                onSelectAddress(addresses[0].id);
            }
        }
    }, [addresses, selectedAddressId, onSelectAddress]);

    const formatAddress = (address: Address) => {
        return [
            address.addressLine,
            address.ward,
            address.district,
            address.province
        ].filter(Boolean).join(", ");
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8">
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-2 border-gray-200 rounded-xl p-6 animate-pulse"
                        >
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    if (addresses.length === 0) {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-gray-200 shadow-lg p-16"
                >
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-100 rounded-full mb-6"
                        >
                            <MapPin className="h-10 w-10 text-primary" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Chưa có địa chỉ giao hàng</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Vui lòng thêm địa chỉ nhận hàng để chúng tôi có thể giao sản phẩm đến bạn
                        </p>
                        <Button onClick={() => setShowAddForm(true)} size="lg" className="gap-2 h-12 px-8 shadow-lg">
                            <Plus className="h-5 w-5" />
                            Thêm địa chỉ mới
                        </Button>
                    </div>
                </motion.div>

                {/* Add Address Dialog - IMPORTANT: Must be included here too! */}
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Thêm địa chỉ mới</DialogTitle>
                        </DialogHeader>
                        <AddressForm
                            onSuccess={handleAddressSuccess}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl">
                            <MapPinned className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Chọn địa chỉ nhận hàng của bạn</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowAddForm(true)}
                        className="gap-2 border-2 hover:border-primary hover:bg-primary/5"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Thêm địa chỉ</span>
                    </Button>
                </div>
            </motion.div>

            {/* Address List */}
            <RadioGroup value={selectedAddressId?.toString() || ""} onValueChange={(value) => onSelectAddress(parseInt(value))}>
                <div className="space-y-4">
                    <AnimatePresence>
                        {addresses.map((address, index) => {
                            const isSelected = selectedAddressId === address.id;

                            return (
                                <motion.div
                                    key={address.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.01 }}
                                    className={cn(
                                        "bg-white rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden",
                                        isSelected
                                            ? "border-primary shadow-lg ring-4 ring-primary/10"
                                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                    )}
                                    onClick={() => onSelectAddress(address.id)}
                                >
                                    {/* Selected Indicator Bar */}
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            className="h-1.5 bg-gradient-to-r from-primary to-blue-600"
                                        />
                                    )}

                                    <div className="p-4">
                                        <div className="flex items-start gap-4">
                                            <RadioGroupItem
                                                value={address.id.toString()}
                                                id={`address-${address.id}`}
                                                className="mt-1.5"
                                            />

                                            {/* Address Type Icon */}
                                            <div className={cn(
                                                "p-3 rounded-xl border-2 transition-all",
                                                isSelected
                                                    ? "bg-gradient-to-br from-primary/10 to-blue-100 border-primary/30"
                                                    : "bg-gray-50 border-gray-200"
                                            )}>
                                                <Home className={cn("h-5 w-5", isSelected ? "text-primary" : "text-gray-600")} />
                                            </div>

                                            {/* Address Details */}
                                            <div className="flex-1 min-w-0">
                                                {/* Name and Default Badge */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Label
                                                        htmlFor={`address-${address.id}`}
                                                        className="text-base font-bold cursor-pointer text-gray-900"
                                                    >
                                                        {address.receiverName}
                                                    </Label>
                                                    {address.isDefault && (
                                                        <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Mặc định
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Phone Number */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                                        <Phone className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {address.phone}
                                                    </span>
                                                </div>

                                                {/* Full Address */}
                                                <div className="flex items-start gap-2">
                                                    <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
                                                        <MapPin className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed flex-1">
                                                        {formatAddress(address)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Selected Check Icon */}
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring" }}
                                                    className="flex-shrink-0"
                                                >
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                                        <Check className="h-6 w-6 text-white" strokeWidth={3} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </RadioGroup>

            {/* Add Address Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Thêm địa chỉ mới</DialogTitle>
                    </DialogHeader>
                    <AddressForm
                        onSuccess={handleAddressSuccess}
                        onCancel={() => setShowAddForm(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
