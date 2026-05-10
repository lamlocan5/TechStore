package com.example.order_service.service;

import com.example.order_service.client.ProductServiceClient;
import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.dto.request.OrderItemRequest;
import com.example.order_service.dto.request.OrderRequest;
import com.example.order_service.dto.response.OrderItemResponse;
import com.example.order_service.dto.response.OrderResponse;
import com.example.order_service.dto.response.RevenueStatisticsResponse;
import com.example.order_service.dto.response.SalesStatisticsResponse;
import com.example.order_service.dto.response.VariantSoldDataResponse;
import com.example.order_service.entity.OrderEntity;
import com.example.order_service.entity.OrderItemEntity;
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.entity.VoucherUsageEntity;
import com.example.order_service.enums.OrderStatus;
import com.example.order_service.enums.OrderType;
import com.example.order_service.enums.PaymentMethod;
import com.example.order_service.enums.PaymentStatus;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.OrderItemRepository;
import com.example.order_service.repository.OrderRepository;
import com.example.order_service.repository.VoucherUsageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final VoucherService voucherService;
    private final VoucherUsageRepository voucherUsageRepository;
    private final ProductServiceClient productServiceClient;
    private final IdentityServiceClient identityServiceClient;
    private final UserVoucherService userVoucherService;

    private OrderItemResponse mapItemToResponse(OrderItemEntity entity) {
        return OrderItemResponse.builder()
                .id(entity.getId())
                .orderId(entity.getOrder().getId())
                .productId(entity.getProductId())
                .variantId(entity.getVariantId())
                .productName(entity.getProductName())
                .sku(entity.getSku())
                .attributesName(entity.getAttributesName())
                .quantity(entity.getQuantity())
                .price(entity.getPrice())
                .total(entity.getTotal())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private OrderResponse mapToResponse(OrderEntity entity) {
        List<OrderItemResponse> items = entity.getItems() != null
                ? entity.getItems().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList())
                : new ArrayList<>();

        return OrderResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .addressId(entity.getAddressId())
                .voucherId(entity.getVoucherId())
                .orderType(entity.getOrderType())
                .status(entity.getStatus())
                .paymentMethod(entity.getPaymentMethod())
                .paymentStatus(entity.getPaymentStatus())
                .subtotal(entity.getSubtotal())
                .discount(entity.getDiscount())
                .shippingFee(entity.getShippingFee())
                .total(entity.getTotal())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .paidAt(entity.getPaidAt())
                .shippedAt(entity.getShippedAt())
                .completedAt(entity.getCompletedAt())
                .cancelledAt(entity.getCancelledAt())
                .items(items)
                .build();
    }

    public OrderResponse createOrder(String userId, OrderRequest request) {
        // Xác định đây có phải yêu cầu đặt trước (preorder) hay không
        boolean isPreorderRequest = Boolean.TRUE.equals(request.getPreorder());

        // Với đơn NORMAL cần kiểm tra đủ tồn kho trước khi tạo
        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getVariantId() == null) {
                throw new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND);
            }

            boolean inStock = productServiceClient.checkStockAvailability(
                    itemReq.getVariantId(),
                    itemReq.getQuantity()
            );

            // NORMAL yêu cầu đủ hàng; PREORDER cho phép hết hàng
            if (!inStock && !isPreorderRequest) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        // Tính subtotal từ các item
        long subtotal = 0;
        List<OrderItemEntity> itemEntities = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            long itemTotal = itemReq.getPrice() * itemReq.getQuantity();
            subtotal += itemTotal;

            OrderItemEntity item = OrderItemEntity.builder()
                    .productId(itemReq.getProductId())
                    .variantId(itemReq.getVariantId())
                    .productName(itemReq.getProductName())
                    .sku(itemReq.getSku())
                    .attributesName(itemReq.getAttributesName())
                    .quantity(itemReq.getQuantity())
                    .price(itemReq.getPrice())
                    .total(itemTotal)
                    .build();
            itemEntities.add(item);
        }

        // Áp dụng voucher nếu có
        long discount = 0;
        Long voucherId = null;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isEmpty()) {
            VoucherEntity voucher = voucherService.validateVoucher(
                    request.getVoucherCode(),
                    userId,
                    subtotal
            );
            discount = voucherService.calculateDiscount(voucher, subtotal);
            voucherId = voucher.getId();
        }

        // Tính tổng cuối cùng
        long shippingFee = request.getShippingFee() != null ? request.getShippingFee() : 0L;
        long total = subtotal - discount + shippingFee;

        // Khởi tạo entity đơn hàng
        OrderType orderType = isPreorderRequest ? OrderType.PREORDER : OrderType.NORMAL;

        OrderEntity order = OrderEntity.builder()
                .userId(userId)
                .addressId(request.getAddressId())
                .voucherId(voucherId)
                .orderType(orderType)
                .status(OrderStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.UNPAID)
                .subtotal(subtotal)
                .discount(discount)
                .shippingFee(shippingFee)
                .total(total)
                .note(request.getNote())
                .items(new ArrayList<>())
                .build();

        // Gắn item vào đơn
        for (OrderItemEntity item : itemEntities) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        OrderEntity savedOrder = orderRepository.save(order);

        // Giữ tồn kho (trừ kho) chỉ với đơn NORMAL; PREORDER sẽ giao sau khi có hàng
        if (orderType == OrderType.NORMAL) {
            for (OrderItemEntity item : savedOrder.getItems()) {
                if (item.getVariantId() != null) {
                    productServiceClient.reserveStock(item.getVariantId(), item.getQuantity());
                }
            }
        }

        // Ghi nhận sử dụng voucher nếu có
        if (voucherId != null) {
            VoucherUsageEntity usage = VoucherUsageEntity.builder()
                    .voucherId(voucherId)
                    .userId(userId)
                    .orderId(savedOrder.getId())
                    .usedAt(LocalDateTime.now())
                    .build();
            voucherUsageRepository.save(usage);

            // Đánh dấu voucher trong ví người dùng đã được sử dụng (nếu tồn tại)
            try {
                userVoucherService.markVoucherUsed(userId, voucherId);
            } catch (Exception e) {
                // Không chặn quy trình order nếu có lỗi trong ví voucher
            }
        }

        return mapToResponse(savedOrder);
    }

    public OrderResponse getOrderById(Long id) {
        OrderEntity entity = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return mapToResponse(entity);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    public Page<OrderResponse> getOrdersByType(OrderType orderType, Pageable pageable) {
        return orderRepository.findByOrderType(orderType, pageable)
                .map(this::mapToResponse);
    }

    public List<OrderResponse> getOrdersByUserId(String userId) {
        return orderRepository.findByUserId(userId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<OrderResponse> getOrdersByUserId(String userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable)
                .map(this::mapToResponse);
    }

    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<OrderResponse> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable)
                .map(this::mapToResponse);
    }

    public List<OrderResponse> getOrdersByUserIdAndStatus(String userId, OrderStatus status) {
        return orderRepository.findByUserIdAndStatus(userId, status)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<OrderResponse> getOrdersByUserIdAndStatus(String userId, OrderStatus status, Pageable pageable) {
        return orderRepository.findByUserIdAndStatus(userId, status, pageable)
                .map(this::mapToResponse);
    }

    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderStatus oldStatus = order.getStatus();

        // Kiểm tra chuyển trạng thái hợp lệ
        validateStatusTransition(oldStatus, newStatus);

        order.setStatus(newStatus);

        // Ghi nhận mốc thời gian tương ứng trạng thái
        LocalDateTime now = LocalDateTime.now();
        switch (newStatus) {
            case PAID:
                // Khi chuyển sang PAID, cập nhật payment status và paidAt nếu chưa có
                if (order.getPaidAt() == null) {
                    order.setPaidAt(now);
                }
                if (order.getPaymentStatus() != PaymentStatus.PAID) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                }
                break;
            case SHIPPING:
                if (order.getShippedAt() == null) {
                    order.setShippedAt(now);
                }
                break;
            case COMPLETED:
                if (order.getCompletedAt() == null) {
                    order.setCompletedAt(now);
                    // Chỉ tính total_spent khi đơn hàng lần đầu chuyển sang COMPLETED
                    // (tránh tính lại nếu đơn đã COMPLETED rồi)
                    // Khi đơn hoàn thành: cộng dồn total_spent cho user để cập nhật rank
                    try {
                        identityServiceClient.addTotalSpent(order.getUserId(), order.getTotal());
                    } catch (Exception e) {
                        // log nhưng không chặn cập nhật trạng thái đơn hàng
                        log.error("Error adding total spent for user {} when order {} completed: {}",
                                order.getUserId(), order.getId(), e.getMessage());
                    }
                }
                break;
            case CANCELLED:
                order.setCancelledAt(now);
                // Trả lại tồn kho khi hủy đơn NORMAL
                if (order.getOrderType() == OrderType.NORMAL) {
                    for (OrderItemEntity item : order.getItems()) {
                        if (item.getVariantId() != null) {
                            try {
                                productServiceClient.releaseStock(item.getVariantId(), item.getQuantity());
                            } catch (Exception e) {
                                // Log error but continue with cancellation
                            }
                        }
                    }
                }
                break;
        }

        return mapToResponse(orderRepository.save(order));
    }

    /**
     * Kiểm tra tính hợp lệ của việc chuyển trạng thái đơn hàng.
     */
    private void validateStatusTransition(OrderStatus oldStatus, OrderStatus newStatus) {
        // Trạng thái kết thúc
        if (oldStatus == OrderStatus.COMPLETED) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL_COMPLETED);
        }
        if (oldStatus == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        boolean allowed = switch (oldStatus) {
            case PENDING -> (newStatus == OrderStatus.PAID || newStatus == OrderStatus.CANCELLED);
            case PAID -> (newStatus == OrderStatus.SHIPPING || newStatus == OrderStatus.CANCELLED);
            case SHIPPING -> (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.CANCELLED);
            default -> false;
        };

        if (!allowed) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }
    }

    public OrderResponse updatePaymentStatus(Long id, PaymentStatus newStatus) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        PaymentStatus oldPaymentStatus = order.getPaymentStatus();
        order.setPaymentStatus(newStatus);

        LocalDateTime now = LocalDateTime.now();

        // Xử lý khi thanh toán thành công
        if (newStatus == PaymentStatus.PAID && oldPaymentStatus != PaymentStatus.PAID) {
            order.setPaidAt(now);

            // Tự động chuyển trạng thái đơn hàng từ PENDING sang PAID khi thanh toán thành công
            // Áp dụng cho cả online payment và COD (khi admin xác nhận thanh toán)
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.PAID);
            }
        }

        // Xử lý khi hoàn tiền
        if (newStatus == PaymentStatus.REFUNDED) {
            // Trả lại tồn kho khi hoàn tiền (chỉ đơn NORMAL)
            if (order.getOrderType() == OrderType.NORMAL) {
                for (OrderItemEntity item : order.getItems()) {
                    if (item.getVariantId() != null) {
                        try {
                            productServiceClient.releaseStock(item.getVariantId(), item.getQuantity());
                        } catch (Exception e) {
                            // Log error but continue
                        }
                    }
                }
            }
        }

        return mapToResponse(orderRepository.save(order));
    }

    public void cancelOrder(Long id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Không thể hủy đơn hàng đã hoàn thành hoặc đã bị hủy
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL_COMPLETED);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        // Sử dụng updateOrderStatus để xử lý logic hủy đơn (bao gồm release stock)
        updateOrderStatus(id, OrderStatus.CANCELLED);
    }

    /**
     * Lấy thống kê bán hàng: tổng số lượng đã bán và tổng đơn COMPLETED.
     *
     * @return SalesStatisticsResponse với totalSold (tổng số lượng) và totalOrders (số đơn hoàn tất)
     */
    public SalesStatisticsResponse getSalesStatistics() {
        Long totalSold = orderItemRepository.sumQuantityFromCompletedOrders();
        Long totalOrders = orderRepository.countByStatus(OrderStatus.COMPLETED);

        return SalesStatisticsResponse.builder()
                .totalSold(totalSold != null ? totalSold : 0L)
                .totalOrders(totalOrders)
                .build();
    }

    /**
     * Lấy số lượng bán theo variantId từ các đơn đã hoàn tất.
     *
     * @return VariantSoldDataResponse chứa map variantId -> tổng số lượng
     */
    public VariantSoldDataResponse getVariantSoldData() {
        List<Object[]> results = orderItemRepository.getSoldQuantitiesByVariantId();
        Map<Long, Long> soldDataMap = new HashMap<>();

        for (Object[] result : results) {
            Long variantId = ((Number) result[0]).longValue();
            Long totalQuantity = ((Number) result[1]).longValue();
            soldDataMap.put(variantId, totalQuantity);
        }

        return VariantSoldDataResponse.builder()
                .soldData(soldDataMap)
                .build();
    }

    /**
     * Kiểm tra xem user đã mua sản phẩm (có order COMPLETED với productId này) chưa
     *
     * @param userId    ID của user
     * @param productId ID của sản phẩm
     * @return true nếu user đã mua sản phẩm, false nếu chưa
     */
    public boolean hasUserPurchasedProduct(String userId, Long productId) {
        return orderItemRepository.hasUserPurchasedProduct(userId, productId);
    }

    /**
     * Lấy thống kê doanh thu theo tháng/quý/năm
     *
     * @param period "month" | "quarter" | "year"
     * @param year   Năm cần thống kê
     * @param month  Tháng (chỉ khi period = "month")
     * @return RevenueStatisticsResponse
     */
    public RevenueStatisticsResponse getRevenueStatistics(String period, int year, Integer month) {
        List<OrderEntity> completedOrders = orderRepository.findByStatusAndYearAndMonth(
                OrderStatus.COMPLETED, year, month);

        long totalRevenue = 0;
        int totalItems = 0;
        Map<String, RevenueStatisticsResponse.PeriodRevenueDetail> periodMap = new HashMap<>();
        Map<Long, RevenueStatisticsResponse.TopProductInfo> productMap = new LinkedHashMap<>();

        for (OrderEntity order : completedOrders) {
            totalRevenue += order.getTotal();
            int orderItemCount = 0;

            for (OrderItemEntity item : order.getItems()) {
                int itemQty = item.getQuantity();
                totalItems += itemQty;
                orderItemCount += itemQty;

                // Aggregate by product (variant)
                Long variantId = item.getVariantId();
                String variantDisplayName = item.getProductName();
                if (item.getAttributesName() != null && !item.getAttributesName().isEmpty()) {
                    variantDisplayName += " (" + item.getAttributesName() + ")";
                }
                
                productMap.putIfAbsent(variantId, RevenueStatisticsResponse.TopProductInfo.builder()
                        .productId(variantId)
                        .productName(variantDisplayName)
                        .sku(item.getSku())
                        .quantity(0)
                        .revenue(0L)
                        .build());

                RevenueStatisticsResponse.TopProductInfo product = productMap.get(variantId);
                product.setQuantity(product.getQuantity() + itemQty);
                product.setRevenue(product.getRevenue() + (item.getPrice() * itemQty));
            }

            // Get period key based on order date
            String periodKey = getPeriodKey(order.getCreatedAt(), period);
            periodMap.putIfAbsent(periodKey, RevenueStatisticsResponse.PeriodRevenueDetail.builder()
                    .period(periodKey)
                    .revenue(0L)
                    .orderCount(0)
                    .itemCount(0)
                    .averageOrderValue(0L)
                    .build());

            RevenueStatisticsResponse.PeriodRevenueDetail detail = periodMap.get(periodKey);
            detail.setRevenue(detail.getRevenue() + order.getTotal());
            detail.setOrderCount(detail.getOrderCount() + 1);
            detail.setItemCount(detail.getItemCount() + orderItemCount);
        }

        // Calculate average order value for each period
        periodMap.values().forEach(detail -> {
            if (detail.getOrderCount() > 0) {
                detail.setAverageOrderValue(detail.getRevenue() / detail.getOrderCount());
            }
        });

        // Sort products by revenue descending
        List<RevenueStatisticsResponse.TopProductInfo> topProducts = productMap.values().stream()
                .sorted((a, b) -> Long.compare(b.getRevenue(), a.getRevenue()))
                .limit(10)
                .collect(Collectors.toList());

        // Sort periods by key
        List<RevenueStatisticsResponse.PeriodRevenueDetail> sortedDetails = periodMap.values().stream()
                .sorted(Comparator.comparing(RevenueStatisticsResponse.PeriodRevenueDetail::getPeriod))
                .collect(Collectors.toList());

        return RevenueStatisticsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(completedOrders.size())
                .totalItems(totalItems)
                .details(sortedDetails)
                .topProducts(topProducts)
                .build();
    }

    private String getPeriodKey(LocalDateTime dateTime, String period) {
        int month = dateTime.getMonthValue();
        int year = dateTime.getYear();

        switch (period) {
            case "month":
                return String.valueOf(month);
            case "quarter":
                int quarter = (month - 1) / 3 + 1;
                return "Q" + quarter;
            case "year":
                return String.valueOf(year);
            default:
                return String.valueOf(month);
        }
    }
}

