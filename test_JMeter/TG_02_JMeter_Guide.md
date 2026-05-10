# Hướng Dẫn Cấu Hình JMeter - TG_02: Product Listing (Browse Homepage Load Test)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Đo hiệu năng trang danh sách sản phẩm khi 200 user đồng thời |
| **API** | `GET /api/v1/product/products?page={page}&limit=12` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 200 |
| **Ramp-up** | 60 giây |
| **Loop** | 5 |
| **Duration** | 10 phút |
| **Target throughput** | 100 req/s |
| **SLA** | p95 < 800ms, p99 < 1500ms, Error < 0.5% |
| **Auth** | ❌ Không cần token (public endpoint) |

---

## Bước 1: Chuẩn Bị Trước Khi Vào JMeter

### 1.1. Đảm bảo services đang chạy
Kiểm tra API Gateway và Product Service đã up:
```
curl http://localhost:8888/api/v1/product/products?page=1&limit=12
```
> ✅ Nếu trả về JSON có `"result"` và danh sách sản phẩm → OK.  
> ❌ Nếu Connection refused → khởi động lại services.

### 1.2. Đảm bảo dữ liệu sản phẩm đã được seed vào DB
File SQL seed đã có sẵn tại:
```
test_JMeter\data\data_chung\seed_data.sql
```
Chạy trên MySQL:
```sql
SOURCE C:/Users/Admin/Desktop/PTIT/Y4_T2/QA/SQA/test_JMeter/data/data_chung/seed_data.sql;
```

### 1.3. Không cần file CSV cho TG_02
Khác với TG_01 (dùng CSV cho username/password), TG_02 dùng **Random Variable** để tạo số trang ngẫu nhiên.  
Không cần chuẩn bị file data.

---

## Bước 2: Thêm Thread Group (TG_02)

1. **Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**
2. Đặt tên: **`TG_02 - Product Listing Load Test`**
3. Cấu hình:

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads (users) | `200` | 200 user đồng thời — gấp đôi TG_01 vì homepage nhiều traffic hơn |
| Ramp-up period (seconds) | `60` | Mỗi giây thêm ~3 thread (200/60) — tăng từ từ, không spike |
| Loop Count | `5` | Mỗi user lướt homepage 5 lần — mô phỏng user thật xem nhiều trang |

> 💡 **Tại sao Loop=5 chứ không Loop=1?**  
> TG_01 login chỉ 1 lần/session. Còn homepage user thường xem nhiều trang → Loop=5 mô phỏng đúng hành vi thực tế.

---

## Bước 3: Thêm Random Variable (Tạo Số Trang Ngẫu Nhiên)

Đây là điểm khác biệt lớn nhất so với TG_01 — không dùng CSV mà dùng Random Variable.

1. **Chuột phải vào TG_02** → **Add → Config Element → Random Variable**
2. Đặt tên: **`Random - Page Number`**
3. Cấu hình:

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Variable Name** | `page` | Tên biến, dùng trong request: `${page}` |
| **Minimum Value** | `1` | Trang đầu tiên |
| **Maximum Value** | `10` | Giả sử có 10 trang sản phẩm |
| **Seed for Random** | *(để trống)* | Hoàn toàn ngẫu nhiên mỗi lần chạy |
| **Per Thread (each user gets own value)** | `True` | Mỗi thread tạo số trang riêng |

> 💡 **Tại sao cần random page?**  
> Nếu 200 user cùng GET `page=1` → DB/cache có thể trả về kết quả giống nhau → không phản ánh đúng tải thật.  
> Random page=1..10 → mỗi user gọi trang khác → giống real traffic, tránh cache hit giả.

---

## Bước 4: Thêm HTTP Request Defaults

1. **Chuột phải vào TG_02** → **Add → Config Element → HTTP Request Defaults**
2. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 5: Thêm HTTP Header Manager

1. **Chuột phải vào TG_02** → **Add → Config Element → HTTP Header Manager**
2. Đặt tên: **`Headers - Accept JSON`**
3. Click **Add** → Thêm header:

| Name | Value | Giải thích |
|---|---|---|
| `Accept` | `application/json` | Nói rõ client muốn nhận JSON response |

> 💡 **Khác TG_01**: TG_01 cần `Content-Type: application/json` vì có POST body.  
> TG_02 là GET request → **không có body** → chỉ cần `Accept` header.

---

## Bước 6: Thêm Constant Throughput Timer (100 req/s)

1. **Chuột phải vào TG_02** → **Add → Timer → Constant Throughput Timer**
2. Đặt tên: **`Throughput - 100 req/s`**
3. Cấu hình:

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Target throughput (in samples per minute)** | `6000` | 100 req/s × 60 giây = 6000 req/phút |
| **Calculate Throughput based on** | `All active threads in current thread group` | Chia đều cho 200 threads |

> 💡 **Tại sao nhân 60?**  
> JMeter tính throughput theo **req/phút**, không phải req/giây.  
> Công thức: `Target (req/s) × 60 = giá trị nhập vào`

---

## Bước 7: Thêm HTTP Request Sampler (GET Products)

1. **Chuột phải vào TG_02** → **Add → Sampler → HTTP Request**
2. Đặt tên: **`GET - /api/v1/product/products`**
3. Cấu hình:

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Method** | `GET` | Đọc dữ liệu — không có request body |
| **Server Name** | `localhost` *(hoặc để trống nếu đã có Defaults)* | |
| **Port** | `8888` | |
| **Path** | `/api/v1/product/products` | Endpoint danh sách sản phẩm |

### Thêm Query Parameters (tab "Parameters"):

> ⚠️ **Quan trọng**: Chọn tab **"Parameters"** — KHÔNG dùng "Body Data" cho GET request!

Click **Add** để thêm từng dòng:

| Name | Value | Encode? | Giải thích |
|---|---|---|---|
| `page` | `${page}` | ✅ | Số trang ngẫu nhiên từ Random Variable |
| `limit` | `12` | ✅ | 12 sản phẩm/trang — giống frontend production |

> JMeter sẽ tự ghép thành: `GET /api/v1/product/products?page=3&limit=12`

---

## Bước 8: Thêm Các Assertions

### 8.1. Kiểm tra HTTP Status Code = 200

1. **Chuột phải vào HTTP Request** → **Add → Assertions → Response Assertion**
2. Đặt tên: **`Assert - Status 200`**

| Trường | Giá trị |
|---|---|
| **Field to Test** | `Response Code` |
| **Pattern Matching Rules** | `Equals` |
| **Patterns to Test** | `200` |

### 8.2. Kiểm tra Body chứa "result"

1. **Chuột phải vào HTTP Request** → **Add → Assertions → Response Assertion**
2. Đặt tên: **`Assert - Body contains result`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Field to Test** | `Text Response` ⚠️ | Body response — KHÔNG chọn "Response Message" |
| **Pattern Matching Rules** | `Contains` | |
| **Patterns to Test** | `result` | Response trả về `{"code":1000,"result":{...}}` |

> ⚠️ **Nhớ bài học từ TG_01**: Phải chọn **`Text Response`**, không phải `Response Message`!  
> `Response Message` = chuỗi "OK" → không bao giờ chứa "result" → luôn FAIL.

### 8.3. Kiểm tra Response Time < 2000ms

1. **Chuột phải vào HTTP Request** → **Add → Assertions → Duration Assertion**
2. Đặt tên: **`Assert - Response Time < 2000ms`**

| Trường | Giá trị |
|---|---|
| **Duration in milliseconds** | `2000` |

---

## Bước 9: Thêm Listeners (Xem Kết Quả)

### 9.1. Aggregate Report ✅ (quan trọng nhất)

1. **Chuột phải vào TG_02** → **Add → Listener → Aggregate Report**
2. Set **"Write results to file"**:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_02_result.csv
```

### 9.2. Summary Report ✅

1. **Chuột phải vào TG_02** → **Add → Listener → Summary Report**

### 9.3. View Results Tree ⚠️ (chỉ dùng khi debug)

1. **Chuột phải vào TG_02** → **Add → Listener → View Results Tree**

> ⚠️ **Tắt listener này khi chạy 200 threads** — gây tốn RAM rất nhiều!  
> Cách tắt: Chuột phải → **Disable**

---

## Bước 10: Lưu Test Plan

**File → Save As** → Lưu thành:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_02_ProductListing_LoadTest.jmx
```
*(hoặc lưu chung vào file .jmx đã có của TG_01)*

---

## Bước 11: Chạy Test

### Cách 1: Chạy qua GUI (để debug)
- **Disable** View Results Tree nếu chạy full 200 threads
- Click nút **▶ Run** (Ctrl+R)
- Quan sát **Aggregate Report** real-time

### Cách 2: Chạy qua Command Line (khuyến nghị cho load test thật)
```powershell
cd C:\apache-jmeter\bin

.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_02_ProductListing_LoadTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_02_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_02_report"
```

---

## Bước 12: Đọc Kết Quả & Đánh Giá

### Metrics cần quan tâm trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 600ms | 90% request hoàn thành trong thời gian này |
| **95th Percentile** | **< 800ms** ✅ | SLA chính |
| **99th Percentile** | **< 1500ms** ✅ | SLA phụ |
| **Error %** | **< 0.5%** ✅ | Tỷ lệ lỗi (chặt hơn TG_01 vì GET đơn giản hơn) |
| **Throughput** | ≥ 100 req/s | Thông lượng đạt mục tiêu |

### Các lỗi thường gặp & cách xử lý:

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `404 Not Found` | Path API sai | Kiểm tra lại `/api/v1/product/products` |
| `500 Internal Server Error` | DB chưa có sản phẩm | Chạy `seed_data.sql` |
| `Assert Body contains result` fail | Chọn nhầm `Response Message` | Đổi sang `Text Response` |
| Response time tăng dần | Không có cache, DB query chậm | Dự kiến — ghi nhận bottleneck |
| Error% tăng khi > 150 threads | DB connection pool cạn | Điều chỉnh `max-active` connections |

---

## So Sánh TG_01 vs TG_02

| | TG_01 - Login | TG_02 - Product List |
|---|---|---|
| **Method** | POST | GET |
| **Auth** | Không | Không |
| **Request body** | JSON `{username, password}` | Không có body |
| **Params** | Trong body | Query string (`?page=&limit=`) |
| **Test data** | CSV file (100 users) | Random Variable (page 1-10) |
| **Threads** | 100 | 200 |
| **Loop** | 1 | 5 |
| **Total requests** | 100 × 1 = **100** | 200 × 5 = **1000** |
| **Target throughput** | 50 req/s | 100 req/s |
| **SLA p95** | < 500ms | < 800ms |
| **Error threshold** | < 1% | < 0.5% |

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_02 - Product Listing Load Test [200 threads, 60s ramp-up, loop=5]
    ├── 🎲 Random Variable: page (min=1, max=10, per-thread=true)
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Accept: application/json
    ├── ⏱️ Constant Throughput Timer: 6000 req/min (= 100 req/s)
    ├── 🔷 HTTP Request: GET /api/v1/product/products
    │       Params: page=${page}, limit=12
    │   ├── ✅ Response Assertion: Status Code = 200
    │   ├── ✅ Response Assertion: Text Response contains "result"
    │   └── ✅ Duration Assertion: < 2000ms
    ├── 📊 Listener: View Results Tree (DISABLE khi chạy full load)
    ├── 📊 Listener: Summary Report
    └── 📊 Listener: Aggregate Report → TG_02_result.csv
```

---

## Checklist Trước Khi Chạy

- [ ] Product Service + API Gateway đang chạy (port 8888)
- [ ] `seed_data.sql` đã được import vào DB
- [ ] Test thử bằng browser/curl: `http://localhost:8888/api/v1/product/products?page=1&limit=12`
- [ ] Random Variable đã cấu hình đúng (page, min=1, max=10, per-thread=true)
- [ ] Params dùng tab **"Parameters"** (không phải "Body Data")
- [ ] Assert Body dùng **"Text Response"** (không phải "Response Message")
- [ ] Throughput Timer = `6000` (req/phút, = 100 req/s)
- [ ] **Disable** View Results Tree trước khi chạy 200 threads
- [ ] Tạo thư mục `results/` nếu chưa có
