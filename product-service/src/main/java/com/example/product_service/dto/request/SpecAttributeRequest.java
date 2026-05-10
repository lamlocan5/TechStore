package com.example.product_service.dto.request;

import com.example.product_service.entity.SpecAttributeEntity.DataType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpecAttributeRequest {
    String keyName;
    String label;
    DataType dataType;
    Boolean searchable;
    Boolean facetable;
}
