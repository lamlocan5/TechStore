package com.example.profile.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressRequest {
    String userId;
    String receiverName;
    String phone;
    String addressLine;
    Boolean isDefault;
    String province;
    String district;
    String ward;
}
