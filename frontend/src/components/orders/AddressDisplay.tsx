"use client";

import { useEffect, useState } from "react";
import { getAddressById } from "@/lib/api/address.service";
import type { Address } from "@/types/address";
import { User, Phone, MapPin, Loader2 } from "lucide-react";

interface AddressDisplayProps {
    addressId: number;
    compact?: boolean;
}

export function AddressDisplay({ addressId, compact = false }: AddressDisplayProps) {
    const [address, setAddress] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                setIsLoading(true);
                const data = await getAddressById(addressId);
                setAddress(data);
            } catch (err) {
                setError("Không thể tải địa chỉ");
            } finally {
                setIsLoading(false);
            }
        };

        if (addressId) {
            fetchAddress();
        }
    }, [addressId]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Đang tải địa chỉ...</span>
            </div>
        );
    }

    if (error || !address) {
        return (
            <p className="text-sm text-gray-500">Địa chỉ ID: {addressId}</p>
        );
    }

    const fullAddress = [
        address.addressLine,
        address.ward,
        address.district,
        address.province,
    ].filter(Boolean).join(", ");

    if (compact) {
        return (
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                    {address.receiverName} • {address.phone}
                </p>
                <p className="text-sm text-gray-600">{fullAddress}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Receiver Info */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-gray-900">
                        {address.receiverName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm text-gray-700">
                        {address.phone}
                    </span>
                </div>
            </div>

            {/* Full Address */}
            <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{fullAddress}</p>
            </div>
        </div>
    );
}
