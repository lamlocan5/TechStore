# Hướng Dẫn Cấu Hình JMeter - TG_05: Add to Cart Concurrent (Race Condition / Spike Test)

## Thông Tin Test

| Thuộc tính | Giá trị |
|---|---|
| **Mục tiêu** | Phát hiện race condition khi nhiều user thêm sản phẩm vào cart cùng lúc |
| **API** | `POST /api/v1/cart/items` |
| **Server** | `localhost` |
| **Port** | `8888` (API Gateway) |
| **Threads** | 100 (spike đột ngột) |
| **Ramp-up** | **5 giây** (cực nhanh — đặc trưng Spike Test) |
| **Loop** | 3 |
| **Duration** | ~3 phút |
| **Target throughput** | 50 req/s |
| **SLA** | p95 < 1000ms, Error < 3% |
| **Loại test** | ⚡ **Spike Test** (khác hoàn toàn TG_01–04) |
| **Auth** | ✅ **Cần Bearer Token** (private endpoint) |

> 💡 **Spike Test vs Load/Stress Test là gì?**
> - **Load Test** (TG_01, TG_02, TG_04): Tải **cố định** ổn định → đo steady-state performance.
> - **Stress Test** (TG_03): Tăng dần đến breaking point.
> - **Spike Test** (TG_05): **Tăng đột ngột** 100 threads trong 5 giây → mô phỏng flash sale, traffic burst.

> 💡 **Race Condition là gì trong context này?**
> Khi 100 users **cùng lúc** add cùng một sản phẩm vào cart → hệ thống phải xử lý upsert đồng thời.
> Nếu không có lock/transaction đúng → có thể bị duplicate cart item, sai quantity, hoặc data corruption.

---

## Bước 1: Chuẩn Bị Trước Khi Vào JMeter

### 1.1. Kiểm tra API (cần token)

Lấy token bằng cách login thủ công:
```
curl -X POST "http://localhost:8888/api/v1/identity/auth/token" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"testuser001\", \"password\": \"Test@123456\"}"
```
> ✅ Lưu lại giá trị `result.token` — dùng để test thử bên dưới.

Test thử API cart:
```
curl -X POST "http://localhost:8888/api/v1/cart/items" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <TOKEN_Ở_TRÊN>" ^
  -d "{\"variantId\": 1, \"quantity\": 1}"
```
> ✅ Trả về JSON có `"result"` → API hoạt động.

### 1.2. Tạo file CSV variant IDs

Tạo file `variant_ids.csv` tại:
```
test_JMeter\data\data_chung\variant_ids.csv
```

> ⚠️ **Dùng lệnh PowerShell sau để tạo file KHÔNG có BOM** (tránh lỗi như TG_04):

```powershell
$content = "variant_id`n1`n2`n3`n4`n5"
[System.IO.File]::WriteAllText(
  "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\variant_ids.csv",
  $content,
  [System.Text.UTF8Encoding]::new($false)
)
```

Nội dung file (chỉ cần **5 variant ID** — dùng đi dùng lại để tạo contention):
```
variant_id
1
2
3
4
5
```

> 💡 **Tại sao chỉ 5 variant thay vì 20–50 như TG_04?**
> TG_05 muốn tạo **contention** — nhiều user cùng add **cùng sản phẩm**.
> Nếu dùng 100 variant khác nhau → không có race condition → mất mục đích test.
> 5 variant + 100 threads → trung bình 20 thread tranh nhau mỗi variant → tạo đủ áp lực.

### 1.3. File CSV users đã có sẵn

File `users.csv` đã tồn tại tại:
```
test_JMeter\data\data_user\users.csv
```

Format: `username,password` — 100 users từ `testuser001` đến `testuser100`.

---

## Bước 2: Thêm Thread Group (TG_05) — Spike Test Config

**Chuột phải vào Test Plan** → **Add → Threads (Users) → Thread Group**

Đặt tên: **`TG_05 - Add to Cart Race Condition Spike Test`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Number of Threads | `100` | 100 user đồng thời |
| Ramp-up period | `5` | ⚡ Tăng cực nhanh: 100/5 = 20 thread/giây |
| Loop Count | `3` | Mỗi user add cart 3 lần |

> 💡 **Tại sao Ramp-up chỉ 5 giây (khác hẳn TG_01–04 là 60–120s)?**
> Spike Test **cố tình** tạo tải đột ngột để mô phỏng:
> - Flash sale bắt đầu: tất cả user vào cùng lúc.
> - Marketing campaign: hàng ngàn user click link cùng một lúc.
> Ramp-up = 5s → gần như toàn bộ 100 threads active trong vòng 5 giây đầu.

---

## Bước 3: Thêm CSV Data Set Config — Users (Login)

TG_05 cần login để lấy token → cần CSV users.

**Chuột phải vào TG_05** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Users`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\users.csv` | |
| **Variable Names** | `username,password` | 2 biến |
| **Ignore first line** | `True` | Dòng đầu là header |
| **Delimiter** | `,` | |
| **Recycle on EOF** | `True` | 100 threads × 3 loops = 300 > 100 users → cần recycle |
| **Stop thread on EOF** | `False` | |
| **Sharing mode** | `All threads` | |

---

## Bước 4: Thêm CSV Data Set Config — Variant IDs

**Chuột phải vào TG_05** → **Add → Config Element → CSV Data Set Config**

Đặt tên: **`CSV - Variant IDs`**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Filename** | `C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\variant_ids.csv` | |
| **Variable Names** | `variant_id` | 1 biến |
| **Ignore first line** | `True` | |
| **Delimiter** | `,` | |
| **Recycle on EOF** | `True` | Chỉ 5 variant → phải recycle liên tục |
| **Stop thread on EOF** | `False` | |
| **Sharing mode** | `All threads` | Tất cả threads dùng chung → tạo contention |

> 💡 **Sharing mode = All threads** ở đây rất quan trọng:
> → Các threads lấy variant_id **theo vòng tròn**: 1, 2, 3, 4, 5, 1, 2, 3...
> → Đảm bảo mỗi variant bị nhiều threads hit đồng thời → race condition xảy ra.

---

## Bước 5: Thêm HTTP Request Defaults

**Chuột phải vào TG_05** → **Add → Config Element → HTTP Request Defaults**

| Trường | Giá trị |
|---|---|
| **Server Name or IP** | `localhost` |
| **Port Number** | `8888` |
| **Protocol** | `http` |

---

## Bước 6: Thêm HTTP Header Manager

**Chuột phải vào TG_05** → **Add → Config Element → HTTP Header Manager**

| Name | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

> ⚠️ **Chưa có Authorization ở đây** — Token sẽ được thêm sau khi login (Bước 7).

---

## Bước 7: Thêm HTTP Request — Login (Lấy Token)

**Chuột phải vào TG_05** → **Add → Sampler → HTTP Request**

Đặt tên: **`POST - Login (Get Token)`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/identity/auth/token` |
| **Body Data** | `{"username": "${username}", "password": "${password}"}` |

> ⚠️ Chọn tab **Body Data** (không phải Parameters) vì đây là JSON body.

### 7.1. Thêm JSON Extractor để lấy token

**Chuột phải vào "POST - Login"** → **Add → Post Processors → JSON Extractor**

| Trường | Giá trị |
|---|---|
| Name | `Extract - ACCESS_TOKEN` |
| **Names of created variables** | `ACCESS_TOKEN` |
| **JSON Path expressions** | `$.result.token` |
| **Match No.** | `1` |
| **Default Value** | `TOKEN_NOT_FOUND` |

---

## Bước 8: Thêm HTTP Header Manager riêng cho Cart Request (Bearer Token)

**Chuột phải vào TG_05** → **Add → Config Element → HTTP Header Manager**

Đặt tên: **`Header - Authorization`**

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${ACCESS_TOKEN}` |

> 💡 **Tại sao cần 2 Header Manager?**
> - Header Manager ở Bước 6: `Content-Type` + `Accept` → áp dụng cho **tất cả** requests (kể cả Login).
> - Header Manager ở Bước 8 (Authorization): chỉ áp dụng sau khi đã có token từ Login.
> - Cách khác: Đặt Authorization vào **chính HTTP Request cart** thay vì Header Manager riêng.

---

## Bước 9: Thêm Constant Throughput Timer (50 req/s)

**Chuột phải vào TG_05** → **Add → Timer → Constant Throughput Timer**

| Trường | Giá trị | Giải thích |
|---|---|---|
| **Target throughput** | `3000` | 50 req/s × 60 = 3000 req/phút |
| **Calculate based on** | `All active threads in current thread group` | |

---

## Bước 10: Thêm HTTP Request Sampler — Add to Cart

**Chuột phải vào TG_05** → **Add → Sampler → HTTP Request**

Đặt tên: **`POST - /api/v1/cart/items`**

| Trường | Giá trị |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/cart/items` |

### Tab Body Data:
```json
{"variantId": ${variant_id}, "quantity": 1}
```

> ⚠️ Dùng tab **Body Data** (không phải Parameters) vì đây là POST với JSON body.

> 💡 **quantity = 1 cố định**: Đủ để test race condition. Không cần random quantity.

---

## Bước 11: Thêm Các Assertions

### 11.1. Kiểm tra Status Code = 200

**Chuột phải vào HTTP Request cart** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Status 200` |
| **Field to Test** | `Response Code` |
| Pattern Matching | `Equals` |
| Pattern | `200` |

### 11.2. Kiểm tra Body chứa "result"

**Chuột phải vào HTTP Request cart** → **Add → Assertions → Response Assertion**

| Trường | Giá trị |
|---|---|
| Name | `Assert - Body has result` |
| **Field to Test** | `Text Response` |
| Pattern Matching | `Contains` |
| Pattern | `result` |

### 11.3. Kiểm tra Response Time < 3000ms

**Chuột phải vào HTTP Request cart** → **Add → Assertions → Duration Assertion**

| Trường | Giá trị | Giải thích |
|---|---|---|
| Name | `Assert - Response Time < 3000ms` |
| **Duration** | `3000` | Thoáng hơn vì đây là Spike Test — server chịu tải đột ngột |

> 💡 **So sánh Duration Assertion:**
> - TG_01 Login: 2000ms
> - TG_04 Product Detail: 2000ms
> - TG_05 Add Cart Spike: **3000ms** (spike test chấp nhận chậm hơn bình thường)

> ⚠️ **Không assert 409 Conflict?**
> Nếu server xử lý cart theo kiểu **upsert** (add → tăng quantity nếu đã có) thì sẽ luôn trả 200.
> Nếu server trả 409 khi duplicate → cần sửa assertion thành `Contains` với pattern `200|409`
> Tùy vào business logic của service — kiểm tra API spec để biết.

---

## Bước 12: Thêm Listeners

**Chuột phải vào TG_05** → **Add → Listener:**

### 12.1. Aggregate Report ✅
Set file output:
```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_05_result.csv
```

### 12.2. Response Time Graph ✅
> Theo dõi response time theo thời gian — thấy spike rõ ràng trong 5 giây đầu.

### 12.3. View Results Tree ⚠️ (chỉ debug)
> Hữu ích để kiểm tra token có được extract đúng không.  
> **Disable** khi chạy full test.

---

## Bước 13: Lưu Test Plan

```
C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_05_AddCart_SpikeTest.jmx
```

---

## Bước 14: Chạy Test

### Cách 1: Chạy qua GUI
- Bật **View Results Tree** tạm thời để verify token extraction ở vài request đầu
- Click **▶ Run** (Ctrl+R)
- Quan sát spike ngay trong 5 giây đầu trên Response Time Graph

### Cách 2: Chạy qua Command Line
```powershell
cd C:\apache-jmeter\bin

.\jmeter.bat -n `
  -t "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\TG_05_AddCart_SpikeTest.jmx" `
  -l "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_05_result.jtl" `
  -e `
  -o "C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\results\TG_05_report"
```

---

## Bước 15: Đọc Kết Quả & Đánh Giá

### Metrics trong Aggregate Report:

| Metric | Ngưỡng Pass | Ý nghĩa |
|---|---|---|
| **90th Percentile** | < 700ms | |
| **95th Percentile** | **< 1000ms** ✅ | SLA chính |
| **99th Percentile** | < 2000ms | |
| **Error %** | **< 3%** ✅ | Cao hơn TG_01–04 vì spike test |
| **Throughput** | ≥ 50 req/s | |

### Cách đọc kết quả Race Condition:

Kiểm tra **Error % theo thời gian**:

```
0-5s   (Spike phase  ): response tăng vọt lên 500–2000ms → bình thường trong spike
5-30s  (Sustained    ): response ổn định < 1000ms → hệ thống recovery được ✅
Error% : < 3% → không có race condition nghiêm trọng ✅
Error% : > 10% → có vấn đề với upsert logic, cần investigate ❌
```

### Các lỗi thường gặp & cách xử lý:

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `TOKEN_NOT_FOUND` trong body | JSON Extractor lỗi, path sai | Kiểm tra `$.result.token` với View Results Tree |
| `401 Unauthorized` | Token không được truyền đúng | Kiểm tra Header Manager Authorization |
| `400 Bad Request` | Body JSON sai format | Kiểm tra `variantId` có đúng tên không |
| `404 Not Found` cho cart | variant_id không tồn tại trong DB | Sửa CSV dùng variant_id thật |
| Error% > 10% | Race condition thật / DB quá tải | Ghi nhận → đây là bug cần fix |
| CSV BOM error | File tạo bằng PowerShell `Set-Content` | Dùng `[System.IO.File]::WriteAllText` với UTF8 no BOM |

---

## So Sánh TG_01 / TG_02 / TG_03 / TG_04 / TG_05

| | TG_01 Login | TG_02 Product List | TG_03 Adv. Search | TG_04 Product Detail | TG_05 Add Cart |
|---|---|---|---|---|---|
| **Loại test** | Load | Load | Stress | Load | **Spike** |
| **Method** | POST | GET | GET | GET | **POST** |
| **Auth** | Không | Không | Không | Không | **✅ Cần token** |
| **Body** | JSON | Không | Không | Không | **JSON** |
| **Login step** | Không | Không | Không | Không | **✅ Có** |
| **Ramp-up** | 60s | 60s | 120s | 60s | **5s (⚡ spike)** |
| **Threads** | 100 | 200 | 200 | 150 | **100** |
| **Loop** | 1 | 5 | 10 | 10 | **3** |
| **Total requests** | 100 | 1000 | 2000 | 1500 | **300** |
| **Throughput** | 50 req/s | 100 req/s | 30 req/s | 80 req/s | **50 req/s** |
| **SLA p95** | 500ms | 800ms | 2000ms | 600ms | **1000ms** |
| **Duration Assert** | 2000ms | 2000ms | 5000ms | 2000ms | **3000ms** |
| **CSV count** | 1 (users) | N/A | 1 (search) | 1 (products) | **2 (users + variants)** |
| **Risk** | High | High | Critical | High | **High (race condition)** |

---

## Cấu Trúc Cuối Cùng Trong JMeter

```
📋 Test Plan: Bookstore Performance Test
└── 🧵 TG_05 - Add to Cart Race Condition Spike Test [100 threads, 5s ramp-up, loop=3]
    ├── 📄 CSV Data Set Config: users.csv
    │       Variables: username, password
    │       Recycle on EOF: True
    ├── 📄 CSV Data Set Config: variant_ids.csv
    │       Variables: variant_id
    │       Recycle on EOF: True
    │       Sharing mode: All threads
    ├── 🌐 HTTP Request Defaults: localhost:8888
    ├── 📋 HTTP Header Manager: Content-Type, Accept
    ├── ⏱️ Constant Throughput Timer: 3000 req/min (= 50 req/s)
    ├── 🔷 HTTP Request: POST /api/v1/identity/auth/token
    │       Body: {"username": "${username}", "password": "${password}"}
    │   └── 🔍 JSON Extractor: $.result.token → ACCESS_TOKEN
    ├── 📋 HTTP Header Manager: Authorization: Bearer ${ACCESS_TOKEN}
    ├── 🔷 HTTP Request: POST /api/v1/cart/items
    │       Body: {"variantId": ${variant_id}, "quantity": 1}
    │   ├── ✅ Response Assertion: Status Code = 200
    │   ├── ✅ Response Assertion: Body contains "result"
    │   └── ✅ Duration Assertion: < 3000ms
    ├── 📊 Listener: Aggregate Report → TG_05_result.csv
    ├── 📊 Listener: Response Time Graph
    └── 📊 Listener: View Results Tree (DISABLE khi chạy full)
```

---

## Checklist Trước Khi Chạy

- [ ] Identity Service + API Gateway đang chạy (port 8888)
- [ ] Test login thủ công bằng curl → lấy được token ✅
- [ ] File `variant_ids.csv` đã tạo **không có BOM** (dùng lệnh PowerShell ở Bước 1.2)
- [ ] Các `variant_id` trong CSV tồn tại trong DB
- [ ] **JSON Extractor** path: `$.result.token` (kiểm tra đúng với response thật)
- [ ] **Header Authorization**: `Bearer ${ACCESS_TOKEN}` (có dấu cách sau Bearer)
- [ ] **Body Data** của cart request: `{"variantId": ${variant_id}, "quantity": 1}`
- [ ] Ramp-up = **5 giây** (không phải 60s)
- [ ] **Disable** View Results Tree trước khi chạy full
- [ ] Tạo thư mục `results/` nếu chưa có
