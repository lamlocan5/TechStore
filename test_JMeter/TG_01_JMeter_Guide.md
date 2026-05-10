# Hướng Dẫn Cấu Hình JMeter - TG_01: User Login (Authentication Load Test)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Đo hiệu năng đăng nhập khi 100 user đồng thời |
| **API** | `POST /api/v1/identity/auth/token` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 100 |
| **Ramp-up** | 60 giây |
| **Loop** | 1 |
| **Duration** | 5 phút |
| **Target throughput** | 50 req/s |
| **SLA** | p95 < 500ms, p99 < 1000ms, Error < 1% |

---

## Bước 1: Chuẩn Bị Trước Khi Vào JMeter

### 1.1. Đảm bảo services đang chạy
Kiểm tra API Gateway và Identity Service đã up:
```
curl -X POST http://localhost:8888/api/v1/identity/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser001\", \"password\": \"Test@123456\"}"
```
> ✅ Nếu trả về JSON có `token` → OK.  
> ❌ Nếu Connection refused → khởi động lại services.

### 1.2. Đảm bảo dữ liệu user đã được seed vào DB
File SQL seed đã có sẵn tại:
```
test_JMeter\data\data_user\seed_users.sql
```
Chạy trên MySQL:
```sql
-- Chạy trong MySQL Workbench hoặc CLI
SOURCE C:/Users/Admin/Desktop/PTIT/Y4_T2/QA/SQA/test_JMeter/data/data_user/seed_users.sql;
```

### 1.3. File CSV test data
File `users.csv` đã có sẵn tại:
```
test_JMeter\data\data_user\users.csv
```
Nội dung: 100 dòng với format `username,password`  
(testuser001 → testuser100, password = `Test@123456`)

---

## Bước 2: Tạo Test Plan Mới Trong JMeter

1. Mở **Apache JMeter** (double-click `jmeter.bat` trong thư mục `bin/`)
2. Vào menu **File → New** → Test Plan trống xuất hiện
3. Đổi tên Test Plan: Click vào `Test Plan` → đặt tên **"Bookstore Performance Test"**

---

## Bước 3: Thêm Thread Group (TG_01)

1. **Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**
2. Đặt tên Thread Group: **`TG_01 - User Login Load Test`**
3. Cấu hình các thông số:

| Trường | Giá trị | Ghi chú |
|---|---|---|
| Number of Threads (users) | `100` | 100 user đồng thời |
| Ramp-up period (seconds) | `60` | Mỗi giây thêm ~1.67 thread |
| Loop Count | `1` | Mỗi user login 1 lần |
| Duration (seconds) | `300` | Tick **Specify Thread Lifetime**, set Duration = 300 |

> 💡 **Lưu ý**: Tick vào **"Same user on each iteration"** = OFF (mỗi thread dùng user khác nhau từ CSV).

---

## Bước 4: Thêm CSV Data Set Config (File Test Data)

Đây là thành phần quan trọng nhất — đọc username/password từ file CSV.

1. **Chuột phải vào TG_01** → **Add → Config Element → CSV Data Set Config**
2. Đặt tên: **`CSV - Users Login Data`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\users.csv` |
| **Variable Names** | `username,password` |
| **Ignore first line** | `True` (dòng đầu là header) |
| **Delimiter** | `,` |
| **Allow quoted data** | `False` |
| **Recycle on EOF** | `False` |
| **Stop thread on EOF** | `True` |
| **Sharing mode** | `All threads` |

---

## Bước 5: Thêm HTTP Request Defaults (tuỳ chọn, tiện lợi)

Để không phải gõ server/port mỗi lần:

1. **Chuột phải vào TG_01** → **Add → Config Element → HTTP Request Defaults**
2. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 6: Thêm HTTP Header Manager

1. **Chuột phải vào TG_01** → **Add → Config Element → HTTP Header Manager**
2. Đặt tên: **`Headers - JSON Content-Type`**
3. Click **Add** → Thêm header:

| Name | Value |
|---|---|
| `Content-Type` | `application/json` |

---

## Bước 7: Thêm HTTP Request Sampler (Login)

Đây là request thực sự gọi API login.

1. **Chuột phải vào TG_01** → **Add → Sampler → HTTP Request**
2. Đặt tên: **`POST - /api/v1/identity/auth/token`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Server Name** | `localhost` *(hoặc để trống nếu đã có HTTP Request Defaults)* |
| **Port Number** | `8888` |
| **Path** | `/api/v1/identity/auth/token` |
| **Body Data** | *(xem bên dưới)* |

**Nội dung Body Data** (tab "Body Data"):
```json
{"username": "${username}", "password": "${password}"}
```

> ⚠️ **Quan trọng**: Chọn tab **"Body Data"** (không phải "Parameters") vì đây là JSON request body.

---

## Bước 8: Thêm JSON Extractor (Lấy Token)

Bước này trích xuất `ACCESS_TOKEN` từ response để dùng cho các TG khác (TG_05, TG_06...).

1. **Chuột phải vào HTTP Request vừa tạo** → **Add → Post Processors → JSON Extractor**
2. Đặt tên: **`Extract - ACCESS_TOKEN`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Names of created variables** | `ACCESS_TOKEN` |
| **JSON Path expressions** | `$.result.token` |
| **Match No.** | `1` |
| **Default Values** | `TOKEN_NOT_FOUND` |

> 💡 Nếu path `$.result.token` không đúng, dùng Postman để test thử response và xác nhận JSONPath.

---

## Bước 9: Thêm Response Assertion (Kiểm Tra Kết Quả)

### 9.1. Kiểm tra HTTP Status Code = 200

1. **Chuột phải vào HTTP Request** → **Add → Assertions → Response Assertion**
2. Đặt tên: **`Assert - Status 200`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Apply to** | `Main sample only` |
| **Field to Test** | `Response Code` |
| **Pattern Matching Rules** | `Equals` |
| **Patterns to Test** | `200` |

### 9.2. Kiểm tra Body chứa "token"

1. **Chuột phải vào HTTP Request** → **Add → Assertions → Response Assertion**
2. Đặt tên: **`Assert - Body contains token`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Field to Test** | `Response Body` |
| **Pattern Matching Rules** | `Contains` |
| **Patterns to Test** | `token` |

### 9.3. Kiểm tra Response Time < 2000ms

1. **Chuột phải vào HTTP Request** → **Add → Assertions → Duration Assertion**
2. Đặt tên: **`Assert - Response Time < 2000ms`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Duration in milliseconds** | `2000` |

---

## Bước 10: Thêm Throughput Controller (50 req/s)

Để giới hạn throughput mục tiêu 50 req/s:

1. **Chuột phải vào TG_01** → **Add → Timer → Constant Throughput Timer**
2. Đặt tên: **`Throughput - 50 req/s`**
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Target throughput (in samples per minute)** | `3000` *(= 50 × 60)* |
| **Calculate Throughput based on** | `All active threads in current thread group` |

---

## Bước 11: Thêm Listeners (Xem Kết Quả)

### 11.1. View Results Tree (debug - chỉ dùng khi test nhỏ)

1. **Chuột phải vào TG_01** → **Add → Listener → View Results Tree**

> ⚠️ Tắt listener này khi chạy load thật (gây tốn RAM).

### 11.2. Summary Report

1. **Chuột phải vào TG_01** → **Add → Listener → Summary Report**

### 11.3. Aggregate Report (quan trọng nhất - xem p95, p99)

1. **Chuột phải vào TG_01** → **Add → Listener → Aggregate Report**

> ✅ Listener này hiển thị: Average, Min, Max, **90th pct**, **95th pct**, **99th pct**, Throughput, Error%.

### 11.4. Lưu kết quả ra file CSV

Trong mỗi Listener, điền vào trường **"Write results to file"**:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_01_result.csv
```
*(Tạo thư mục `results` trước)*

---

## Bước 12: Lưu Test Plan

**File → Save As** → Lưu thành:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_01_Login_LoadTest.jmx
```

---

## Bước 13: Chạy Test

### Cách 1: Chạy qua GUI (Khuyến nghị để debug)
- Click nút **▶ Run** (hoặc Ctrl+R)
- Quan sát **View Results Tree** và **Aggregate Report** real-time

### Cách 2: Chạy qua Command Line (Khuyến nghị cho load test thật)
```powershell
# Di chuyển đến thư mục JMeter
cd C:\apache-jmeter\bin

# Chạy test không có GUI
.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_01_Login_LoadTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_01_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_01_report"
```

> 💡 Tham số:
> - `-n` : non-GUI mode
> - `-t` : đường dẫn file .jmx
> - `-l` : file log kết quả (.jtl)
> - `-e -o` : tạo HTML report tự động

---

## Bước 14: Đọc Kết Quả & Đánh Giá

### Metrics cần quan tâm trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 400ms | 90% request hoàn thành trong thời gian này |
| **95th Percentile** | **< 500ms** ✅ | SLA chính |
| **99th Percentile** | **< 1000ms** ✅ | SLA phụ |
| **Error %** | **< 1%** ✅ | Tỷ lệ lỗi |
| **Throughput** | ≥ 50 req/s | Thông lượng đạt mục tiêu |
| **Average** | < 300ms | Trung bình |

### Các lỗi thường gặp & cách xử lý:

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `Connection refused` | Services chưa khởi động | Kiểm tra docker/services |
| `401 Unauthorized` | Sai username/password | Kiểm tra seed SQL đã chạy chưa |
| `TOKEN_NOT_FOUND` | JSONPath sai | Dùng View Results Tree để xem response structure |
| `Non HTTP response` | Quá nhiều thread, OS hết socket | Giảm threads hoặc tăng OS file descriptor limit |
| Error% cao | DB quá tải hoặc bcrypt timeout | Kiểm tra DB connections, logs |

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_01 - User Login Load Test [100 threads, 60s ramp-up, loop=1]
    ├── 📄 CSV Data Set Config: CSV - Users Login Data
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Content-Type: application/json
    ├── ⏱️ Constant Throughput Timer: 3000 req/min (= 50 req/s)
    ├── 🔷 HTTP Request: POST /api/v1/identity/auth/token
    │   ├── 🔍 JSON Extractor: $.result.token → ACCESS_TOKEN
    │   ├── ✅ Response Assertion: Status Code = 200
    │   ├── ✅ Response Assertion: Body contains "token"
    │   └── ✅ Duration Assertion: < 2000ms
    ├── 📊 Listener: View Results Tree
    ├── 📊 Listener: Summary Report
    └── 📊 Listener: Aggregate Report
```

---

## Checklist Trước Khi Chạy

- [ ] Identity Service + API Gateway đang chạy (port 8888)
- [ ] `seed_users.sql` đã được import vào DB
- [ ] Test thử bằng Postman/curl với `testuser001`/`Test@123456` → OK
- [ ] File `users.csv` đặt đúng đường dẫn trong CSV Data Set Config
- [ ] Tạo thư mục `results/` trong `test_JMeter/`
- [ ] Listeners đã set đường dẫn lưu file kết quả
- [ ] Không mở quá nhiều Listeners khi chạy load thật
