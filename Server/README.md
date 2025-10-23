## API thêm user Google Workspace EDU với Express.js
<!-- SMS webhook feature removed per project decision -->


API này cho phép tạo user mới trong Google Workspace (EDU) bằng Google Admin SDK. Dự án sử dụng Service Account kèm Domain‑Wide Delegation để mạo danh (impersonate) admin.

### 1) Yêu cầu & chuẩn bị
- Node.js 18+
- Quyền quản trị trong Google Workspace (Super Admin hoặc Admin có quyền Directory)
- Một Google Cloud Project

### 2) Bật API và tạo Service Account
1. Vào Google Cloud Console → APIs & Services → Enable APIs and Services → bật "Admin SDK".
2. Tạo Service Account: IAM & Admin → Service Accounts → New Service Account.
3. Tạo key cho Service Account (JSON). KHÔNG commit file JSON.

### 3) Bật Domain‑Wide Delegation (DWD)
1. Mở Service Account vừa tạo → phần "Show domain-wide delegation" → bật và lưu Client ID.
2. Vào Admin Console: Security → Access and data control → API controls → Domain-wide delegation → Add new.
3. Dán Client ID và thêm các scope:
   - `https://www.googleapis.com/auth/admin.directory.user`

### 4) Chọn user để mạo danh (impersonate)
- Chọn một tài khoản admin trong domain, ví dụ `admin@your-domain.edu`.

### 5) Cấu hình môi trường
Tạo file `.env` ở thư mục gốc (hoặc sao chép từ `config/env.example` rồi đổi tên), với nội dung mẫu:

```env
PORT=3000
GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
GOOGLE_IMPERSONATE_SUBJECT=admin@your-domain.edu
```

Lưu ý: với PRIVATE KEY, nếu lưu trong `.env`, cần giữ `\n` như trên. Nếu dùng file JSON, chuyển thành biến môi trường tương ứng.

### 6) Cài đặt và chạy

```bash
npm install
npm run dev
# hoặc
npm start
```

Server chạy tại `http://localhost:3000`.

### 7) Kiến trúc nhanh
- `src/server.js`: Express server, middleware, health check, mount routes.
- `src/users.js`: Endpoint tạo user Workspace.
- `src/lib/googleAuth.js`: Khởi tạo Admin SDK với JWT + DWD + impersonation.
- `config/env.example`: Mẫu biến môi trường nếu không thể tạo `.env.example` ở root.

### 8) API tạo user
- Endpoint: `POST /api/users`
- Body JSON:

```json
{
  "primaryEmail": "new.user@your-domain.edu",
  "password": "StrongP@ssw0rd",
  "givenName": "New",
  "familyName": "User",
  "orgUnitPath": "/Students",
  "recoveryEmail": "owner@example.com",
  "recoveryPhone": "+84901234567"
}
```

#### Trường mở rộng kiểu bulk (tùy chọn, bỏ qua nếu rỗng)
Bạn có thể truyền thêm các trường sau; bất kỳ trường nào rỗng/undefined sẽ KHÔNG được gửi lên Admin SDK:

```json
{
  "orgUnitPath": "/Students",
  "suspended": false,
  "changePasswordAtNextLogin": false,
  "workPhone": "+84123456789",
  "homePhone": "",
  "mobilePhone": "+84987654321",
  "workAddress": "123 Main St, HN",
  "homeAddress": "",
  "workSecondaryEmail": "alt@your-domain.edu",
  "homeSecondaryEmail": "",
  "employeeId": "EMP-001",
  "employeeType": "FULL_TIME",
  "employeeTitle": "Teacher",
  "department": "Math",
  "costCenter": "CC-01",
  "managerEmail": "manager@your-domain.edu",
  "buildingId": "B1",
  "floorName": "F2",
  "floorSection": "S3",
  "notes": "New hire",
  "language": "vi"
}
```

Hệ thống sẽ tự động “prune” các giá trị trống ("", null, undefined, mảng rỗng, object rỗng) trước khi gọi Admin SDK.

- Phản hồi thành công 201:

```json
{
  "user": {
    "id": "...",
    "primaryEmail": "new.user@your-domain.edu",
    "backupCodes": ["123456","654321","..."],
    ...
  }
}
```