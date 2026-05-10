import type { Province, District, Ward } from "@/types/address";

/**
 * Format location name for display
 * If name is just a number, prepend the type
 * Examples:
 * - "1" + "Quận" → "Quận 1"
 * - "2" + "Phường" → "Phường 2"
 * - "Ba Đình" + "Quận" → "Ba Đình" (unchanged)
 */
export function formatLocationName(name: string, type: string): string {
    // Check if name is just a number
    if (/^\d+$/.test(name.trim())) {
        return `${type} ${name}`;
    }
    return name;
}

/**
 * Format province for display
 */
export function formatProvince(province: Province): Province {
    return {
        ...province,
        name: formatLocationName(province.name, province.type),
    };
}

/**
 * Format district for display
 */
export function formatDistrict(district: District): District {
    return {
        ...district,
        name: formatLocationName(district.name, district.type),
    };
}

/**
 * Format ward for display
 */
export function formatWard(ward: Ward): Ward {
    return {
        ...ward,
        name: formatLocationName(ward.name, ward.type),
    };
}

/**
 * Format array of locations
 */
export function formatProvinces(provinces: Province[]): Province[] {
    return provinces.map(formatProvince);
}

export function formatDistricts(districts: District[]): District[] {
    return districts.map(formatDistrict);
}

export function formatWards(wards: Ward[]): Ward[] {
    return wards.map(formatWard);
}
