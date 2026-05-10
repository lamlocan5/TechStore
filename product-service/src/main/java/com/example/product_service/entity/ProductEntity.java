package com.example.product_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "product_categories",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    List<CategoryEntity> categories = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    BrandEntity brand;

    @Column(nullable = false, length = 255)
    String name;

    @Column(length = 255)
    String slug;

    @Column(name = "short_description", columnDefinition = "LONGTEXT")
    String shortDescription;

    @Column(columnDefinition = "LONGTEXT")
    String description;

    @Column(name = "price_list")
    Long priceList;

    @Column(name = "price_sale")
    Long priceSale;

    @Column(length = 255)
    String avatar;

    @Column(columnDefinition = "JSON")
    String images; // dạng JSON string

    @Column(nullable = false)
    Boolean status;

    @Column(name = "first_image", length = 255)
    String firstImage;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
