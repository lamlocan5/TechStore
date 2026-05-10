# Phần 3: Thiết Kế Kịch Bản JMeter (Thread Groups)

---

## TG_01 - User Login (Authentication Load Test)

- **Mục tiêu**: Đo hiệu năng đăng nhập khi nhiều user đồng thời, kiểm tra JWT issuance performance
- **API**: POST /api/v1/identity/auth/token
- **Method**: POST
- **Loại test**: Load Test
- **Threads**: 100
- **Ramp-up**: 60 giây
- **Loop**: 1
- **Duration**: 5 phút
- **Target throughput**: 50 req/s
- **Response threshold**: p95 < 500ms, p99 < 1000ms
- **Error threshold**: < 1%
- **Test data**: CSV chứa username/password (100 user test accounts)
- **Assertions**:
  - Response code = 200
  - Body chứa "token"
  - Response time < 2000ms
- **Correlation**: Extract token từ response → dùng cho TG_02, TG_03...
- **Dependencies**: DB có sẵn user data
- **Risk**: High - DB lookup + bcrypt verification mỗi request
- **Vì sao chọn test**: Đây là điểm vào duy nhất, nếu login chậm toàn bộ UX bị ảnh hưởng

**Config JMeter**:
```
HTTP Request:
  Server: localhost
  Port: 8888
  Path: /api/v1/identity/auth/token
  Method: POST
  Body: {"username": "${username}", "password": "${password}"}
  
Headers:
  Content-Type: application/json

Extractors:
  JSON Extractor: $.result.token → save as ACCESS_TOKEN
```

---

## TG_02 - Product Listing (Browse Homepage Load Test)

- **Mục tiêu**: Đo hiệu năng trang danh sách sản phẩm - endpoint nhiều user truy cập nhất
- **API**: GET /api/v1/product/products?page=1&limit=12
- **Method**: GET
- **Loại test**: Load Test
- **Threads**: 200
- **Ramp-up**: 60 giây
- **Loop**: 5
- **Duration**: 10 phút
- **Target throughput**: 100 req/s
- **Response threshold**: p95 < 800ms, p99 < 1500ms
- **Error threshold**: < 0.5%
- **Test data**: Random page=1..10, limit=12
- **Assertions**:
  - Response code = 200
  - Body chứa "result"
  - Response time < 2000ms
- **Correlation**: Không cần token (public endpoint)
- **Dependencies**: DB có sản phẩm
- **Risk**: High - paginated query, không có cache
- **Vì sao chọn test**: Homepage - 80% traffic đổ vào đây

**Config JMeter**:
```
HTTP Request:
  Path: /api/v1/product/products
  Params: page=${page}, limit=12, search=${search_keyword}
  
Random Variable:
  page: 1-10
  search_keyword: CSV file với keywords
```

---

## TG_03 - Advanced Product Search (Search Stress Test)

- **Mục tiêu**: Kiểm tra hiệu năng fuzzy search với nhiều filter đồng thời
- **API**: GET /api/v1/product/products/search/advanced
- **Method**: GET
- **Loại test**: Stress Test
- **Threads**: 50 → 200 (tăng dần)
- **Ramp-up**: 120 giây
- **Loop**: 10
- **Duration**: 15 phút
- **Target throughput**: 30 req/s
- **Response threshold**: p95 < 2000ms, p99 < 3000ms
- **Error threshold**: < 2%
- **Test data**: CSV với keyword, minPrice, maxPrice, brandId, categoryId
- **Assertions**:
  - Response code = 200
  - Response time < 5000ms
- **Correlation**: Không cần token
- **Dependencies**: DB có sản phẩm, brands, categories
- **Risk**: Critical - multi-filter JOIN query, fuzzy search có thể gây full table scan
- **Vì sao chọn test**: Đây là query phức tạp nhất, không có index tốt sẽ chậm nghiêm trọng

**Config JMeter**:
```
HTTP Request Params:
  keyword: ${keyword}
  minPrice: ${min_price}
  maxPrice: ${max_price}
  brandId: ${brand_id}
  categoryId: ${category_id}
  page: 1
  limit: 12

CSV Data:
  keywords.csv: laptop, macbook, iphone, samsung, oppo...
  price_ranges.csv: 0-5000000, 5000000-20000000...
```

---

## TG_04 - Product Detail Page (Concurrent Read)

- **Mục tiêu**: Đo hiệu năng xem chi tiết sản phẩm khi nhiều user xem cùng lúc
- **API**: GET /api/v1/product/products/{id}
- **Method**: GET
- **Loại test**: Load Test
- **Threads**: 150
- **Ramp-up**: 60 giây
- **Loop**: 10
- **Duration**: 10 phút
- **Target throughput**: 80 req/s
- **Response threshold**: p95 < 600ms
- **Error threshold**: < 0.5%
- **Test data**: CSV với product IDs (20-50 sản phẩm phổ biến)
- **Assertions**:
  - Response code = 200
  - Body chứa "variants"
- **Correlation**: Không cần token
- **Dependencies**: DB có products và variants
- **Risk**: High - JOIN với ProductVariant, SpecAttribute, Review
- **Vì sao chọn test**: Trang xem sản phẩm = 60% traffic

---

## TG_05 - Add to Cart Concurrent (Race Condition Test)

- **Mục tiêu**: Phát hiện race condition khi nhiều user thêm sản phẩm vào cart cùng lúc
- **API**: POST /api/v1/cart/items
- **Method**: POST
- **Loại test**: Spike Test
- **Threads**: 100 (spike sudden)
- **Ramp-up**: 5 giây (spike nhanh)
- **Loop**: 3
- **Duration**: 3 phút
- **Target throughput**: 50 req/s
- **Response threshold**: p95 < 1000ms
- **Error threshold**: < 3%
- **Test data**: Token từ TG_01, CSV variantId (cùng 5 sản phẩm để tạo contention)
- **Assertions**:
  - Response code = 200 hoặc 409 (conflict expected)
  - Body chứa "result"
- **Correlation**: Dùng ACCESS_TOKEN từ TG_01 Login
- **Dependencies**: User đã đăng nhập, sản phẩm tồn tại
- **Risk**: High - concurrent write to cart, upsert logic
- **Vì sao chọn test**: Cart add là hành động đồng thời cao trong flash sale

**Config JMeter**:
```
HTTP Request:
  Path: /api/v1/cart/items
  Body: {"variantId": ${variant_id}, "quantity": 1}
  
Header:
  Authorization: Bearer ${ACCESS_TOKEN}

Spike Config:
  Ramp up 100 threads trong 5 giây
```

---

## TG_06 - Create Order (Transaction Stress Test)

- **Mục tiêu**: Đo hiệu năng tạo đơn hàng - transaction phức tạp nhất hệ thống
- **API**: POST /api/v1/orders
- **Method**: POST
- **Loại test**: Stress Test
- **Threads**: 50
- **Ramp-up**: 30 giây
- **Loop**: 2
- **Duration**: 10 phút
- **Target throughput**: 20 req/s
- **Response threshold**: p95 < 3000ms, p99 < 5000ms
- **Error threshold**: < 5%
- **Test data**: Token, variantId, quantity, addressId, paymentMethod=COD
- **Assertions**:
  - Response code = 200 hoặc 201
  - Body chứa "orderId"
- **Correlation**: ACCESS_TOKEN, variantId đủ stock
- **Dependencies**: User login, cart có items, address đã tạo, stock > 0
- **Risk**: Critical - gọi cross-service (product để giảm stock, identity để update rank), DB transaction
- **Vì sao chọn test**: Dễ deadlock, timeout, race condition khi stock thấp

**Config JMeter**:
```
HTTP Request:
  Path: /api/v1/orders
  Body: {
    "items": [{"variantId": ${variant_id}, "quantity": 1}],
    "addressId": ${address_id},
    "paymentMethod": "COD",
    "voucherCode": null
  }
  
Header:
  Authorization: Bearer ${ACCESS_TOKEN}
```

---

## TG_07 - My Orders List (User History Pagination)

- **Mục tiêu**: Đo hiệu năng lấy danh sách đơn hàng của user (paginated)
- **API**: GET /api/v1/orders/my-orders?page=1&limit=12
- **Method**: GET
- **Loại test**: Load Test
- **Threads**: 100
- **Ramp-up**: 60 giây
- **Loop**: 5
- **Duration**: 8 phút
- **Target throughput**: 40 req/s
- **Response threshold**: p95 < 1000ms
- **Error threshold**: < 1%
- **Test data**: Token từ 100 users khác nhau
- **Assertions**:
  - Response code = 200
  - Body chứa "result"
- **Correlation**: ACCESS_TOKEN (per user)
- **Dependencies**: User đã có orders trong DB
- **Risk**: Medium - paginated query với sort by createdAt DESC
- **Vì sao chọn test**: Trang "Đơn hàng của tôi" được xem thường xuyên

---

## TG_08 - Voucher Claim Concurrent (Concurrency Test)

- **Mục tiêu**: Kiểm tra race condition khi nhiều user claim cùng một voucher có giới hạn
- **API**: POST /api/v1/vouchers/{id}/claim
- **Method**: POST
- **Loại test**: Spike Test
- **Threads**: 80
- **Ramp-up**: 3 giây
- **Loop**: 1
- **Duration**: 2 phút
- **Target throughput**: 80 req/s
- **Response threshold**: p95 < 1500ms
- **Error threshold**: < 50% (vì voucher có giới hạn, nhiều request sẽ fail)
- **Test data**: 80 user tokens, 1 voucher ID có giới hạn 10 lượt dùng
- **Assertions**:
  - Response code = 200 (claimed) hoặc 400 (hết lượt) - cả hai đều chấp nhận
  - Kiểm tra total successful = đúng giới hạn voucher
- **Correlation**: ACCESS_TOKEN, voucherId
- **Dependencies**: Voucher active với maxUsage=10
- **Risk**: High - concurrent write, có thể over-claim nếu không có distributed lock
- **Vì sao chọn test**: Phát hiện lỗi race condition trong claim voucher

---

## TG_09 - Revenue Statistics Admin (Heavy Aggregate)

- **Mục tiêu**: Đo hiệu năng query thống kê doanh thu - aggregate query phức tạp
- **API**: GET /api/v1/orders/revenue-statistics?period=month&year=2025&month=5
- **Method**: GET
- **Loại test**: Load Test
- **Threads**: 20
- **Ramp-up**: 30 giây
- **Loop**: 10
- **Duration**: 10 phút
- **Target throughput**: 5 req/s
- **Response threshold**: p95 < 5000ms, p99 < 10000ms
- **Error threshold**: < 1%
- **Test data**: Admin token, params: period=[month/quarter/year], year=2025
- **Assertions**:
  - Response code = 200
  - Response time < 15000ms
- **Correlation**: ADMIN_TOKEN
- **Dependencies**: Admin user, có dữ liệu orders
- **Risk**: High - GROUP BY aggregation trên bảng orders lớn, chậm nếu không có index
- **Vì sao chọn test**: Admin dashboard, thường bị bỏ qua nhưng query rất nặng

---

## TG_10 - End-to-End User Journey (Soak Test)

- **Mục tiêu**: Mô phỏng hành trình user hoàn chỉnh: Login → Xem SP → Tìm kiếm → Thêm cart → Tạo đơn
- **APIs liên quan**:
  1. POST /auth/token
  2. GET /products (random page)
  3. GET /products/search/advanced
  4. GET /products/{id}
  5. GET /variants/product/{id}
  6. POST /api/cart/items
  7. GET /api/cart
  8. POST /api/orders
  9. GET /api/orders/my-orders
- **Method**: Mixed
- **Loại test**: Soak Test (Endurance)
- **Threads**: 30
- **Ramp-up**: 60 giây
- **Loop**: Infinite
- **Duration**: 30 phút
- **Target throughput**: Tự nhiên theo flow
- **Response threshold**: Không có API nào vượt p95 > 3000ms liên tục
- **Error threshold**: < 2% tổng thể
- **Test data**: 30 user accounts, product IDs, variant IDs
- **Assertions**: Mỗi step đều có assertion riêng
- **Correlation**: Token từ step 1, productId từ step 2-3, variantId từ step 5
- **Dependencies**: Full data setup
- **Risk**: Critical - phát hiện memory leak, connection pool exhaustion theo thời gian
- **Vì sao chọn test**: Soak test 30 phút phát hiện resource leak mà load test ngắn không thấy

**Config JMeter với Transaction Controller**:
```
Transaction Controller: "Full User Journey"
  ├── HTTP: Login → extract ACCESS_TOKEN
  ├── Think Time: 2000ms (Gaussian Timer)
  ├── HTTP: Browse products → extract productId
  ├── Think Time: 1500ms
  ├── HTTP: Search products
  ├── Think Time: 1000ms
  ├── HTTP: View product detail → extract variantId
  ├── Think Time: 2000ms
  ├── HTTP: Add to cart
  ├── Think Time: 3000ms
  └── HTTP: Create order
```
