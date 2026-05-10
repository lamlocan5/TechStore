"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getProvinces, getDistricts, getWards } from "@/lib/api/location.service";
import type { GHNProvince, GHNDistrict, GHNWard } from "@/types/address";
import { Search } from "lucide-react";

interface LocationSelectProps {
    onProvinceChange?: (province: { id: number; name: string } | null) => void;
    onDistrictChange?: (district: { id: number; name: string } | null) => void;
    onWardChange?: (ward: { code: string; name: string } | null) => void;
    defaultProvinceId?: number;
    defaultDistrictId?: number;
    defaultWardCode?: string;
}

export function LocationSelect({
    onProvinceChange,
    onDistrictChange,
    onWardChange,
    defaultProvinceId,
    defaultDistrictId,
    defaultWardCode,
}: LocationSelectProps) {
    const [provinces, setProvinces] = useState<GHNProvince[]>([]);
    const [districts, setDistricts] = useState<GHNDistrict[]>([]);
    const [wards, setWards] = useState<GHNWard[]>([]);

    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(defaultProvinceId || null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(defaultDistrictId || null);
    const [selectedWardCode, setSelectedWardCode] = useState<string | null>(defaultWardCode || null);

    const [provinceSearch, setProvinceSearch] = useState("");
    const [districtSearch, setDistrictSearch] = useState("");
    const [wardSearch, setWardSearch] = useState("");

    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingWards, setIsLoadingWards] = useState(false);

    // Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setIsLoadingProvinces(true);
                const data = await getProvinces();
                setProvinces(data);
            } catch (error) {
                console.error("Failed to load provinces:", error);
            } finally {
                setIsLoadingProvinces(false);
            }
        };
        loadProvinces();
    }, []);

    // Load districts when province changes
    useEffect(() => {
        if (!selectedProvinceId) {
            setDistricts([]);
            setWards([]);
            setSelectedDistrictId(null);
            setSelectedWardCode(null);
            return;
        }

        const loadDistricts = async () => {
            try {
                setIsLoadingDistricts(true);
                const data = await getDistricts(selectedProvinceId);
                setDistricts(data);
                setWards([]);
                setSelectedWardCode(null);
            } catch (error) {
                console.error("Failed to load districts:", error);
            } finally {
                setIsLoadingDistricts(false);
            }
        };
        loadDistricts();
    }, [selectedProvinceId]);

    // Load wards when district changes
    useEffect(() => {
        if (!selectedDistrictId) {
            setWards([]);
            setSelectedWardCode(null);
            return;
        }

        const loadWards = async () => {
            try {
                setIsLoadingWards(true);
                const data = await getWards(selectedDistrictId);
                setWards(data);
            } catch (error) {
                console.error("Failed to load wards:", error);
            } finally {
                setIsLoadingWards(false);
            }
        };
        loadWards();
    }, [selectedDistrictId]);

    const handleProvinceChange = (value: string) => {
        const provinceId = parseInt(value);
        setSelectedProvinceId(provinceId);
        setSelectedDistrictId(null);
        setSelectedWardCode(null);

        const province = provinces.find((p) => p.ProvinceID === provinceId);
        onProvinceChange?.(province ? { id: province.ProvinceID, name: province.ProvinceName } : null);
        onDistrictChange?.(null);
        onWardChange?.(null);
    };

    const handleDistrictChange = (value: string) => {
        const districtId = parseInt(value);
        setSelectedDistrictId(districtId);
        setSelectedWardCode(null);

        const district = districts.find((d) => d.DistrictID === districtId);
        onDistrictChange?.(district ? { id: district.DistrictID, name: district.DistrictName } : null);
        onWardChange?.(null);
    };

    const handleWardChange = (value: string) => {
        setSelectedWardCode(value);

        const ward = wards.find((w) => w.WardCode === value);
        onWardChange?.(ward ? { code: ward.WardCode, name: ward.WardName } : null);
    };

    // Filter functions
    const filteredProvinces = provinces.filter((p) =>
        p.ProvinceName.toLowerCase().includes(provinceSearch.toLowerCase()) ||
        p.NameExtension.some(ext => ext.toLowerCase().includes(provinceSearch.toLowerCase()))
    );

    const filteredDistricts = districts.filter((d) =>
        d.DistrictName.toLowerCase().includes(districtSearch.toLowerCase()) ||
        d.NameExtension.some(ext => ext.toLowerCase().includes(districtSearch.toLowerCase()))
    );

    const filteredWards = wards.filter((w) =>
        w.WardName.toLowerCase().includes(wardSearch.toLowerCase()) ||
        w.NameExtension.some(ext => ext.toLowerCase().includes(wardSearch.toLowerCase()))
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Province Select */}
            <div>
                <Select
                    value={selectedProvinceId?.toString() || ""}
                    onValueChange={handleProvinceChange}
                    disabled={isLoadingProvinces}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Tỉnh/Thành phố"} />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm tỉnh/thành..."
                                    value={provinceSearch}
                                    onChange={(e) => setProvinceSearch(e.target.value)}
                                    className="pl-8 h-8"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredProvinces.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">Không tìm thấy</div>
                            ) : (
                                filteredProvinces.map((province) => (
                                    <SelectItem key={province.ProvinceID} value={province.ProvinceID.toString()}>
                                        {province.ProvinceName}
                                    </SelectItem>
                                ))
                            )}
                        </div>
                    </SelectContent>
                </Select>
            </div>

            {/* District Select */}
            <div>
                <Select
                    value={selectedDistrictId?.toString() || ""}
                    onValueChange={handleDistrictChange}
                    disabled={!selectedProvinceId || isLoadingDistricts}
                >
                    <SelectTrigger>
                        <SelectValue
                            placeholder={
                                isLoadingDistricts ? "Đang tải..." : !selectedProvinceId ? "Chọn tỉnh trước" : "Quận/Huyện"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm quận/huyện..."
                                    value={districtSearch}
                                    onChange={(e) => setDistrictSearch(e.target.value)}
                                    className="pl-8 h-8"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredDistricts.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">Không tìm thấy</div>
                            ) : (
                                filteredDistricts.map((district) => (
                                    <SelectItem key={district.DistrictID} value={district.DistrictID.toString()}>
                                        {district.DistrictName}
                                    </SelectItem>
                                ))
                            )}
                        </div>
                    </SelectContent>
                </Select>
            </div>

            {/* Ward Select */}
            <div>
                <Select
                    value={selectedWardCode || ""}
                    onValueChange={handleWardChange}
                    disabled={!selectedDistrictId || isLoadingWards}
                >
                    <SelectTrigger>
                        <SelectValue
                            placeholder={
                                isLoadingWards ? "Đang tải..." : !selectedDistrictId ? "Chọn quận trước" : "Phường/Xã"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm phường/xã..."
                                    value={wardSearch}
                                    onChange={(e) => setWardSearch(e.target.value)}
                                    className="pl-8 h-8"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredWards.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">Không tìm thấy</div>
                            ) : (
                                filteredWards.map((ward) => (
                                    <SelectItem key={ward.WardCode} value={ward.WardCode}>
                                        {ward.WardName}
                                    </SelectItem>
                                ))
                            )}
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
