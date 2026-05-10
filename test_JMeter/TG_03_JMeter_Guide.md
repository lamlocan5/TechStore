# Hướng Dẫn Cấu Hình JMeter - TG_03: Advanced Product Search (Search Stress Test)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Kiểm tra hiệu năng fuzzy search với nhiều filter đồng thời dưới tải tăng dần |
| **API** | `GET /api/v1/product/products/search/advanced` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 50 → 200 (tăng dần — Stress Test) |
| **Ramp-up** | 120 giây |
| **Loop** | 10 |
| **Duration** | 15 phút |
| **Target throughput** | 30 req/s |
| **SLA** | p95 < 2000ms, p99 < 3000ms, Error < 2% |
| **Loại test** | ⚡ **Stress Test** (khác TG_01/TG_02 là Load Test) |
| **Auth** | ❌ Không cần token (public endpoint) |

> 💡 **Stress Test vs Load Test là gì?**  
> - **Load Test** (TG_01, TG_02): Giữ tải **cố định** ở mức production → đo xem hệ thống có đáp ứng được không.  
> - **Stress Test** (TG_03): **Tăng dần tải** cho đến khi hệ thống bắt đầu suy giảm → tìm điểm giới hạn (breaking point).

---

## Bước 1: Chuẩn Bị Trước Khi Vào JMeter

### 1.1. Kiểm tra API hoạt động
```
curl "http://localhost:8888/api/v1/product/products/search/advanced?keyword=iphone&minPrice=10000000&maxPrice=25000000&brandId=1&categoryId=9&page=1&limit=12"
```
> ✅ Trả về JSON có `"result"` và danh sách sản phẩm → OK.

### 1.2. File CSV test data đã có sẵn
File `search_params.csv` đã được tạo tại:
```
test_JMeter\data\data_chung\search_params.csv
```

Nội dung: 30 bộ tham số search khác nhau với format:
```
keyword,min_price,max_price,brand_id,category_id
iphone,10000000,25000000,1,9
macbook,20000000,40000000,1,2
...
```

> 💡 **Tại sao cần CSV đa dạng cho TG_03?**  
> Search API thực hiện **multi-filter JOIN query** — mỗi bộ tham số khác nhau → query plan khác nhau.  
> Dùng CSV đa dạng → test được nhiều loại query, tránh cache hit giả.  
> So sánh: TG_02 chỉ cần random số trang → đơn giản hơn nhiều.

### 1.3. Mapping brand_id và category_id trong DB

| brand_id | Tên Brand |
|---|---|
| 1 | Apple |
| 2 | Samsung |
| 3 | Dell |
| 4 | HP |
| 5 | Lenovo |
| 6 | Asus |
| 7 | Acer |
| 8 | MSI |
| 11 | Xiaomi |
| 12 | OPPO |
| 13 | Vivo |
| 18 | Razer |
| 20 | Microsoft Surface |

| category_id | Loại Sản Phẩm |
|---|---|
| 2 | Laptop (MacBook) |
| 8 | Điện thoại |
| 9 | iPhone |
| 10 | Laptop Gaming |
| 11 | Laptop Văn phòng |
| 13 | iPad |

---

## Bước 2: Thêm Thread Group (TG_03) — Stress Test Config

**Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**

Đặt tên: **`TG_03 - Advanced Search Stress Test`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads | `200` | Số thread tối đa (đỉnh stress) |
| Ramp-up period | `120` | Tăng chậm hơn: 200/120 ≈ 1.7 thread/giây |
| Loop Count | `10` | Mỗi thread search 10 lần |

> 💡 **Tại sao Ramp-up = 120s (gấp đôi TG_01/TG_02)?**  
> Stress test cần tăng tải **từ từ hơn** để quan sát hệ thống suy giảm từng bước.  
> Nếu ramp-up quá nhanh → không biết hệ thống bắt đầu chậm từ 50, 100, hay 150 threads.

> 💡 **Tại sao bắt đầu 50 threads chứ không phải 200 ngay?**  
> JMeter với Ramp-up=120s và Thread=200 sẽ tự động tăng từ 0→200 trong 120 giây.  
> Không cần cài đặt thêm — bản chất ramp-up đã tạo ra hiệu ứng "tăng dần".

---

## Bước 3: Thêm CSV Data Set Config (File Search Params)

**Chuột phải vào TG_03** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Search Parameters`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\search_params.csv` | |
| **Variable Names** | `keyword,min_price,max_price,brand_id,category_id` | 5 biến từ CSV |
| **Ignore first line** | `True` | Dòng đầu là header |
| **Delimiter** | `,` | |
| **Recycle on EOF** | `True` | ⚠️ Khác TG_01! — Chỉ có 30 bộ data nhưng loop=10 → cần recycle |
| **Stop thread on EOF** | `False` | Không dừng khi hết file — tiếp tục vòng lặp |
| **Sharing mode** | `All threads` | |

> 💡 **Tại sao TG_03 cần Recycle = True còn TG_01 thì không?**  
> - TG_01: 100 users × 1 lần = 100 requests → CSV có đúng 100 dòng → không cần recycle.  
> - TG_03: 200 threads × 10 loops = 2000 requests → CSV chỉ có 30 dòng → **phải recycle** để tránh "hết data giữa chừng".

---

## Bước 4: Thêm HTTP Request Defaults

**Chuột phải vào TG_03** → **Add → Config Element → HTTP Request Defaults**

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 5: Thêm HTTP Header Manager

**Chuột phải vào TG_03** → **Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Accept` | `application/json` |

---

## Bước 6: Thêm Constant Throughput Timer (30 req/s)

**Chuột phải vào TG_03** → **Add → Timer → Constant Throughput Timer**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Target throughput** | `1800` | 30 req/s × 60 = 1800 req/phút |
| **Calculate based on** | `All active threads in current thread group` | |

> 💡 **Tại sao TG_03 chỉ 30 req/s dù có đến 200 threads?**  
> Advanced search là query **phức tạp nhất** hệ thống (fuzzy search + multi-filter JOIN).  
> Mục tiêu là tìm breaking point, không phải throughput tối đa.  
> Đặt throughput thấp → quan sát response time tăng dần theo threads.

---

## Bước 7: Thêm HTTP Request Sampler (Advanced Search)

**Chuột phải vào TG_03** → **Add → Sampler → HTTP Request**

Đặt tên: **`GET - /api/v1/product/products/search/advanced`**

| Trường | Giá trị |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/product/products/search/advanced` |

### Thêm Query Parameters (tab "Parameters"):

| Name | Value | Giải thích |
|---|---|---|
| `keyword` | `${keyword}` | Từ khóa search — từ CSV |
| `minPrice` | `${min_price}` | Giá tối thiểu — từ CSV |
| `maxPrice` | `${max_price}` | Giá tối đa — từ CSV |
| `brandId` | `${brand_id}` | ID thương hiệu — từ CSV |
| `categoryId` | `${category_id}` | ID danh mục — từ CSV |
| `page` | `1` | Luôn lấy trang đầu |
| `limit` | `12` | 12 kết quả/trang |

> ⚠️ Vẫn dùng tab **"Parameters"** — đây là GET request.

> 💡 **Tại sao có đến 7 params trong khi TG_02 chỉ có 2?**  
> Đây là advanced search — mỗi param thêm vào là thêm một điều kiện WHERE trong SQL.  
> Với 5 filter đồng thời, DB phải JOIN nhiều bảng và evaluate nhiều điều kiện → đây là điểm bottleneck cần stress test.

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

### 8.2. Kiểm tra Response Time < 5000ms

**Chuột phải vào HTTP Request** → **Add → Assertions → Duration Assertion**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Name | `Assert - Response Time < 5000ms` |
| **Duration** | `5000` | Thoáng hơn TG_01 (2000ms) vì search phức tạp hơn |

> 💡 **So sánh ngưỡng Duration Assertion:**  
> - TG_01 Login: 2000ms (đơn giản — chỉ check DB 1 bảng)  
> - TG_02 Product List: 2000ms (pagination nhưng cơ bản)  
> - TG_03 Advanced Search: **5000ms** (multi-filter JOIN — cho phép chậm hơn)  
> Ngưỡng assertion ≠ SLA. SLA là p95 < 2000ms, nhưng assertion giữ ở 5000ms để không fail các request outlier trong stress test.

> ⚠️ **Không cần check "Body contains result" cho TG_03?**  
> Có thể thêm nếu muốn, nhưng search advanced có thể trả về kết quả rỗng `"result":{"data":[]}` khi không có sản phẩm khớp → sẽ vẫn có "result" trong body → có thể thêm nếu cần.

---

## Bước 9: Thêm Gaussian Random Timer (Think Time)

TG_03 là stress test — thêm think time để mô phỏng user thật, tránh hammer server liên tục.

**Chuột phải vào TG_03** → **Add → Timer → Gaussian Random Timer**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Constant Delay Offset (ms)** | `500` | Độ trễ cơ bản 500ms |
| **Deviation (ms)** | `200` | ±200ms ngẫu nhiên → delay thực tế: 300–700ms |

> 💡 **Tại sao TG_01/TG_02 không có timer nhưng TG_03 thì có?**  
> TG_01, TG_02 dùng **Constant Throughput Timer** → timer đó đã kiểm soát tốc độ.  
> TG_03 vẫn có Throughput Timer, nhưng thêm Gaussian Timer để:  
> 1. Tránh tất cả 200 threads gửi request cùng đúng 1ms.  
> 2. Mô phỏng thực tế hơn (user gõ keyword, suy nghĩ rồi mới click Search).

---

## Bước 10: Thêm Listeners

**Chuột phải vào TG_03** → **Add → Listener:**

### 10.1. Aggregate Report ✅
Set file output:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_03_result.csv
```

### 10.2. Response Time Graph ✅ (đặc biệt quan trọng cho Stress Test)
**Chuột phải vào TG_03** → **Add → Listener → Response Time Graph**

> 💡 Với **Stress Test**, đây là listener quan trọng nhất!  
> Biểu đồ thời gian response theo thời gian → thấy rõ điểm nào response time bắt đầu tăng vọt (= breaking point).  
> Load Test chỉ cần Aggregate Report. Stress Test cần thêm biểu đồ timeline.

### 10.3. Active Threads Over Time ✅
**Chuột phải vào TG_03** → **Add → Listener → Active Threads Over Time**

> 💡 Kết hợp Response Time Graph + Active Threads Over Time → thấy được:  
> "Khi số thread tăng từ 100 lên 150, response time tăng từ 800ms lên 2500ms" → đây là breaking point!

### 10.4. View Results Tree ⚠️ (chỉ debug)

---

## Bước 11: Lưu Test Plan

```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_03_AdvancedSearch_StressTest.jmx
```

---

## Bước 12: Chạy Test

### Cách 1: Chạy qua GUI
- **Disable** View Results Tree
- Click **▶ Run** (Ctrl+R)
- Quan sát **Response Time Graph** real-time — đây là điểm thú vị của stress test!

### Cách 2: Chạy qua Command Line
```powershell
cd C:\apache-jmeter\bin

.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_03_AdvancedSearch_StressTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_03_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_03_report"
```

---

## Bước 13: Đọc Kết Quả & Đánh Giá

### Metrics trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 1500ms | |
| **95th Percentile** | **< 2000ms** ✅ | SLA chính |
| **99th Percentile** | **< 3000ms** ✅ | SLA phụ |
| **Error %** | **< 2%** ✅ | Cao hơn TG_01/TG_02 vì stress test |
| **Throughput** | ≥ 30 req/s | |

### Cách đọc kết quả Stress Test:

Nhìn vào **Response Time Graph** theo thời gian:

```
0-30s  (  0-50 threads):  response ~300ms  → Hệ thống khỏe ✅
30-60s ( 50-100 threads): response ~800ms  → Bắt đầu tải ⚠️
60-90s (100-150 threads): response ~2000ms → Gần ngưỡng SLA 🔴
90-120s(150-200 threads): response ~5000ms → Vượt SLA ❌ ← Breaking point tại ~130 threads
```

> 💡 **Breaking point** = số thread tại đó response time bắt đầu tăng phi tuyến.  
> Đây là thông tin quý giá — cho biết system **chỉ chịu được X concurrent search request** trước khi suy giảm.

### Các lỗi thường gặp & cách xử lý:

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `404 Not Found` | Path API sai (có thể khác `/search/advanced`) | Kiểm tra lại path trong source code |
| `400 Bad Request` | Tên param sai (có thể `min_price` thay vì `minPrice`) | Kiểm tra API spec |
| Error% tăng vọt > 10% | DB quá tải, connection pool cạn | Ghi nhận breaking point — đây là kết quả mong đợi |
| Response > 10s | Full table scan, thiếu index | Ghi nhận → đây là bottleneck cần cải thiện |
| CSV variable = KHÔNG_CÓ | Sai tên biến trong params | Kiểm tra `Variable Names` trong CSV Config |

---

## So Sánh TG_01 / TG_02 / TG_03

| | TG_01 Login | TG_02 Product List | TG_03 Adv. Search |
|---|---|---|---|
| **Loại test** | Load | Load | **Stress** |
| **Method** | POST | GET | GET |
| **Params** | JSON body | 2 params | **7 params** |
| **Test data** | CSV users | Random Variable | **CSV search_params** |
| **CSV Recycle** | False | N/A | **True** |
| **Threads** | 100 (cố định) | 200 (cố định) | 200 **(tăng dần)** |
| **Ramp-up** | 60s | 60s | **120s** |
| **Loop** | 1 | 5 | **10** |
| **Total requests** | 100 | 1000 | **2000** |
| **Think time** | Không | Không | **Gaussian 500±200ms** |
| **Throughput** | 50 req/s | 100 req/s | **30 req/s** |
| **SLA p95** | 500ms | 800ms | **2000ms** |
| **Duration Assert** | 2000ms | 2000ms | **5000ms** |
| **Key listener** | Aggregate | Aggregate | **Response Time Graph** |
| **Risk** | High | High | **Critical** |

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_03 - Advanced Search Stress Test [200 threads, 120s ramp-up, loop=10]
    ├── 📄 CSV Data Set Config: search_params.csv
    │       Variables: keyword,min_price,max_price,brand_id,category_id
    │       Recycle on EOF: True
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Accept: application/json
    ├── ⏱️ Constant Throughput Timer: 1800 req/min (= 30 req/s)
    ├── ⏳ Gaussian Random Timer: 500ms ± 200ms
    ├── 🔷 HTTP Request: GET /api/v1/product/products/search/advanced
    │       Params: keyword, minPrice, maxPrice, brandId, categoryId, page=1, limit=12
    │   ├── ✅ Response Assertion: Status Code = 200
    │   └── ✅ Duration Assertion: < 5000ms
    ├── 📊 Listener: Aggregate Report → TG_03_result.csv
    ├── 📊 Listener: Response Time Graph ← quan trọng nhất cho Stress Test
    ├── 📊 Listener: Active Threads Over Time
    └── 📊 Listener: View Results Tree (DISABLE khi chạy full)
```

---

## Checklist Trước Khi Chạy

- [ ] Product Service + API Gateway đang chạy (port 8888)
- [ ] Test thử bằng curl với 1 bộ params → OK
- [ ] File `search_params.csv` đặt đúng đường dẫn
- [ ] **CSV Recycle on EOF = True** (nếu False → thread dừng giữa chừng khi hết 30 dòng)
- [ ] Tên param đúng: `keyword`, `minPrice`, `maxPrice`, `brandId`, `categoryId` (kiểm tra API spec)
- [ ] Gaussian Random Timer đã được thêm
- [ ] **Response Time Graph** đã được thêm (listener quan trọng nhất của stress test)
- [ ] **Disable** View Results Tree trước khi chạy
- [ ] Tạo thư mục `results/` nếu chưa có
