package com.example.order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "order_statuses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderStatusEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 50)
    String code; // PENDING, PAID, SHIPPING, etc.

    @Column(nullable = false, length = 100)
    String name; // Đang chờ, Đã thanh toán, Đang giao hàng, etc.

    @Column(length = 500)
    String description;

    @Column(length = 20)
    String color; // Hex color for UI display

    @Column(nullable = false)
    Integer displayOrder = 0; // Order for display

    @Column(nullable = false)
    Boolean isActive = true; // Whether this status is active

    @Column(nullable = false)
    Boolean isDefault = false; // Whether this is default status for new orders
}

