package com.example.payment.service;

import com.example.payment.dto.PaymentRequest;
import config.VNPayConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class VNPayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.ipn-url}")
    private String ipnUrl;

    /**
     * Tạo URL thanh toán VNPay
     * Lưu ý: VNPay yêu cầu amount phải nhân 100 (ví dụ: 100000 VND -> 10000000)
     */
    public String createPaymentUrl(PaymentRequest req, String ipAddress) {
        String vnpTxnRef = req.getOrderId();
        String vnpCreateDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        
        // VNPay yêu cầu amount phải nhân 100 (đơn vị là xu)
        long vnpAmount = req.getAmount() * 100;

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(vnpAmount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", vnpTxnRef);
        params.put("vnp_OrderInfo", "Thanh toan don hang " + vnpTxnRef);
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_CreateDate", vnpCreateDate);
        params.put("vnp_Locale", "vn");

        String secureHash = VNPayConfig.hashAllFields(params, hashSecret);
        params.put("vnp_SecureHash", secureHash);

        StringBuilder queryUrl = new StringBuilder(payUrl + "?");

        for (Map.Entry<String, String> entry : params.entrySet()) {
            queryUrl.append(entry.getKey())
                    .append("=")
                    .append(entry.getValue())
                    .append("&");
        }

        return queryUrl.substring(0, queryUrl.length() - 1);
    }

    /**
     * Xác thực chữ ký từ VNPay callback
     * @param params Các tham số từ VNPay callback
     * @return true nếu chữ ký hợp lệ
     */
    public boolean verifyPayment(Map<String, String> params) {
        try {
            String vnp_SecureHash = params.get("vnp_SecureHash");
            if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
                log.warn("Missing vnp_SecureHash in payment callback");
                return false;
            }

            // Loại bỏ vnp_SecureHash để tính toán hash
            Map<String, String> paramsForHash = new HashMap<>(params);
            paramsForHash.remove("vnp_SecureHash");

            // Tính toán hash
            String calculatedHash = VNPayConfig.hashAllFields(paramsForHash, hashSecret);

            // So sánh hash
            boolean isValid = vnp_SecureHash.equals(calculatedHash);
            
            if (!isValid) {
                log.warn("Invalid payment signature. Expected: {}, Got: {}", calculatedHash, vnp_SecureHash);
            }
            
            return isValid;
        } catch (Exception e) {
            log.error("Error verifying payment signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Lấy response code từ VNPay
     * @param responseCode Mã response từ VNPay
     * @return Thông điệp tương ứng
     */
    public String getResponseMessage(String responseCode) {
        if (responseCode == null) {
            return "Không có mã phản hồi";
        }

        return switch (responseCode) {
            case "00" -> "Giao dịch thành công";
            case "07" -> "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)";
            case "09" -> "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking";
            case "10" -> "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
            case "11" -> "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch";
            case "12" -> "Thẻ/Tài khoản bị khóa";
            case "13" -> "Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch";
            case "24" -> "Giao dịch không thành công do: Khách hàng hủy giao dịch";
            case "51" -> "Tài khoản không đủ số dư để thực hiện giao dịch";
            case "65" -> "Tài khoản đã vượt quá hạn mức giao dịch trong ngày";
            case "75" -> "Ngân hàng thanh toán đang bảo trì";
            case "79" -> "Nhập sai mật khẩu thanh toán quá số lần quy định";
            case "99" -> "Lỗi không xác định";
            default -> "Mã lỗi không xác định: " + responseCode;
        };
    }

    /**
     * Kiểm tra giao dịch có thành công không
     */
    public boolean isPaymentSuccess(String responseCode) {
        return "00".equals(responseCode);
    }
}
