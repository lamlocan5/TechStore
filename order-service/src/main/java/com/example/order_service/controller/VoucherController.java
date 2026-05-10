package com.example.order_service.controller;

import com.example.order_service.dto.ApiResponse;
import com.example.order_service.dto.PaginatedResponse;
import com.example.order_service.dto.request.VoucherRequest;
import com.example.order_service.dto.response.VoucherResponse;
import com.example.order_service.entity.UserVoucherEntity;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.service.VoucherService;
import com.example.order_service.service.UserVoucherService;
import com.example.order_service.client.IdentityServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final UserVoucherService userVoucherService;
    private final IdentityServiceClient identityServiceClient;

    private String getAuthenticatedUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VoucherResponse> create(@RequestBody VoucherRequest request) {
        return ApiResponse.<VoucherResponse>builder()
                .message("Voucher created successfully")
                .result(voucherService.createVoucher(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VoucherResponse> update(@PathVariable Long id, @RequestBody VoucherRequest request) {
        return ApiResponse.<VoucherResponse>builder()
                .message("Voucher updated successfully")
                .result(voucherService.updateVoucher(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ApiResponse.<Void>builder()
                .message("Voucher deleted successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<VoucherResponse> getById(@PathVariable Long id) {
        return ApiResponse.<VoucherResponse>builder()
                .message("Voucher details")
                .result(voucherService.getVoucherById(id))
                .build();
    }

    @GetMapping("/code/{code}")
    public ApiResponse<VoucherResponse> getByCode(@PathVariable String code) {
        return ApiResponse.<VoucherResponse>builder()
                .message("Voucher details")
                .result(voucherService.getVoucherByCode(code))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaginatedResponse<VoucherResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<VoucherResponse> voucherPage = voucherService.getAllVouchers(pageable);
        
        PaginatedResponse<VoucherResponse> paginatedResponse = PaginatedResponse.<VoucherResponse>builder()
                .result(voucherPage.getContent())
                .total(voucherPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(voucherPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<VoucherResponse>>builder()
                .message("All vouchers")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/active")
    public ApiResponse<PaginatedResponse<VoucherResponse>> getActive(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<VoucherResponse> voucherPage = voucherService.getActiveVouchers(pageable);
        
        PaginatedResponse<VoucherResponse> paginatedResponse = PaginatedResponse.<VoucherResponse>builder()
                .result(voucherPage.getContent())
                .total(voucherPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(voucherPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<VoucherResponse>>builder()
                .message("Active vouchers")
                .result(paginatedResponse)
                .build();
    }

    /**
     * Lấy danh sách voucher đang hoạt động phù hợp với rank hiện tại của user (dùng cho trang Mã giảm giá)
     */
    @GetMapping("/available-for-me")
    public ApiResponse<List<VoucherResponse>> getAvailableForMe() {
        String userId = getAuthenticatedUserId();
        String rankName = identityServiceClient.getUserRank(userId);

        MembershipRank userRank = MembershipRank.BRONZE;
        if (rankName != null) {
            try {
                userRank = MembershipRank.valueOf(rankName);
            } catch (IllegalArgumentException ignored) {
            }
        }

        List<VoucherResponse> allActive = voucherService.getActiveVouchers();
        MembershipRank finalUserRank = userRank;
        List<VoucherResponse> filtered = allActive.stream()
                .filter(v -> v.getMinRankRequired() == null
                        || finalUserRank.ordinal() >= v.getMinRankRequired().ordinal())
                .toList();

        return ApiResponse.<List<VoucherResponse>>builder()
                .message("Vouchers available for current user rank")
                .result(filtered)
                .build();
    }

    /**
     * User tự claim voucher vào kho cá nhân (voucher thu thập)
     */
    @PostMapping("/{id}/claim")
    public ApiResponse<Void> claimVoucher(@PathVariable Long id) {
        String userId = getAuthenticatedUserId();
        String rankName = identityServiceClient.getUserRank(userId);

        MembershipRank userRank = MembershipRank.BRONZE;
        if (rankName != null) {
            try {
                userRank = MembershipRank.valueOf(rankName);
            } catch (IllegalArgumentException ignored) {
            }
        }

        userVoucherService.claimVoucher(userId, id, userRank);
        return ApiResponse.<Void>builder()
                .message("Voucher claimed successfully")
                .build();
    }

    /**
     * Lấy danh sách voucher trong kho (wallet) của user hiện tại
     */
    @GetMapping("/my-wallet")
    public ApiResponse<List<UserVoucherEntity>> getMyWallet() {
        String userId = getAuthenticatedUserId();
        List<UserVoucherEntity> vouchers = userVoucherService.getActiveUserVouchers(userId);
        return ApiResponse.<List<UserVoucherEntity>>builder()
                .message("My voucher wallet")
                .result(vouchers)
                .build();
    }
}

