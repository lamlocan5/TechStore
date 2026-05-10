package com.example.profile.mapper;

import org.mapstruct.Mapper;

import com.example.profile.dto.request.AddressRequest;
import com.example.profile.dto.response.AddressResponse;
import com.example.profile.entity.Address;

@Mapper(componentModel = "spring")
public interface AddressMapper {
    Address toAddress(AddressRequest request);

    AddressResponse toAddressResponse(Address entity);
}
