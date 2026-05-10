"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, User, Edit, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Address } from "@/types/address";
import { cn } from "@/lib/utils";

interface AddressCardProps {
    address: Address;
    onEdit: (address: Address) => void;
    onDelete: (id: number) => void;
    onSetDefault: (id: number) => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const fullAddress = `${address.addressLine}, ${address.ward}, ${address.district}, ${address.province}`;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "bg-white rounded-lg border p-4 transition-all",
                    address.isDefault
                        ? "border-primary shadow-md"
                        : "border-gray-200 hover:border-primary/50 hover:shadow-sm"
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-2 rounded-lg",
                            address.isDefault ? "bg-primary/10" : "bg-gray-100"
                        )}>
                            <MapPin className={cn(
                                "h-5 w-5",
                                address.isDefault ? "text-primary" : "text-gray-600"
                            )} />
                        </div>
                        {address.isDefault && (
                            <Badge className="gap-1">
                                <Star className="h-3 w-3" />
                                Mặc định
                            </Badge>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(address)}
                            className="h-8 w-8 p-0"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Receiver Info */}
                <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{address.receiverName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{address.phone}</span>
                    </div>
                </div>

                {/* Address */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {fullAddress}
                </p>

                {/* Set Default Button */}
                {!address.isDefault && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetDefault(address.id)}
                        className="w-full gap-2"
                    >
                        <Star className="h-4 w-4" />
                        Đặt làm mặc định
                    </Button>
                )}
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa địa chỉ</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onDelete(address.id);
                                setShowDeleteDialog(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
