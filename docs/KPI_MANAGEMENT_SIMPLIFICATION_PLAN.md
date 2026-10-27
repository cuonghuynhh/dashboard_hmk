# KPI Management — Simplification Plan

**Ngày tạo:** 26/10/2026
**Nguồn chuẩn:** Import mục tiêu (W9 FE-E) — `docs/qc/W9_FE_E.md`
**Trang:** `pos.gui/src/pages/dashboard-v2/views/KpiManagementView.vue`

---

## 1. Chuẩn Import (nguồn đầu vào duy nhất)

| Thuộc tính | Chuẩn Import |
|---|---|
| **Scope** | Chỉ Chi nhánh (branch) |
| **Metrics** | Chỉ GMV (bắt buộc >0) + Traffic (tùy chọn, ≥0) |
| **Day Type** | Trong tuần (T2-T6) / Cuối tuần (T7-CN) — **không có ngày lễ** |
| **Period** | Tháng (fromMonth → toMonth, max 3 tháng) |
| **Format** | Branch × Day (mỗi dòng = 1 chi nhánh × 1 ngày) |
| **Import mode** | Partial (dòng hợp lệ ghi, dòng lỗi bỏ qua) |

---

## 2. Feature BỊ DƯ (redundant) dựa trên chuẩn Import

| # | Thành phần | Lý do dư | Đề xuất |
|---|---|---|---|
| 1 | Scope selector: Công ty, Khu vực, Nhân viên | Import chỉ Chi nhánh | Xóa khỏi filter + wizard. Chỉ giữ Chi nhánh. |
| 2 | Metrics: DTT, Conversion rate, AOV, CSAT | Import chỉ GMV + Traffic | Xóa hoàn toàn khỏi table, version history, types. |
| 3 | Period: Năm, Quý, Chiến dịch | Import chỉ Tháng | Xóa period types khác Tháng. |
| 4 | 3 Summary Cards (Tổng số KPI đang áp dụng / KPI đã hoàn thành / Cấp độ phân bổ sâu nhất) | Không actionable, không drive chart | Xóa hoặc gộp thành 1 badge đơn giản. |
| 5 | Version History Modal | Import overwrite/update. Version tracking không cần. | Xóa. |
| 6 | Bulk Update Modal | Import đã xử lý bulk. | Xóa. |
| 7 | Day Type: ngày lễ | Import chỉ Sat/Sun. | Giữ current logic. Không thêm holiday. |
| 8 | Scope filter entity input (text search) | Nếu chỉ Chi nhánh, filter đơn giản hơn. | Đơn giản hóa: dropdown chi nhánh thay text search. |

---

## 3. Feature NÊN GIỮ + BỔ SUNG

| # | Thành phần | Lý do | Bổ sung |
|---|---|---|---|
| 1 | **Import mục tiêu** (DashboardImportModal, kind KPI) | Đầu vào chuẩn | Giữ nguyên |
| 2 | **Daily Targets Table** (branch × day GMV/Traffic) | Hiển thị kết quả import. Cần cho Heatmap + ResponsePostProcessor. | Giữ nguyên |
| 3 | **KPI List Table (read-only + manual edit)** | Cần xem danh sách KPI đã import | **Bổ sung: cho phép sửa KPI thủ công trên table** — người có quyền import kpi coi như có quyền sửa trên table |
| 4 | **Thêm KPI mới** (button) | Cần thêm KPI theo chi nhánh | **Giữ** — chỉnh lại luồng UI/UX |
| 5 | **Activate/Archive KPI** | Chuyển trạng thái Draft → Applying | Giữ |
| 6 | **Month picker** (Daily Targets) | Xem mục tiêu theo tháng | Giữ |

---

## 4. Luồng UI/UX đề xuất (Option C v2 — Excel-like Grid Edit)

### 4.0 Tổng quan luồng

Trang KPI Management sau tinh gọn chỉ có **1 màn hình duy nhất** (không wizard, không modal). User thao tác trực tiếp trên grid giống Excel.

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Header: Tiêu đề + (Import mục tiêu)                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ Panel điều khiển ─────────────────────────────────────────────────────┐  │
│  │  Chi nhánh: [dropdown ▾]    Tháng: [month picker]                     │  │
│  │                                                                        │  │
│  │  ┌─ Nhập hàng loạt theo loại ngày ──────────────────────────────────┐ │  │
│  │  │  Trong tuần:  GMV [____] ₫   Traffic [____] lượt                 │ │  │
│  │  │               [Áp dụng cho ngày trong tuần]                       │ │  │
│  │  │  Cuối tuần:   GMV [____] ₫   Traffic [____] lượt                 │ │  │
│  │  │               [Áp dụng cho ngày cuối tuần]                       │ │  │
│  │  │  ☑ Chỉ áp dụng cho ngày chưa có giá trị (không ghi đè)           │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  │  Lọc loại ngày: [Tất cả ▾]  │  Lọc trạng thái: [Tất cả ▾]            │  │
│  │  (Tất cả / Trong tuần / Cuối tuần)  (Tất cả / Đã nhập / Chưa nhập)   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ Grid (Excel-like) ────────────────────────────────────────────────────┐  │
│  │  Ngày │ Loại ngày │ Mục tiêu GMV (₫) │ Mục tiêu Traffic │ Trạng thái │  │
│  │───────┼───────────┼──────────────────┼──────────────────┼────────────│  │
│  │ 01/10 │ Trong tuần│ [  50.000.000  ] │ [    100       ] │ ✓ Đã nhập  │  │
│  │ 02/10 │ Trong tuần│ [  50.000.000  ] │ [    100       ] │ ✓ Đã nhập  │  │
│  │ 06/10 │ Trong tuần│ [______________]  │ [______________]  │ — Chưa nhập│  │
│  │ ...   │ ...       │ ...              │ ...              │ ...        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Đã thay đổi: N ngày (N × GMV, N × Traffic)                               │
│  [Hủy]                                    [Xác nhận lưu mục tiêu]          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tương tác chi tiết

| Thao tác | Hành vi |
|---|---|
| **Chọn Chi nhánh + Tháng** | Load grid. Ngày đã có data → hiển thị giá trị (đậm). Ngày chưa có → `—` (mờ). |
| **Filter Loại ngày** | `Tất cả` / `Trong tuần` / `Cuối tuần` → chỉ hiển thị rows khớp. Không xóa data. |
| **Filter Trạng thái** | `Tất cả` / `Đã nhập` / `Chưa nhập` → chỉ hiển thị rows khớp. |
| **Nhập hàng loạt** | User nhập GMV/Traffic cho Trong tuần → nhấn "Áp dụng cho ngày trong tuần" → fill tất cả ngày Trong tuần chưa có data. Tương tự Cuối tuần. |
| **Checkbox "Chỉ áp dụng cho ngày chưa có giá trị"** | Nếu tick → không ghi đè data đã có. Nếu untick → ghi đè tất cả. |
| **Click vào cell** | Cell chuyển thành input. Nhập → Enter/Tab chuyển cell tiếp. |
| **Cell chưa edit (mờ)** | Hiển thị `—` (slate-400). Không tính là "đã thay đổi". |
| **Cell đã edit (đậm)** | Hiển thị giá trị (slate-700). Đánh dấu "đã thay đổi". |
| **Validation per-cell** | GMV: > 0 (bắt buộc). Traffic: ≥ 0 (tùy chọn). Invalid → cell viền đỏ + tooltip. |
| **Nút "Xác nhận lưu"** | Disable nếu không có thay đổi hoặc có cell invalid. Lưu tất cả cells đã thay đổi (partial save). |
| **Audit log** | Mỗi cell thay đổi ghi: ai, khi nào, chi nhánh, ngày, metric, giá trị cũ → mới. |
| **Nút "Hủy"** | Discard tất cả thay đổi, reset grid về trạng thái ban đầu. |

### 4.3 Ưu điểm Option C v2

- **Không có "Tải default" bí ẩn** — user tự nhập giá trị hàng loạt
- **Linh hoạt** — áp dụng chỉ Trong tuần, chỉ Cuối tuần, hoặc cả hai
- **An toàn** — checkbox tránh ghi đè
- **Excel-like** — quen thuộc, thao tác nhanh
- **Audit log per-cell** — truy vết chi tiết

---

## 5. Components cần xóa / đơn giản hóa

### Xóa (4 components)
- `KpiConfigurationModal.vue` → thay bằng inline form đơn giản hoặc modal nhẹ
- `KpiVersionHistoryModal.vue`
- `KpiBulkActionBar.vue`
- `KpiBulkUpdateModal.vue`

### Đơn giản hóa (2 components)
- `KpiTable.vue`: bỏ cột legacy metrics, scope filter → chỉ Chi nhánh dropdown + Status. Thêm inline edit cells.
- `KpiManagementView.vue`: bỏ 3 summary cards, đơn giản hóa filter, giữ Daily Targets Table.

### Giữ nguyên (2 components)
- `DashboardImportModal.vue` (kind KPI) — đầu vào chuẩn
- `KpiTable.vue` (read-only + inline edit) — xem + sửa

---

## 6. Impact & Priority

| Priority | Task | Effort |
|---|---|---|
| P0 | Xóa scope Công ty/Khu vực/Nhân viên khỏi filter + wizard | S |
| P0 | Xóa metrics legacy (DTT, Conversion, AOV, CSAT) khỏi table + types | S |
| P0 | Xóa period types khác Tháng | S |
| P1 | Xóa 3 Summary Cards hoặc gộp thành badge | S |
| P1 | Xóa Version History Modal + Bulk Update Modal + Bulk Action Bar | S |
| P1 | Thêm inline edit trên table (GMV/Traffic cells) | M |
| P1 | Đơn giản hóa "Thêm KPI mới" flow (Chi nhánh + Tháng + GMV/Traffic) | M |
| P2 | Đơn giản hóa filter (dropdown Chi nhánh thay text search) | S |

---

## 7. Quyết định BOD (đã chốt — vòng 2)

### 7.0 Ambiguity đã chốt (26/10/2026)

| # | Ambiguity | Quyết định | Ảnh hưởng |
|---|---|---|---|
| 1 | Partial save semantics | **All-or-nothing** — nếu 1 cell invalid, không lưu bất kỳ cell nào. Toàn bộ batch fail, user sửa rồi retry. | Backend: transaction rollback. FE: disable "Xác nhận lưu" nếu có cell invalid. |
| 2 | Bulk fill scope | **Apply ALL days** — bulk fill áp dụng cho tất cả ngày trong tháng (không chỉ row đang hiển thị). Filter chỉ ảnh hưởng view, không ảnh hưởng bulk fill scope. | FE: bulk fill iterate over ALL days (không filter), không mutate chỉ visible rows. UX khuyến nghị: thêm filter chip + banner "Áp dụng cho tất cả X ngày trong tháng" + đếm số dòng bị ảnh hưởng. |
| 3 | Checkbox granularity | **Per-metric** — GMV và Traffic độc lập. User có thể tick "chỉ GMV" hoặc "chỉ Traffic" hoặc cả hai. | FE: 2 checkbox riêng: ☑ GMV (chỉ điền ô GMV trống) + ☑ Traffic (chỉ điền ô Traffic trống). |
| 4 | Audit log | **Bỏ hoàn toàn** — không implement audit log trong phase này. Sẽ discuss sau. | Không cần bảng `KpiDailyTargetAudit`, không cần endpoint `GET .../Audit`. Giảm scope đáng kể. |
| 5 | Scope grid | **Single branch** — dropdown chi nhánh. Grid chỉ hiển thị 1 chi nhánh tại 1 thời điểm. | FE: dropdown Chi nhánh (required). Không cần multi-branch view. |
| 6 | "Thêm KPI mới" flow | **Excel-like grid (Option C)** — 1 màn hình, grid editable, nhập hàng loạt theo loại ngày. | Không wizard, không modal. Form đơn giản + grid inline. |

### 7.1 Luồng UI/UX (Option C v2 — đã chốt)

(Xem section 4 để biết layout chi tiết)

### 7.2 Impact của quyết định "Bỏ audit log"

- **Backend:** Không cần bảng `KpiDailyTargetAudit`, không cần endpoint `GET .../Audit`. Giảm effort backend từ L xuống M.
- **Frontend:** Không cần màn hình xem audit log. Giảm effort FE.
- **QA:** Không cần test audit log. Giảm test scenarios.
- **Tech Lead:** Giảm complexity đáng kể. Migration đơn giản hơn.

### 7.3 Quyết định đã chốt trước đó (vòng 1)

1. **Tinh gọn** (không xóa toàn bộ) — giữ Import + Daily Targets + inline edit + simplified Add KPI.
2. ~~Cần audit log~~ → **Bỏ** (chốt vòng 2, mục 4).

## 8. Tham khảo

- Chuẩn Import: `docs/qc/W9_FE_E.md` (section 1-3)
- Product Spec: `docs/PRODUCT_SPEC_DASHBOARD.md` (section KPI)
- QC Report: `docs/qc/QC_FINAL_frontend.md` (FR-IMP-02)
- Business Rules: `/Users/gryffindor/Desktop/DASHBOARD_V2_SOLUTIONS_BUSINESS_RULES.md` (BR-1..BR-12)
