"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AddressCard } from "@/components/profile/AddressCard";
import { AddressForm } from "@/components/profile/AddressForm";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getMyAddresses, deleteAddress, setDefaultAddress } from "@/lib/api/address.service";
import type { Address } from "@/types/address";
import toast from "react-hot-toast";

export function AddressList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | undefined>();
    const queryClient = useQueryClient();

    // Fetch addresses
    const { data: addresses, isLoading } = useQuery({
        queryKey: ["my-addresses"],
        queryFn: getMyAddresses,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
            toast.success("Xóa địa chỉ thành công!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Xóa địa chỉ thất bại!");
        },
    });

    // Set default mutation
    const setDefaultMutation = useMutation({
        mutationFn: setDefaultAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
            toast.success("Đã đặt làm địa chỉ mặc định!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Đặt địa chỉ mặc định thất bại!");
        },
    });

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingAddress(undefined);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingAddress(undefined);
        queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingAddress(undefined);
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
                    >
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Add Button */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Button
                        onClick={handleAddNew}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Thêm địa chỉ mới
                    </Button>
                </motion.div>

                {/* Addresses Grid */}
                {addresses && addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address, index) => (
                            <motion.div
                                key={address.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <AddressCard
                                    address={address}
                                    onEdit={handleEdit}
                                    onDelete={(id) => deleteMutation.mutate(id)}
                                    onSetDefault={(id) => setDefaultMutation.mutate(id)}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg border border-gray-200 p-12 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Chưa có địa chỉ nào
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Thêm địa chỉ để sử dụng khi đặt hàng
                        </p>
                        <Button onClick={handleAddNew} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm địa chỉ đầu tiên
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                        </DialogTitle>
                    </DialogHeader>
                    <AddressForm
                        address={editingAddress}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
