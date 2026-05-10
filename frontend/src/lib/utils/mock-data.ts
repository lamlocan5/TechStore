import type { Address } from "@/types";

// Mock addresses since there's no Address API
export const mockAddresses: Address[] = [
    {
        id: 1,
        userId: "user-id-123",
        fullName: "Nguyễn Văn A",
        phone: "0123456789",
        address: "123 Đường Nguyễn Huệ",
        ward: "Phường Bến Nghé",
        district: "Quận 1",
        city: "Hồ Chí Minh",
        isDefault: true,
    },
    {
        id: 2,
        userId: "user-id-123",
        fullName: "Nguyễn Văn A",
        phone: "0987654321",
        address: "456 Đường Lê Lợi",
        ward: "Phường Bến Thành",
        district: "Quận 1",
        city: "Hồ Chí Minh",
        isDefault: false,
    },
];

// Address service functions using mock data
export function getAddressesByUserId(userId: string): Address[] {
    return mockAddresses.filter(addr => addr.userId === userId);
}

export function getDefaultAddress(userId: string): Address | undefined {
    return mockAddresses.find(addr => addr.userId === userId && addr.isDefault);
}

export function getAddressById(id: number): Address | undefined {
    return mockAddresses.find(addr => addr.id === id);
}

export function addAddress(address: Omit<Address, "id">): Address {
    const newAddress: Address = {
        ...address,
        id: Math.max(...mockAddresses.map(a => a.id), 0) + 1,
    };

    // If this is set as default, unset other defaults for this user
    if (newAddress.isDefault) {
        mockAddresses.forEach(addr => {
            if (addr.userId === newAddress.userId) {
                addr.isDefault = false;
            }
        });
    }

    mockAddresses.push(newAddress);
    return newAddress;
}

export function updateAddress(id: number, updates: Partial<Address>): Address | undefined {
    const index = mockAddresses.findIndex(addr => addr.id === id);
    if (index === -1) return undefined;

    // If setting as default, unset other defaults for this user
    if (updates.isDefault) {
        mockAddresses.forEach(addr => {
            if (addr.userId === mockAddresses[index].userId) {
                addr.isDefault = false;
            }
        });
    }

    mockAddresses[index] = { ...mockAddresses[index], ...updates };
    return mockAddresses[index];
}

export function deleteAddress(id: number): boolean {
    const index = mockAddresses.findIndex(addr => addr.id === id);
    if (index === -1) return false;

    mockAddresses.splice(index, 1);
    return true;
}
