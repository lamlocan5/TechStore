# Phần 2: Danh Sách API & Phân Loại

## 2. Bảng Danh Sách API

| API | Method | Module | Auth? | DB Query? | Risk Level | Nên test? | Lý do |
|---|---|---|---|---|---|---|---|
| /api/v1/identity/auth/token | POST | Identity | No | Yes (find user) | High | ✅ | Điểm vào hệ thống, mọi user đều qua đây |
| /api/v1/identity/auth/refresh | POST | Identity | No | Yes | Medium | ✅ | Token refresh thường xuyên |
| /api/v1/identity/auth/logout | POST | Identity | Yes | Yes (insert blacklist) | Medium | ✅ | Invalidate token, write DB |
| /api/v1/identity/users/createUser | POST | Identity | No | Yes (insert) | Medium | ⚠️ | Tạo user - không test quá nhiều |
| /api/v1/identity/users | GET | Identity | Yes(ADMIN) | Yes (paginated) | Low | ✅ | Paginated list |
| /api/v1/identity/users/my-info | GET | Identity | Yes | Yes | Medium | ✅ | Được gọi thường xuyên từ FE |
| /api/v1/product/products | GET | Product | No | Yes (paginated) | High | ✅ | Trang chủ, tải nặng nhất |
| /api/v1/product/products/{id} | GET | Product | No | Yes (JOIN variants) | High | ✅ | Detail page, nhiều JOIN |
| /api/v1/product/products/search | GET | Product | No | Yes (LIKE query) | High | ✅ | Search, hay bị slow |
| /api/v1/product/products/search/advanced | GET | Product | No | Yes (multi-filter JOIN) | Critical | ✅ | Fuzzy search + price + brand + category |
| /api/v1/product/products/brand/{brandId} | GET | Product | No | Yes (paginated) | Medium | ✅ | Filter by brand |
| /api/v1/product/categories | GET | Product | No | Yes | Low | ✅ | Navbar, gọi thường xuyên |
| /api/v1/product/brands | GET | Product | No | Yes | Low | ✅ | Filter sidebar |
| /api/v1/product/variants/product/{productId} | GET | Product | No | Yes | High | ✅ | Hiển thị option sản phẩm |
| /api/v1/product/reviews/product/{productId} | GET | Product | No | Yes (paginated) | Medium | ✅ | Reviews có thể nhiều |
| /api/v1/product/reviews | POST | Product | Yes | Yes + check purchase | High | ✅ | Kiểm tra cross-service |
| /api/v1/cart | GET | Order | Yes | Yes | Medium | ✅ | Load cart mỗi khi mở app |
| /api/v1/cart/items | POST | Order | Yes | Yes (upsert) | High | ✅ | Race condition risk |
| /api/v1/cart/items/{itemId} | PUT | Order | Yes | Yes | Medium | ✅ | Update quantity |
| /api/v1/cart/items/{itemId} | DELETE | Order | Yes | Yes | Low | ⚠️ | Không test quá nhiều |
| /api/v1/orders | POST | Order | Yes | Yes (transaction) | Critical | ✅ | Transaction phức tạp nhất |
| /api/v1/orders/my-orders | GET | Order | Yes | Yes (paginated) | Medium | ✅ | Hay được gọi |
| /api/v1/orders/{id} | GET | Order | Yes | Yes | Medium | ✅ | Order detail |
| /api/v1/orders/{id} | DELETE | Order | Yes | Yes (cancel) | Medium | ⚠️ | Không test bulk |
| /api/v1/orders/statistics/sales | GET | Order | Yes(ADMIN) | Yes (aggregate) | High | ✅ | Aggregate query |
| /api/v1/orders/revenue-statistics | GET | Order | Yes(ADMIN) | Yes (aggregate) | High | ✅ | Heavy aggregate |
| /api/v1/vouchers/active | GET | Order | No | Yes | Low | ✅ | Voucher listing |
| /api/v1/vouchers/available-for-me | GET | Order | Yes | Yes + cross-service | Medium | ✅ | Cross-service call |
| /api/v1/vouchers/{id}/claim | POST | Order | Yes | Yes (write) | Medium | ✅ | Concurrent claim risk |
| /api/v1/vouchers/my-wallet | GET | Order | Yes | Yes | Low | ✅ | User voucher list |
| /api/v1/payment/create-payment | POST | Payment | No | Yes (cross-service) | High | ✅ | Payment initiation |
| /api/v1/profile/users/{userId} | GET | Profile | No | Yes | Low | ✅ | Được gọi nhiều |
| /api/v1/profile/addresses/my-address | GET | Profile | Yes | Yes | Low | ✅ | Checkout flow |
| /api/v1/profile/addresses | POST | Profile | Yes | Yes | Low | ⚠️ | Không test nhiều |

## 3. Phân Loại Nhóm API

### Auth APIs
- POST /auth/token
- POST /auth/refresh
- POST /auth/logout

### Product APIs
- GET /products (list, paginated)
- GET /products/{id} (detail)
- GET /variants/product/{productId}

### Search APIs
- GET /products/search
- GET /products/search/advanced
- GET /categories
- GET /brands

### Cart APIs
- GET /api/cart
- POST /api/cart/items
- PUT /api/cart/items/{id}

### Order APIs
- POST /api/orders (create)
- GET /api/orders/my-orders
- GET /api/orders/{id}

### Voucher APIs
- GET /api/vouchers/active
- GET /api/vouchers/available-for-me
- POST /api/vouchers/{id}/claim

### Payment APIs
- POST /api/vnpay/create-payment

### Review APIs
- GET /reviews/product/{productId}
- POST /reviews

### Admin/Reporting APIs
- GET /api/orders/statistics/sales
- GET /api/orders/revenue-statistics

## 4. API KHÔNG Nên Performance Test

| API | Lý do |
|---|---|
| POST /users/createUser (bulk) | Tạo dữ liệu thật trong DB production |
| DELETE /users/{userId} | Xóa dữ liệu không phục hồi |
| DELETE /products/{id} | Xóa product trong production |
| PUT /orders/{id}/status (ADMIN) | Thay đổi trạng thái đơn thật |
| DELETE /api/cart/clear | Xóa cart thật |
| POST /variants/internal/{id}/stock/reduce | Internal endpoint, không expose qua gateway |
| GET /api/vnpay/payment-return | Callback từ VNPay - không test vì phụ thuộc external |
| GET /api/vnpay/payment-ipn | IPN callback - chỉ VNPay gọi |
| /chatbot/**, /ai-image-search/** | AI endpoints - loại trừ theo yêu cầu |
| POST /auth/forgot-password | Gọi email service thật |
