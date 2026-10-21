 # GHI CHÚ TẠM DỪNG — 18/10/2026

> Dừng theo yêu cầu (máy cần sleep). Ghi chú này cho biết dừng ở đâu, trạng thái từng nhánh và cách làm tiếp. Không có gì bị push; mọi thay đổi nằm trên các nhánh cục bộ.

## 1. Đã xong và đã kiểm chứng

| Repo (thư mục) | Nhánh | Commit đầu nhánh | Trạng thái |
|---|---|---|---|
| `report.api` | **`qc/dashboard-v2`** (nhánh tích hợp backend, 38 commit so với `origin/main`) | `5fc7b69` | **Xong.** Gồm các đợt 1, 2a, 2b, 3a, 3b và fix1. Build sạch; test DashboardV2 + KpiV2 489/491 (2 bỏ qua do cần Postgres); bộ dữ liệu chuẩn 15/15; EF không còn thay đổi model chưa có migration |
| `pos.api` | `qc/dashboard-v2-permissions` (từ nhánh `1001` của đội dev) | `f38f44545` | **Xong.** Thêm 5 mã quyền Dashboard V2; build sạch |
| `pos.gui` | `qc/dashboard-v2-wave1` → `qc/dashboard-v2-wave2` | `327745e8` | **Xong.** Đợt 1 + giao diện đợt 2/3: 43 file / 388 test đạt, `vue-tsc` và eslint sạch |

Các nhánh con `qc/dashboard-v2-wave1`, `-wave2`, `-wave2b`, `-wave3-rbac`, `-wave3b`, `-fix1` trong `report.api` được giữ lại để tra lịch sử. Worktree `report.api-rbac` (nhánh `qc/dashboard-v2-wave3b`) đã gộp xong, có thể xóa bằng `git -C report.api worktree remove ../report.api-rbac`.

## 2. Đang làm dở — dừng ở đây

**`pos.gui`, nhánh `qc/dashboard-v2-wave3`** — giao diện đợt 3. Đề bài: `dashboard_hmk/_agy/task_fe_wave3.md`.

| Hạng mục (theo đề bài) | Trạng thái |
|---|---|
| 0. Typings cho mọi endpoint mới | ✅ đã commit |
| 1. Vận hành (Order Aging rỗng, Time Peak, nhân khẩu, basket 5 mức, 6 phương thức thanh toán, chiến dịch, benchmark, anomaly, chuyển đổi, tỷ lệ trả/đổi) | ✅ đã commit |
| 2. Sản phẩm (tăng trưởng Top 5, đa chiều, treemap drill-down, ma trận SPH×CYL, thương hiệu, Top SP + SS/ROP) | ✅ đã commit — **dừng ngay sau hạng mục này** |
| 3. Nhân sự (leaderboard có "Chưa gán", Top-3, góc nhìn STAFF) | ⏳ chưa làm |
| 4. Quản lý KPI (danh sách, wizard có mục tiêu theo loại ngày, xung đột, bulk, chỉ đọc khi không có quyền ghi) | ⏳ chưa làm |
| 5. Import Excel 4 bước (Traffic, mục tiêu) | ⏳ chưa làm |
| 6. Traffic dùng chung (Search / Upsert / History) | ⏳ chưa làm |
| 7. Heatmap V2 (bucket một phần, khu vực chung) | ⏳ chưa làm |
| 8. Quản lý khu vực (BOD) | ⏳ chưa làm |
| 9. Test các hạng mục | một phần (theo từng hạng mục đã làm) |
| 10. Change log `docs/qc/WAVE3_pos_gui.md` | ⏳ chưa làm |

### 2.1. Trạng thái chính xác lúc dừng
- Worker `agy` được dừng **có kiểm soát** lúc 10:2x ngày 18/10, ngay sau commit `687ea752`; không còn tiến trình `agy` nào chạy.
- Nhánh `qc/dashboard-v2-wave3` có 3 commit trên `qc/dashboard-v2-wave2`:
  - `ac1c3bcf` typings + OpenAPI (hạng mục 0);
  - `c960797e` Vận hành FR-OP-01..10 (hạng mục 1);
  - `687ea752` Sản phẩm FR-PR-01..06 (hạng mục 2).
- **Cây làm việc sạch**; không có thay đổi chưa commit.
- Kiểm chứng lúc dừng: `vue-tsc` sạch; Vitest **392/395 đạt**, 46 file.
- **3 test lỗi**, cùng một nguyên nhân, cần sửa đầu tiên khi làm tiếp: `e2e/dashboard-v2/dashboardV2Responsive.spec.ts` (desktop / tablet / mobile) chờ bảng có class `min-w-[680px]`, nhưng hạng mục 2 đã đổi bảng Top sản phẩm sang `min-w-[800px]` (do thêm cột tồn kho / SS / ROP). Hướng sửa: cập nhật test responsive theo bảng mới, sau khi kiểm tra bảng vẫn cuộn ngang trong khung ở độ rộng 360px (NFR-05).

## 3. Việc còn lại sau khi làm tiếp
1. Sửa 3 test responsive (mục 2.1), rồi hoàn tất `qc/dashboard-v2-wave3` (hạng mục 3 → 10). Kiểm chứng: Vitest, `vue-tsc`, eslint, cây làm việc sạch.
2. Vòng QC cuối cho giao diện (chỉ đọc, đối chiếu tài liệu chuẩn), sửa các lỗi PM đã xác minh.
3. Sửa các mô tả hợp đồng API chưa chính xác do worker viết:
   - `WAVE2_pos_gui.md`: mục API ghi `canViewGmv`, `/api/v2/...`. Code thật dùng `flags.gmvRead` và `Admin/V2/Dashboard/Access`.
   - `WAVE2B_report_api.md`, `WAVE3B_report_api.md`: một số đường dẫn sai. Route thật nằm trong `report.api/Src/WebApi/Controllers/Admins/V2/*.cs`.
4. Tổng kết, rồi anh/chị quyết định push và tạo PR (chưa push gì).

## 4. Điều kiện trước khi triển khai (nhắc lại)
- Merge nhánh pos.api `1001-phan-quyen-cum-chi-so-dashboard` (hoặc `qc/dashboard-v2-permissions`), và cấp quyền `manager.dashboard-v2.gmv.read` cho BOD **trước**, nếu không mọi người sẽ bị ẩn GMV.
- Giữ `DashboardV2:LegacyScopeMapping=true` tới khi Identity cấp các mã quyền mới.
- Áp dụng các migration trong `report.api/Src/Infrastructure/Migrations/Pending/`, chạy backfill sự kiện doanh thu và snapshot công nợ, seed khu vực từ `data-store-kpi.md`, rồi chuyển dữ liệu SaleTarget sang KPI V2. Checklist chi tiết ở `QC_FINAL_backend.md` mục 6.
- Kiểm tra mỗi MANAGER/STAFF có bản ghi `Staff` và `SiteStaff` trên POS.

## 5. Câu hỏi vẫn chờ anh/chị
- Các quyết định tạm áp QĐ-16 … QĐ-25 (tài liệu chuẩn mục 10; câu hỏi gốc ở `QC_TONG_HOP.md` mục 3).
- A10: danh sách mã loại thanh toán thật. Hiện dùng ánh xạ mặc định trong `DashboardV2:PaymentTypeMapping`.
- Nhóm D: dữ liệu công đoạn mài lắp và Lab hiện **chưa có trên POS**, nên Order Aging và bảng Lab đang ở trạng thái "chưa có dữ liệu".

## 6. Cách làm tiếp
- Nhắn "tiếp tục". PM sẽ khởi chạy lại worker `agy` (model `gemini-3.8-flash-high`) cho `pos.gui`, với đề bài bổ sung "hạng mục 0–2 đã xong; sửa 3 test responsive trước, rồi làm tiếp từ hạng mục 3", rồi bật bộ theo dõi.
- Xem tiến độ: `cd /Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk && ./agy_progress.sh --watch 20`.
- Đề bài, script và log của các worker được lưu ở `dashboard_hmk/_agy/` (ngoài các repo, không mất khi khởi động lại máy).
