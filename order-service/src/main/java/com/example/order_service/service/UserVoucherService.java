package com.example.order_service.service;

import com.example.order_service.entity.UserVoucherEntity;
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.UserVoucherRepository;
import com.example.order_service.repository.VoucherRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserVoucherService {

    private final UserVoucherRepository userVoucherRepository;
    private final VoucherRepository voucherRepository;

    public List<UserVoucherEntity> getUserVouchers(String userId) {
        return userVoucherRepository.findByUserId(userId);
    }

    public List<UserVoucherEntity> getActiveUserVouchers(String userId) {
        return userVoucherRepository.findByUserIdAndIsUsed(userId, false);
    }

    /**
     * User tự thu thập (claim) voucher
     */
    public void claimVoucher(String userId, Long voucherId, MembershipRank userRank) {
        VoucherEntity voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();

        // Active + thời gian
        if (voucher.getStatus() != 1
                || now.isBefore(voucher.getStartAt())
                || now.isAfter(voucher.getEndAt())) {
            throw new AppException(ErrorCode.VOUCHER_NOT_ACTIVE);
        }

        // Rank tối thiểu
        if (userRank.ordinal() < voucher.getMinRankRequired().ordinal()) {
            throw new AppException(ErrorCode.VOUCHER_RANK_NOT_ENOUGH);
        }

        // Số lượng giới hạn tổng
        if (voucher.getMaxUsage() != null) {
            long totalUsage = userVoucherRepository.countByUserIdAndVoucherId(userId, voucherId);
            if (totalUsage >= voucher.getMaxUsage()) {
                throw new AppException(ErrorCode.VOUCHER_USAGE_LIMIT_REACHED);
            }
        }

        // Giới hạn mỗi user
        if (voucher.getMaxPerUser() != null) {
            long userClaimCount = userVoucherRepository.countByUserIdAndVoucherId(userId, voucherId);
            if (userClaimCount >= voucher.getMaxPerUser()) {
                throw new AppException(ErrorCode.VOUCHER_USER_USAGE_LIMIT_REACHED);
            }
        }

        UserVoucherEntity uv = UserVoucherEntity.builder()
                .userId(userId)
                .voucherId(voucherId)
                .isUsed(false)
                .claimedAt(LocalDateTime.now())
                .build();

        userVoucherRepository.save(uv);
    }

    /**
     * Đánh dấu voucher đã được dùng khi thanh toán
     */
    public void markVoucherUsed(String userId, Long voucherId) {
        UserVoucherEntity uv = userVoucherRepository
                .findByUserIdAndVoucherIdAndIsUsed(userId, voucherId, false)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_IN_WALLET));

        uv.setIsUsed(true);
        uv.setUsedAt(LocalDateTime.now());
        userVoucherRepository.save(uv);
    }
}
