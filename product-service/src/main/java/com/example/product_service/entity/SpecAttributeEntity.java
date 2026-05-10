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
@Table(name = "spec_attributes")
public class SpecAttributeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "key_name", unique = true, nullable = false)
    String keyName;

    @Column(nullable = false)
    String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false)
    DataType dataType;

    Boolean searchable;
    Boolean facetable;

    public enum DataType {
        TEXT, INT, DECIMAL, BOOL
    }
}
