# Hướng Dẫn Cấu Hình JMeter - TG_07: My Orders List (User History Pagination)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Đo hiệu năng lấy danh sách đơn hàng của user (paginated) |
| **API** | `GET /api/v1/orders/my-orders?page=1&limit=12` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 100 |
| **Ramp-up** | 60 giây |
| **Loop** | 5 |
| **Duration** | ~8 phút |
| **Target throughput** | 40 req/s |
| **SLA** | p95 < 1000ms, Error < 1% |
| **Loại test** | 📦 **Load Test** |
| **Auth** | ✅ **Cần Bearer Token** |

> 💡 **Tại sao test "My Orders"?**
> Trang "Đơn hàng của tôi" được user xem rất thường xuyên sau khi mua hàng để kiểm tra trạng thái.
> Query này cần **ORDER BY created_at DESC** + **filter theo user_id** — nếu thiếu index sẽ chậm khi DB lớn.

---

## So Sánh Với Các TG Trước

| | TG_05 Add Cart | TG_06 Create Order | **TG_07 My Orders** |
|---|---|---|---|
| **Method** | POST | POST | **GET** |
| **Body** | JSON | JSON phức tạp | **Không có** |
| **CSV cần** | 2 (users + variants) | 3 (users + variants + address) | **1 (chỉ users)** |
| **Transaction** | 1 write | Multi write + cross-service | **1 read (đơn giản nhất)** |
| **Risk** | Race condition | Deadlock | **Thiếu index** |

> ✅ TG_07 là test **đơn giản nhất** trong nhóm có auth. Dùng để đo hiệu năng read với pagination.

---

## Bước 1: Kiểm Tra Trước Khi Vào JMeter

### 1.1. Xác nhận users có orders trong DB

```sql
-- Chạy trong MySQL/DBeaver
SELECT user_id, COUNT(*) as order_count
FROM orders
GROUP BY user_id
LIMIT 10;
```

> ✅ Seed data đã tạo 100 orders cho 100 users khác nhau → OK.

### 1.2. Test thủ công bằng CMD

```cmd
:: Bước 1: Lấy token
curl -s -X POST "http://localhost:8888/api/v1/identity/auth/token" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser001\",\"password\":\"Test@123456\"}"
```

```cmd
:: Bước 2: Gọi API my-orders
curl -s "http://localhost:8888/api/v1/orders/my-orders?page=1&limit=12" ^
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

> ✅ Kết quả mong đợi: Response `200 OK` chứa `"result"` với danh sách orders.

---

## Bước 2: Thêm Thread Group (TG_07)

**Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**

Đặt tên: **`TG_07 - My Orders List Load Test`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads | `100` | 100 users đồng thời xem đơn hàng |
| Ramp-up period | `60` | Tăng dần trong 1 phút — Load Test |
| Loop Count | `5` | Mỗi user xem 5 lần — mô phỏng F5 nhiều lần |

---

## Bước 3: Thêm CSV Data Set Config — Users

**Chuột phải vào TG_07** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Users`**

| Trường | Giá trị |
|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\users.csv` |
| **Variable Names** | `username,password` |
| **Ignore first line** | `True` |
| **Delimiter** | `,` |
| **Recycle on EOF** | `True` |
| **Stop thread on EOF** | `False` |
| **Sharing mode** | `All threads` |

---

## Bước 4: Thêm HTTP Request Defaults

**Chuột phải vào TG_07** → **Add → Config Element → HTTP Request Defaults**

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 5: Thêm HTTP Header Manager (Global)

**Chuột phải vào TG_07** → **Add → Config Element → HTTP Header Manager**

Đặt tên: **`Header - Global`**

| Name | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

---

## Bước 6: Thêm Constant Throughput Timer (40 req/s)

**Chuột phải vào TG_07** → **Add → Timer → Constant Throughput Timer**

| Trường | Giá trị |
|---|---|
| **Target throughput** | `2400` | 40 req/s × 60 = 2400 req/phút |
| **Calculate based on** | `All active threads in current thread group` |

---

## Bước 7: Thêm HTTP Request — Login

**Chuột phải vào TG_07** → **Add → Sampler → HTTP Request**

Đặt tên: **`POST - Login (Get Token)`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/identity/auth/token` |

Tab **Body Data**:
```json
{"username": "${username}", "password": "${password}"}
```

### 7.1. Thêm JSON Extractor

**Chuột phải vào "POST - Login"** → **Add → Post Processors → JSON Extractor**

| Trường | Giá trị |
|---|---|
| **Names of created variables** | `ACCESS_TOKEN` |
| **JSON Path expressions** | `$.result.token` |
| **Default Value** | `TOKEN_NOT_FOUND` |

---

## Bước 8: Thêm HTTP Request — Get My Orders

**Chuột phải vào TG_07** → **Add → Sampler → HTTP Request**

Đặt tên: **`GET - /api/v1/orders/my-orders`**

| Trường | Giá trị |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/orders/my-orders` |

Tab **Parameters** (thêm từng dòng):

| Name | Value | Encode? |
|---|---|---|
| `page` | `1` | ☑ |
| `limit` | `12` | ☑ |

> 💡 **Để test pagination đa dạng hơn**, có thể dùng `${__Random(1,5,)}` cho `page`:
> - Name: `page` | Value: `${__Random(1,5,)}` → mỗi request random page 1–5.

### 8.1. Thêm HTTP Header Manager — Authorization

**Chuột phải vào "GET - /api/v1/orders/my-orders"** → **Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${ACCESS_TOKEN}` |

> ⚠️ **Đặt Header Manager này bên TRONG request `my-orders`**, không phải ở cấp TG.

---

## Bước 9: Thêm Assertions

### 9.1. Kiểm tra Status Code = 200

**Chuột phải vào "GET - /api/v1/orders/my-orders"** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Status 200` |
| **Field to Test** | `Response Code` |
| Pattern Matching | `Equals` |
| Pattern | `200` |

### 9.2. Kiểm tra Body chứa "result"

**Chuột phải vào "GET - /api/v1/orders/my-orders"** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Body has result` |
| **Field to Test** | `Text Response` |
| Pattern Matching | `Contains` |
| Pattern | `result` |

### 9.3. Kiểm tra Response Time < 3000ms

**Chuột phải vào "GET - /api/v1/orders/my-orders"** → **Add → Assertions → Duration Assertion**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Name | `Assert - Response Time < 3000ms` |
| **Duration** | `3000` | Thoáng hơn SLA để tránh false positive — SLA thật là p95 < 1000ms |

---

## Bước 10: Thêm Listeners

**Chuột phải vào TG_07** → **Add → Listener:**

### 10.1. Aggregate Report ✅
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_07_result.csv
```

### 10.2. Response Time Graph ✅
> Quan sát response time theo thời gian — nếu tăng dần theo thời gian (dù load không đổi) → dấu hiệu thiếu index hoặc connection pool cạn.

### 10.3. View Results Tree ⚠️ (chỉ debug)
> **Disable** trước khi chạy full test.

---

## Bước 11: Lưu Test Plan

```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_07_MyOrders_LoadTest.jmx
```

---

## Bước 12: Chạy Test

### Cách 1: Qua GUI
Click **▶ Run** (Ctrl+R)

### Cách 2: Command Line
```powershell
cd C:\apache-jmeter\bin

.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_07_MyOrders_LoadTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_07_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_07_report"
```

---

## Bước 13: Đọc Kết Quả & Đánh Giá

### Metrics trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 800ms | |
| **95th Percentile** | **< 1000ms** ✅ | SLA chính — thấp nhất trong nhóm auth |
| **Error %** | **< 1%** ✅ | |
| **Throughput** | ≥ 40 req/s | |

### Các lỗi thường gặp:

| Lỗi | HTTP Status | Nguyên nhân | Xử lý |
|---|---|---|---|
| `TOKEN_NOT_FOUND` → 401 | 401 | Login fail | Kiểm tra lại credentials trong CSV |
| `403 Forbidden` | 403 | User cố xem orders của người khác | Không xảy ra (API filter theo token) |
| Response rỗng / `items: []` | 200 | User không có orders | Đảm bảo seed data đã chạy |
| Response > 1000ms | — | Thiếu index `user_id` + `created_at` | Ghi nhận → thêm composite index |

### Điểm cần kiểm tra đặc biệt — Pagination Query:

```sql
-- Query mà hệ thống thực hiện mỗi request:
SELECT * FROM orders
WHERE user_id = 'f98ccb4d-...'
ORDER BY created_at DESC
LIMIT 12 OFFSET 0;

-- Nếu KHÔNG có index → Full Table Scan → chậm khi DB lớn
-- Nếu CÓ index trên (user_id, created_at) → Index Scan → nhanh
```

> 💡 **Nếu p95 > 1000ms**: Chạy `EXPLAIN` trên query trên để kiểm tra có đang dùng index không.

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_07 - My Orders List Load Test [100 threads, 60s ramp-up, loop=5]
    ├── 📄 CSV Data Set Config: users.csv
    │       Variables: username, password
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Content-Type, Accept  (KHÔNG có Authorization)
    ├── ⏱️ Constant Throughput Timer: 2400 req/min (= 40 req/s)
    ├── 🔷 POST - Login (Get Token)
    │       Body: {"username": "${username}", "password": "${password}"}
    │   └── 🔍 JSON Extractor: $.result.token → ACCESS_TOKEN
    └── 🔷 GET - /api/v1/orders/my-orders
            Params: page=1, limit=12
        ├── 📋 Header - Authorization: Bearer ${ACCESS_TOKEN}  ← BÊN TRONG request
        ├── ✅ Assert - Status 200
        ├── ✅ Assert - Body has result
        └── ✅ Assert - Response Time < 3000ms
    ├── 📊 Listener: Aggregate Report → TG_07_result.csv
    ├── 📊 Listener: Response Time Graph
    └── 📊 Listener: View Results Tree (DISABLE khi chạy full)
```

---

## Checklist Trước Khi Chạy

- [ ] Tất cả services đang chạy: Identity, Order Service + API Gateway (8888)
- [ ] Test thủ công bằng CMD (Bước 1.2) → response có orders ✅
- [ ] Seed data orders đã được insert vào DB (100 orders cho 100 users)
- [ ] `$.result.token` đúng với response thực tế
- [ ] **Authorization** đặt **bên trong** "GET - /api/v1/orders/my-orders"
- [ ] **Disable** View Results Tree trước khi chạy full
- [ ] Tạo thư mục `results/` nếu chưa có
