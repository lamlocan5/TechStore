# Hướng Dẫn Cấu Hình JMeter - TG_04: Product Detail Page (Concurrent Read)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Đo hiệu năng xem chi tiết sản phẩm khi nhiều user xem cùng lúc |
| **API** | `GET /api/v1/product/products/{id}` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 150 (cố định — Load Test) |
| **Ramp-up** | 60 giây |
| **Loop** | 10 |
| **Duration** | 10 phút |
| **Target throughput** | 80 req/s |
| **SLA** | p95 < 600ms, Error < 0.5% |
| **Loại test** | 📦 **Load Test** |
| **Auth** | ❌ Không cần token (public endpoint) |

> 💡 **Tại sao test Product Detail?**  
> Trang xem chi tiết sản phẩm chiếm ~60% traffic toàn hệ thống.  
> API này thực hiện JOIN với nhiều bảng: `ProductVariant`, `SpecAttribute`, `Review` → dễ chậm dưới tải cao.

---

## Bước 1: Chuẩn Bị Trước Khi Vào JMeter

### 1.1. Kiểm tra API hoạt động
```
curl "http://localhost:8888/api/v1/product/products/1"
```
> ✅ Trả về JSON có `"result"` kèm danh sách variants → OK.

### 1.2. Tạo file CSV product IDs

Tạo file `product_ids.csv` tại:
```
test_JMeter\data\data_chung\product_ids.csv
```

Nội dung (lấy 20–50 product_id có thật từ DB):
```
product_id
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
```

> 💡 **Tại sao cần CSV product_id thay vì hardcode 1 ID?**  
> Nếu tất cả 150 threads cùng gọi `products/1` → DB cache sẽ trả kết quả nhanh giả tạo.  
> Dùng CSV nhiều ID khác nhau → test được nhiều query plan, tránh cache hit 100%.

### 1.3. Kiểm tra DB có dữ liệu
Đảm bảo các `product_id` trong CSV đều tồn tại trong DB và có ít nhất 1 variant.

---

## Bước 2: Thêm Thread Group (TG_04) — Load Test Config

**Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**

Đặt tên: **`TG_04 - Product Detail Concurrent Read`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads | `150` | 150 user đồng thời xem sản phẩm |
| Ramp-up period | `60` | Tăng đều: 150/60 = 2.5 thread/giây |
| Loop Count | `10` | Mỗi thread xem 10 sản phẩm khác nhau |

> 💡 **Tại sao Ramp-up = 60s (bằng TG_01/TG_02)?**  
> TG_04 là Load Test — không cần tăng chậm như TG_03 (Stress Test).  
> Ramp-up 60s giúp server không bị spike đột ngột khi test bắt đầu.

> 💡 **So sánh Threads:**  
> - TG_01 Login: 100 threads (điểm vào, 1 lần)  
> - TG_02 Product List: 200 threads (trang chủ — nhiều nhất)  
> - TG_04 Product Detail: **150 threads** (trang sản phẩm — 60% traffic)

---

## Bước 3: Thêm CSV Data Set Config (Product IDs)

**Chuột phải vào TG_04** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Product IDs`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\product_ids.csv` | |
| **Variable Names** | `product_id` | 1 biến duy nhất |
| **Ignore first line** | `True` | Dòng đầu là header |
| **Delimiter** | `,` | |
| **Recycle on EOF** | `True` | 150 threads × 10 loops = 1500 requests > 20 IDs → cần recycle |
| **Stop thread on EOF** | `False` | Không dừng khi hết file |
| **Sharing mode** | `All threads` | |

> 💡 **Recycle = True vì:**  
> 150 threads × 10 loops = 1500 requests, nhưng CSV chỉ có 20 product IDs → phải recycle để không bị dừng giữa chừng.

---

## Bước 4: Thêm HTTP Request Defaults

**Chuột phải vào TG_04** → **Add → Config Element → HTTP Request Defaults**

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 5: Thêm HTTP Header Manager

**Chuột phải vào TG_04** → **Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Accept` | `application/json` |

---

## Bước 6: Thêm Constant Throughput Timer (80 req/s)

**Chuột phải vào TG_04** → **Add → Timer → Constant Throughput Timer**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Target throughput** | `4800` | 80 req/s × 60 = 4800 req/phút |
| **Calculate based on** | `All active threads in current thread group` | |

> 💡 **Tại sao TG_04 là 80 req/s — cao hơn TG_03 (30 req/s)?**  
> Product Detail là query đơn giản hơn Advanced Search (JOIN ít bảng hơn, không có fuzzy search).  
> 80 req/s phản ánh thực tế: trang chi tiết được truy cập nhiều nhưng query không quá phức tạp.

---

## Bước 7: Thêm HTTP Request Sampler (Product Detail)

**Chuột phải vào TG_04** → **Add → Sampler → HTTP Request**

Đặt tên: **`GET - /api/v1/product/products/${product_id}`**

| Trường | Giá trị |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/product/products/${product_id}` |

> ⚠️ **Lưu ý quan trọng**: Path dùng biến `${product_id}` trực tiếp trong URL (path variable) — **không** thêm vào tab Parameters.  
> Đây là REST path variable, khác với query string param của TG_02/TG_03.

> 💡 **Không có query params vì:**  
> Endpoint này chỉ cần `product_id` trong path — không có filter hay pagination thêm.

---

## Bước 8: Thêm Các Assertions

### 8.1. Kiểm tra Status Code = 200

**Chuột phải vào HTTP Request** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Status 200` |
| **Field to Test** | `Response Code` |
| Pattern Matching | `Equals` |
| Pattern | `200` |

### 8.2. Kiểm tra Body chứa "variants"

**Chuột phải vào HTTP Request** → **Add → Assertions → Response Assertion**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Name | `Assert - Body has variants` |
| **Field to Test** | `Text Response` ← (= Response Body trong JMeter) |
| Pattern Matching | `Contains` |
| Pattern | `variants` |

> 💡 **Tại sao check "variants"?**  
> Product Detail phải trả về thông tin variants (màu sắc, dung lượng, giá...).  
> Nếu thiếu "variants" → API trả về dữ liệu không đầy đủ → lỗi business logic.

### 8.3. Kiểm tra Response Time < 2000ms

**Chuột phải vào HTTP Request** → **Add → Assertions → Duration Assertion**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Name | `Assert - Response Time < 2000ms` |
| **Duration** | `2000` | Bằng TG_01/TG_02 — query không quá phức tạp |

> 💡 **So sánh Duration Assertion:**
> - TG_01 Login: 2000ms  
> - TG_02 Product List: 2000ms  
> - TG_03 Advanced Search: 5000ms (multi-filter JOIN phức tạp)  
> - TG_04 Product Detail: **2000ms** (JOIN ít hơn TG_03)

---

## Bước 9: Thêm Listeners

**Chuột phải vào TG_04** → **Add → Listener:**

### 9.1. Aggregate Report ✅
Set file output:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_04_result.csv
```

### 9.2. Response Time Graph ✅
**Chuột phải vào TG_04** → **Add → Listener → Response Time Graph**

> 💡 Theo dõi response time theo thời gian — phát hiện nếu có xu hướng chậm dần (memory leak, connection pool đầy dần).

### 9.3. View Results Tree ⚠️ (chỉ debug)

> ⚠️ **Disable** View Results Tree trước khi chạy full test — tiêu tốn RAM JMeter rất nhiều.

---

## Bước 10: Lưu Test Plan

```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_04_ProductDetail_LoadTest.jmx
```

---

## Bước 11: Chạy Test

### Cách 1: Chạy qua GUI
- **Disable** View Results Tree
- Click **▶ Run** (Ctrl+R)
- Quan sát **Response Time Graph** real-time

### Cách 2: Chạy qua Command Line
```powershell
cd C:\apache-jmeter\bin

.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_04_ProductDetail_LoadTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_04_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_04_report"
```

---

## Bước 12: Đọc Kết Quả & Đánh Giá

### Metrics trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 400ms | |
| **95th Percentile** | **< 600ms** ✅ | SLA chính |
| **99th Percentile** | < 1000ms | |
| **Error %** | **< 0.5%** ✅ | Chặt hơn TG_03 vì Load Test |
| **Throughput** | ≥ 80 req/s | |

### Các lỗi thường gặp & cách xử lý:

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `404 Not Found` | product_id trong CSV không tồn tại trong DB | Kiểm tra lại CSV, xác nhận ID có trong DB |
| `500 Internal Server Error` | JOIN query thất bại, variant null | Kiểm tra DB integrity |
| Response > 2000ms | Thiếu index trên `product_id`, `variant.product_id` | Thêm index DB |
| Error% tăng dần theo thời gian | Connection pool cạn dần | Tăng pool size hoặc giảm threads |
| CSV variable = `KHÔNG_CÓ` | Sai tên biến `product_id` | Kiểm tra `Variable Names` trong CSV Config |

---

## So Sánh TG_01 / TG_02 / TG_03 / TG_04

| | TG_01 Login | TG_02 Product List | TG_03 Adv. Search | TG_04 Product Detail |
|---|---|---|---|---|
| **Loại test** | Load | Load | Stress | **Load** |
| **Method** | POST | GET | GET | **GET** |
| **Auth** | Không | Không | Không | **Không** |
| **Path variable** | Không | Không | Không | **Có (`{id}`)** |
| **Test data** | CSV users | Random Variable | CSV search_params | **CSV product_ids** |
| **CSV Recycle** | False | N/A | True | **True** |
| **Threads** | 100 | 200 | 200 (tăng dần) | **150** |
| **Ramp-up** | 60s | 60s | 120s | **60s** |
| **Loop** | 1 | 5 | 10 | **10** |
| **Total requests** | 100 | 1000 | 2000 | **1500** |
| **Throughput** | 50 req/s | 100 req/s | 30 req/s | **80 req/s** |
| **SLA p95** | 500ms | 800ms | 2000ms | **600ms** |
| **Duration Assert** | 2000ms | 2000ms | 5000ms | **2000ms** |
| **Check body** | `token` | `result` | Không | **`variants`** |
| **Risk** | High | High | Critical | **High** |

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_04 - Product Detail Concurrent Read [150 threads, 60s ramp-up, loop=10]
    ├── 📄 CSV Data Set Config: product_ids.csv
    │       Variables: product_id
    │       Recycle on EOF: True
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Accept: application/json
    ├── ⏱️ Constant Throughput Timer: 4800 req/min (= 80 req/s)
    ├── 🔷 HTTP Request: GET /api/v1/product/products/${product_id}
    │   ├── ✅ Response Assertion: Status Code = 200
    │   ├── ✅ Response Assertion: Body contains "variants"
    │   └── ✅ Duration Assertion: < 2000ms
    ├── 📊 Listener: Aggregate Report → TG_04_result.csv
    ├── 📊 Listener: Response Time Graph
    └── 📊 Listener: View Results Tree (DISABLE khi chạy full)
```

---

## Checklist Trước Khi Chạy

- [ ] Product Service + API Gateway đang chạy (port 8888)
- [ ] Test thử bằng curl với 1 product_id → OK
- [ ] File `product_ids.csv` đặt đúng đường dẫn
- [ ] Tất cả product_id trong CSV tồn tại trong DB và có variants
- [ ] **CSV Recycle on EOF = True**
- [ ] Path trong HTTP Request dùng `${product_id}` trong URL (không phải tab Parameters)
- [ ] **Disable** View Results Tree trước khi chạy
- [ ] Tạo thư mục `results/` nếu chưa có
