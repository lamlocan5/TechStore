package com.example.product_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_variants")
public class ProductVariantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    ProductEntity product;

    @Column(unique = true)
    String sku;

    String color;
    
    @Column(name = "ram_gb")
    Integer ramGb;
    
    @Column(name = "storage_gb")
    Integer storageGb;
    
    @Column(name = "cpu_model")
    String cpuModel;
    
    String igpu;
    
    @Column(name = "gpu_model")
    String gpuModel;
    
    @Column(name = "chipset_model")
    String chipsetModel;
    
    String os;

    @Column(name = "price_list")
    Long priceList;
    
    @Column(name = "price_sale")
    Long priceSale;
    
    Integer stock;

    @Column(name = "allow_preorder")
    Boolean allowPreorder;
    
    @Column(name = "weightg")
    Integer weightG;

    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @OneToMany(mappedBy = "productVariant", cascade = CascadeType.ALL, orphanRemoval = true)
    List<VariantSpecEntity> specs;
}
