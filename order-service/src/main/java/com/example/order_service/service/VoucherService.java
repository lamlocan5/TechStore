package com.example.order_service.service;

import com.example.order_service.dto.request.VoucherRequest;
import com.example.order_service.dto.response.VoucherResponse;
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.VoucherRepository;
import com.example.order_service.repository.VoucherUsageRepository;
import com.example.order_service.repository.UserVoucherRepository;
import com.example.order_service.client.IdentityServiceClient;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final IdentityServiceClient identityServiceClient;

    private VoucherResponse mapToResponse(VoucherEntity entity) {
        return VoucherResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .discountType(entity.getDiscountType())
                .discountValue(entity.getDiscountValue())
                .discountMaxValue(entity.getDiscountMaxValue())
                .minOrderTotal(entity.getMinOrderTotal())
                .startAt(entity.getStartAt())
                .endAt(entity.getEndAt())
                .maxUsage(entity.getMaxUsage())
                .maxPerUser(entity.getMaxPerUser())
                .status(entity.getStatus())
                .minRankRequired(entity.getMinRankRequired())
                .build();
    }

    public VoucherResponse createVoucher(VoucherRequest request) {
        VoucherEntity entity = VoucherEntity.builder()
                .code(request.getCode())
                .name(request.getName())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .discountMaxValue(request.getDiscountMaxValue())
                .minOrderTotal(request.getMinOrderTotal())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .maxUsage(request.getMaxUsage())
                .maxPerUser(request.getMaxPerUser())
                .status(request.getStatus() != null ? request.getStatus() : 1)
                .minRankRequired(request.getMinRankRequired() != null
                        ? request.getMinRankRequired()
                        : MembershipRank.BRONZE)
                .build();

        return mapToResponse(voucherRepository.save(entity));
    }

    public VoucherResponse updateVoucher(Long id, VoucherRequest request) {
        VoucherEntity entity = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setDiscountType(request.getDiscountType());
        entity.setDiscountValue(request.getDiscountValue());
        entity.setDiscountMaxValue(request.getDiscountMaxValue());
        entity.setMinOrderTotal(request.getMinOrderTotal());
        entity.setStartAt(request.getStartAt());
        entity.setEndAt(request.getEndAt());
        entity.setMaxUsage(request.getMaxUsage());
        entity.setMaxPerUser(request.getMaxPerUser());
        entity.setStatus(request.getStatus());
        entity.setMinRankRequired(request.getMinRankRequired() != null
                ? request.getMinRankRequired()
                : MembershipRank.BRONZE);

        return mapToResponse(voucherRepository.save(entity));
    }

    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new AppException(ErrorCode.VOUCHER_NOT_FOUND);
        }
        voucherRepository.deleteById(id);
    }

    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll()
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<VoucherResponse> getAllVouchers(Pageable pageable) {
        return voucherRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    public List<VoucherResponse> getActiveVouchers() {
        return voucherRepository.findActiveVouchers(LocalDateTime.now())
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<VoucherResponse> getActiveVouchers(Pageable pageable) {
        return voucherRepository.findActiveVouchers(LocalDateTime.now(), pageable)
                .map(this::mapToResponse);
    }

    public VoucherResponse getVoucherById(Long id) {
        VoucherEntity entity = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        return mapToResponse(entity);
    }

    public VoucherResponse getVoucherByCode(String code) {
        VoucherEntity entity = voucherRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        return mapToResponse(entity);
    }

    public VoucherEntity validateVoucher(String code, String userId, Long orderTotal) {
        VoucherEntity voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();

        // Check if voucher is active
        if (voucher.getStatus() != 1) {
            throw new AppException(ErrorCode.VOUCHER_NOT_ACTIVE);
        }

        // Check date range
        if (now.isBefore(voucher.getStartAt()) || now.isAfter(voucher.getEndAt())) {
            throw new AppException(ErrorCode.VOUCHER_NOT_VALID_TIME);
        }

        // Check min order total
        if (orderTotal < voucher.getMinOrderTotal()) {
            throw new AppException(ErrorCode.VOUCHER_MIN_ORDER_NOT_MET);
        }

        // Check max usage
        if (voucher.getMaxUsage() != null) {
            long totalUsage = voucherUsageRepository.countByVoucherId(voucher.getId());
            if (totalUsage >= voucher.getMaxUsage()) {
                throw new AppException(ErrorCode.VOUCHER_USAGE_LIMIT_REACHED);
            }
        }

        // Check max per user
        if (voucher.getMaxPerUser() != null) {
            long userUsage = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), userId);
            if (userUsage >= voucher.getMaxPerUser()) {
                throw new AppException(ErrorCode.VOUCHER_USER_USAGE_LIMIT_REACHED);
            }
        }

        // Kiểm tra rank tối thiểu
        String rankName = identityServiceClient.getUserRank(userId);
        if (rankName != null) {
            try {
                MembershipRank userRank = MembershipRank.valueOf(rankName);
                if (userRank.ordinal() < voucher.getMinRankRequired().ordinal()) {
                    throw new AppException(ErrorCode.VOUCHER_RANK_NOT_ENOUGH);
                }
            } catch (IllegalArgumentException ignored) {
                // nếu rank không map được thì bỏ qua kiểm tra
            }
        }

        // Nếu voucher được thiết kế là "thu thập", yêu cầu user phải có trong ví (user_vouchers)
        long walletCount = userVoucherRepository.countByUserIdAndVoucherId(userId, voucher.getId());
        if (walletCount == 0 && voucher.getMaxPerUser() != null && voucher.getMaxPerUser() > 0) {
            // Với các voucher có giới hạn mỗi user, yêu cầu phải được claim trước
            throw new AppException(ErrorCode.VOUCHER_NOT_IN_WALLET);
        }

        return voucher;
    }

    public Long calculateDiscount(VoucherEntity voucher, Long orderTotal) {
        long discount = 0;

        if (voucher.getDiscountType() == DiscountType.PERCENT) {
            discount = (orderTotal * voucher.getDiscountValue()) / 100;
            if (voucher.getDiscountMaxValue() != null && discount > voucher.getDiscountMaxValue()) {
                discount = voucher.getDiscountMaxValue();
            }
        } else if (voucher.getDiscountType() == DiscountType.AMOUNT) {
            discount = voucher.getDiscountValue();
        }

        return Math.min(discount, orderTotal);
    }
}

