package com.example.product_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "variant_specs")
public class VariantSpecEntity {

    @Id
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    ProductVariantEntity productVariant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spec_attribute_id", nullable = false)
    SpecAttributeEntity specAttribute;

    @Lob
    String value;
}
