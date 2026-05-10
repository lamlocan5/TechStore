package com.example.product_service.dto.response;

import com.example.product_service.entity.SpecAttributeEntity.DataType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpecAttributeResponse {
    Long id;
    String keyName;
    String label;
    DataType dataType;
    Boolean searchable;
    Boolean facetable;
}
