# Phần 4: Setup JMeter & Monitoring

## 1. Cấu Trúc Test Plan Hoàn Chỉnh

```text
Test Plan: Bookstore Microservices Performance Test
│
├── [User Defined Variables]
│     HOST = localhost
│     PORT = 8888
│     BASE_URL = http://${HOST}:${PORT}/api/v1
│     ADMIN_USER = admin
│     ADMIN_PASS = Admin@123
│
├── [HTTP Request Defaults]
│     Server Name: ${HOST}
│     Port: ${PORT}
│     Content-Type: application/json
│
├── [CSV Data Set Config: users.csv]
│     username, password
│
├── [CSV Data Set Config: products.csv]
│     product_id, variant_id
│
├── [CSV Data Set Config: search_keywords.csv]
│     keyword, min_price, max_price, brand_id, category_id
│
├── [HTTP Header Manager - Global]
│     Content-Type: application/json
│     Accept: application/json
│
├── [Cookie Manager]
│
├── [TG_01] Login Load Test (100 threads)
│     ├── HTTP Request: POST /identity/auth/token
│     ├── JSON Extractor: ACCESS_TOKEN
│     ├── Response Assertion: code=200, body contains "token"
│     └── Duration Assertion: < 2000ms
│
├── [TG_02] Product List Load (200 threads)
│     ├── HTTP Request: GET /product/products
│     ├── Response Assertion
│     └── Throughput Controller
│
├── [TG_03] Advanced Search Stress (50→200 threads)
│     ├── HTTP Request: GET /product/products/search/advanced
│     ├── Random Variable: page
│     └── Response Assertion
│
├── [TG_04] Product Detail (150 threads)
│     ├── HTTP Request: GET /product/products/${product_id}
│     └── Response Assertion
│
├── [TG_05] Add Cart Spike (100 threads, ramp 5s)
│     ├── setUp: Login → extract token
│     ├── HTTP Request: POST /cart/items
│     └── Response Assertion
│
├── [TG_06] Create Order Stress (50 threads)
│     ├── HTTP Request: POST /orders
│     └── Duration Assertion: < 5000ms
│
├── [TG_07] My Orders List (100 threads)
│     ├── HTTP Request: GET /orders/my-orders
│     └── Response Assertion
│
├── [TG_08] Voucher Claim Spike (80 threads, ramp 3s)
│     ├── HTTP Request: POST /vouchers/${voucher_id}/claim
│     └── Response Assertion: 200 or 400
│
├── [TG_09] Revenue Stats Admin (20 threads)
│     ├── HTTP Request: GET /orders/revenue-statistics
│     └── Duration Assertion: < 10000ms
│
├── [TG_10] E2E Soak Test (30 threads, 30min)
│     ├── Transaction Controller: "Full Journey"
│     │     ├── Login
│     │     ├── Gaussian Timer: 2000ms ±500ms
│     │     ├── Browse products
│     │     ├── Search
│     │     ├── View detail
│     │     ├── Add cart
│     │     └── Create order
│     └── Response Assertions per step
│
└── [Listeners - All Thread Groups]
      ├── Summary Report
      ├── Aggregate Report
      ├── Response Times Over Time
      ├── Transactions Per Second
      ├── Active Threads Over Time
      └── View Results Tree (disabled khi chạy thật - chỉ debug)
```

---

## 2. Test Data Strategy

### users.csv (100 users test)
```csv
username,password
testuser001,Test@123456
testuser002,Test@123456
...
testuser100,Test@123456
```

### admin_users.csv
```csv
username,password,role
admin01,Admin@123,ADMIN
```

### products.csv (50 sản phẩm)
```csv
product_id,variant_id,product_name
1,1,Laptop Dell
2,5,iPhone 15
...
```

### search_keywords.csv
```csv
keyword,min_price,max_price,brand_id,category_id
laptop,,,,
iphone,5000000,30000000,,
samsung,,,,2
,,0,5000000,1,
```

### addresses.csv
```csv
user_id,address_id
testuser001,1
testuser002,2
```

---

## 3. Assertions & Listeners Chi Tiết

### Assertions nên cấu hình

| Assertion Type | Config | Áp dụng cho |
|---|---|---|
| Response Assertion | Response Code = 200 | Tất cả TG |
| Response Assertion | JSON Path $.result != null | Tất cả GET |
| Duration Assertion | Max time per TG (xem bảng) | Tất cả TG |
| JSON Assertion | $.code = 0 hoặc 1000 | Tất cả response |
| Size Assertion | < 5MB | TG_02, TG_04 |

### Max Duration per Thread Group

| TG | Max Response Time |
|---|---|
| TG_01 Login | 2000ms |
| TG_02 Product List | 2000ms |
| TG_03 Advanced Search | 5000ms |
| TG_04 Product Detail | 2000ms |
| TG_05 Add Cart | 3000ms |
| TG_06 Create Order | 8000ms |
| TG_07 My Orders | 3000ms |
| TG_08 Voucher Claim | 3000ms |
| TG_09 Revenue Stats | 15000ms |
| TG_10 E2E Full | 30000ms |

### Listeners nên dùng
- **Summary Report**: Tổng hợp min/max/avg/error%
- **Aggregate Report**: Percentile p90/p95/p99
- **Response Times Over Time (plugin)**: Thấy xu hướng chậm dần theo thời gian
- **Transactions Per Second (plugin)**: TPS thực tế
- **Active Threads Over Time (plugin)**: Verify ramp-up đúng
- **jp@gc - PerfMon Metrics Collector**: Monitor CPU, RAM server

---

## 4. Monitoring Strategy

### Metrics cần theo dõi trong quá trình test

| Metric | Tool | Warning | Critical |
|---|---|---|---|
| CPU server | PerfMon / htop | > 70% | > 90% |
| RAM JVM heap | JVM metrics | > 80% | > 95% |
| DB connections | MySQL SHOW PROCESSLIST | > 80% pool | pool exhausted |
| Response Time p95 | JMeter Aggregate | > threshold | 2x threshold |
| Error Rate | JMeter Summary | > 1% | > 5% |
| TPS | JMeter TPS graph | < target 50% | < target 20% |
| DB slow queries | MySQL slow query log | > 1s | > 5s |

### MySQL Slow Query Monitoring
```sql
-- Enable slow query log trước khi test
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- Query sau test để tìm slow queries
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 20;
```

### JVM Monitoring (mỗi service)
```bash
# Memory usage
jstat -gcutil <pid> 5000

# Thread dump khi thấy latency tăng bất thường
jstack <pid> > thread_dump_$(date +%s).txt
```

---

## 5. Cấu Hình JMeter Khuyến Nghị

### JMeter Startup (jmeter.bat / jmeter.sh)
```bash
# Tăng heap cho JMeter khi chạy nhiều threads
set HEAP=-Xms1g -Xmx4g -XX:MaxMetaspaceSize=256m
```

### jmeter.properties
```properties
# Tăng timeout
httpclient4.time_to_live=2000
httpclient4.idletimeout=2000

# Disable verify SSL
https.use.cached.ssl.context=false

# Non-GUI mode cho test thật
jmeter -n -t test_plan.jmx -l results.jtl -e -o report_output/
```

### Timers (Think Time)
- Trang browse: Gaussian Timer, mean=2000ms, deviation=500ms
- Trang search: Gaussian Timer, mean=1500ms, deviation=300ms
- Sau add cart: Gaussian Timer, mean=3000ms, deviation=1000ms
- Giữa các request: Constant Throughput Timer theo TG

---

## 6. Quy Trình Thực Thi Test

### Bước 1: Chuẩn bị môi trường
1. Đảm bảo tất cả services đang chạy (identity, product, order, payment, profile)
2. DB có dữ liệu: ít nhất 100 users, 200 products, 500 variants
3. Tạo CSV files test data
4. Bật MySQL slow query log
5. Chạy JMeter ở non-GUI mode

### Bước 2: Chạy từng TG riêng lẻ trước
- Chạy TG_01 → verify login OK
- Chạy TG_02 → verify product list OK
- Chạy TG_05 → cần token từ TG_01 trước

### Bước 3: Chạy full test
```bash
jmeter -n -t bookstore_full_test.jmx \
  -l results/result_$(date +%Y%m%d_%H%M).jtl \
  -e -o reports/report_$(date +%Y%m%d_%H%M)/ \
  -JHOST=localhost -JPORT=8888
```

### Bước 4: Phân tích kết quả
- Mở HTML report trong `reports/`
- Kiểm tra p95, p99 per endpoint
- Tìm endpoints có error > threshold
- Xem slow query log MySQL
- Tìm memory/CPU spikes tương ứng với thời điểm latency tăng

---

## 7. Kết Quả Chấp Nhận (Pass/Fail Criteria)

| Criteria | Pass | Fail |
|---|---|---|
| Login p95 | ≤ 500ms | > 1000ms |
| Product list p95 | ≤ 800ms | > 2000ms |
| Advanced search p95 | ≤ 2000ms | > 5000ms |
| Create order p95 | ≤ 3000ms | > 8000ms |
| Error rate overall | ≤ 1% | > 5% |
| TPS login | ≥ 50 req/s | < 20 req/s |
| TPS product list | ≥ 100 req/s | < 40 req/s |
| No OOM errors | 0 OOM | Any OOM |
| No connection pool exhaustion | 0 | Any |
