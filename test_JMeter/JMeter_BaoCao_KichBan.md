# BÁO CÁO CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ HIỆU NĂNG JMETER
## Hệ thống: Bookstore Microservices

---

## TỔNG QUAN

| Thông số | Giá trị |
|---|---|
| Công cụ | Apache JMeter |
| Môi trường | localhost, API Gateway port 8888 |
| Database | MySQL 8, shared DB `profile_service` |
| Số kịch bản | 8 Thread Groups (TG_01 → TG_08) |
| Loại test | Load Test, Stress Test, Spike Test |

---

## TG_01 — User Login (Authentication Load Test)

### Lý do chọn
Login là **điểm vào duy nhất** của toàn hệ thống. Mỗi request phải: tra cứu DB → verify bcrypt password (CPU-intensive) → ký JWT. Nếu login chậm → toàn bộ UX bị ảnh hưởng.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `POST /api/v1/identity/auth/token` |
| Loại test | Load Test |
| Số Threads | 100 |
| Ramp-up | 60 giây |
| Loop | 1 |
| Tổng request | **100 requests** |
| Target Throughput | 50 req/s (= 3000 req/phút) |
| Auth | Không cần |
| Test Data | CSV: 100 cặp username/password |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 500ms** | > 1000ms |
| p99 | **< 1000ms** | > 2000ms |
| Average | < 300ms | > 600ms |
| Error Rate | **< 1%** | > 5% |
| Throughput | ≥ 50 req/s | < 20 req/s |
| Duration Assert | < 2000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Response Assertion | Body contains | `"token"` |
| Duration Assertion | Max time | < 2000ms |
| JSON Extractor | Lấy token | `$.result.token` → `ACCESS_TOKEN` |

### Bottleneck
- bcrypt verification tốn CPU mỗi request
- DB lookup bảng users không có cache

---

## TG_02 — Product Listing (Browse Homepage Load Test)

### Lý do chọn
Homepage nhận **80% tổng traffic**. Không có cache, mỗi request là 1 paginated SQL query. Test xác minh hệ thống chịu được 100 SELECT/giây liên tục.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `GET /api/v1/product/products?page={page}&limit=12` |
| Loại test | Load Test |
| Số Threads | 200 |
| Ramp-up | 60 giây |
| Loop | 5 |
| Tổng request | **1,000 requests** |
| Target Throughput | 100 req/s (= 6000 req/phút) |
| Auth | Không cần (public) |
| Test Data | Random Variable: page = 1–10 |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 800ms** | > 2000ms |
| p99 | **< 1500ms** | > 3000ms |
| Error Rate | **< 0.5%** | > 2% |
| Throughput | ≥ 100 req/s | < 40 req/s |
| Duration Assert | < 2000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Response Assertion | Text Response contains | `"result"` |
| Duration Assertion | Max time | < 2000ms |

---

## TG_03 — Advanced Product Search (Stress Test)

### Lý do chọn
Query phức tạp nhất hệ thống: fuzzy search + multi-filter JOIN (keyword + minPrice + maxPrice + brandId + categoryId). Không có index tốt → full table scan → latency tăng phi tuyến. Mục tiêu: tìm **breaking point**.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `GET /api/v1/product/products/search/advanced` |
| Loại test | **Stress Test** |
| Số Threads | 200 (tăng dần từ 0) |
| Ramp-up | **120 giây** |
| Loop | 10 |
| Tổng request | **2,000 requests** |
| Target Throughput | 30 req/s (= 1800 req/phút) |
| Think Time | Gaussian: 500ms ± 200ms |
| Auth | Không cần (public) |
| Test Data | CSV: 30 bộ params (keyword, minPrice, maxPrice, brandId, categoryId) |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 2000ms** | > 5000ms |
| p99 | **< 3000ms** | > 8000ms |
| Error Rate | **< 2%** | > 10% |
| Throughput | ≥ 30 req/s | < 10 req/s |
| Duration Assert | < 5000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Duration Assertion | Max time | < 5000ms |

### Listeners đặc thù (Stress Test)
- **Response Time Graph**: xác định breaking point
- **Active Threads Over Time**: correlate thread count vs response time

---

## TG_04 — Product Detail Page (Concurrent Read)

### Lý do chọn
Trang chi tiết sản phẩm = **~60% traffic** hệ thống. API JOIN: Product → Variant → SpecAttribute → Review. Thiếu index trên FK → chậm dưới tải cao.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `GET /api/v1/product/products/{id}` |
| Loại test | Load Test |
| Số Threads | 150 |
| Ramp-up | 60 giây |
| Loop | 10 |
| Tổng request | **1,500 requests** |
| Target Throughput | 80 req/s (= 4800 req/phút) |
| Auth | Không cần (public) |
| Test Data | CSV: 20 product_id thực từ DB |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 600ms** | > 1500ms |
| p99 | < 1000ms | > 2000ms |
| Error Rate | **< 0.5%** | > 2% |
| Throughput | ≥ 80 req/s | < 30 req/s |
| Duration Assert | < 2000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Response Assertion | Body contains | `"variants"` |
| Duration Assertion | Max time | < 2000ms |

---

## TG_05 — Add to Cart (Race Condition Spike Test)

### Lý do chọn
Flash sale: 100 users cùng add cùng sản phẩm → race condition trên upsert → duplicate items, sai quantity. Ramp-up 5 giây mô phỏng flash sale bắt đầu đột ngột.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `POST /api/v1/cart/items` |
| Loại test | **Spike Test** |
| Số Threads | 100 |
| Ramp-up | **5 giây** |
| Loop | 3 |
| Tổng request | **300 requests** |
| Target Throughput | 50 req/s (= 3000 req/phút) |
| Auth | **Cần Bearer Token** |
| Test Data | CSV users (100), CSV variant_ids (**chỉ 5** để tạo contention) |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 1000ms** | > 3000ms |
| p99 | < 2000ms | > 5000ms |
| Error Rate | **< 3%** | > 10% |
| Duration Assert | < 3000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Response Assertion | Body contains | `"result"` |
| Duration Assertion | Max time | < 3000ms |

### Luồng thực thi
1. Login → JSON Extractor: `$.result.token` → `ACCESS_TOKEN`
2. POST cart với `Authorization: Bearer ${ACCESS_TOKEN}`, body: `{"variantId": ${variant_id}, "quantity": 1}`

---

## TG_06 — Create Order (Transaction Stress Test)

### Lý do chọn
Transaction phức tạp nhất hệ thống. 1 request = validate → check stock (Product Svc) → reduce stock (Product Svc) → tạo Order → xóa Cart → update rank (Identity Svc). Dễ deadlock, timeout, race condition. **Phát hiện lỗ hổng Price Manipulation Critical** trong quá trình test.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `POST /api/v1/orders` |
| Loại test | **Stress Test** |
| Số Threads | 50 |
| Ramp-up | 30 giây |
| Loop | 2 |
| Tổng request | **100 requests** |
| Target Throughput | 20 req/s (= 1200 req/phút) |
| Auth | **Cần Bearer Token** |
| Cross-service | Product Service × 2, Identity Service × 1 |
| Test Data | CSV users (100), CSV variant_ids (5), CSV address_ids (5) |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 3000ms** | > 8000ms |
| p99 | **< 5000ms** | > 10000ms |
| Error Rate | **< 5%** | > 15% |
| Throughput | ≥ 20 req/s | < 8 req/s |
| Duration Assert | < 8000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Response Assertion | Body contains | `"result"` |
| Duration Assertion | Max time | < 8000ms |

### Bugs phát hiện

| Bug | Mức độ | Mô tả |
|---|---|---|
| Price Manipulation | **Critical** | Client gửi `price=1` → server không validate → mua MacBook 24tr giá 1đ |
| productId null | High | Server yêu cầu client gửi productId thay vì tự lookup |
| productName null | High | Server yêu cầu client gửi tên SP thay vì query DB |

> Reset stock sau test: `UPDATE product_variant SET stock = 500 WHERE id IN (1,2,3,4,5);`

---

## TG_07 — My Orders List (User History Pagination)

### Lý do chọn
User thường xuyên xem "Đơn hàng của tôi" để kiểm tra trạng thái. Query cần `ORDER BY created_at DESC + filter user_id` — thiếu composite index → chậm khi DB lớn.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `GET /api/v1/orders/my-orders?page=1&limit=12` |
| Loại test | Load Test |
| Số Threads | 100 |
| Ramp-up | 60 giây |
| Loop | 5 |
| Tổng request | **500 requests** |
| Target Throughput | 40 req/s (= 2400 req/phút) |
| Auth | **Cần Bearer Token** |
| Test Data | CSV users (100) |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 1000ms** | > 2500ms |
| Error Rate | **< 1%** | > 5% |
| Throughput | ≥ 40 req/s | < 15 req/s |
| Duration Assert | < 3000ms | — |

### Assertions

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | HTTP Status | = 200 |
| Response Assertion | Body contains | `"result"` |
| Duration Assertion | Max time | < 3000ms |

---

## TG_08 — Voucher Claim (Race Condition Spike Test)

### Lý do chọn
Voucher flash sale "Giảm 50% cho 10 người đầu tiên": 80 users tranh giành 1 voucher maxUsage=10. Không có lock → over-claim → công ty mất tiền. Test xác nhận hệ thống cấp đúng 10 voucher.

### Cấu hình

| Thuộc tính | Giá trị |
|---|---|
| API | `POST /api/v1/vouchers/{id}/claim` |
| Loại test | **Spike Test (Race Condition)** |
| Số Threads | 80 |
| Ramp-up | **3 giây** (nhanh nhất) |
| Loop | 1 |
| Tổng request | **80 requests** |
| Target Throughput | 80 req/s (= 4800 req/phút) |
| Auth | **Cần Bearer Token** |
| Test Data | CSV users (80), CSV voucher_ids (1 voucher, maxUsage=10) |

### Ngưỡng SLA

| Metric | PASS | FAIL |
|---|---|---|
| p95 | **< 1500ms** | > 4000ms |
| Số request 200 | **= đúng 10** | > 10 (over-claim!) |
| Số request 400 | = 70 (bình thường) | — |
| Số request 500 | **= 0** | Bất kỳ 500 nào |
| Error Rate | **~87.5% (bình thường!)** | Có request 500 |
| Duration Assert | < 4000ms | — |

### Assertions (đặc biệt)

| Assertion | Kiểm tra | Giá trị |
|---|---|---|
| Response Assertion | **NOT** 500 | Pattern = **Not** Equals `500` |
| Duration Assertion | Max time | < 4000ms |

> ⚠️ **Không assert HTTP 200** — cả 200 và 400 đều hợp lệ!

### Kiểm tra sau test
```sql
SELECT current_usage FROM vouchers WHERE code = 'JMETER_TEST_10';
-- PHẢI = 10
```

---

## BẢNG TỔNG HỢP 8 KỊCH BẢN

| | TG_01 | TG_02 | TG_03 | TG_04 | TG_05 | TG_06 | TG_07 | TG_08 |
|---|---|---|---|---|---|---|---|---|
| **Loại test** | Load | Load | Stress | Load | Spike | Stress | Load | Spike |
| **Threads** | 100 | 200 | 200 | 150 | 100 | 50 | 100 | 80 |
| **Ramp-up** | 60s | 60s | 120s | 60s | **5s** | 30s | 60s | **3s** |
| **Loop** | 1 | 5 | 10 | 10 | 3 | 2 | 5 | 1 |
| **Tổng req** | 100 | 1,000 | 2,000 | 1,500 | 300 | 100 | 500 | 80 |
| **Throughput** | 50/s | 100/s | 30/s | 80/s | 50/s | 20/s | 40/s | 80/s |
| **SLA p95** | 500ms | 800ms | 2000ms | 600ms | 1000ms | 3000ms | 1000ms | 1500ms |
| **Error limit** | <1% | <0.5% | <2% | <0.5% | <3% | <5% | <1% | ~87%(ok) |
| **Duration Assert** | 2000ms | 2000ms | 5000ms | 2000ms | 3000ms | 8000ms | 3000ms | 4000ms |
| **Cần Auth** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Rủi ro** | High | High | Critical | High | High | Critical | Medium | High |

---

## TIÊU CHÍ PASS/FAIL TOÀN HỆ THỐNG

| Tiêu chí | PASS | FAIL |
|---|---|---|
| Login p95 | ≤ 500ms | > 1000ms |
| Product List p95 | ≤ 800ms | > 2000ms |
| Advanced Search p95 | ≤ 2000ms | > 5000ms |
| Product Detail p95 | ≤ 600ms | > 1500ms |
| Add Cart p95 | ≤ 1000ms | > 3000ms |
| Create Order p95 | ≤ 3000ms | > 8000ms |
| My Orders p95 | ≤ 1000ms | > 2500ms |
| Voucher Claim (số 200) | = 10 | ≠ 10 |
| Error rate tổng thể | ≤ 1% | > 5% |
| OOM errors | 0 | Bất kỳ |
| DB pool exhaustion | 0 | Bất kỳ |
| Voucher over-claim | 0 | current_usage > 10 |

---

## MONITORING TRONG QUÁ TRÌNH TEST

| Metric | Tool | Warning | Critical |
|---|---|---|---|
| CPU server | PerfMon/htop | > 70% | > 90% |
| JVM Heap | JVM metrics | > 80% | > 95% |
| DB connections | SHOW PROCESSLIST | > 80% pool | Pool exhausted |
| DB slow queries | slow_query_log | > 1s | > 5s |
| Response p95 | JMeter Aggregate | > SLA | > 2× SLA |
| TPS | JMeter TPS graph | < 50% target | < 20% target |
