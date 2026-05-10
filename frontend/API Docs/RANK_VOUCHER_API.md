## Quản lý Rank User & Voucher theo Rank

Tài liệu này mô tả các API và luồng xử lý để FE ghép tính năng:
- Hạng thành viên (Rank) của User
- Voucher theo Rank
- Kho voucher (Voucher Wallet)
- Áp dụng voucher khi checkout

---

### 1. Rank User (Membership Rank)

#### 1.1. Các hạng hiện tại

Backend định nghĩa 4 hạng (enum):

- **BRONZE**: Đồng – hạng mặc định, tổng chi tiêu \< = 10,000,000 VNĐ
- **SILVER**: Bạc – tổng chi tiêu \> 10,000,000 VNĐ
- **GOLD**: Vàng – tổng chi tiêu \> 40,000,000 VNĐ
- **DIAMOND**: Kim Cương – tổng chi tiêu \> 100,000,000 VNĐ

Tổng chi tiêu \(totalSpent\) được tính từ **tổng tiền đơn hàng đã hoàn thành (COMPLETED)**. Đơn đang giao/hủy không được tính.

#### 1.2. Thuộc tính mới trên User (Identity Service)

Response `UserResponse` (dùng cho `/users`, `/users/my-info`, `/users/{userId}`) có thêm:

- **totalSpent**: `number` – tổng tiền user đã chi (VNĐ)
- **rank**: `string` – một trong: `BRONZE | SILVER | GOLD | DIAMOND`

FE có thể dùng `rank` để:

- Hiển thị huy hiệu hạng
- Lọc/tắt-bật nút "Lấy mã", "Chỉ dành cho hạng GOLD"…

#### 1.3. Cập nhật Rank tự động

Khi **Order** chuyển sang trạng thái `COMPLETED`:

- `order-service` gọi nội bộ `identity-service` để cộng dồn `totalSpent` cho user dựa trên `order.total`
- `identity-service` tính lại rank theo bảng ngưỡng trên

FE không phải tự tính rank, chỉ cần đọc `rank` từ API.

---

### 2. Voucher theo Rank

#### 2.1. Thuộc tính Voucher

Bên `order-service`, entity `Voucher` có thêm:

- **minRankRequired**: `string` – rank tối thiểu được phép dùng/claim voucher  
  Một trong: `BRONZE | SILVER | GOLD | DIAMOND`  
  Mặc định: `BRONZE`

Các thuộc tính cũ vẫn giữ:

- **discountType**: `PERCENT` hoặc `AMOUNT`
- **discountValue**, **discountMaxValue**
- **minOrderTotal**
- **startAt**, **endAt**
- **maxUsage**: tổng số lần sử dụng tối đa toàn hệ thống
- **maxPerUser**: số lần tối đa mỗi user được dùng/claim
- **status**: `1` = active, `0` = inactive

#### 2.2. Phân loại Voucher

Hiện logic backend hỗ trợ:

- **Voucher thu thập (Collectible)**:
  - Hiển thị trên trang "Mã giảm giá"
  - User cần **claim (Lấy mã)** → được lưu vào kho cá nhân (`user_vouchers`)
  - Khi checkout, nếu voucher yêu cầu claim (có `maxPerUser`), backend sẽ kiểm tra user đã có trong kho chưa

- **Voucher tự động tặng (System Gift)**:
  - Có thể cấu hình bằng cách tạo các voucher với code cố định (VD: `RANK_SILVER_WELCOME`, `RANK_GOLD_WELCOME`…) và tự gọi internal API từ Identity Service (phần này có thể mở rộng thêm nếu cần).

---

### 3. API chính cho FE

#### 3.1. Lấy thông tin user + rank hiện tại

- **Service**: `identity-service` (qua Gateway)
- **Method**: `GET`
- **URL gốc** (tham khảo): `/users/my-info`
- **Auth**: bắt buộc (JWT)

**Response (rút gọn)**:

```json
{
  "code": 1000,
  "message": null,
  "result": {
    "id": "string",
    "username": "string",
    "firstName": "string",
    "lastName": "string",
    "dob": "2024-01-01",
    "roles": [],
    "totalSpent": 15000000,
    "rank": "SILVER"
  }
}
```

FE dùng trường `rank` và `totalSpent`.

---

#### 3.2. Lấy danh sách Voucher đang hoạt động (ADMIN)

Đã có sẵn:

- **GET** `/api/vouchers/active`

Dùng cho trang quản trị, không phụ thuộc rank.

---

#### 3.3. Lấy danh sách Voucher khả dụng theo Rank của user (trang "Mã giảm giá")

- **Service**: `order-service`
- **Method**: `GET`
- **URL**: `/api/vouchers/available-for-me`
- **Auth**: bắt buộc (user đã đăng nhập)

**Mô tả**:

- Backend tự lấy `userId` từ token hiện tại.
- Gọi `identity-service` để lấy `rank` của user.
- Lọc danh sách voucher:
  - `status = 1`
  - `startAt <= now <= endAt`
  - `userRank >= minRankRequired` (VD: user GOLD nhìn thấy voucher BRONZE/BẠC/VÀNG)

**Response**:

```json
{
  "code": 1000,
  "message": "Vouchers available for current user rank",
  "result": [
    {
      "id": 1,
      "code": "BRONZE_5K",
      "name": "Giảm 5K cho hạng Đồng",
      "discountType": "AMOUNT",
      "discountValue": 5000,
      "discountMaxValue": null,
      "minOrderTotal": 100000,
      "startAt": "2025-01-01T00:00:00",
      "endAt": "2025-12-31T23:59:59",
      "maxUsage": 1000,
      "maxPerUser": 1,
      "status": 1,
      "minRankRequired": "BRONZE"
    }
  ]
}
```

**Gợi ý UI**:

- Nếu muốn hiển thị các voucher **cao hơn rank hiện tại** để "nhá hàng", FE có thể gọi API admin `/api/vouchers/active` và tự so sánh `minRankRequired` với rank user để:
  - Nếu `userRank < minRankRequired` → show nút disabled + text:  
    `"Chỉ dành cho thành viên hạng {minRankRequired} trở lên"`.

---

#### 3.4. User claim voucher vào ví cá nhân (Collectible)

- **Service**: `order-service`
- **Method**: `POST`
- **URL**: `/api/vouchers/{id}/claim`
- **Auth**: bắt buộc

**Path params**:

- `id`: ID của voucher

**Body**: *không cần body*

**Logic backend**:

- Lấy `userId` từ token.
- Lấy rank hiện tại từ identity-service.
- Check:
  - `status = 1`
  - `startAt <= now <= endAt`
  - `userRank >= minRankRequired`
  - `maxUsage` (tổng) chưa vượt
  - `maxPerUser` chưa vượt (user chưa claim quá số lần cho phép)
- Nếu OK → tạo bản ghi trong bảng `user_vouchers` với:
  - `user_id`
  - `voucher_id`
  - `is_used = false`
  - `claimed_at = now`

**Response (thành công)**:

```json
{
  "code": 1000,
  "message": "Voucher claimed successfully",
  "result": null
}
```

**Các lỗi có thể gặp** (mã message tóm tắt):

- `VOUCHER_NOT_FOUND`
- `VOUCHER_NOT_ACTIVE`
- `VOUCHER_NOT_VALID_TIME`
- `VOUCHER_RANK_NOT_ENOUGH` – rank không đủ
- `VOUCHER_USAGE_LIMIT_REACHED` – hết tổng số lượng
- `VOUCHER_USER_USAGE_LIMIT_REACHED` – user đã claim đủ số lần

---

#### 3.5. Xem kho Voucher cá nhân (Voucher Wallet)

- **Service**: `order-service`
- **Method**: `GET`
- **URL**: `/api/vouchers/my-wallet`
- **Auth**: bắt buộc

**Mô tả**:

- Lấy tất cả bản ghi trong bảng `user_vouchers` với:
  - `user_id = currentUser`
  - `is_used = false`

**Response (rút gọn)**:

```json
{
  "code": 1000,
  "message": "My voucher wallet",
  "result": [
    {
      "id": 10,
      "userId": "user-123",
      "voucherId": 1,
      "isUsed": false,
      "claimedAt": "2025-01-10T10:00:00",
      "usedAt": null
    }
  ]
}
```

> FE có thể cần call thêm `/api/vouchers/{id}` để lấy thông tin chi tiết voucher (code, name, discountType...) hoặc backend có thể mở rộng response nếu cần.

**Gợi ý UI**:

- Trang "Kho voucher" hoặc trong bước checkout:
  - Hiển thị danh sách voucher còn hiệu lực (`isUsed = false`, thời gian còn hạn).
  - Cho phép chọn 1 voucher (hoặc nhiều nếu hệ thống hỗ trợ).

---

#### 3.6. Áp dụng voucher khi checkout

Luồng hiện tại (đã có sẵn, được mở rộng thêm kiểm tra rank + ví):

- **Service**: `order-service`
- **Method**: `POST`
- **URL**: `/api/orders`

**Request (rút gọn)**:

```json
{
  "addressId": 1,
  "voucherCode": "BRONZE_5K",
  "paymentMethod": "CASH_ON_DELIVERY",
  "shippingFee": 20000,
  "note": "Giao giờ hành chính",
  "items": [
    {
      "variantId": 123,
      "quantity": 1,
      "price": 15000000
    }
  ]
}
```

**Backend làm gì**:

1. Tính `subtotal` từ items.
2. Nếu có `voucherCode`:
   - Gọi `VoucherService.validateVoucher(code, userId, subtotal)`:
     - Check tồn tại + active + thời gian + `minOrderTotal`
     - Check `maxUsage`, `maxPerUser`
     - Lấy rank từ identity-service, so với `minRankRequired`
     - Nếu voucher có `maxPerUser` (tức thường là voucher rank/thu thập):
       - Kiểm tra user đã **claim vào ví** hay chưa (`user_vouchers`).
   - Nếu hợp lệ → tính `discount` (`PERCENT` hoặc `AMOUNT`).
3. Tạo order, lưu `voucherId`, `discount`, `total`.
4. Ghi nhận usage vào bảng `voucher_usages`.
5. Nếu user có bản ghi trong `user_vouchers` tương ứng → đánh dấu `is_used = true`, `usedAt = now`.

**Các lỗi FE cần xử lý khi apply voucher**:

- `VOUCHER_NOT_FOUND`
- `VOUCHER_NOT_ACTIVE` / `VOUCHER_NOT_VALID_TIME`
- `VOUCHER_MIN_ORDER_NOT_MET`
- `VOUCHER_USAGE_LIMIT_REACHED`
- `VOUCHER_USER_USAGE_LIMIT_REACHED`
- `VOUCHER_RANK_NOT_ENOUGH`
- `VOUCHER_NOT_IN_WALLET`

---

### 4. Gợi ý tích hợp FE

#### 4.1. Trang "Mã giảm giá"

1. Call `/users/my-info` để lấy `rank`.
2. Call `/api/vouchers/available-for-me` để lấy các voucher phù hợp rank:
   - Render dạng grid/list.
   - Mỗi item:
     - Hiển thị tên, mô tả, minRankRequired.
     - Nút "Lấy mã" → `POST /api/vouchers/{id}/claim`.
3. (Tuỳ chọn) Nếu muốn show full list, call thêm `/api/vouchers/active` (admin), so sánh rank để:
   - Nếu userRank \< minRankRequired → nút disabled + text `"Chỉ dành cho thành viên hạng {minRankRequired}"`.

#### 4.2. Checkout – chọn voucher

1. Trước bước thanh toán:
   - Call `/api/vouchers/my-wallet` để lấy các voucher user đã claim.
   - Hoặc kết hợp với `/api/vouchers/{id}` để hiện code, mô tả.
2. Cho user chọn 1 voucher (lấy `code`).
3. Khi submit order:
   - Gửi `voucherCode` trong body `/api/orders`.
4. Xử lý error code từ backend để hiển thị thông báo phù hợp.

---

### 5. Database (tham khảo)

Tóm tắt các bảng liên quan (backend đã khai báo entity tương ứng):

- **users** (Identity Service):
  - `id` (PK)
  - `username`, `password`, ...
  - `total_spent BIGINT NOT NULL DEFAULT 0`
  - `rank VARCHAR(20) NOT NULL DEFAULT 'BRONZE'`

- **vouchers** (Order Service):
  - Các cột hiện có (id, code, name, discount_*, min_order_total, start_at, end_at, max_usage, max_per_user, status, ...)
  - `min_rank_required VARCHAR(20) NOT NULL DEFAULT 'BRONZE'`

- **user_vouchers** (Order Service):
  - `id` (PK)
  - `user_id` (string, 36)
  - `voucher_id` (FK -> vouchers.id)
  - `is_used` (boolean)
  - `claimed_at` (datetime)
  - `used_at` (datetime, nullable)

- **voucher_usages** (Order Service – đã có):
  - Ghi nhận voucher đã dùng gắn với order cụ thể.

---

## 6. CURL Commands & Postman Collection

### 6.1. CURL Commands

#### 6.1.1. Lấy thông tin User + Rank (qua Gateway)

```bash
# Lấy thông tin user hiện tại (có rank và totalSpent)
curl -X GET "http://localhost:8888/api/v1/identity/users/my-info" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response mẫu:**
```json
{
  "code": 1000,
  "message": null,
  "result": {
    "id": "user-uuid-123",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "dob": "1990-01-01",
    "roles": [],
    "totalSpent": 15000000,
    "rank": "SILVER"
  }
}
```

#### 6.1.2. Lấy danh sách Voucher khả dụng theo Rank

```bash
# Lấy voucher phù hợp với rank hiện tại của user
curl -X GET "http://localhost:8888/api/v1/vouchers/available-for-me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response mẫu:**
```json
{
  "code": 1000,
  "message": "Vouchers available for current user rank",
  "result": [
    {
      "id": 1,
      "code": "BRONZE_5K",
      "name": "Giảm 5K cho hạng Đồng",
      "discountType": "AMOUNT",
      "discountValue": 5000,
      "discountMaxValue": null,
      "minOrderTotal": 100000,
      "startAt": "2025-01-01T00:00:00",
      "endAt": "2025-12-31T23:59:59",
      "maxUsage": 1000,
      "maxPerUser": 1,
      "status": 1,
      "minRankRequired": "BRONZE"
    }
  ]
}
```

#### 6.1.3. Claim Voucher vào ví cá nhân

```bash
# Claim voucher có ID = 1
curl -X POST "http://localhost:8888/api/v1/vouchers/1/claim" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response thành công:**
```json
{
  "code": 1000,
  "message": "Voucher claimed successfully",
  "result": null
}
```

**Response lỗi (rank không đủ):**
```json
{
  "code": 1007,
  "message": "Hạng thành viên hiện tại của bạn không đủ để sử dụng mã giảm giá này.",
  "result": null
}
```

#### 6.1.4. Xem kho Voucher cá nhân (Wallet)

```bash
# Lấy danh sách voucher đã claim và chưa dùng
curl -X GET "http://localhost:8888/api/v1/vouchers/my-wallet" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response mẫu:**
```json
{
  "code": 1000,
  "message": "My voucher wallet",
  "result": [
    {
      "id": 10,
      "userId": "user-uuid-123",
      "voucherId": 1,
      "isUsed": false,
      "claimedAt": "2025-01-10T10:00:00",
      "usedAt": null
    }
  ]
}
```

#### 6.1.5. Tạo Voucher mới (ADMIN) - có minRankRequired

```bash
# Tạo voucher mới với rank requirement
curl -X POST "http://localhost:8888/api/v1/vouchers" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GOLD_10PERCENT",
    "name": "Giảm 10% cho hạng Vàng",
    "discountType": "PERCENT",
    "discountValue": 10,
    "discountMaxValue": 50000,
    "minOrderTotal": 500000,
    "startAt": "2025-01-01T00:00:00",
    "endAt": "2025-12-31T23:59:59",
    "maxUsage": 500,
    "maxPerUser": 1,
    "status": 1,
    "minRankRequired": "GOLD"
  }'
```

#### 6.1.6. Cập nhật Voucher (ADMIN) - thêm/sửa minRankRequired

```bash
# Cập nhật voucher ID = 1, thêm rank requirement
curl -X PUT "http://localhost:8888/api/v1/vouchers/1" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BRONZE_5K",
    "name": "Giảm 5K cho hạng Đồng",
    "discountType": "AMOUNT",
    "discountValue": 5000,
    "discountMaxValue": null,
    "minOrderTotal": 100000,
    "startAt": "2025-01-01T00:00:00",
    "endAt": "2025-12-31T23:59:59",
    "maxUsage": 1000,
    "maxPerUser": 1,
    "status": 1,
    "minRankRequired": "BRONZE"
  }'
```

#### 6.1.7. Tạo Order với Voucher (có validate rank)

```bash
# Tạo order và áp dụng voucher code
curl -X POST "http://localhost:8888/api/v1/orders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": 1,
    "voucherCode": "BRONZE_5K",
    "paymentMethod": "CASH_ON_DELIVERY",
    "shippingFee": 20000,
    "note": "Giao giờ hành chính",
    "items": [
      {
        "variantId": 123,
        "quantity": 1,
        "price": 150000
      }
    ]
  }'
```

**Response thành công:**
```json
{
  "code": 1000,
  "message": "Order created successfully",
  "result": {
    "id": 100,
    "userId": "user-uuid-123",
    "status": "PENDING",
    "subtotal": 150000,
    "discount": 5000,
    "shippingFee": 20000,
    "total": 165000,
    "voucherId": 1
  }
}
```

**Response lỗi (rank không đủ):**
```json
{
  "code": 1007,
  "message": "Hạng thành viên hiện tại của bạn không đủ để sử dụng mã giảm giá này.",
  "result": null
}
```

#### 6.1.8. Internal API - Cộng total_spent cho User (Service-to-Service)

```bash
# API nội bộ - Order Service gọi Identity Service
# Không cần JWT (chỉ dùng cho service-to-service)
curl -X POST "http://localhost:8080/users/internal/user-uuid-123/add-spent" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 165000
  }'
```

**Lưu ý:** API này chỉ dùng cho service-to-service, không nên expose ra Gateway hoặc gọi từ FE.

---

### 6.2. Postman Collection

File Postman Collection đầy đủ được lưu tại: `frontend/API Docs/RANK_VOUCHER_POSTMAN.json`

#### 6.2.1. Import vào Postman

1. Mở Postman
2. Click **Import**
3. Chọn file `RANK_VOUCHER_POSTMAN.json`
4. Collection sẽ được import với các request đã cấu hình sẵn

#### 6.2.2. Collection Variables

Collection sử dụng các biến sau (cần set trong Postman):

- `base_url`: `http://localhost:8888` (Gateway URL)
- `identity_base`: `http://localhost:8080` (Identity Service direct - cho internal API)
- `order_base`: `http://localhost:8084` (Order Service direct - cho internal API)
- `access_token`: JWT token (tự động lưu sau khi login)
- `user_id`: User ID (tự động lưu sau khi login)
- `voucher_id`: Voucher ID để test claim/update

#### 6.2.3. Các Request trong Collection

1. **Identity Service**
   - `GET /api/v1/identity/users/my-info` - Lấy thông tin user + rank
   - `GET /api/v1/identity/users/{userId}` - Lấy thông tin user theo ID
   - `POST /users/internal/{userId}/add-spent` - Internal API cộng total_spent

2. **Voucher Service**
   - `GET /api/v1/vouchers/available-for-me` - Lấy voucher theo rank
   - `GET /api/v1/vouchers/active` - Lấy tất cả voucher active (ADMIN)
   - `GET /api/v1/vouchers/{id}` - Lấy chi tiết voucher
   - `POST /api/v1/vouchers/{id}/claim` - Claim voucher vào ví
   - `GET /api/v1/vouchers/my-wallet` - Xem kho voucher cá nhân
   - `POST /api/v1/vouchers` - Tạo voucher mới (ADMIN)
   - `PUT /api/v1/vouchers/{id}` - Cập nhật voucher (ADMIN)

3. **Order Service**
   - `POST /api/v1/orders` - Tạo order với voucher
   - `PUT /api/v1/orders/{id}/status?status=COMPLETED` - Cập nhật trạng thái đơn (trigger cộng total_spent)

#### 6.2.4. Test Scripts trong Postman

Collection có sẵn test scripts để:
- Tự động lưu `access_token` sau khi login
- Tự động lưu `user_id` từ response
- Validate response status codes
- Log response data để debug

---

### 6.3. Testing Flow

#### Flow 1: User claim và sử dụng voucher

1. **Login** để lấy JWT token
2. **GET /users/my-info** → kiểm tra rank hiện tại (VD: BRONZE)
3. **GET /vouchers/available-for-me** → xem voucher phù hợp rank
4. **POST /vouchers/{id}/claim** → claim voucher vào ví
5. **GET /vouchers/my-wallet** → xác nhận voucher đã vào ví
6. **POST /orders** với `voucherCode` → tạo order và áp dụng voucher
7. **PUT /orders/{id}/status?status=COMPLETED** → hoàn thành đơn (trigger cộng total_spent)
8. **GET /users/my-info** → kiểm tra lại rank (có thể đã tăng nếu total_spent vượt ngưỡng)

#### Flow 2: Admin tạo voucher theo rank

1. **Login với tài khoản ADMIN**
2. **POST /vouchers** với `minRankRequired: "GOLD"` → tạo voucher cho hạng Vàng
3. **GET /vouchers/active** → xem danh sách voucher
4. **Login với user BRONZE**
5. **GET /vouchers/available-for-me** → voucher GOLD không xuất hiện
6. **POST /vouchers/{gold_voucher_id}/claim** → sẽ báo lỗi `VOUCHER_RANK_NOT_ENOUGH`

---

### 6.4. Error Codes Reference

| Code | Message | HTTP Status |
|------|---------|-------------|
| 4001 | VOUCHER_NOT_FOUND | 404 |
| 4002 | VOUCHER_NOT_ACTIVE | 400 |
| 4003 | VOUCHER_NOT_VALID_TIME | 400 |
| 4004 | VOUCHER_MIN_ORDER_NOT_MET | 400 |
| 4005 | VOUCHER_USAGE_LIMIT_REACHED | 400 |
| 4006 | VOUCHER_USER_USAGE_LIMIT_REACHED | 400 |
| 4007 | VOUCHER_RANK_NOT_ENOUGH | 403 |
| 4008 | VOUCHER_NOT_IN_WALLET | 400 |

---

### 6.5. Notes

- Tất cả API qua Gateway đều cần JWT token trong header `Authorization: Bearer {token}`
- Internal API (`/users/internal/*`) không cần JWT nhưng chỉ nên gọi từ service-to-service
- Rank được tính tự động khi order chuyển sang `COMPLETED`
- Voucher có `maxPerUser > 0` yêu cầu user phải claim trước khi dùng
- Voucher có `maxPerUser = null` hoặc `0` có thể dùng trực tiếp mà không cần claim


