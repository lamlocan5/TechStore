# Bảng Kịch Bản Kiểm Thử (Test Cases) - Các Chức Năng Bổ Sung của UserService

Dưới đây là chi tiết các Test Cases được thiết kế cho các phương thức còn lại của lớp `UserService`. Bạn có thể Copy/Paste thẳng vào file Excel báo cáo.

| STT | Mã testcase | Lớp điều khiển | Phương thức | Trường hợp test | Mục tiêu test | Input (Dữ liệu đầu vào) | Expected Output (Kết quả kỳ vọng) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 5 | **IDN_5** | UserService (Đổi mật khẩu) | `changePassword` | Đổi mật khẩu thành công | Kiểm tra đổi mật khẩu với dữ liệu hợp lệ | User tồn tại<br>`PasswordChangeRequest request = new PasswordChangeRequest("oldPassword", "newPassword");` | Cập nhật mật khẩu thành công trong DB, trả về `UserResponse`. |
| 6 | **IDN_6** | UserService (Đổi mật khẩu) | `changePassword` | Người dùng không tồn tại | Kiểm tra lỗi khi user không có trong DB | `userId` không tồn tại<br>`PasswordChangeRequest request = new PasswordChangeRequest("oldPassword", "newPassword");` | Ném `AppException` với `ErrorCode.USER_NOT_EXISTED`. |
| 7 | **IDN_7** | UserService (Đổi mật khẩu) | `changePassword` | Sai mật khẩu cũ | Kiểm tra xác minh mật khẩu cũ | User tồn tại<br>`PasswordChangeRequest request = new PasswordChangeRequest("wrongPassword", "newPassword");` | Ném `AppException` với `ErrorCode.INCORRECT_PASSWORD`. |
| 8 | **IDN_8** | UserService (Cập nhật thông tin user) | `updateUser` | Cập nhật thành công | Kiểm tra update với dữ liệu hợp lệ | User tồn tại<br>`UserUpdateRequest request = new UserUpdateRequest("NewName", "Nguyen");` | Cập nhật thành công, trả về `UserResponse` với tên mới. |
| 9 | **IDN_9** | UserService (Cập nhật thông tin user) | `updateUser` | Người dùng không tồn tại | Kiểm tra lỗi user không tồn tại | `userId` không tồn tại<br>`UserUpdateRequest request = new UserUpdateRequest("NewName", "Nguyen");` | Ném `AppException` với `ErrorCode.USER_NOT_EXISTED`. |
| 10 | **IDN_10** | UserService (Cập nhật thông tin user) | `updateUser` | Dữ liệu không hợp lệ | Kiểm tra validate dữ liệu rỗng | User tồn tại<br>`UserUpdateRequest request = new UserUpdateRequest("", "");` | Ném Exception do dữ liệu rỗng (FAILED nếu hệ thống không validate). |
| 11 | **IDN_11** | UserService (Lấy danh sách user) | `getUsers()` | Lấy danh sách user | Kiểm tra phương thức trả về danh sách user | (Không truyền tham số, DB có sẵn user) | Lấy danh sách user thành công. |
| 12 | **IDN_12** | UserService (Lấy thông tin 1 user) | `getMyInfo()` | Lấy thông tin bản thân | Kiểm tra phương thức trả về đúng user đang đăng nhập | Đã đăng nhập user hợp lệ | Lấy thông tin bản thân thành công. |
| 13 | **IDN_13** | UserService (Lấy thông tin 1 user) | `getUser(String id)` | User không tồn tại | Kiểm tra ném lỗi khi tìm ID không tồn tại | Truyền vào `id` không tồn tại | Ném `AppException` với `ErrorCode.USER_NOT_EXISTED`. |
