// GHN Location Types
export interface GHNProvince {
    ProvinceID: number;
    ProvinceName: string;
    CountryID: number;
    Code: number;
    NameExtension: string[];
    IsEnable: number;
    RegionID: number;
    CanUpdateCOD: boolean;
    Status: number;
}

export interface GHNDistrict {
    DistrictID: number;
    ProvinceID: number;
    DistrictName: string;
    Code: number;
    Type: number;
    SupportType: number;
    NameExtension: string[];
    IsEnable: number;
    CanUpdateCOD: boolean;
    Status: number;
}

export interface GHNWard {
    WardCode: string;
    DistrictID: number;
    WardName: string;
    NameExtension: string[];
    CanUpdateCOD: boolean;
    SupportType: number;
    Status: number;
}

export interface GHNProvinceResponse {
    code: number;
    message: string;
    data: GHNProvince[];
}

export interface GHNDistrictResponse {
    code: number;
    message: string;
    data: GHNDistrict[];
}

export interface GHNWardResponse {
    code: number;
    message: string;
    data: GHNWard[];
}

// Update Address interface to include GHN IDs
export interface Address {
    id: number;
    userId: string;
    receiverName: string;
    phone: string;
    addressLine: string;
    province: string;
    district: string;
    ward: string;
    provinceId?: number;
    districtId?: number;
    wardCode?: string;
    isDefault: boolean;
}

export interface CreateAddressRequest {
    receiverName: string;
    phone: string;
    addressLine: string;
    province: string;
    district: string;
    ward: string;
    provinceId?: number;
    districtId?: number;
    wardCode?: string;
    isDefault?: boolean;
}

export interface UpdateAddressRequest {
    receiverName?: string;
    phone?: string;
    addressLine?: string;
    province?: string;
    district?: string;
    ward?: string;
    provinceId?: number;
    districtId?: number;
    wardCode?: string;
    isDefault?: boolean;
}
