# Hướng Dẫn Cấu Hình JMeter - TG_08: Voucher Claim Race Condition Spike Test

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Kiểm tra race condition khi 80 user đồng thời claim 1 voucher có `max_usage = 10` |
| **API** | `POST /api/v1/vouchers/{id}/claim` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | `80` (mỗi user là 1 testuser001–testuser080) |
| **Ramp-up** | `3` giây (spike cực nhanh, tạo maximum contention) |
| **Loop** | `1` |
| **SLA** | p95 < 1500ms |
| **Loại test** | ⚡ Spike Test — Race Condition |
| **Auth** | ✅ Cần Bearer Token (mỗi thread login riêng) |

> 💡 **Điểm đặc biệt của TG_08:**
> - Voucher có `max_usage = 10` → chỉ 10 user đầu claim được
> - 70 user còn lại nhận HTTP 400 (code `4005` — VOUCHER_USAGE_LIMIT_REACHED)
> - **Error Rate ~87.5% là bình thường và mong đợi!**
> - Mục tiêu thực sự: bảng `user_vouchers` phải có **đúng 10 bản ghi** sau test

---

## Hiểu Đúng Logic Code Trước Khi Test

### Flow của `POST /api/vouchers/{id}/claim`

```
VoucherController.claimVoucher(id)
  │
  ├─ 1. Lấy userId từ JWT (SecurityContext)
  ├─ 2. Gọi IdentityServiceClient.getUserRank(userId) → rank
  └─ 3. UserVoucherService.claimVoucher(userId, voucherId, rank)
           │
           ├─ Check voucher tồn tại → 404 nếu không có
           ├─ Check status=1 và now trong [start_at, end_at] → 400 nếu hết hạn
           ├─ Check rank đủ điều kiện → 403 nếu rank thấp hơn min_rank_required
           ├─ Check maxUsage: countByUserIdAndVoucherId(userId, voucherId) >= maxUsage → 400 (4005)
           ├─ Check maxPerUser: countByUserIdAndVoucherId(userId, voucherId) >= maxPerUser → 400 (4006)
           └─ INSERT INTO user_vouchers (user_id, voucher_id, is_used=false, claimed_at=now)
```

> ⚠️ **Bug Logic trong Code Thực Tế:**
> Hàm kiểm tra `maxUsage` dùng `countByUserIdAndVoucherId(userId, voucherId)` — tức là đếm theo **từng user**, không đếm tổng toàn bộ.
> Điều này có nghĩa: nếu `maxUsage = 10` và mỗi user chỉ claim 1 lần, **không có ai bị chặn** do maxUsage!
> Bảng `voucher_usages` là bảng ghi nhận khi DÙNG voucher (khi thanh toán), không phải khi claim.
> → **Race condition thật sự xảy ra ở `maxPerUser`**: nhiều thread cùng user có thể vượt qua check đồng thời.

### Bảng DB liên quan

| Bảng | Vai trò |
|---|---|
| `vouchers` | Thông tin voucher: `id`, `code`, `status`, `start_at`, `end_at`, `max_usage`, `max_per_user`, `min_rank_required` |
| `user_vouchers` | Ghi nhận mỗi lượt claim: `user_id`, `voucher_id`, `is_used`, `claimed_at` |
| `voucher_usages` | Ghi nhận khi dùng voucher lúc thanh toán: `voucher_id`, `user_id`, `order_id`, `used_at` |

---

## Bước 1: Chuẩn Bị Dữ Liệu — Tạo Voucher Test

### 1.1. Chạy SQL tạo voucher

Mở MySQL Workbench, chọn database `profile_service`, chạy theo thứ tự:

```sql
USE profile_service;

-- Bước 0: Tắt safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Bước 1: Xóa dữ liệu claim cũ của voucher test (nếu có)
DELETE FROM user_vouchers
WHERE voucher_id = (SELECT id FROM vouchers WHERE code = 'JMETER_TG08');

-- Bước 2: Xóa voucher test cũ (nếu có)
DELETE FROM vouchers WHERE code = 'JMETER_TG08';

-- Bước 3: Tạo voucher test mới với ngày cố định (tránh lỗi timezone)
INSERT INTO vouchers (
    code,
    name,
    discount_type,
    discount_value,
    discount_max_value,
    min_order_total,
    start_at,
    end_at,
    max_usage,
    max_per_user,
    status,
    min_rank_required
) VALUES (
    'JMETER_TG08',
    'JMeter Race Condition Test Voucher',
    'PERCENT',                   -- enum DiscountType: 'PERCENT' hoặc 'AMOUNT'
    10,                          -- giảm 10%
    50000,                       -- tối đa giảm 50.000đ
    0,                           -- không yêu cầu đơn tối thiểu
    '2020-01-01 00:00:00',       -- start_at cố định — tránh lỗi timezone
    '2030-12-31 23:59:59',       -- end_at cố định — hợp lệ lâu dài
    10,                          -- max_usage = 10 (tổng 10 lượt claim)
    1,                           -- max_per_user = 1 (mỗi user chỉ claim 1 lần)
    1,                           -- status = 1 (active)
    'BRONZE'                     -- enum MembershipRank: 'BRONZE','SILVER','GOLD','DIAMOND'
);

-- Bước 4: Bật lại safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Bước 5: Kiểm tra kết quả — ghi lại giá trị id
SELECT id, code, discount_type, discount_value, max_usage, max_per_user,
       status, min_rank_required, start_at, end_at
FROM vouchers
WHERE code = 'JMETER_TG08';
```

> 📝 **Ghi lại `id`** từ kết quả SELECT — đây là `voucher_id` dùng trong CSV.
> ⚠️ **Lý do dùng ngày cố định:** `NOW()` trong MySQL bị ảnh hưởng timezone server.
> Java đọc `LocalDateTime` không kèm timezone → dùng ngày cố định `2020-01-01` / `2030-12-31` để tránh lỗi `VOUCHER_NOT_ACTIVE` do lệch giờ UTC+7.

### 1.2. Cập nhật file voucher_ids.csv

File đã có tại: `test_JMeter\data\data_chung\voucher_ids.csv`

Nội dung file (thay `4` bằng ID thực tế từ bước 1.1 nếu khác):

```
voucher_id
4
```

> ⚠️ Chỉ cần **1 dòng duy nhất** — tất cả 80 thread đều tranh giành cùng 1 voucher này.

### 1.3. Xác nhận bằng curl trước khi chạy JMeter

```cmd
:: Bước 1: Lấy token (dùng testuser001)
curl -s -X POST "http://localhost:8888/api/v1/identity/auth/token" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser001\",\"password\":\"Test@123456\"}"

:: Kết quả mong đợi (ghi lại token):
:: {"code":1000,"result":{"token":"eyJ...","authenticated":true,...}}

:: Bước 2: Claim voucher (thay VOUCHER_ID và TOKEN)
curl -s -X POST "http://localhost:8888/api/v1/vouchers/VOUCHER_ID/claim" ^
  -H "Authorization: Bearer TOKEN_HERE" ^
  -H "Content-Type: application/json"

:: Kết quả mong đợi khi thành công:
:: {"code":1000,"message":"Voucher claimed successfully"}

:: Bước 3: Kiểm tra DB sau khi claim thủ công
:: SELECT * FROM user_vouchers WHERE voucher_id = VOUCHER_ID;
```

---

## Bước 2: Reset Trước Mỗi Lần Chạy Test

> ⚠️ **Bắt buộc** phải reset trước mỗi lần test vì `user_vouchers` tích lũy dữ liệu.

```sql
USE profile_service;

-- Bước 1: Tắt safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Bước 2: Xóa toàn bộ bản ghi claim của voucher test
DELETE FROM user_vouchers
WHERE voucher_id = 4;  -- ID voucher JMETER_TG08 (thay nếu khác)

-- Bước 3: Bật lại safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Bước 4: Xác nhận — kết quả phải = 0
SELECT COUNT(*) AS so_luot_da_claim
FROM user_vouchers
WHERE voucher_id = 4;
```

---

## Bước 3: Cấu Hình Thread Group TG_08

**Chuột phải vào Test Plan → Add → Threads (Users) → Thread Group**

Đặt tên: **`TG_08 - Voucher Claim Race Condition Spike Test`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads | `80` | 80 users đồng thời (testuser001–testuser080) |
| Ramp-up period | `3` | 3 giây — spike nhanh, tạo contention tối đa |
| Loop Count | `1` | Mỗi user chỉ claim 1 lần |

---

## Bước 4: CSV Data Set Config — Users

**Chuột phải vào TG_08 → Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Users`**

| Trường | Giá trị |
|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\users.csv` |
| **Variable Names** | `username,password` |
| **Ignore first line** | `True` |
| **Recycle on EOF** | `False` |
| **Stop thread on EOF** | `False` |
| **Sharing mode** | `All threads` |

> File `users.csv` có 100 dòng (testuser001–testuser100). 80 thread dùng 80 dòng đầu, mỗi thread 1 user riêng biệt.

---

## Bước 5: CSV Data Set Config — Voucher IDs

**Chuột phải vào TG_08 → Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Voucher IDs`**

| Trường | Giá trị |
|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\voucher_ids.csv` |
| **Variable Names** | `voucher_id` |
| **Ignore first line** | `True` |
| **Recycle on EOF** | `True` |
| **Stop thread on EOF** | `False` |
| **Sharing mode** | `All threads` |

---

## Bước 6: HTTP Request Defaults

**Chuột phải vào TG_08 → Add → Config Element → HTTP Request Defaults**

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 7: HTTP Header Manager (Global)

**Chuột phải vào TG_08 → Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

---

## Bước 8: Constant Throughput Timer

**Chuột phải vào TG_08 → Add → Timer → Constant Throughput Timer**

| Trường | Giá trị |
|---|---|
| **Target throughput (in samples per minute)** | `4800` |
| **Calculate Throughput based on** | `All active threads in current thread group` |

---

## Bước 9: HTTP Request — Login (Lấy Token)

**Chuột phải vào TG_08 → Add → Sampler → HTTP Request**

Đặt tên: **`POST - /api/v1/identity/auth/token`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/identity/auth/token` |

Tab **Body Data**:
```json
{"username": "${username}", "password": "${password}"}
```

### 9.1. JSON Extractor (lấy token từ response)

**Chuột phải vào sampler Login → Add → Post Processors → JSON Extractor**

| Trường | Giá trị |
|---|---|
| **Names of created variables** | `ACCESS_TOKEN` |
| **JSON Path expressions** | `$.result.token` |
| **Default Value** | `TOKEN_NOT_FOUND` |

> 📌 **Tại sao `$.result.token`?**
> Identity service trả về `ApiResponse<AuthenticationResponse>`:
> ```json
> {
>   "code": 1000,
>   "result": {
>     "token": "eyJhbGc...",
>     "authenticated": true,
>     "userId": "...",
>     "username": "testuser001"
>   }
> }
> ```
> Token nằm ở `result.token` → path là `$.result.token`.

---

## Bước 10: HTTP Request — Claim Voucher

**Chuột phải vào TG_08 → Add → Sampler → HTTP Request**

Đặt tên: **`POST - /api/v1/vouchers/${voucher_id}/claim`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/vouchers/${voucher_id}/claim` |
| **Body Data** | *(để trống — API không cần request body)* |

> API route trong controller: `@PostMapping("/{id}/claim")` — không nhận body, chỉ cần token.

### 10.1. HTTP Header Manager — Authorization

**Chuột phải vào sampler Claim Voucher → Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${ACCESS_TOKEN}` |

---

## Bước 11: Assertions

> ⚠️ **Đặc điểm quan trọng của TG_08:** Cả `200` lẫn `400` đều là kết quả **hợp lệ**.
> - `HTTP 200` + `{"code":1000}` → Claim thành công
> - `HTTP 400` + `{"code":4005}` → Vượt giới hạn `max_usage` — **đúng hành vi**
> - `HTTP 400` + `{"code":4006}` → Vượt giới hạn `max_per_user` — **đúng hành vi**
> - `HTTP 403` → Token hết hạn hoặc rank không đủ
> - `HTTP 500` → Lỗi server thật sự — **KHÔNG được phép có**

### 11.1. Response Assertion — Chặn lỗi 500

**Chuột phải vào sampler Claim Voucher → Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Không có lỗi 500` |
| **Field to Test** | `Response Code` |
| Pattern Matching Rules | Tích **Not** + tích **Equals** |
| Patterns to Test | `500` |

### 11.2. Duration Assertion — Kiểm tra thời gian phản hồi

**Chuột phải vào sampler Claim Voucher → Add → Assertions → Duration Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Response Time < 4000ms` |
| **Duration in milliseconds** | `4000` |

---

## Bước 12: Listeners

**Chuột phải vào TG_08 → Add → Listener:**

### 12.1. Aggregate Report
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_08_result.csv
```

### 12.2. Summary Report
> Xem nhanh tổng số Success vs Error — quan trọng để đếm xem có đúng 10 success không.

### 12.3. View Results Tree
> ⚠️ Chỉ dùng khi **debug**. Phải **Disable** trước khi chạy full test (nhấn chuột phải → Disable).

---

## Bước 13: Lưu và Chạy Test

Lưu file JMX tại:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_08_VoucherClaimRaceConditionSpikeTest.jmx
```

Chạy: **Run → Start** (Ctrl+R)

---

## Bước 14: Đọc Kết Quả và Đánh Giá

### Kết quả mong đợi (hệ thống ĐÚNG):

| Metric | Giá trị mong đợi | Ghi chú |
|---|---|---|
| **Số request HTTP 200** | ≤ 10 | Tối đa 10 user claim thành công |
| **Số request HTTP 400** | ≥ 70 | User bị từ chối (code 4005 hoặc 4006) |
| **Số request HTTP 500** | 0 | Không có lỗi server |
| **Error %** | ~87.5% | Bình thường: 70/80 = 87.5% |
| **p95** | < 1500ms | SLA |

### Kết quả cần cảnh báo (hệ thống có BUG):

| Dấu hiệu | Ý nghĩa |
|---|---|
| Số HTTP 200 **> 10** | ⚠️ Over-claim! Race condition không được xử lý |
| Có request **HTTP 500** | ❌ Deadlock hoặc crash khi concurrent write |
| p95 **> 1500ms** | ❌ Hiệu năng không đạt SLA |

### Kiểm tra DB sau khi chạy xong:

```sql
USE profile_service;

-- Đếm số lượt claim thực tế vào user_vouchers
SELECT COUNT(*) AS tong_so_luot_claim
FROM user_vouchers
WHERE voucher_id = (SELECT id FROM vouchers WHERE code = 'JMETER_TG08');
-- Kết quả PHẢI <= 10

-- Xem chi tiết từng lượt claim (ai claim được)
SELECT uv.user_id, uv.voucher_id, uv.is_used, uv.claimed_at
FROM user_vouchers uv
WHERE uv.voucher_id = (SELECT id FROM vouchers WHERE code = 'JMETER_TG08')
ORDER BY uv.claimed_at;

-- Kiểm tra có over-claim không (COUNT > max_usage)
SELECT
    v.code,
    v.max_usage,
    COUNT(uv.id) AS actual_claims,
    CASE
        WHEN COUNT(uv.id) > v.max_usage THEN '❌ OVER-CLAIM! BUG!'
        WHEN COUNT(uv.id) = v.max_usage THEN '✅ Đúng giới hạn'
        ELSE '⚠️ Under-claim (lock quá chặt?)'
    END AS ket_qua
FROM vouchers v
LEFT JOIN user_vouchers uv ON uv.voucher_id = v.id
WHERE v.code = 'JMETER_TG08'
GROUP BY v.id, v.code, v.max_usage;
```

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_08 - Voucher Claim Race Condition Spike Test
    │   [80 threads | ramp-up 3s | loop 1]
    │
    ├── 📄 CSV Data Set Config: users.csv
    │       Variable Names: username,password
    ├── 📄 CSV Data Set Config: voucher_ids.csv
    │       Variable Names: voucher_id
    ├── 🌐 HTTP Request Defaults: localhost:8888 http
    ├── 📋 HTTP Header Manager: Content-Type, Accept
    ├── ⏱️  Constant Throughput Timer: 4800 req/min
    │
    ├── 🔷 POST - /api/v1/identity/auth/token
    │       Body: {"username":"${username}","password":"${password}"}
    │   └── 🔍 JSON Extractor: $.result.token → ACCESS_TOKEN
    │
    └── 🔷 POST - /api/v1/vouchers/${voucher_id}/claim
            Body: (trống)
        ├── 📋 HTTP Header Manager: Authorization: Bearer ${ACCESS_TOKEN}
        ├── ✅ Response Assertion: NOT 500
        └── ✅ Duration Assertion: < 4000ms
    │
    ├── 📊 Aggregate Report → results/TG_08_result.csv
    ├── 📊 Summary Report
    └── 📊 View Results Tree (DISABLE khi chạy full)
```

---

## Checklist Trước Khi Chạy

- [ ] Services đang chạy: **Identity (8080)**, **Order (8084)**, **API Gateway (8888)**
- [ ] Đã chạy SQL tạo voucher `JMETER_TG08` với `max_usage=10`, `max_per_user=1`, `status=1`
- [ ] `voucher_ids.csv` chứa đúng ID của voucher vừa tạo
- [ ] Đã **reset** `user_vouchers` (DELETE trước mỗi lần test)
- [ ] Test thủ công bằng curl → nhận `{"code":1000}` ✅
- [ ] JSON Extractor path là `$.result.token` (không phải `$.token`)
- [ ] Header `Authorization: Bearer ${ACCESS_TOKEN}` nằm **trong** sampler Claim Voucher
- [ ] **Disable** View Results Tree trước khi chạy full
- [ ] Sau test: chạy SQL kiểm tra `COUNT(*) FROM user_vouchers` phải ≤ 10

---

## So Sánh Với Các TG Khác

| | TG_05 | TG_06 | TG_07 | **TG_08** |
|---|---|---|---|---|
| **Loại test** | Spike | Stress | Load | **Spike (Race Condition)** |
| **Ramp-up** | 5s | 30s | 60s | **3s** |
| **Error % mong đợi** | < 3% | < 5% | < 1% | **~87.5%** (bình thường!) |
| **Assert chính** | code=1000 | code=1000 | code=1000 | **NOT 500** |
| **Reset sau test** | Reset stock | Reset stock | Không cần | **DELETE user_vouchers** |
| **Bảng DB kiểm tra** | product_variants | orders | orders | **user_vouchers** |
| **Mục tiêu chính** | Phát hiện race condition cart | Đo breaking point | Đo pagination load | **Đếm chính xác số claim** |
