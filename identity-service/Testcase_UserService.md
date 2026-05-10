# Bảng Kịch Bản Kiểm Thử (Test Cases) - UserService

Dưới đây là chi tiết 4 Test Cases được thiết kế cho phương thức `createUser` của lớp `UserService`. Bạn có thể bôi đen toàn bộ bảng này và Copy/Paste thẳng vào file Excel hoặc Word báo cáo của bạn.

| Mã testcase | Trường hợp test | Input (Dữ liệu đầu vào) | Expected Output (Kết quả kỳ vọng) |
| :--- | :--- | :--- | :--- |
| **IDN_001** | Người dùng đủ thông tin hợp lệ | `UserCreationRequest request = UserCreationRequest.builder()`<br>&nbsp;&nbsp;`.username("test_user_01")`<br>&nbsp;&nbsp;`.password("password123")`<br>&nbsp;&nbsp;`.firstName("Nguyen")`<br>&nbsp;&nbsp;`.build();` | Dữ liệu tạo bản ghi mới thành công dưới Database, hàm trả về đối tượng `UserResponse` có `username` là "test_user_01". |
| **IDN_002** | Người dùng có tên đăng nhập đã tồn tại | *(Giả sử DB đã có sẵn user tên "test_user_01")*<br><br>`UserCreationRequest request = UserCreationRequest.builder()`<br>&nbsp;&nbsp;`.username("test_user_01")`<br>&nbsp;&nbsp;`.password("password123")`<br>&nbsp;&nbsp;`.build();` | Hàm ném ra ngoại lệ `AppException` với mã lỗi báo trùng lặp: `ErrorCode.USER_EXISTED`. |
| **IDN_003** | Người dùng có trường dữ liệu không hợp lệ | `UserCreationRequest request = UserCreationRequest.builder()`<br>&nbsp;&nbsp;`.username("test_user_03")`<br>&nbsp;&nbsp;`.password("123")`<br>&nbsp;&nbsp;`.build();` | Hàm ném ra ngoại lệ báo lỗi (Exception) từ chối tạo do độ dài mật khẩu không hợp lệ (ngắn hơn 6 ký tự). |
| **IDN_004** | Người dùng trường dữ liệu bị thiếu (là null) | `UserCreationRequest request = UserCreationRequest.builder()`<br>&nbsp;&nbsp;`.username(null)`<br>&nbsp;&nbsp;`.password("password123")`<br>&nbsp;&nbsp;`.build();` | Hàm ném ra ngoại lệ báo lỗi (Exception) do khuyết trường dữ liệu bắt buộc (`username` bị null) hoặc văng lỗi CSDL. |
