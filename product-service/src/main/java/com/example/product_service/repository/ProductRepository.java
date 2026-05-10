package com.example.product_service.repository;

import com.example.product_service.entity.ProductEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    List<ProductEntity> findByNameContainingIgnoreCase(String name);
    Page<ProductEntity> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    /**
     * Search by name với fuzzy search - hỗ trợ typo tolerance
     * Ví dụ: "macbok" sẽ tìm được "macbook"
     */
    @Query("SELECT p FROM ProductEntity p WHERE " +
           "(:name IS NULL OR :name = '' OR " +
           "  LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
           "  LOWER(REPLACE(p.name, ' ', '')) LIKE LOWER(:fuzzyPattern)) AND " +
           "p.status = true " +
           "ORDER BY " +
           "  CASE WHEN LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) THEN 1 ELSE 2 END, " +
           "  p.createdAt DESC")
    Page<ProductEntity> searchByNameWithFuzzy(
        @Param("name") String name,
        @Param("fuzzyPattern") String fuzzyPattern,
        Pageable pageable
    );
    
    /**
     * Search products với filters: keyword (fuzzy search), price range, brand
     * - Fuzzy search: "macbok" sẽ tìm được "macbook" bằng cách tìm với pattern linh hoạt
     * - Có thể có cả 2 điều kiện (price + brand) hoặc không có điều kiện nào
     */
    @Query("SELECT p FROM ProductEntity p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "  LOWER(REPLACE(p.name, ' ', '')) LIKE LOWER(:fuzzyPattern)) AND " +
           "(:minPrice IS NULL OR (p.priceSale IS NOT NULL AND p.priceSale >= :minPrice)) AND " +
           "(:maxPrice IS NULL OR (p.priceSale IS NOT NULL AND p.priceSale <= :maxPrice)) AND " +
           "(:brandId IS NULL OR p.brand.id = :brandId) AND " +
           "p.status = true " +
           "ORDER BY " +
           "  CASE WHEN :keyword IS NOT NULL AND :keyword != '' AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 1 ELSE 2 END, " +
           "  p.createdAt DESC")
    Page<ProductEntity> searchProducts(
        @Param("keyword") String keyword,
        @Param("fuzzyPattern") String fuzzyPattern,
        @Param("minPrice") Long minPrice,
        @Param("maxPrice") Long maxPrice,
        @Param("brandId") Long brandId,
        Pageable pageable
    );

    /**
     * Search products với filters bao gồm categoryId
     * - Hỗ trợ tìm kiếm theo category (laptop, điện thoại, etc.)
     * - Fuzzy search cho keyword
     * - Filter theo price range, brand, category
     * - Sử dụng LEFT JOIN với categories (ManyToMany relationship)
     */
    @Query("SELECT DISTINCT p FROM ProductEntity p LEFT JOIN p.categories c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "  LOWER(REPLACE(p.name, ' ', '')) LIKE LOWER(:fuzzyPattern)) AND " +
           "(:minPrice IS NULL OR (p.priceSale IS NOT NULL AND p.priceSale >= :minPrice)) AND " +
           "(:maxPrice IS NULL OR (p.priceSale IS NOT NULL AND p.priceSale <= :maxPrice)) AND " +
           "(:brandId IS NULL OR p.brand.id = :brandId) AND " +
           "(:categoryId IS NULL OR c.id = :categoryId) AND " +
           "p.status = true " +
           "ORDER BY " +
           "  CASE WHEN :keyword IS NOT NULL AND :keyword != '' AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 1 ELSE 2 END, " +
           "  p.createdAt DESC")
    Page<ProductEntity> searchProductsWithCategory(
        @Param("keyword") String keyword,
        @Param("fuzzyPattern") String fuzzyPattern,
        @Param("minPrice") Long minPrice,
        @Param("maxPrice") Long maxPrice,
        @Param("brandId") Long brandId,
        @Param("categoryId") Long categoryId,
        Pageable pageable
    );


    @Query("SELECT p FROM ProductEntity p " +
            "WHERE p.brand.id = :brandId AND p.status = true " +
            "ORDER BY p.createdAt DESC")
    Page<ProductEntity> findByBrandId(@Param("brandId") Long brandId, Pageable pageable);
}
