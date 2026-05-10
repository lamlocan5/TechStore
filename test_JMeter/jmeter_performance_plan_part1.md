# Kế Hoạch Performance Test JMeter - Bookstore Microservices

## 1. Tổng Quan Kiến Trúc

### Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Backend Framework | Spring Boot 3.2.5 (Java 21) |
| ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Cache | Không có (chưa triển khai Redis) |
| Queue/Messaging | Apache Kafka (bootstrap: 103.214.8.112:9094) |
| Auth | JWT (RS256 / HS512), OAuth2 Resource Server |
| API Gateway | Spring Cloud Gateway (port 8888) |
| Inter-service | OpenFeign (sync HTTP) |
| File Storage | Không rõ (upload ảnh qua ImageIndexController) |
| Payment | VNPay (external integration) |
| Frontend | Next.js |

### Mapping Service — Port

| Service | Port | Context Path |
|---|---|---|
| API Gateway | 8888 | /api/v1/... |
| Identity Service | 8080 | /identity |
| Profile Service | 8081 | /profile |
| Notification Service | 8082 | /notification |
| Product Service | 8083 | /product |
| Order Service | 8084 | /api/orders, /api/cart, /api/vouchers |
| Payment Service | 8085 | /api/vnpay |
| Chatbot Service | 8086 | (BỎ QUA - AI) |
| AI Image Search | 8087 | (BỎ QUA - AI) |

### Điểm Bottleneck Tiềm Năng

1. **Product Search (GET /api/v1/product/products/search/advanced)**: Fuzzy search nhiều filter, JOIN nhiều bảng
2. **Create Order (POST /api/v1/orders)**: Transaction phức tạp - giảm stock, tạo order, tính voucher
3. **Add to Cart concurrent (POST /api/v1/cart/items)**: Race condition nếu nhiều user cùng thêm sản phẩm cuối
4. **VNPay callback (GET /api/v1/payment/payment-return)**: Retry logic với Thread.sleep, chặn thread
5. **Get All Products (GET /api/v1/product/products)**: Pagination nhưng không có cache
6. **Revenue Statistics (GET /api/v1/orders/revenue-statistics)**: Aggregate query lớn
