package com.example.payment.controller;

import com.example.payment.client.OrderServiceClient;
import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.PaymentResponse;
import com.example.payment.dto.PaymentReturnResponse;
import com.example.payment.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/vnpay")
@RequiredArgsConstructor
public class VNPayController {

    private final VNPayService vnPayService;
    private final OrderServiceClient orderServiceClient;

    /**
     * Tạo URL thanh toán VNPay
     * @param req Thông tin thanh toán (orderId, amount)
     * @param request HttpServletRequest để lấy IP
     * @return PaymentResponse chứa paymentUrl
     */
    @PostMapping("/create-payment")
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestBody PaymentRequest req, 
            HttpServletRequest request) {
        try {
            // Validate request
            if (req.getOrderId() == null || req.getOrderId().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(PaymentResponse.builder()
                                .message("Order ID không được để trống")
                                .build());
            }

            if (req.getAmount() <= 0) {
                return ResponseEntity.badRequest()
                        .body(PaymentResponse.builder()
                                .message("Số tiền thanh toán phải lớn hơn 0")
                                .build());
            }

            // Validate order exists
            try {
                Long orderId = Long.parseLong(req.getOrderId());
                if (!orderServiceClient.validateOrder(orderId)) {
                    return ResponseEntity.badRequest()
                            .body(PaymentResponse.builder()
                                    .message("Đơn hàng không tồn tại hoặc không hợp lệ")
                                    .build());
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest()
                        .body(PaymentResponse.builder()
                                .message("Order ID không hợp lệ")
                                .build());
            }

            // Get client IP
            String ipAddress = getClientIpAddress(request);
            
            // Create payment URL
            String paymentUrl = vnPayService.createPaymentUrl(req, ipAddress);
            
            log.info("Created payment URL for order: {}", req.getOrderId());

            return ResponseEntity.ok(PaymentResponse.builder()
                    .paymentUrl(paymentUrl)
                    .orderId(req.getOrderId())
                    .amount(req.getAmount())
                    .message("Tạo URL thanh toán thành công")
                    .build());
        } catch (Exception e) {
            log.error("Error creating payment URL: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PaymentResponse.builder()
                            .message("Lỗi khi tạo URL thanh toán: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Callback URL khi người dùng quay lại từ VNPay (Return URL)
     * Frontend sẽ redirect user đến đây sau khi thanh toán
     * 
     * Các trường hợp xử lý:
     * - Thanh toán thành công (vnp_ResponseCode = "00")
     * - Thanh toán thất bại (các mã lỗi khác)
     * - Chữ ký không hợp lệ
     * - Đơn hàng không tồn tại
     * - Lỗi khi cập nhật order service
     */
    @GetMapping("/payment-return")
    public ResponseEntity<PaymentReturnResponse> paymentReturn(HttpServletRequest request) {
        try {
            // Lấy tất cả parameters từ VNPay
            Map<String, String> params = new HashMap<>();
            request.getParameterMap().forEach((key, values) -> {
                if (values != null && values.length > 0) {
                    params.put(key, values[0]);
                }
            });

            String vnpResponseCode = params.get("vnp_ResponseCode");
            String vnpTxnRef = params.get("vnp_TxnRef");
            String vnpTransactionId = params.get("vnp_TransactionNo");
            String vnpAmount = params.get("vnp_Amount");
            String vnpBankCode = params.get("vnp_BankCode");
            String vnpPayDate = params.get("vnp_PayDate");

            log.info("Payment return callback - Order: {}, ResponseCode: {}, TransactionId: {}", 
                    vnpTxnRef, vnpResponseCode, vnpTransactionId);

            // Validate required parameters
            if (vnpTxnRef == null || vnpTxnRef.isEmpty()) {
                log.warn("Missing vnp_TxnRef in payment return");
                return ResponseEntity.ok(PaymentReturnResponse.builder()
                        .success(false)
                        .message("Thiếu thông tin đơn hàng")
                        .responseCode(vnpResponseCode)
                        .responseMessage("Missing order ID")
                        .build());
            }

            // Xác thực chữ ký
            boolean isValidSignature = vnPayService.verifyPayment(params);
            
            if (!isValidSignature) {
                log.warn("Invalid signature for order: {}", vnpTxnRef);
                return ResponseEntity.ok(PaymentReturnResponse.builder()
                        .success(false)
                        .message("Chữ ký không hợp lệ. Giao dịch có thể bị giả mạo.")
                        .orderId(vnpTxnRef)
                        .responseCode(vnpResponseCode)
                        .responseMessage("Invalid signature")
                        .build());
            }

            // Xử lý kết quả thanh toán
            boolean isSuccess = vnPayService.isPaymentSuccess(vnpResponseCode);
            String message = vnPayService.getResponseMessage(vnpResponseCode);

            // Parse amount (VNPay trả về amount * 100)
            Long amount = null;
            if (vnpAmount != null && !vnpAmount.isEmpty()) {
                try {
                    amount = Long.parseLong(vnpAmount) / 100;
                } catch (NumberFormatException e) {
                    log.warn("Invalid amount format: {}", vnpAmount);
                }
            }

            PaymentReturnResponse response = PaymentReturnResponse.builder()
                    .success(isSuccess)
                    .message(message)
                    .orderId(vnpTxnRef)
                    .transactionId(vnpTransactionId)
                    .amount(amount)
                    .responseCode(vnpResponseCode)
                    .responseMessage(message)
                    .build();

            // Cập nhật trạng thái đơn hàng nếu thanh toán thành công
            if (isSuccess && vnpTxnRef != null) {
                try {
                    Long orderId = Long.parseLong(vnpTxnRef);
                    
                    // Kiểm tra đơn hàng có tồn tại không
                    if (!orderServiceClient.validateOrder(orderId)) {
                        log.warn("Order not found: {}", orderId);
                        response.setMessage(message + " (Lưu ý: Không tìm thấy đơn hàng)");
                        return ResponseEntity.ok(response);
                    }
                    
                    // Cập nhật trạng thái thanh toán với cơ chế retry
                    boolean updated = updatePaymentStatusWithRetry(orderId, "PAID", 3);
                    if (updated) {
                        log.info("Updated payment status to PAID for order: {}", orderId);
                        response.setMessage(message);
                    } else {
                        log.error("Failed to update payment status for order: {} after retries", orderId);
                        response.setMessage(message + " (Lưu ý: Có thể cần kiểm tra lại trạng thái đơn hàng)");
                    }
                } catch (NumberFormatException e) {
                    log.error("Invalid order ID format: {}", vnpTxnRef);
                    response.setMessage(message + " (Lưu ý: Mã đơn hàng không hợp lệ)");
                }
            } else {
                // Thanh toán thất bại - có thể cập nhật trạng thái FAILED nếu cần
                log.info("Payment failed for order: {}, ResponseCode: {}", vnpTxnRef, vnpResponseCode);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing payment return: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PaymentReturnResponse.builder()
                            .success(false)
                            .message("Lỗi xử lý kết quả thanh toán: " + e.getMessage())
                            .build());
        }
    }

    /**
     * IPN (Instant Payment Notification) - VNPay gọi đến đây để xác nhận giao dịch
     * Đây là endpoint quan trọng để đảm bảo giao dịch được xác nhận chính xác
     * 
     * Lưu ý: IPN có thể được gọi nhiều lần cho cùng một giao dịch
     * Cần xử lý idempotent để tránh cập nhật trùng lặp
     * 
     * Các trường hợp xử lý:
     * - Thanh toán thành công: Cập nhật order status
     * - Thanh toán thất bại: Log và trả về mã lỗi
     * - Chữ ký không hợp lệ: Trả về mã lỗi 97
     * - Đơn hàng không tồn tại: Trả về mã lỗi 04
     * - Lỗi khi cập nhật: Retry và trả về mã lỗi tương ứng
     */
    @GetMapping("/payment-ipn")
    public ResponseEntity<Map<String, String>> paymentIpn(HttpServletRequest request) {
        try {
            // Lấy tất cả parameters từ VNPay
            Map<String, String> params = new HashMap<>();
            request.getParameterMap().forEach((key, values) -> {
                if (values != null && values.length > 0) {
                    params.put(key, values[0]);
                }
            });

            String vnpResponseCode = params.get("vnp_ResponseCode");
            String vnpTxnRef = params.get("vnp_TxnRef");
            String vnpTransactionId = params.get("vnp_TransactionNo");
            String vnpAmount = params.get("vnp_Amount");
            String vnpBankCode = params.get("vnp_BankCode");
            String vnpPayDate = params.get("vnp_PayDate");

            log.info("IPN callback - Order: {}, ResponseCode: {}, TransactionId: {}, Amount: {}", 
                    vnpTxnRef, vnpResponseCode, vnpTransactionId, vnpAmount);

            // Kiểm tra tham số bắt buộc
            if (vnpTxnRef == null || vnpTxnRef.isEmpty()) {
                log.warn("IPN: Missing vnp_TxnRef");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("RspCode", "04");
                errorResponse.put("Message", "Missing order ID");
                return ResponseEntity.ok(errorResponse);
            }

            // Xác thực chữ ký
            boolean isValidSignature = vnPayService.verifyPayment(params);
            
            if (!isValidSignature) {
                log.warn("IPN: Invalid signature for order: {}", vnpTxnRef);
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("RspCode", "97");
                errorResponse.put("Message", "Checksum failed");
                return ResponseEntity.ok(errorResponse);
            }

            // Xử lý kết quả thanh toán
            boolean isSuccess = vnPayService.isPaymentSuccess(vnpResponseCode);

            if (isSuccess && vnpTxnRef != null) {
                try {
                    Long orderId = Long.parseLong(vnpTxnRef);
                    
                    // Kiểm tra đơn hàng có tồn tại không
                    if (!orderServiceClient.validateOrder(orderId)) {
                        log.warn("IPN: Order not found: {}", orderId);
                        Map<String, String> errorResponse = new HashMap<>();
                        errorResponse.put("RspCode", "04");
                        errorResponse.put("Message", "Order not found");
                        return ResponseEntity.ok(errorResponse);
                    }
                    
                    // Cập nhật trạng thái thanh toán với retry và kiểm tra idempotent
                    // Thực tế cần kiểm tra đơn đã cập nhật chưa để tránh cập nhật trùng
                    boolean updated = updatePaymentStatusWithRetry(orderId, "PAID", 3);
                    
                    if (updated) {
                        log.info("IPN: Successfully updated payment status to PAID for order: {}", orderId);
                        Map<String, String> successResponse = new HashMap<>();
                        successResponse.put("RspCode", "00");
                        successResponse.put("Message", "Confirm Success");
                        return ResponseEntity.ok(successResponse);
                    } else {
                        log.error("IPN: Failed to update payment status for order: {} after retries", orderId);
                        Map<String, String> errorResponse = new HashMap<>();
                        errorResponse.put("RspCode", "01");
                        errorResponse.put("Message", "Update order failed");
                        return ResponseEntity.ok(errorResponse);
                    }
                } catch (NumberFormatException e) {
                    log.error("IPN: Invalid order ID format: {}", vnpTxnRef);
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("RspCode", "04");
                    errorResponse.put("Message", "Invalid order ID");
                    return ResponseEntity.ok(errorResponse);
                }
            } else {
                // Thanh toán thất bại
                String failMessage = vnPayService.getResponseMessage(vnpResponseCode);
                log.info("IPN: Payment failed for order: {}, ResponseCode: {}, Message: {}", 
                        vnpTxnRef, vnpResponseCode, failMessage);
                
                Map<String, String> failResponse = new HashMap<>();
                failResponse.put("RspCode", "01");
                failResponse.put("Message", "Payment failed: " + failMessage);
                return ResponseEntity.ok(failResponse);
            }
        } catch (Exception e) {
            log.error("IPN: Error processing IPN: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("RspCode", "99");
            errorResponse.put("Message", "Internal error: " + e.getMessage());
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
    * Cập nhật trạng thái thanh toán với cơ chế retry
     * @param orderId ID đơn hàng
     * @param paymentStatus Trạng thái thanh toán
     * @param maxRetries Số lần retry tối đa
     * @return true nếu cập nhật thành công
     */
    private boolean updatePaymentStatusWithRetry(Long orderId, String paymentStatus, int maxRetries) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                boolean updated = orderServiceClient.updatePaymentStatus(orderId, paymentStatus);
                if (updated) {
                    return true;
                }
                attempts++;
                if (attempts < maxRetries) {
                    log.warn("Retry {}/{} updating payment status for order: {}", attempts, maxRetries, orderId);
                    Thread.sleep(1000 * attempts); // backoff lũy tiến
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Interrupted while retrying payment status update for order: {}", orderId);
                return false;
            } catch (Exception e) {
                attempts++;
                log.error("Error updating payment status for order {} (attempt {}/{}): {}", 
                        orderId, attempts, maxRetries, e.getMessage());
                if (attempts < maxRetries) {
                    try {
                        Thread.sleep(1000 * attempts);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return false;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Lấy địa chỉ IP thực của client (xử lý proxy/load balancer)
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        
        // Xử lý trường hợp có nhiều IP (X-Forwarded-For có thể chứa nhiều IP)
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        
        return ipAddress;
    }
}
