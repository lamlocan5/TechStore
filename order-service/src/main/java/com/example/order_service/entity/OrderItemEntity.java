package com.example.order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    OrderEntity order;

    @Column(name = "product_id", nullable = false)
    Long productId;

    @Column(name = "variant_id")
    Long variantId;

    @Column(name = "product_name", nullable = false)
    String productName;

    @Column(length = 64)
    String sku;

    @Column(name = "attributes_name")
    String attributesName;

    @Column(nullable = false)
    Integer quantity;

    @Column(nullable = false)
    Long price;

    @Column(nullable = false)
    Long total;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

