import axios from "axios";
import type {
    GHNProvinceResponse,
    GHNDistrictResponse,
    GHNWardResponse,
} from "@/types/address";

const GHN_API_URL = "https://online-gateway.ghn.vn/shiip/public-api/master-data";
const GHN_TOKEN = process.env.NEXT_PUBLIC_GHN_TOKEN || ""; // Add to .env

// Create GHN client
const ghnClient = axios.create({
    baseURL: GHN_API_URL,
    headers: {
        "Content-Type": "application/json",
        "Token": GHN_TOKEN,
    },
});

/**
 * Get all provinces from GHN
 */
export const getProvinces = async () => {
    const response = await ghnClient.get<GHNProvinceResponse>("/province");
    return response.data.data;
};

/**
 * Get districts by province ID
 */
export const getDistricts = async (provinceId: number) => {
    const response = await ghnClient.get<GHNDistrictResponse>("/district", {
        params: { province_id: provinceId },
    });
    return response.data.data;
};

/**
 * Get wards by district ID
 */
export const getWards = async (districtId: number) => {
    const response = await ghnClient.get<GHNWardResponse>("/ward", {
        params: { district_id: districtId },
    });
    return response.data.data;
};
