# TRACK 1 — Phân tích Nghiệp vụ từ Mã nguồn & Tài liệu (BA)
**Dự án:** Dashboard quản trị HMK/Rocky (chuỗi bán lẻ kính mắt) — repo `dashboard_hmk`
**Người thực hiện:** Business Analyst (Track 1 — chỉ đọc code + tài liệu, KHÔNG dùng trình duyệt)
**Commit tham chiếu:** `c3d3cb9` (HEAD `main`, 25/09/2026)
**Phạm vi đọc:** toàn bộ `src/` (~10.4k dòng), `docs/FRS.md`, `docs/VISUALIZATION_IDEAS.md`, `docs/BRAINSTORM_RETAIL_DEBT_SOLUTION.md`, `chart_basket*.txt`, các script `*.cjs` gốc (chỉ để đọc ý đồ), `git log --stat -15`.

### Quy ước
- `file:dòng` = đường dẫn tương đối từ gốc repo, số dòng ở commit `c3d3cb9`.
- **[HT]** = Hiện trạng (code đang làm vậy). **[FRS]** = Mục tiêu theo FRS/tài liệu (code CHƯA làm vậy).
- Mức độ: **High** (sai số liệu / sai nghiệp vụ / chức năng chính không hoạt động), **Medium** (sai lệch dễ gây hiểu nhầm, thiếu tính năng phụ), **Low** (thẩm mỹ, định dạng, code chết).
- Đơn vị gốc của chart engine: **Triệu VNĐ (Tr)**. "Tỷ" = Tr / 1000.
- Mọi số liệu trong app là **mock**. Không có API/backend dữ liệu (`server.ts` chỉ phục vụ file tĩnh + `/api/health`).

---

## 0. TÓM TẮT ĐIỀU HÀNH (Executive Summary)

1. **Ứng dụng là prototype front-end thuần mock.** Có 2 "thế giới dữ liệu" tách biệt: (a) **chart engine có seed** (`src/utils/chartEngine.ts`) — chỉ 7 widget của trang Tổng quan + 1 chart Sản phẩm dùng, có phản ứng với bộ lọc ngày/chu kỳ/khu vực; (b) **mảng tĩnh / `Math.random()`** (`src/data.ts` và mock nội bộ component) — toàn bộ trang Vận hành, Sản phẩm (trừ 1 chart), Nhân sự, KPI và 1 widget Tổng quan (Bản đồ hiệu suất chi nhánh). Nhóm (b) **không phản ứng với bất kỳ bộ lọc toàn cục nào**.
2. **Cùng một chỉ số được tính ≥ 3 cách khác nhau** (High): "Doanh thu thuần/Thực thu" = `netRev` (85–90% GMV, ngẫu nhiên) ở thẻ tài chính & biểu đồ xu hướng; = `GMV − Hoàn/Hủy` (95% GMV) ở Waterfall; = `GMV × (1 − dropRate băm theo tên chi nhánh)` ở Bảng xếp hạng. AOV = `netRev/orders` (thẻ) nhưng = `GMV/orders` (biểu đồ Hiệu quả đơn hàng & Tăng trưởng).
3. **Thẻ tài chính (Financial Overview Cards) bỏ qua bộ lọc Khu vực/Chi nhánh toàn cục** dù có đọc biến (`FinancialOverviewCards.tsx:139,144,204`) — High.
4. **Nhiều công thức là placeholder**: "DOANH THU" = GMV × 1.05 (lớn hơn GMV — phi lý); "GIÁ TRỊ ĐIỀU CHỈNH" chỉ = −Hoàn/Hủy (bỏ qua upsale dù tooltip nói có) và % xu hướng **hard-code "15,4"**; "KHÁCH HÀNG MỚI" = 30% số đơn; footer ngày trên thẻ **hard-code "01/09 — 30/09/2026"**.
5. **Nhiều tính năng FRS chưa có hoặc khác hẳn**: Growth Analysis (FRS: scatter góc phần tư Tăng trưởng × Biên LN) → code: line+bar theo thời gian với "kỳ trước" là số giả lập; Top Performance (FRS: Top 5 CN + Top 5 SP + % đạt chỉ tiêu) → code: toàn bộ CN/khu vực, không có SP, không có chỉ tiêu; Branch Performance Map (FRS: thanh ngang) → code: heatmap 80 chi nhánh; Product Growth (FRS: WoW/MoM/YoY) → code: không có bộ chọn, số liệu ngẫu nhiên; Conversion & Refund (FRS: phễu + nguyên nhân) → code: 2 biểu đồ cột tĩnh.
6. **Bộ lọc đa chiều (Ngành hàng, Thương hiệu, Giới tính, Phân khúc HĐ, PIC, Trạng thái) chỉ là giao diện**, không gắn state, nút "Áp dụng bộ lọc" không có handler (`FilterBar.tsx:103-177`).
7. **Trang Quản lý KPI là mock tĩnh**: tìm kiếm không lọc, Sửa/Xóa/Lọc/Phân trang không hoạt động, "Lưu" của bulk edit và modal cấu hình không ghi dữ liệu; phát hiện xung đột là giả lập (mọi đối tượng ≠ "Tất cả" đều "trùng"). Mục tiêu (target) dùng ở biểu đồ Xu hướng được hard-code (42 Tr/ngày…) và **không liên kết** với module KPI.
8. **Phân quyền chỉ là dropdown phía client** (ai cũng đổi được sang BOD). MANAGER/STAFF không bị giới hạn dữ liệu theo cửa hàng/cá nhân — chỉ ẩn tab.
9. **Bug chức năng đáng chú ý**: Product Growth chiều "Nhà CC" vẽ 0 đường, chiều "Thương hiệu" chỉ 2/5 đường có dữ liệu (High); Treemap drill-down có khả năng không click được trên Recharts 3.9.2 (cần DA xác minh); Combo "Cả 2 (AOV & UPT)" vẽ UPT trên trục AOV; modal Thương hiệu hiển thị cột "undefined"; mũi tên xu hướng thẻ NỢ TREO bị đảo chiều; InfoTooltip của 3 chart truyền sai prop nên tooltip trống.
10. **Dữ liệu danh mục không nhất quán giữa các widget**: 5 chi nhánh "HMK HN Chi nhánh 1…5" (engine) vs 10 chi nhánh thật "HMK BÌNH DƯƠNG, Shopee…" (data.ts, chết) vs 80 chi nhánh sinh tự động (heatmap) vs 9 tên khác (dead code Executive); khu vực "Miền Bắc/Trung/Nam" (bộ lọc) vs "Hồ Chí Minh/Miền Bắc/Miền Trung/Đông Nam Bộ" (Benchmark, Anomaly, Heatmap, KPI).

---

## 1. KHUNG ỨNG DỤNG, PHÂN QUYỀN & BỘ LỌC

### 1.1. Cấu trúc khung (App shell)
| Thành phần | Mô tả [HT] | Nguồn |
|---|---|---|
| Header | Logo + tiêu đề "EBID Workspace / Eyewear Business Intelligence Dashboard"; "Đồng bộ: HH:MM:SS" (giờ vi-VN); dropdown "Quyền truy cập" (BOD/MANAGER/STAFF); nút "Cấu hình KPI" (chỉ BOD); chuông thông báo badge cố định "3" (không click được); avatar "Admin / admin@hmkeyewear.com" (cố định) | `src/components/Header.tsx:16-80` |
| FilterBar (thanh lọc toàn cục) | Chu kỳ (Ngày/Tuần/Tháng/Quý/Năm), Từ ngày – Đến ngày (input date), Khu vực + Chi nhánh (chỉ BOD), chip cửa hàng (MANAGER) / chip PIC (STAFF), nút "Bộ lọc đa chiều" (mở panel), nút đồng bộ (refresh) | `src/components/FilterBar.tsx:16-181` |
| Thanh tab | Tổng quan / Vận hành & Khách hàng / Sản phẩm & Tồn kho / Hiệu suất Nhân sự / Quản lý KPI | `src/App.tsx:64-133` |
| Tiêu đề trang (HTML) | "Dashboard Kinh Doanh" (khác "EBID Workspace" trên header) | `index.html:6`, `metadata.json` |

- Header và FilterBar đều `sticky top-0 z-50` (`Header.tsx:14`, `FilterBar.tsx:21`) → khi cuộn có thể chồng lên nhau (cần DA xác minh).
- `refreshData()` chỉ bật spinner 800ms và cập nhật giờ "Đồng bộ"; **không tái sinh dữ liệu** (`AppContext.tsx:41-53`).

### 1.2. Trạng thái toàn cục & giá trị mặc định (`src/AppContext.tsx`)
| State | Mặc định | Dòng |
|---|---|---|
| `role` | `"BOD"` | 27 |
| `dateRange` | `{start: "2026-06-01", end: "2026-09-30"}` (122 ngày) | 36 |
| `period` | `"week"` | 37 |
| `globalRegion` | `"Tất cả Khu vực"` | 38 |
| `globalBranch` | `"Tất cả Chi nhánh"` | 39 |
| `lastUpdated` | giờ hiện tại `vi-VN` HH:MM:SS | 28-34 |
| Tab mặc định | `"executive"` | `App.tsx:22` |

Không có persist (URL/localStorage) — F5 là về mặc định.

### 1.3. Ma trận phân quyền (verify trong `App.tsx` + `Header.tsx` + `FilterBar.tsx` + `PersonnelView.tsx`)
| Hạng mục | BOD | MANAGER | STAFF | Nguồn |
|---|---|---|---|---|
| Tab "Tổng quan" | ✔ | ✘ (nếu đang ở tab này → tự chuyển sang "Vận hành") | ✘ | `App.tsx:28-30,36,65-78` |
| Tab "Vận hành & Khách hàng" | ✔ | ✔ | ✘ | `App.tsx:37-42,79-105` |
| Tab "Sản phẩm & Tồn kho" | ✔ | ✔ | ✘ | `App.tsx:43-48,79-105` |
| Tab "Hiệu suất Nhân sự" | ✔ (Leaderboard) | ✔ (Leaderboard) | ✔ (Góc nhìn cá nhân) | `App.tsx:49-50,107-118`; `PersonnelView.tsx:29,178` |
| Tab "Quản lý KPI" | ✔ | ✔ | ✘ | `App.tsx:51-52,119-132` |
| Nút "Cấu hình KPI" trên Header | ✔ | ✘ | ✘ | `Header.tsx:55-63` |
| Nút "Thêm KPI mới" (trong tab KPI) → cùng modal | ✔ | ✔ | — | `KPIManagementView.tsx:48-54,218` |
| Bộ lọc Khu vực/Chi nhánh toàn cục | ✔ | ✘ (chip tĩnh "HMK ĐN LÊ DUẨN 2") | ✘ (chip tĩnh "PIC: Nguyễn Văn A") | `FilterBar.tsx:53-74` |
| STAFF bị ép về tab Nhân sự | — | — | ✔ (useEffect) | `App.tsx:25-27` |

**Ghi chú phân quyền:**
- Vai trò chọn bằng dropdown client-side, không xác thực (`Header.tsx:43-51`). → **Gap-SEC-01 (High cho production)**.
- MANAGER: chip "HMK ĐN LÊ DUẨN 2" là `<button>` không có `onClick`, dữ liệu các tab **không** bị giới hạn theo cửa hàng (cùng số liệu với BOD). STAFF: chip "PIC: Nguyễn Văn A" tương tự; dữ liệu cá nhân là hard-code. → **Gap-ROLE-01 (High)**.
- Nhánh dự phòng trong `renderView` (`App.tsx:33-56`) đảm bảo vai trò không đủ quyền luôn rơi về `PersonnelView`/`OperationalView`.

### 1.4. Bộ lọc toàn cục vs bộ lọc cục bộ (Local Filter)
**Cơ chế** (`src/hooks/useLocalFilter.ts:4-15`):
- Mỗi widget có Local Filter khởi tạo `localRegion/localBranch` = giá trị toàn cục.
- `useEffect([globalRegion, globalBranch])` **ghi đè** giá trị cục bộ mỗi khi bộ lọc toàn cục đổi (dòng 9-12) → thay đổi toàn cục reset mọi local filter; thay đổi local KHÔNG lan ngược lên toàn cục.
- FRS nói Local Filter "không ảnh hưởng đến Filter chung" (`docs/FRS.md:48`) — đúng một chiều; chiều ngược lại (toàn cục reset cục bộ) không được FRS mô tả.

**UI chọn Khu vực/Chi nhánh** (`src/components/LocalFilterUI.tsx` — dùng chung cho toàn cục và cục bộ):
- Đổi Khu vực → Chi nhánh reset về "Tất cả Chi nhánh" (dòng 16-19).
- Danh sách chi nhánh lọc theo khu vực bằng `getBranchesByRegion` (`src/utils/constants.ts:12-15`).
- Danh mục: `REGIONS = ['Tất cả Khu vực','Miền Bắc','Miền Trung','Miền Nam']` (`constants.ts:9`); 5 chi nhánh: HMK HN Chi nhánh 1 & 5 → Miền Bắc; HMK ĐN Chi nhánh 2 → Miền Trung; HMK BD Chi nhánh 3, HMK Chi nhánh 4 → Miền Nam (`constants.ts:1-7`).

**Ma trận tác động bộ lọc → widget** (✔ = có tác động; ✘ = không):
| Widget | Ngày (dateRange) | Chu kỳ (period) | KV/CN toàn cục | Local filter KV/CN | Bộ lọc đa chiều |
|---|---|---|---|---|---|
| Financial Overview Cards | ✔ | ✘ | **✘ (bug)** | — | ✘ |
| GMV vs Doanh thu thuần | ✔ | ✔ | ✔ (qua reset local) | ✔ | ✘ |
| Waterfall | ✔ | ✘ (tổng kỳ) | ✔ | ✔ | ✘ |
| Hiệu quả đơn hàng (AOV-Volume-UPT) | ✔ | ✔ | ✔ | ✔ | ✘ |
| Phân rã nguồn GMV | ✔ | ✔ | ✔ | ✔ | ✘ |
| Xu hướng Lũy kế & Tiến độ KH | ✔ | ✔ | ✔ | ✔ | ✘ |
| Bảng xếp hạng Hiệu suất | ✔ | ✘ | ✔ | ✔ | ✘ |
| Bản đồ hiệu suất chi nhánh (heatmap) | ✘ | ✘ (tab riêng Ngày/Tuần/Tháng) | ✘ | ✘ (dropdown riêng) | ✘ |
| Phân tích Tăng trưởng | ✔ | ✔ | ✔ | ✔ | ✘ |
| Toàn bộ trang Vận hành | ✘ | ✘ | ✘ | ✘ | ✘ |
| Product Growth Analysis | ✔ | ✔ | ✘ (gọi engine không truyền KV) | ✘ | ✘ |
| Các widget còn lại trang Sản phẩm | ✘ | ✘ | ✘ | ✘ | ✘ |
| Trang Nhân sự, Trang KPI | ✘ | ✘ | ✘ | ✘ | ✘ |

### 1.5. Thanh lọc toàn cục — chi tiết
| Điều khiển | Giá trị | Hành vi [HT] | Nguồn |
|---|---|---|---|
| Chu kỳ | day/week/month/quarter/year ("Theo Ngày"…"Theo Năm") | ghi `period` vào context | `FilterBar.tsx:27-37` |
| Từ ngày / Đến ngày | `<input type=date>` | ghi `dateRange`; **không validate** start ≤ end, không chặn rỗng | `FilterBar.tsx:42,46` |
| Khu vực / Chi nhánh | xem 1.4 | chỉ render khi `role==='BOD'` | `FilterBar.tsx:53-62` |
| Bộ lọc đa chiều | toggle panel 4 cột | panel gồm: Ngành hàng (Tất cả/Tròng/Gọng/Kính mát), Thương hiệu (Tất cả/HMK/Essilor/Chemi), Giới tính, Phân khúc HĐ (<5Tr, 5-10Tr, >10Tr), PIC Sales (chỉ "Tất cả"), KTV (chỉ "Tất cả"), Trạng thái đơn (Tất cả/Đã hoàn thành/Đang đo mắt/Đang mài lắp/Đang vận chuyển) — **tất cả `<select>` uncontrolled, không state, không handler**; nút "Áp dụng bộ lọc" không có `onClick` | `FilterBar.tsx:78-91,103-177` |
| Đồng bộ | icon refresh | gọi `refreshData` (xem 1.1) | `FilterBar.tsx:92-98` |

### 1.6. Acceptance Criteria — Khung & phân quyền
- **AC-SHELL-01 [HT]** Given người dùng mở app lần đầu, When trang tải xong, Then vai trò = BOD, tab "Tổng quan" được chọn, Chu kỳ = "Theo Tuần", Từ ngày = 01/06/2026, Đến ngày = 30/09/2026, Khu vực = "Tất cả Khu vực", Chi nhánh = "Tất cả Chi nhánh".
- **AC-ROLE-01 [HT]** Given vai trò BOD, When đổi sang "Quản lý (Cửa hàng)" khi đang ở tab Tổng quan, Then tab Tổng quan biến mất và trang tự chuyển sang "Vận hành & Khách hàng"; tab hiển thị: Vận hành, Sản phẩm, Nhân sự, Quản lý KPI.
- **AC-ROLE-02 [HT]** Given bất kỳ tab nào, When đổi sang "Nhân viên (Cá nhân)", Then chỉ còn tab "Hiệu suất Nhân sự" và nội dung là góc nhìn cá nhân (4 thẻ điểm, Tiến độ KPI tuần, Vinh danh).
- **AC-ROLE-03 [HT]** Given vai trò MANAGER hoặc STAFF, Then nút "Cấu hình KPI" trên Header và bộ chọn Khu vực/Chi nhánh toàn cục không hiển thị; thay bằng chip "HMK ĐN LÊ DUẨN 2" (MANAGER) / "PIC: Nguyễn Văn A" (STAFF).
- **AC-ROLE-04 [FRS/đề xuất]** Given vai trò MANAGER của cửa hàng X, When xem bất kỳ biểu đồ nào, Then dữ liệu chỉ thuộc cửa hàng X. *(Chưa đáp ứng.)*
- **AC-FILTER-01 [HT]** Given vai trò BOD, When chọn Khu vực "Miền Bắc", Then dropdown Chi nhánh chỉ còn "Tất cả Chi nhánh", "HMK HN Chi nhánh 1", "HMK HN Chi nhánh 5" và mọi Local Filter trên trang Tổng quan được đặt lại = Miền Bắc / Tất cả Chi nhánh.
- **AC-FILTER-02 [HT]** Given đã đổi Local Filter của một biểu đồ, When đổi bộ lọc toàn cục, Then Local Filter đó bị ghi đè bằng giá trị toàn cục.
- **AC-FILTER-03 [HT]** Given panel "Bộ lọc đa chiều" mở, When chọn bất kỳ giá trị nào và bấm "Áp dụng bộ lọc", Then không có số liệu nào thay đổi. **[FRS]** Then toàn trang phải lọc theo Ngành hàng/Khách hàng/Nhân sự/Trạng thái.
- **AC-FILTER-04 [FRS/đề xuất]** Given Từ ngày > Đến ngày hoặc ô ngày rỗng, When áp dụng, Then hệ thống chặn và báo lỗi. *(HT: không chặn; xem câu hỏi DA-Q12.)*
- **AC-SYNC-01 [HT]** When bấm icon đồng bộ, Then icon quay ~0.8s và giá trị "Đồng bộ: HH:MM:SS" cập nhật; số liệu không đổi.

---

## 2. MÔ HÌNH DỮ LIỆU & CHART ENGINE

### 2.1. Chart engine có seed (`src/utils/chartEngine.ts`)
Sinh số liệu **theo từng ngày**, xác định (deterministic) theo chuỗi ngày `YYYY-MM-DD`.

| Bước | Công thức trong code | Dòng |
|---|---|---|
| Seed | `seed = |hash(dateStr)|`, `dateStr = date.toISOString().split('T')[0]` (UTC) | 26-27, 11-18 |
| Random | `seededRandom(s) = frac(sin(s)·10000)` | 20-23 |
| GMV cơ sở/ngày | `baseGmv = 20 + rand·10` (Tr) | 34 |
| Mùa vụ | ×1.5 tháng 8; ×1.3 tháng 9; ×1.1 tháng 7 (Back-to-school) | 37-39 |
| Cuối tuần | ×1.4 nếu Thứ 7/CN | 42 |
| Net Revenue/ngày | `netRev = gmv × (0.85 + r1·0.05)` → 85–90% GMV | 45 |
| Số đơn/ngày | `orders = floor(gmv / (0.7 + r2·0.2))` (AOV ngầm 0.7–0.9 Tr) | 46 |
| Phân bổ chi nhánh | ĐN CN2 30%, HN CN1 25%, BD CN3 20%, CN4 15%, HN CN5 10% | 48-54 |
| Lọc KV/CN | giữ chi nhánh khớp; `ratio = GMV lọc / GMV tổng` | 56-71 |
| Các trường trả về (đã nhân `ratio`) | `gmv`(lọc), `netRev·ratio`, `orders = round(orders·ratio)`, `units = round(orders·(2.15+r6·0.4))`, `frames=0.4·gmv`, `lenses=0.45·gmv`, `contactLenses=0.1·gmv`, `accessories=0.05·gmv`, `refunds=0.05·gmv`, `upsale=0.1·gmv`, `directOrder=gmv·(0.35+r4·0.05)`, `preOrder=gmv·(0.65−r4·0.05)`, `debt=gmv·(0.012+r5·0.006)`; `grossMargin = 0.70+r3·0.05` (**không** nhân ratio) | 73-89 |
| Tổng hợp khoảng | `aggregateMetrics(start,end,region,branch)`: cộng dồn từng ngày (bao gồm cả 2 đầu), `avgGrossMargin = trung bình đơn giản theo ngày` | 92-138 |

Hệ quả nghiệp vụ của engine:
- `directOrder + preOrder = gmv` chính xác (r4 triệt tiêu) → Phân rã nguồn GMV cộng đúng bằng GMV.
- Hoàn/Hủy luôn = **đúng 5% GMV**; Upsale luôn = 10% GMV; Nợ = 1.2–1.8% GMV.
- Biên LN gộp không phụ thuộc khu vực/chi nhánh, không dùng giá vốn.
- `debt` là **luồng phát sinh theo ngày** được cộng dồn (không phải số dư) — mâu thuẫn với định nghĩa "Tổng dư nợ dương trên sổ cái" (FRS 4.4.9).

### 2.2. Gom nhóm theo chu kỳ (`generateChartDataByPeriod`, `chartEngine.ts:140-208`)
| Chu kỳ | Quy tắc bucket | Nhãn trục X | Dòng |
|---|---|---|---|
| Ngày | mỗi ngày 1 điểm | `DD/MM` (vi-VN) | 161-165 |
| Tuần | **cửa sổ trượt 7 ngày bắt đầu từ ngày "Từ ngày"** (không theo tuần ISO/lịch); tuần cuối cắt tại "Đến ngày" | `Tuần N (DD/MM)` (N đếm từ 1) | 166-171 |
| Tháng | từ ngày hiện tại đến cuối tháng lịch; tháng đầu/cuối có thể lẻ | `Tháng M` (không có năm) | 172-178 |
| Quý | đến cuối quý lịch; quý đầu/cuối có thể lẻ nhưng vẫn ghi "Quý N" | `Quý N` (không có năm) | 179-186 |
| Năm | đến 31/12; năm lẻ vẫn ghi đủ | `Năm YYYY` | 187-194 |

- Mặc định (01/06–30/09, Tuần): **18 điểm** "Tuần 1 (01/06)"…"Tuần 18 (28/09)"; tuần 18 chỉ 3 ngày.
- Tháng: 4 điểm (Tháng 6–9). Quý: 2 điểm ("Quý 2" = chỉ tháng 6; "Quý 3"). Năm: 1 điểm.
- Bug tiềm ẩn (Low): nhánh Tháng gọi `setMonth(+1)` trước `setDate(1)` (176-177) → nếu "Từ ngày" là 29–31 sẽ nhảy cóc tháng (vd 31/01 → 01/03, mất tháng 2). Nhãn Tháng/Quý không có năm → khoảng thời gian > 12 tháng sẽ trùng nhãn.
- Múi giờ (Low): `new Date("YYYY-MM-DD")` = 00:00 UTC; seed theo ngày UTC còn mùa vụ/cuối tuần theo giờ địa phương → số liệu chênh nhẹ theo múi giờ trình duyệt (GMV mặc định 4,22 Tỷ ở UTC+7 vs 4,21 Tỷ ở UTC).

### 2.3. Danh mục thực thể & chiều dữ liệu (mock)
| Thực thể / chiều | Giá trị | Nơi khai báo | Dùng ở đâu |
|---|---|---|---|
| Khu vực (bộ lọc) | Miền Bắc, Miền Trung, Miền Nam | `constants.ts:9` | FilterBar, Local Filter, engine |
| Khu vực (bộ khác) | Hồ Chí Minh, Miền Bắc, Miền Trung, Đông Nam Bộ | `RegionalComparison.tsx:14`, `AnomalyDetectionChart.tsx:16`, `BranchRevenueComparison.tsx:11`, `KPIConfigurationModal.tsx:58`, KPI list | Benchmark, Anomaly, Heatmap, KPI |
| Chi nhánh (engine) | HMK HN CN1, HMK ĐN CN2, HMK BD CN3, HMK CN4, HMK HN CN5 | `constants.ts:1-7` | các widget dùng engine |
| Chi nhánh (heatmap) | 80 CN sinh tự động "`{HMK/HMK HN/HMK ĐN/HMK BD} Chi nhánh {1..80}`" | `BranchRevenueComparison.tsx:10-18` | Bản đồ hiệu suất CN |
| Chi nhánh "thật" | HMK BÌNH DƯƠNG, Shopee - HMK Eyewear, HMK Q10 SVH, HMK ĐN LÊ DUẨN 2, TikTok - HMK Eyewear, HMK NGUYỄN TRÃI Q1.2, HMK BÌNH THẠNH, HMK TĐ VVN 1, HMK Q7.2, HMK CẦN THƠ 128 | `data.ts:403-524` (**không render**) ; 5 tên trong `conversionRateData.store` (`data.ts:588-594`) | Chỉ biểu đồ Tỷ lệ chuyển đổi |
| Kênh online | Shopee, TikTok (gpm 100%) | `data.ts:417-463` (chết) | — |
| Ngành hàng | Gọng kính, Tròng kính, Kính mát, Áp tròng, Phụ kiện | `data.ts:204-238,262-268` | Multi-dim, Treemap |
| Nhóm SP / thương hiệu / NCC / chiết suất / màu | xem `data.ts:269-311` | `multidimensionalAnalysisData` | Multi-dim, Treemap (chế độ chiều) |
| Thương hiệu | HMK Eyewear, Essilor, Chemi, Zeiss, Hoya (+ Ray-Ban, Gentle Monster, Bolon cho gọng) | `data.ts:253-259,280-291` | Brand Distribution, Multi-dim |
| Nhân sự | PIC Sales A–E; KTV đo: BS. Tuấn, KTV. Hoàng, KTV. Linh, BS. My; Lab: Hùng, Dũng, Tuấn | `data.ts:382-401` | Trang Nhân sự |
| Công đoạn đơn | Đo khám, Mài lắp, Vận chuyển | `data.ts:107-142` | Order Aging |
| Nhóm tuổi | HS-SV (<25), VP (25-35), Trung niên (35-50), Lớn tuổi (>50) — biên chồng lấn 25/35/50 | `data.ts:145-158` | Nhân khẩu học |
| Phân khúc HĐ | <5Tr, 5-10Tr, 10-20Tr, 20-30Tr, >30Tr | `data.ts:160-166` | Basket Size |
| Thanh toán | Chuyển khoản 65%, Tiền mặt 20%, Quẹt thẻ (POS) 10%, App/Trả góp 5% | `data.ts:189-194` | Payment |
| Chiến dịch | Back to School 2026, Khai trương CN mới, Summer Sale, Combo Đa tròng | `data.ts:196-201` | Marketing |

### 2.4. Kiểu dữ liệu (`src/types.ts`)
| Interface | Trường | Trạng thái sử dụng |
|---|---|---|
| `MetricData` (3-37) | title, description, value, unit, subValue, trend, trendValue, trendLabel, sparklineData, previousValue, currentValueNumber(+NoVat), previousValueNumber(+NoVat), isInverse, formatType, formatOptions, color, iconType | Chỉ dùng bởi `executiveMetrics` + `MetricCard` — **cả hai không được render** (code chết) |
| `BranchPerformance` (39-52) | id, name, revenue, target, targetPercent, previousRevenue, growth, gpm, upt, atv, remakeRate, returnRate | Chỉ `branchPerformanceData` — **không render** |
| `ProductData` (54-61) | id, name, quantity, supplier, power, color | `topProductsData` (bảng Top SP) |
| `TreemapNode` (`data.ts:608-613`) | name, size, fill, children | Treemap phân cấp |
| `ChartDataPoint` (`chartEngine.ts:4-9`) | label, startDate, endDate, ...metrics | Mọi chart dùng engine |

Dữ liệu `data.ts` **không được dùng ở bất kỳ đâu** (code chết): `growthTimeData`, `growthStoreData`, `growthCategoryData`, `growthCustomerTypeData`, `growthDimensionsData`, `categoryData`, `lensTypeData`, `frameTypeData`; chỉ được import trong code chết của ExecutiveView: `executiveMetrics`, `timeTrendData`, `branchPerformanceData`, `branchRevenueByPeriod`.

### 2.5. Thành phần dùng chung
| Thành phần | Hành vi [HT] | Nguồn |
|---|---|---|
| `DataDetailModal` ("Xem chi tiết dữ liệu", icon FileText) | Bảng trong modal; ô tìm kiếm lọc theo **giá trị thô** của mọi cột (`String(val).includes`, không phân biệt hoa thường); bấm tiêu đề cột để sắp xếp **3 trạng thái: tăng → giảm → bỏ sắp xếp**; chuỗi so sánh `localeCompare`; "Không có dữ liệu" khi rỗng. Không có xuất file (export). Từ khóa tìm kiếm & trạng thái sort **được giữ lại** sau khi đóng/mở lại (component không unmount) | `src/components/DataDetailModal.tsx:19-168` |
| `InfoTooltip` | Hover icon (i) → hộp tối hiển thị `description` + "Công thức:" `formula`; vị trí left/center/right | `src/components/InfoTooltip.tsx:4-61` |
| `CustomTooltip` | Tooltip Recharts chung: tiêu đề `titleLabel`/label, danh sách series + `valueFormatter` | `src/components/CustomTooltip.tsx:13-60` |
| Xuất dữ liệu (CSV/Excel/PDF) | **Không tồn tại** ở bất kỳ widget nào | grep toàn `src/` |

### 2.6. Acceptance Criteria — Engine & modal dùng chung
- **AC-ENG-01 [HT]** Given cùng một khoảng ngày và bộ lọc, When tải lại trang, Then mọi widget dùng engine hiển thị cùng giá trị (xác định theo seed); các widget dùng `Math.random()` (xem mục 9) thay đổi.
- **AC-ENG-02 [HT]** Given Chu kỳ = Tuần, khoảng 01/06–30/09/2026, Then trục X có 18 nhãn "Tuần 1 (01/06)" … "Tuần 18 (28/09)".
- **AC-ENG-03 [HT]** Given Chu kỳ = Quý, khoảng 01/06–30/09, Then có 2 cột "Quý 2" (chỉ chứa dữ liệu tháng 6) và "Quý 3".
- **AC-MODAL-01 [HT]** Given modal "Xem chi tiết dữ liệu" đang mở, When bấm 1 lần tiêu đề cột số, Then sắp xếp tăng dần (mũi tên lên); bấm lần 2 → giảm dần; bấm lần 3 → về thứ tự gốc.
- **AC-MODAL-02 [HT]** When gõ từ khóa vào ô "Tìm kiếm dữ liệu...", Then chỉ giữ dòng có ít nhất 1 ô (giá trị thô, chưa định dạng) chứa từ khóa; nếu không có → "Không có dữ liệu".

---

## 3. TRANG "TỔNG QUAN" (Executive View) — chỉ BOD

**File:** `src/views/ExecutiveView.tsx`. Thứ tự render thực tế (`ExecutiveView.tsx:289-318`):
1. Financial Overview Cards (9 thẻ: hàng 5 + hàng 4)
2. Lưới 2 cột: GMV vs Doanh thu thuần | Thác nước Doanh thu (Waterfall)
3. Hiệu quả đơn hàng: AOV – Volume – SL sản phẩm/đơn
4. Phân rã Nguồn hình thành GMV
5. Xu hướng Lũy kế & Tiến độ Kế hoạch (Run-rate Tracking)
6. Bảng xếp hạng Hiệu suất
7. Bản đồ hiệu suất chi nhánh (heatmap)
8. Phân tích Tăng trưởng (Growth Rate Analysis)

> **Code chết trong ExecutiveView** (`ExecutiveView.tsx:37-55, 59-287`): toggle VAT `includeVat`, `timePeriod` cục bộ, multi-select 9 chi nhánh (`branchOptions` 82-92: HMK BÌNH PHƯỚC, HMK HN CẦU GIẤY, HMK Q8, HMK HẢI PHÒNG, HMK BÌNH THẠNH, HMK HN NGUYỄN TRÃI, HMK TĐ Sense City, HMK HUẾ 2, HMK TÂN PHÚ), hệ số `multiplier = (n/9)·0.8+0.2`, dữ liệu `chartData`/`gmvNetRevenueData`/`gmvBreakdownData`/`adjustedMetrics` — tính toán nhưng **không render**. Đây là dấu vết phiên bản cũ có **toggle "Có VAT / Không VAT"** (ý tưởng ở `docs/VISUALIZATION_IDEAS.md:8`) — hiện đã mất khỏi UI.

### 3.1. Financial Overview Cards (Thẻ chỉ số tài chính)
**Nguồn:** `src/components/FinancialOverviewCards.tsx`
**Loại:** 9 thẻ KPI (scorecard) + sparkline dạng bậc (step line) + tooltip (i) mô tả/công thức. Hàng trên 5 thẻ (`lg:grid-cols-5`, dòng 208), hàng dưới 4 thẻ (dòng 291). Khớp bố cục `docs/BRAINSTORM_RETAIL_DEBT_SOLUTION.md:36-38`.
**Tương tác:** chỉ hover tooltip (i). Không click, không drill-down, không toggle VAT.
**Phạm vi dữ liệu:** `aggregateMetrics(start, end)` **không truyền khu vực/chi nhánh** (dòng 144) dù đã đọc `globalRegion, globalBranch` (139); `useMemo` chỉ phụ thuộc `[dateRange]` (204) → **luôn là toàn hệ thống**.
**Kỳ so sánh** (dòng 146-149): `ms = end − start`; `prevStart = start − ms − 1 ngày`; `prevEnd = end − ms − 1 ngày (= start − 1 ngày)` → kỳ trước có **cùng số ngày** (inclusive) và liền kề. Mặc định: 30/01–31/05/2026 (122 ngày).
**Tăng trưởng** (`calcGrowth`, 151-155): `((curr − prev)/prev)·100`, lấy `|x|` 1 chữ số thập phân, dấu phẩy thập phân; `prev = 0` → "0,0" và coi là tăng. Hiển thị mũi tên + "% so với kỳ trước" (106-110). Màu & chiều mũi tên **cùng dựa trên `isPositive`** (xanh+lên / đỏ+xuống).
**Sparkline** (162-175): 1 điểm/ngày trong khoảng (mặc định 122 điểm), luôn toàn hệ thống; trục Y co theo `[dataMin, dataMax]` (116); `type="step"` (118).
**Footer:** **hard-code "01/09 — 30/09/2026"** (131) — props `footerCurr/footerPrev` có truyền nhưng không render.

| Tên chỉ số (UI) | Định nghĩa (tooltip / FRS) | Công thức trong code | Nguồn file:dòng | Định dạng & ghi chú |
|---|---|---|---|---|
| **GMV (SỨC BÁN)** | "Tổng sức bán phát sinh trong kỳ." Công thức tooltip: "Giá trị Đơn Đặt + Giá trị Đơn mua thẳng (không qua Đơn Đặt)" | `Σ gmv` ngày; giá trị = `(gmv/1000).toFixed(2)` | 177, 190, 209-224 | "x,xx" **Tỷ VNĐ**. Sub-info: `Trước VAT: (GMV/1.08) T | VAT: (GMV − GMV/1.08) T` (179-182) — VAT 8% cố định. Icon FilePlus indigo |
| **KHÁCH HÀNG MỚI** | "Số lượng khách hàng lần đầu mua sắm tại hệ thống trong kỳ." | `round(Σorders × 0.3)`; xu hướng = tăng trưởng **số đơn** (`calcGrowth(agg.orders, prev.orders)`) | 191, 226-240 | Số nguyên, không phân cách nghìn (`toString()`), đơn vị "Khách". Sub-info **hard-code** "Bình quân 4-5 khách/ngày" (232) — mâu thuẫn với số tính được (~12,7 khách/ngày mặc định) |
| **DOANH THU** | "Doanh thu dựa trên dòng tiền thực tế (Cash-basis) trước khi trừ các khoản hoàn/hủy." | `Σgmv × 1.05` | 192, 242-255 | "x,xx" Tỷ VNĐ. **Doanh thu > GMV 5%** — placeholder phi lý. Sub-info "Dòng tiền thực thu (Trước điều chỉnh)" |
| **GIÁ TRỊ ĐIỀU CHỈNH** | "Bao gồm tổng giá trị chênh lệch do thay đổi từ Đơn Đặt → Đơn hàng (mua thêm/bỏ bớt) và các khoản hoàn/hủy trong kỳ." | `"-" + round(Σrefunds)` (= −5% GMV); **upsale không được cộng** | 193, 257-271 | "-NNN" **Tr VNĐ**. Xu hướng **hard-code `{val:"15,4", isPos:false}`** → luôn "↓ 15,4%" màu đỏ. Sub-info "Gồm Upsale & Hoàn/Hủy cọc" (sai thực tế) |
| **DOANH THU THUẦN** | "Dòng tiền thực tế đã thu về (Net Revenue) sau khi cấn trừ tất cả các khoản hoàn/hủy." Tooltip công thức: "GMV + Điều chỉnh GMV" | `Σ netRev` (85–90% GMV, ngẫu nhiên theo seed) | 194, 273-288 | "x,xx" Tỷ VNĐ. **≠ GMV + Điều chỉnh** (GMV − 5% = 95% GMV) |
| **NỢ TREO** | "Tổng công nợ tạm thời chưa thu về két (chủ yếu từ đơn đặt cọc cắt kính chờ lấy hoặc khách hẹn chuyển khoản sau)." Công thức: "Tổng dư nợ dương trên sổ cái khách hàng" | `round(Σdebt).toLocaleString('vi-VN')` (debt = 1,2–1,8% GMV/ngày, cộng dồn) | 195, 292-307 | "NN" **Tr VNĐ**. Sub-info `Chiếm X,X% GMV` (= Σdebt/Σgmv). Màu đảo (`isPositive={!isPos}`, 301): nợ tăng → đỏ, giảm → xanh — đúng FRS; **nhưng mũi tên cũng bị đảo** (nợ tăng hiển thị ↓ đỏ). Icon Clock amber, sparkline `#d97706` (khớp BRAINSTORM 3.2) |
| **BIÊN LỢI NHUẬN GỘP** | "Tỷ lệ lợi nhuận giữ lại được sau khi trừ đi chi phí cấu thành sản phẩm (Giá vốn hàng bán)…" Công thức: "((Doanh thu thuần − Giá vốn) / Doanh thu thuần) × 100" | `avgGrossMargin × 100` = **trung bình cộng đơn giản** của biên ngày (70–75%), không trọng số doanh thu, không có giá vốn | 196, 309-324; engine 88, 133-135 | "xx,x" %. Xu hướng = **% thay đổi tương đối** của biên (không phải chênh lệch điểm %). Sub-info "Tỷ lệ lợi nhuận trên doanh số gộp" (mâu thuẫn công thức trên DTT) |
| **ĐƠN HÀNG (VOLUME)** | "Tổng số lượng đơn hàng đã được tạo và xử lý thành công trong kỳ (Bao gồm cả khách cắt kính và khách mua mang đi)." Công thức: "Tổng Đơn Đặt + Đơn mua thẳng (không qua Đơn Đặt)" | `Σorders.toLocaleString('vi-VN')` | 197, 326-341 | "N.NNN" Đơn. Sub-info "Đã hoàn thành" |
| **GIÁ TRỊ ĐƠN TB (AOV)** | "Số tiền trung bình mà một khách hàng chi trả trên mỗi đơn hàng…" Công thức: "Doanh thu thuần / Tổng số đơn hàng" | `Σ netRev / Σ orders` (Tr) → `toFixed(1)` | 184-187, 198, 343-358 | "x,x" **Triệu/Đơn** (chỉ 1 chữ số thập phân → mặc định "0,7"). Sub-info `Trước VAT: AOV/1.08 Tr | VAT: … Tr`. Xu hướng = tăng trưởng AOV |

**Giá trị kỳ vọng ở bộ lọc mặc định** (tính lại bằng engine, TZ Asia/Ho_Chi_Minh): GMV **4,22** Tỷ (↑21,7%), Trước VAT 3,90T | VAT 0,31T; KH mới **1554** (↑21,2%); Doanh thu **4,43** Tỷ; Điều chỉnh **-211** Tr (↓15,4% cố định); DTT **3,70** Tỷ (↑21,6%); Nợ treo **63** Tr (↑20,9% hiển thị đỏ ↓), "Chiếm 1,5% GMV"; Biên LN **72,7**% (↑0,1%); Volume **5.181** (↑21,2%); AOV **0,7** Triệu/Đơn (↑0,3%), Trước VAT 0,66Tr | VAT 0,05Tr.

**AC — Financial Overview Cards**
- **AC-FOC-01 [HT]** Given bộ lọc mặc định, When trang Tổng quan tải, Then hiển thị 9 thẻ theo thứ tự hàng trên: GMV (SỨC BÁN), KHÁCH HÀNG MỚI, DOANH THU, GIÁ TRỊ ĐIỀU CHỈNH, DOANH THU THUẦN; hàng dưới: NỢ TREO, BIÊN LỢI NHUẬN GỘP, ĐƠN HÀNG (VOLUME), GIÁ TRỊ ĐƠN TB (AOV).
- **AC-FOC-02 [HT]** Given khoảng ngày [S, E], Then kỳ so sánh là [S − (E−S) − 1 ngày, S − 1 ngày] và % tăng trưởng = (hiện tại − kỳ trước)/kỳ trước × 100, làm tròn 1 chữ số, dấu phẩy thập phân.
- **AC-FOC-03 [HT]** Given BOD chọn Khu vực "Miền Bắc" trên thanh lọc toàn cục, Then giá trị 9 thẻ **không đổi**. **[FRS]** Then giá trị phải chỉ phản ánh Miền Bắc (FRS 3.1 "đồng bộ dữ liệu toàn trang").
- **AC-FOC-04 [HT]** Given GMV = G Tỷ, Then sub-info = "Trước VAT: G/1,08 T | VAT: G − G/1,08 T" (2 chữ số thập phân).
- **AC-FOC-05 [FRS]** Then Doanh thu thuần = GMV + Giá trị điều chỉnh; Giá trị điều chỉnh = Upsell/Downsell + Hoàn/Hủy; Doanh thu (Gross) ≤ GMV. *(HT vi phạm cả 3.)*
- **AC-FOC-06 [HT]** Given Nợ treo kỳ này > kỳ trước, Then % xu hướng màu đỏ (**mũi tên hiện tại hướng xuống**). **[FRS/đề xuất]** mũi tên hướng lên, màu đỏ.
- **AC-FOC-07 [FRS 4.5.4]** Then footer mỗi thẻ hiển thị "DD/MM/YYYY — DD/MM/YYYY" của kỳ gốc và kỳ so sánh. *(HT: luôn "01/09 — 30/09/2026", không có kỳ so sánh.)*
- **AC-FOC-08 [HT]** Given khoảng 122 ngày, Then mỗi sparkline có 122 điểm dạng bậc, trục Y co giãn theo min–max.
- **AC-FOC-09 [FRS/đề xuất]** Given số đơn = 0 trong kỳ, Then AOV hiển thị "—" thay vì "NaN". *(HT: dự kiến "NaN" — xem DA-Q12.)*

### 3.2. Tương quan: GMV vs Doanh thu thuần
**Nguồn:** `src/components/GMVNetRevenueChart.tsx`
**Loại:** Composed chart — Cột GMV (`#bfdbfe`) + Đường Doanh thu thuần (`#4f46e5`), nhãn "pill" % chênh lệch trên đỉnh mỗi cột (229-232, 54-105). Badge "Số % trên cột: Tỷ lệ chênh lệch" (200-202).
**Dữ liệu:** mỗi bucket theo `period` toàn cục: `gmv = Σgmv`, `netRev = Σ netRev` (engine) (111-136).
**Tương tác:** Local Filter KV/CN (204-209); tooltip tùy biến (GMV, DTT, Chênh lệch Tr và −x,x%) (10-51); InfoTooltip tiêu đề: mô tả "Theo dõi độ trễ giữa Sức chốt sale và Thực thu tiền", công thức "**Thực thu = GMV - Hoàn/Hủy - Rớt đơn**" (196-197). Legend.

| Tên chỉ số | Định nghĩa | Công thức trong code | Nguồn | Ghi chú |
|---|---|---|---|---|
| Chênh lệch (gap) | GMV − DTT | `gap = gmv − netRev` | 124 | Tr, làm tròn, `vi-VN` |
| % chênh lệch (nhãn trên cột) | gap/GMV | `gapPercent = (gap/gmv·100).toFixed(1)`; nhãn = `-x,x%` nếu `gap > 0.05` (Tr) ngược lại "0%"; GMV=0 → "0%" | 125-126 | Ẩn nhãn nếu cột rộng < 12px; cột < 30px → chữ trơn không pill (56-75) |
| Trục Y động | Co giãn theo min–max | `paddingTop = max(range·0.28, max·0.12)`; `paddingBottom = max(range·0.2, min·0.1)`; `min < 15 → yMin = 0`; làm tròn bước "đẹp" 1/2/5×10ⁿ với ~5 vạch | 139-182 | Nhãn trục `N Tr` |

Giá trị kỳ vọng mặc định: 18 cột tuần, % chênh lệch ~10–15% mỗi tuần (DTT/GMV tổng = 87,6%).
**Lệch FRS:** FRS gọi là "Biểu đồ Xu hướng **Lũy kế** GMV & Net Revenue" (`FRS.md:28`) — code là giá trị **từng kỳ**, không lũy kế (Medium, đặt tên). Công thức tooltip "− Rớt đơn" không có trong dữ liệu (Low).
**AC**
- **AC-GNR-01 [HT]** Given Chu kỳ = Tháng, khoảng 01/06–30/09, Then hiển thị 4 cột "Tháng 6…Tháng 9", mỗi cột có pill "-x,x%" = (GMV − DTT)/GMV.
- **AC-GNR-02 [HT]** When hover 1 cột, Then tooltip hiện "GMV (Sức bán): N Tr", "Doanh thu thuần: N Tr", "Chênh lệch: N Tr" và "-x,x%".
- **AC-GNR-03 [HT]** Given Local Filter = "Miền Trung", Then GMV mỗi cột ≈ 30% giá trị toàn hệ thống (chỉ HMK ĐN CN2) và các widget khác không đổi.
- **AC-GNR-04 [HT]** Given giá trị nhỏ nhất < 15 Tr, Then trục Y bắt đầu từ 0; ngược lại trục Y bắt đầu ở bội số bước gần nhất dưới (min − đệm).

### 3.3. Thác nước Doanh thu (Waterfall)
**Nguồn:** `src/components/RevenueWaterfallChart.tsx`
**Loại:** Waterfall dựng bằng cột khoảng `[start,end]` (127-131). 3 cột: "Tổng GMV" (`#bfdbfe`), "Hoàn/Hủy" (`#fca5a5`, âm), "Thực thu" (`#10b981`, tổng) (47-51).
**Dữ liệu:** tổng cả khoảng ngày (không theo period): `gmv = Σgmv`, `refunds = Σrefunds (=5% GMV)`, `Thực thu = gmv − refunds` (40-45). Lịch sử: commit `aa1a814` đã bỏ các bước VAT 8%, Phí vận chuyển 3%, Khuyến mãi 5%.
**Tương tác:** Local Filter (96-101); tooltip "Giá trị: ±N Tr", với cột tổng thêm "(Bằng x,x% so với GMV)" (10-33); InfoTooltip công thức "Thực thu = GMV - Hoàn/Hủy" (92).

| Bước | Công thức | Nguồn | Giá trị mặc định |
|---|---|---|---|
| Tổng GMV | Σgmv | 42 | 4.216 Tr |
| Hoàn/Hủy | −Σrefunds = −0,05·GMV | 43, 49 | −211 Tr |
| Thực thu | GMV − Hoàn/Hủy | 45 | 4.005 Tr (95,0% GMV) |

**Lệch:** "Thực thu" ở đây (95% GMV) ≠ "Doanh thu thuần" ở thẻ và các chart khác (87,6% GMV) — **High**. Không có bước Upsell/Downsell (FRS 4.3 gộp vào "Điều chỉnh"). Trục Y `${tick}Tr` không phân cách nghìn (122) (Low). Nhãn trục X xoay −45°.
**AC**
- **AC-WF-01 [HT]** Given bộ lọc mặc định, Then hiển thị 3 cột Tổng GMV → Hoàn/Hủy → Thực thu, cột Hoàn/Hủy treo từ đỉnh GMV xuống, cột Thực thu bắt đầu từ 0.
- **AC-WF-02 [HT]** When hover cột "Thực thu", Then tooltip "+N Tr" và "(Bằng 95,0% so với GMV)".
- **AC-WF-03 [HT]** When đổi Chu kỳ toàn cục, Then Waterfall không đổi (chỉ phụ thuộc khoảng ngày và KV/CN).
- **AC-WF-04 [FRS]** Then Thực thu của Waterfall = Doanh thu thuần trên thẻ tài chính cùng bộ lọc. *(HT không đạt.)*

### 3.4. Hiệu quả đơn hàng: AOV – Volume – SL sản phẩm/đơn
**Nguồn:** `src/components/OrderEfficiencyMetricsChart.tsx` — **không có trong FRS** (tính năng chưa được tài liệu hóa).
**Loại:** 3 thẻ tóm tắt + 3 chế độ hiển thị (segmented): "Phóng to trục Y (Chuẩn)" (mặc định), "Biểu đồ kết hợp (Combo)", "Độ lệch % so với TB" (418-452).
**Tương tác:** Local Filter (455-460); nút modal chi tiết (463-469, cột 338-390); combo: "Đường hiển thị" Cả 2 / Chỉ AOV / Chỉ UPT (784-810); variance: % Lệch AOV / UPT / Volume (923-948); tooltip riêng từng chart. InfoTooltip (402-409) truyền prop `title`/`content` **không tồn tại** trong `InfoTooltip` (chỉ có `label`/`description`) → biểu tượng (i) hiện nhưng tooltip **trống** (Low/Medium).

| Tên chỉ số | Định nghĩa | Công thức trong code | Nguồn | Ghi chú |
|---|---|---|---|---|
| AOV (từng kỳ) | Giá trị TB đơn | `round(Σgmv·10⁶ / Σorders)` **(dựa trên GMV, đơn vị VNĐ)** | 63 | ≠ AOV thẻ tài chính (DTT/đơn, Tr) |
| UPT | SL SP/đơn | `units/orders` 2 chữ số; units = engine `units` (fallback `orders·2.3`) | 61, 64 | |
| AOV TB toàn khoảng | | `Σgmv·10⁶/Σorders` (trọng số) | 100 | Mặc định ≈ 813.773 ₫ |
| UPT TB | | `Σunits/Σorders` | 101 | Mặc định 2,35 |
| Volume TB/kỳ | | `round(Σorders / số kỳ)` | 102 | Mặc định 288 đơn/kỳ (tuần) |
| "Biến thiên: ±x%" (AOV) | | `(max − min)/min·100` (không phải ±) | 112, 483 | đặt tên gây hiểu nhầm (Low) |
| "Chênh lệch: x SP" (UPT) | | `max − min` | 113, 531 | |
| Độ lệch % | so với TB | `(giá trị kỳ − TB)/TB·100` 1 chữ số, cho AOV/UPT/Volume | 132-145 | |
| Trục Y AOV phóng to | | `pad = max(15.000, 35%·(max−min))`, làm tròn 10.000 | 148-155 | nhãn "Nk" |
| Trục Y UPT phóng to | | `pad = max(0,12; 35%·(max−min))` | 157-164 | |
| Màu cột Volume | | ≥ TB → `#10b981` đậm; < TB → `#6ee7b7` nhạt | 676 | Chú thích "Cột đậm: Vượt TB / Cột nhạt: Dưới TB" |
| Màu cột độ lệch | | ≥ 0 → xanh `#10b981`; < 0 → đỏ `#f43f5e` | 993 | |

**Bug:** Chế độ Combo + "Cả 2 (AOV & UPT)": đường UPT gắn vào trục `rightAov` (`yAxisId={comboSecondary==='upt' ? 'rightUpt' : 'rightAov'}`, 882) → UPT (~2,3) bị vẽ trên thang AOV (~800k): hoặc nằm sát đáy (đường phẳng), hoặc trục AOV bị kéo về 0 làm mất hiệu ứng phóng to (Medium — DA-Q7).
**AC**
- **AC-OE-01 [HT]** Given mặc định, Then 3 thẻ: "AOV (Giá trị TB đơn)" ≈ 813.773 ₫ kèm "Biến thiên: ±x%" và "Biên độ dao động: Nk ~ Nk ₫"; "Volume (Sản lượng đơn)" = 288 đơn/kỳ, "Tổng: 5.181 đơn", "Tổng GMV đóng góp: 4.216 Triệu"; "SL sản phẩm/đơn (UPT)" = 2,35 SP/đơn.
- **AC-OE-02 [HT]** Given chế độ "Phóng to trục Y", Then hiển thị 3 chart: AOV (area, trục Y phóng to, đường TB nét đứt), Volume (cột gốc 0, đường TB, cột ≥ TB màu đậm), UPT (area phóng to, đường TB) + hộp "Nhận xét trực quan".
- **AC-OE-03 [HT]** Given chế độ "Độ lệch %", When chọn "% Lệch Volume", Then mỗi cột = (đơn kỳ − TB)/TB, cột ≥0 xanh, <0 đỏ, có đường 0.
- **AC-OE-04 [HT]** When chọn chế độ Combo → "Chỉ UPT", Then trục phải hiển thị thang UPT ("x SP"), trục AOV ẩn.
- **AC-OE-05 [FRS/đề xuất]** Then AOV phải dùng chung 1 định nghĩa với thẻ "GIÁ TRỊ ĐƠN TB (AOV)". *(HT: GMV/đơn vs DTT/đơn.)*

### 3.5. Phân rã Nguồn hình thành GMV (GMV Breakdown)
**Nguồn:** `src/components/GMVBreakdownChart.tsx`
**Loại:** Cột chồng 2 khúc "Đơn lắp sẵn" (`directOrder`, `#0ea5e9`, dưới) + "Đơn đặt trước" (`preOrder`, `#f59e0b`, trên) + đường "Tổng GMV" (`#4f46e5`) (226-232). Badge "Số % trên cột: Tỷ trọng nguồn đơn".
**Dữ liệu:** theo `period`: `directOrder = Σ gmv·(0.35..0.40)`, `preOrder = Σ gmv·(0.60..0.65)` (engine 85-86; component 123-150).
**Tương tác:** Local Filter; tooltip (Tr + % 1 chữ số, Tổng GMV) (10-50); InfoTooltip: "Tỷ trọng đóng góp giữa Đơn lắp sẵn (nhận ngay) và Đơn đặt trước (chờ sản xuất)", công thức "GMV Đặt trước = Các đơn hàng có cọc, chờ sản xuất/lắp ráp" (193-194).

| Quy tắc | Công thức | Nguồn |
|---|---|---|
| % nhãn khúc dưới | `round(direct/total·100)` | 137-138, 146 |
| % nhãn khúc trên | `100 − %direct` (đảm bảo tổng 100) | 139, 147 |
| Ẩn/dời nhãn | khúc dưới: ẩn nếu cao < 14px hoặc rộng < 16px; khúc trên: dời lên trên cột (màu `#b45309`) | 55, 86-98 |
| Trục Y | `yMin = 0`; `yMax = max tổng + max(18%·max, 5)` làm tròn bước 1/2/5×10ⁿ | 153-179 |

**Lệch:** FRS dùng "Đơn mua thẳng (Direct Order)" — UI dùng "Đơn lắp sẵn" (Low, thuật ngữ). Tỷ trọng thực tế mock: direct 35–40% / pre 60–65% mỗi kỳ.
**AC**
- **AC-GB-01 [HT]** Given mỗi cột, Then nhãn % khúc "Đơn lắp sẵn" + nhãn % khúc "Đơn đặt trước" = 100%, và chiều cao cột = Tổng GMV kỳ đó (đường Tổng GMV đi qua đỉnh cột).
- **AC-GB-02 [HT]** When hover, Then tooltip hiện Tr và % (1 chữ số) của từng nguồn và "Tổng GMV".
- **AC-GB-03 [FRS]** Then GMV Breakdown cộng lại = GMV trên thẻ "GMV (SỨC BÁN)" cùng khoảng và cùng KV/CN. *(HT đạt khi KV/CN = Tất cả.)*

### 3.6. Xu hướng Lũy kế & Tiến độ Kế hoạch (Run-rate Tracking) — "Revenue Trend & Target YTD"
**Nguồn:** `src/components/RevenueTrendChart.tsx`
**Loại & chế độ:**
- Chế độ "Tiến độ Kế hoạch (Chuẩn)" (`pace`, mặc định): 
  - "Đồng bộ cả 3" (mặc định): 3 card chart Area (lũy kế thực tế) + Line nét đứt (tiến độ chuẩn) cho GMV / DTT / Nợ, đồng bộ hover bằng `syncId="cum-pace-sync"` (604, 653, 702); mỗi card có nút phóng to (Maximize) → chế độ đơn lẻ.
  - Đơn lẻ (GMV / Doanh thu thuần / Công nợ): 1 chart lớn + đường ngang "Target cuối kỳ" hoặc "Trần an toàn"; nút "← Quay lại xem đồng bộ cả 3" (729-803).
- Chế độ "Biểu đồ kết hợp (Combo)": cột phát sinh kỳ (trục trái) + đường lũy kế + đường kế hoạch (trục phải) (817-900). Vào Combo khi đang "all" → tự chuyển sang GMV (387-392); nút "Đồng bộ cả 3" ẩn trong Combo (427).
**Thành phần khác:** bộ chọn "Chỉ số" (424-471); pill trạng thái GMV "vượt tiến độ +x%" (xanh) / "chậm tiến độ x%" (đỏ) (474-486); 3 thẻ KPI (490-571); hộp "Nhận xét tiến độ" (806-812); Local Filter; modal chi tiết (cột 289-347). InfoTooltip (359-365) truyền sai prop → tooltip trống.

| Tên chỉ số | Định nghĩa | Công thức trong code | Nguồn | Ghi chú |
|---|---|---|---|---|
| Lũy kế (GMV/DTT/Nợ) | Cộng dồn từ **"Từ ngày"** (không phải 01/01 → không phải YTD thật) | `cumulative += agg.x` qua các bucket | 61-67 | |
| Số ngày kế hoạch | | `days = max(1, (end − start)/86.400.000)` → **121** cho 01/06–30/09 (thiếu 1 ngày so với inclusive) | 81 | |
| Target GMV | | `round(days × 42)` Tr (42 Tr/ngày **hard-code**) | 82 | Mặc định 5.082 Tr |
| Target DTT | | `round(days × 35)` Tr | 83 | Mặc định 4.235 Tr |
| Trần nợ an toàn | ~1,5% GMV kế hoạch | `days × 42 × 0.015` | 84 | Mặc định 76,23 Tr |
| Tiến độ chuẩn (paced) tại bước i | phân bổ đều theo **số bucket**, không theo số ngày | `target × (i+1)/N` | 89-93 | tuần lẻ cuối (3 ngày) có trọng số = tuần đủ |
| % lệch tiến độ | | `(lũy kế − paced)/paced × 100` 1 chữ số | 96-98 | |
| % đạt Target | | `round(lũy kế cuối / target × 100)` | 148-149 | |
| Tỷ lệ DTT/GMV | | `Σnet/Σgmv` | 146 | "x,x% GMV" |
| Tỷ lệ Nợ/GMV | | `Σdebt/Σgmv` | 147 | "x,x% GMV (An toàn)" — chữ "(An toàn)" **cố định** (553) |
| "Dưới ngưỡng trần an toàn" | | `-(trần − nợ lũy kế)` luôn màu xanh | 565-568 | Nếu nợ > trần sẽ hiện "--x" xanh (bug hiển thị) |
| Trạng thái GMV | | `finalGmvPaceDev ≥ 0` → "vượt", ngược lại "chậm" | 117-141, 474-486 | |

Giá trị kỳ vọng mặc định (Tuần): GMV lũy kế 4.216 / 5.082 Tr → **Đạt 83% Target**, "**chậm tiến độ -17%**" (pill đỏ); DTT 3.695 / 4.235 Tr → 87%, "87,6% GMV"; Nợ 63,4 / 76,2 Tr, "1,5% GMV (An toàn)", "Dưới ngưỡng trần an toàn: -12,8 Tr".
**Lệch:** FRS gọi "YTD" và "Mục tiêu lũy kế" — code không lấy từ module KPI, không tính từ đầu năm (High). Định dạng số trong tooltip của Nợ dùng `toFixed(2)` → "63,40 Tr" (2 chữ số) còn thẻ 1 chữ số.
**AC**
- **AC-RT-01 [HT]** Given mặc định, Then hiển thị 3 thẻ: "Lũy kế Sức bán GMV" (Đạt x% Target, Mục tiêu: N Tr, Tiến độ nhịp chạy), "Lũy kế Doanh thu thuần" (x% GMV, Đạt x% Target), "Lũy kế Công nợ treo" (x% GMV (An toàn), Trần an toàn); và 3 chart đồng bộ.
- **AC-RT-02 [HT]** When hover 1 điểm trên card GMV, Then 2 card còn lại hiển thị tooltip tại cùng mốc thời gian (syncId).
- **AC-RT-03 [HT]** When bấm icon phóng to trên card "Công nợ", Then chỉ còn 1 chart Công nợ với đường ngang "Trần an toàn: x,x Tr" và nút "← Quay lại xem đồng bộ cả 3".
- **AC-RT-04 [HT]** When chuyển sang "Biểu đồ kết hợp (Combo)" khi đang "Đồng bộ cả 3", Then chỉ số tự chuyển sang "Sức bán GMV" và nút "Đồng bộ cả 3" bị ẩn.
- **AC-RT-05 [HT]** Given lũy kế GMV cuối kỳ < target × 1, Then pill đỏ "GMV đang chậm tiến độ x%".
- **AC-RT-06 [FRS]** Then Target lấy từ KPI "Đang áp dụng" của đối tượng & chu kỳ tương ứng trong module Quản lý KPI, lũy kế tính từ 01/01 (YTD). *(HT không đạt.)*
- **AC-RT-07 [FRS/đề xuất]** Given Nợ lũy kế > Trần an toàn, Then nhãn chuyển sang cảnh báo đỏ ("Vượt trần"). *(HT luôn "(An toàn)" xanh.)*

### 3.7. Bảng xếp hạng Hiệu suất (Top Performance Table)
**Nguồn:** `src/components/TopPerformanceTable.tsx`
**Loại:** Bảng; cột: #, Tên Chi nhánh/Khu vực, GMV, Tỷ trọng GMV, Doanh thu, Tỷ trọng Doanh thu, Tỷ lệ trả hàng; dòng tổng cuối "Tổng Hệ Thống" / "Tổng {Khu vực}" (128-190).
**Tương tác:** Local Filter; toggle "Theo Khu vực / Theo Chi nhánh" (chỉ hiện khi Local KV = "Tất cả Khu vực"; khi chọn 1 KV thì ép theo chi nhánh) (37, 110-123). Không sort tay, không phân trang, không modal.

| Tên chỉ số | Công thức trong code | Nguồn | Ghi chú |
|---|---|---|---|
| GMV dòng | `agg.branches[cn]` (tổng khoảng ngày) | 41 | Tr |
| "Tỷ lệ trả hàng" (dropRate) | `0.05 + (Σ mã ký tự tên CN mod 10) × 0.015` → 5%–18,5%, **cố định theo tên**, không theo thời gian | 11-14 | |
| "Doanh thu" dòng | `GMV × (1 − dropRate)` | 43, 54 | Định nghĩa DT thứ 3 |
| Tỷ trọng GMV | `GMV dòng / GMV lọc × 100` | 76 | 1 chữ số |
| Tỷ trọng Doanh thu | `DT dòng / Σ DT × 100` | 77 | |
| Theo khu vực | cộng GMV & DT các CN theo `BRANCH_TO_REGION`; dropRatio = (GMV−DT)/GMV | 48-69 | |
| Sắp xếp | GMV giảm dần | 80 | không Top-N (hiện tất cả: 5 CN hoặc 3 KV) |
| Tô đỏ | `dropRatio > 0.12` → nền `bg-rose-50` chữ đỏ | 163 | |
| Dòng tổng | GMV lọc, 100%, Σ DT, 100%, (GMV−ΣDT)/GMV | 170-190 | |

Mặc định (Theo Chi nhánh): 1) HMK ĐN CN2 1.265 Tr 30,0% | 1.183 30,5% | 6,5%; 2) HMK HN CN1 1.054 25,0% | 1.001 25,8% | 5,0%; 3) HMK BD CN3 843 20,0% | 725 18,7% | **14,0% (đỏ)**; 4) HMK CN4 632 15,0% | 591 15,3% | 6,5%; 5) HMK HN CN5 422 10,0% | 375 9,7% | 11,0%; Tổng 4.216 | 3.876 | 8,1%. Theo Khu vực: Miền Nam 1.476 (10,8%), Miền Bắc 1.476 (6,7%), Miền Trung 1.265 (6,5%).
**Lệch FRS (High):** FRS 3.1 yêu cầu "Top 5 Chi nhánh và Top 5 Sản phẩm … kèm mức độ hoàn thành chỉ tiêu" (`FRS.md:50-52`) — code không có Sản phẩm, không có chỉ tiêu/% hoàn thành. "Tỷ lệ trả hàng" là số băm giả, không liên quan Hoàn/Hủy engine (5%).
**AC**
- **AC-TOP-01 [HT]** Given Local KV = "Tất cả Khu vực" và chế độ "Theo Chi nhánh", Then bảng có 5 dòng xếp GMV giảm dần + dòng "Tổng Hệ Thống" với Tỷ trọng = 100%.
- **AC-TOP-02 [HT]** Given Tỷ lệ trả hàng của 1 dòng > 12%, Then ô được tô nền đỏ nhạt chữ đỏ.
- **AC-TOP-03 [HT]** When chọn Local KV = "Miền Nam", Then toggle Khu vực/Chi nhánh biến mất, bảng hiện 2 chi nhánh Miền Nam và dòng "Tổng Miền Nam".
- **AC-TOP-04 [FRS]** Then hiển thị Top 5 chi nhánh và Top 5 sản phẩm theo doanh thu, mỗi dòng có % hoàn thành chỉ tiêu. *(HT không đạt.)*

### 3.8. Bản đồ hiệu suất chi nhánh (Heatmap) — "Branch Performance Map"
**Nguồn:** `src/components/BranchRevenueComparison.tsx`
**Loại:** Bảng heatmap (hàng = chi nhánh/khu vực, cột = kỳ), cột đầu sticky, cuộn 2 chiều (max-h 600px) (671-734). Ô có màu theo ngưỡng + hover phóng to.
**Dữ liệu:** mock xác định nội bộ, **80 chi nhánh × (31 ngày "1/7…31/7" | 4 tuần | 7 tháng "Tháng 1…7")** (9-85). Không dùng engine, không dùng bộ lọc toàn cục/khoảng ngày.
**Tương tác:**
- Toggle "Chi nhánh / Khu vực" (468-485).
- Dropdown lọc khu vực (chỉ chế độ Chi nhánh): "Tất cả chi nhánh", Hồ Chí Minh, Miền Bắc, Miền Trung, Đông Nam Bộ (488-501).
- Nút "Nhập Traffic" → modal nhập lượt khách (877-936): hiển thị **7 kỳ đầu × 12 chi nhánh đầu** ("* Đang hiển thị 12 chi nhánh và 7 chu kỳ để demo"); thay đổi cập nhật state cục bộ ngay (415-435), **không lưu** (mất khi rời trang/F5); "Hoàn tất" chỉ đóng.
- Tab kỳ Ngày / Tuần / Tháng (513-529) — độc lập với Chu kỳ toàn cục, không có Quý/Năm.
- Tab chỉ số: "% Target", "Doanh thu", "Traffic", "Tỷ lệ CĐ" (532-566) với `title` gợi ý ngưỡng.
- Chú thích màu theo chỉ số (571-668); với Tỷ lệ CĐ hiện "Công thức: Số đơn / Traffic".
- Tooltip nổi khi hover ô (737-874): Doanh thu (M/B), Chỉ tiêu, Đạt %, quy tắc màu; Tỉ lệ chuyển đổi, Số đơn/Traffic; Lưu lượng khách; Số đơn hoàn tất. Cùng `title` HTML (705).

| Tên chỉ số | Công thức trong code | Nguồn | Ngưỡng màu |
|---|---|---|---|
| Chỉ tiêu DT (targetRevenue) | `400 + ((i·11 + p·7) mod 250)` Tr | 32 | — |
| % Target | sinh theo `seed=(i·17+p·23) mod 100`: <32 → 25–59%; <68 → 60–79%; còn lại 80–125% | 29, 35-45 | ≥115 Xanh rất đậm "Xuất sắc"; 100–114 "Đạt chuẩn"; 90–99 "Đạt tốt"; 80–89 "Đạt yêu cầu" (xanh nhạt); 74–79 "Tiệm cận chỉ tiêu"; 67–73 "Mức trung bình"; 60–66 "Cần theo dõi" (vàng); 50–59 "Chưa đạt"; 40–49 "Cảnh báo thấp"; 30–39 "Nguy cơ cao"; <30 "Nghiêm trọng" (đỏ) (102-201) |
| Doanh thu | `round(targetRevenue × %Target/100)` Tr | 46 | Màu = **theo % Target** (cùng thang trên) |
| Traffic | `120 + ((i·9 + p·13) mod 220)` → 120–339 | 63 | ≥320 rất cao; 240–319 cao; 170–239 TB; <170 thấp (thang xanh lam) (302-338) |
| Số đơn | `max(1, round(traffic × CR%/100))` | 64 | — |
| Tỷ lệ CĐ | `Số đơn / Traffic × 100` (1 chữ số) | 100, 446-449 | ≥90 "tối ưu"; 85–89 "xuất sắc"; 80–84 "rất tốt"; 75–79 "tốt" (xanh); 67–74 "khá"; 58–66 "TB khá"; 50–57 "TB" (vàng); 40–49 "thấp"; 30–39 "rất thấp"; 20–29 "kém"; <20 "rất kém" (đỏ) (202-301) |
| Gộp theo khu vực | DT = Σ; Chỉ tiêu = Σ; **% Target = ΣDT/ΣChỉ tiêu** (gia quyền); Đơn, Traffic = Σ | 370-406 | |
| Định dạng DT | ≥1000 → "x.xB"; ngược lại "NNNM" (đơn vị tiếng Anh M/B) | 437-443 | |

Ngưỡng biên (vàng/xanh): Doanh thu/Target "≥80 xanh, 60–<80 vàng, <60 đỏ" (`title` 537-542 ghi ">80%" — biên 80 thực tế thuộc xanh). Tỷ lệ CĐ "≥75 xanh, 50–<75 vàng, <50 đỏ".
**Lệch FRS (Medium):** FRS mô tả "Danh sách kết hợp đồ thị thanh ngang (Horizontal Bars)" (`FRS.md:54-56`); code là heatmap + Traffic input (không có trong FRS). Danh mục chi nhánh/khu vực không khớp phần còn lại của app. Chỉ tiêu không lấy từ module KPI. Tháng chỉ đến "Tháng 7", ngày cố định tháng 7.
**AC**
- **AC-HM-01 [HT]** Given mặc định, Then heatmap hiển thị 80 chi nhánh × 31 cột ngày "1/7…31/7", chỉ số "% Target", ô màu theo thang 11 sắc độ đỏ–vàng–xanh.
- **AC-HM-02 [HT]** Given chỉ số "Tỷ lệ CĐ", When hover 1 ô, Then tooltip hiện "Tỉ lệ chuyển đổi: x,x%", "Số đơn / Traffic: a / b" và nhãn quy tắc màu (">75% Xanh"/"50-75% Vàng"/"<50% Đỏ").
- **AC-HM-03 [HT]** When chọn "Khu vực", Then hiển thị 4 hàng (Hồ Chí Minh, Miền Bắc, Miền Trung, Đông Nam Bộ) với % Target = ΣDoanh thu/ΣChỉ tiêu, Traffic và Số đơn là tổng.
- **AC-HM-04 [HT]** Given modal "Nhập Traffic", When sửa Traffic của "HMK Chi nhánh 1" kỳ "1/7" thành 100, Then ô tương ứng ở chỉ số Traffic = 100 và Tỷ lệ CĐ = Số đơn/100 ngay lập tức; F5 trả lại giá trị cũ.
- **AC-HM-05 [FRS/đề xuất]** Given BOD đổi khoảng ngày/khu vực toàn cục, Then heatmap phải lọc theo. *(HT không.)*

### 3.9. Phân tích Tăng trưởng (Growth Rate Analysis)
**Nguồn:** `src/components/GrowthAnalysisChart.tsx`
**Loại:** Composed: Line "Kỳ này" (`#4f46e5`) + Line nét đứt "Kỳ trước" (`#94a3b8`) trên trục trái (giá trị tuyệt đối) + Cột "Tăng trưởng (%)" trục phải (xanh ≥0 / đỏ <0) + đường 0 (392-478).
**Tương tác:** 5 tab chỉ số: GMV, Doanh thu, AOV, Volume, Số lượng SP/đơn (340-360); Local Filter; modal chi tiết (cột 272-296); pill "Tổng/TB Kỳ này" + "Tăng trưởng chung" (363-384); hộp insight "Tăng trưởng cao nhất … thấp nhất …" (483-502). InfoTooltip (309-312) truyền sai prop → tooltip trống.

| Tên chỉ số | Công thức trong code | Nguồn | Ghi chú |
|---|---|---|---|
| Giá trị "Kỳ này" | GMV/DTT/Đơn từ engine; AOV = `GMV·10⁶/đơn` (VNĐ); UPT = `units/đơn` | 191-199, 215-230 | |
| Giá trị "Kỳ trước" | **Giả lập**: `prev = current / variation`, `variation = 0.82 + seededRandom(s.getTime())·0.36` (GMV/DTT), đơn `0.85+r·0.3`, units `0.88+r·0.24` | 201-213 | **Không phải dữ liệu kỳ trước thật** |
| Tăng trưởng % | `(current − prev)/prev·100` 1 chữ số; prev=0 → 0 | 232-233 | |
| Tổng/TB kỳ này | GMV/DTT/Volume: tổng; AOV/UPT: trung bình **không trọng số** các kỳ | 255-257 | |
| Tăng trưởng chung | `(Tổng/TB kỳ này − Tổng/TB kỳ trước)/… ·100` | 257 | |
| Insight cao nhất/thấp nhất | max/min của tăng trưởng từng kỳ; max luôn có tiền tố "+" | 239-240, 488 | max âm → "+-x%" (Low) |

**Lệch FRS (High):** FRS 3.1 "Biểu đồ phân tán (Scatter) kết hợp phân chia góc phần tư; X = Tăng trưởng DT %, Y = Biên LN %" (`FRS.md:58-60`) — **không có scatter, không có góc phần tư, không có ngưỡng góc phần tư** trong code. "Kỳ trước" mâu thuẫn với logic kỳ so sánh FRS 4.5 (thẻ tài chính tính thật).
**AC**
- **AC-GA-01 [HT]** Given tab "GMV", Then mỗi kỳ có 2 đường (Kỳ này, Kỳ trước) và 1 cột tăng trưởng %, cột xanh nếu ≥0, đỏ nếu <0.
- **AC-GA-02 [HT]** Given tab "AOV", Then pill ghi "TB Kỳ này: N đ" (trung bình các kỳ) và trục trái định dạng "Nk"/"x,xM".
- **AC-GA-03 [HT]** When hover, Then tooltip: Kỳ này, Kỳ trước, Chênh lệch (±), Tỷ lệ Tăng trưởng ±x,x%.
- **AC-GA-04 [FRS]** Then hiển thị scatter mỗi chi nhánh 1 điểm (X = tăng trưởng DT % so với kỳ trước thực, Y = biên LN gộp %), chia 4 góc phần tư với ngưỡng xác định. *(HT không đạt; ngưỡng chưa được định nghĩa ở đâu — cần PM chốt.)*

---

## 4. TRANG "VẬN HÀNH & KHÁCH HÀNG" (Operational View) — BOD, MANAGER

**File:** `src/views/OperationalView.tsx`. **Không widget nào đọc AppContext** → không phản ứng với khoảng ngày, chu kỳ, khu vực, chi nhánh, vai trò (MANAGER thấy y hệt BOD). Thứ tự render: Order Aging (1/3) | Time Peak (2/3) → Nhân khẩu học → [Basket Size + Hình thức thanh toán] (1/2 lưới, nửa còn lại trống) → Hiệu quả Chiến dịch → Benchmarking → Anomaly → Tỷ lệ chuyển đổi | Tỷ lệ hoàn tiền (`OperationalView.tsx:118-778`).
Mỗi widget (trừ Marketing, Benchmark, Anomaly, Conversion/Refund) có nút FileText mở `DataDetailModal` dùng chung (`openModal` 46-50).

### 4.1. Cảnh báo Tồn đọng (Order Aging)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Cột chồng **ngang**, hàng = công đoạn "Đo khám", "Mài lắp", "Vận chuyển" | 178-254 |
| Phân nhóm tuổi đơn | 1-5 ngày (xanh `#10b981`), 5-10 ngày (vàng `#f59e0b`), 10-20 ngày (cam `#f97316`), > 20 ngày (đỏ `#ef4444`) — biên 5, 10, 20 chồng lấn | 222-253 |
| Toggle | "Theo số lượng" (đơn) / "Theo Value" (Tr) | 160-173 |
| Dữ liệu | tĩnh `orderAgingData` (vd Mài lắp: 850/250/50/20 đơn) | `data.ts:107-142` |
| Tooltip | "Tồn đọng": N đơn / N Triệu | 205-215 |
| Modal | cột Trạng thái, 1-5, 5-10, 10-20, > 20 ngày | 141-154 |
| Drill-down | **Không** (VIS doc §3 muốn click khối đỏ → danh sách ID đơn) | — |

Lệch: VIS doc đề xuất 3 mốc (1-5 xanh, 5-10 vàng, >20 đỏ) và trạng thái "Đang đo mắt/Đang mài lắp/Đang vận chuyển"; code 4 mốc. FRS chỉ nói "phân nhóm theo thời gian lưu đọng" → khớp tổng quát.
- **AC-AG-01 [HT]** Given mặc định, Then 3 thanh ngang (Đo khám, Mài lắp, Vận chuyển), mỗi thanh 4 khúc màu theo thứ tự xanh → vàng → cam → đỏ.
- **AC-AG-02 [HT]** When bấm "Theo Value", Then trục X hiển thị "NTr" và tooltip "N Triệu".
- **AC-AG-03 [FRS/VIS]** When click khối đỏ (> 20 ngày), Then mở danh sách mã đơn tồn đọng. *(Chưa có.)*

### 4.2. Thời gian Bán hàng Tối ưu (Time Peak)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Heatmap dạng bảng HTML 7 ngày (Thứ 2 → Chủ Nhật) × 7 khung giờ (8-10h … 20-22h) | 313-363 |
| Cường độ | `0.1` cơ sở; +0.4 nếu T7/CN; +0.3 nếu 16-18h/18-20h; +0.2 nếu ngày thường 10-12h; ngày thường 8-10h đặt = 0.05; cộng nhiễu `Math.random()±0.1`; kẹp [0.05, 1] | 86-116 |
| Giá trị | Đơn = `floor(intensity·150)`; Doanh thu = `intensity·45` Tr (1 chữ số) — 2 thước đo cùng nguồn intensity | 103-104 |
| Màu ô | `rgba(99,102,241, intensity)`; chữ trắng nếu intensity > 0,5 | 339-340 |
| Hiển thị số trong ô | chỉ khi Đơn > 10 (chế độ đơn) hoặc DT > 3 Tr (chế độ DT) | 354 |
| Toggle | "Theo Đơn hàng" / "Theo Doanh thu" | 289-310 |
| Tooltip | `title` HTML: "{Thứ} {khung}: N đơn / N Triệu VNĐ" | 352 |
| Modal | Ngày trong tuần, Khung giờ, Số lượng đơn **hoặc** Doanh thu (Tr) theo toggle | 270-283 |

Ghi chú: dùng `Math.random()` trong `useMemo([])` → **số đổi mỗi lần vào lại tab** (Medium). `dayOfWeekData/hourOfDayData.value` chỉ dùng làm nhãn.
- **AC-TP-01 [HT]** Then lưới 7×7, ô T7/CN khung 16-20h đậm nhất; ô ngày thường 8-10h nhạt nhất.
- **AC-TP-02 [HT]** When bấm "Theo Doanh thu", Then ô hiển thị "x.xTr" (chỉ các ô > 3 Tr) và modal đổi cột thành "Doanh thu (Tr)".

### 4.3. Phân tích Nhân khẩu học Khách hàng
| Biểu đồ | Chi tiết [HT] | Nguồn |
|---|---|---|
| Tỷ trọng Giới tính | Donut Nam (`#3b82f6`) / Nữ (`#ec4899`); Nam = Σ|male|, Nữ = Σfemale | 58-71, 421-450 |
| Phân bổ Nhóm tuổi | Cột dọc; giá trị = |male| + female mỗi nhóm | 72-76, 461-500 |
| Tháp dân số | Cột ngang chồng `stackOffset="sign"` — Nam âm (trái), Nữ dương (phải); nhãn trục lấy |x| | 512-602 |
| Toggle | "Theo số lượng (Đơn hàng)" → đơn vị **%** / "Theo Value (Doanh thu)" → **Tỷ** | 396-409, 81-83 |
| Dữ liệu | `populationData` (quantity: Nam 37% / Nữ 63%) | `data.ts:145-158` |
| Modal | Nhóm tuổi, Nữ, Nam (Nam hiển thị số âm, vd "-15") | 380-390 |

Ghi chú: tooltip `valueFormatter` dùng `toFixed(1)` không đổi dấu thập phân ("8.2 Tỷ") (Low).
- **AC-DEM-01 [HT]** Given "Theo số lượng", Then donut Nam 37 % / Nữ 63 %, tháp có Nam bên trái, Nữ bên phải.
- **AC-DEM-02 [HT]** When "Theo Value (Doanh thu)", Then cả 3 biểu đồ đổi sang đơn vị Tỷ (trục "NT").

### 4.4. Phân khúc Hóa đơn (Basket Size)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Donut (cx 40%), legend dọc bên phải | 636-666 |
| Nhóm | < 5 Tr (45%), 5 - 10 Tr (30%), 10 - 20 Tr (15%), 20 - 30 Tr (7%), > 30 Tr (3%) | `data.ts:160-166` |
| Modal | Phân khúc (VND), Tỷ trọng (%) | 621-627 |

Lệch: FRS "Dưới 1 Triệu, 1-3 Triệu, Trên 3 Triệu" (`FRS.md:80`); VIS doc "Column chart 0-5tr, >5tr, >10tr, >20tr, >30tr"; `chart_basket.txt` = phiên bản cột, `chart_basket_updated.txt` = donut (ý đồ chuyển sang donut). Bộ lọc đa chiều dùng nhóm thứ 3 (<5, 5-10, >10). Mock AOV toàn hệ thống ~0,7–0,8 Tr ⇒ 45% đơn "< 5 Tr" là không khớp quy mô (Medium — cần chốt dải giá trị).
- **AC-BS-01 [HT]** Then donut 5 lát với nhãn legend "< 5 Tr" … "> 30 Tr", hover hiện "x%".
- **AC-BS-02 [FRS]** Then các nhóm là "< 1 Tr", "1–3 Tr", "> 3 Tr". *(Chờ PM chốt.)*

### 4.5. Hình thức Thanh toán
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Thanh 100% chồng ngang dựng bằng `div` (không phải Recharts), bo tròn | 694-711 |
| Nhóm | Chuyển khoản (CK) 65%, Tiền mặt 20%, Quẹt thẻ (POS) 10%, App / Trả góp 5% | `data.ts:189-194` |
| Nhãn | % chỉ hiện khi > 10% (→ Thẻ 10% và App 5% không có nhãn) | 707 |
| Tooltip | `title` HTML "Tên: x%" | 705 |
| Modal | Hình thức, Tỷ trọng (%) | 681-687 |

Lệch: FRS "COD, Chuyển khoản, Thẻ, Ví điện tử" (`FRS.md:84`) — code không có COD/Ví điện tử, có Tiền mặt/App-Trả góp (Medium).
- **AC-PM-01 [HT]** Then 4 khúc theo thứ tự CK → Tiền mặt → POS → App, chỉ khúc > 10% có nhãn %.

### 4.6. Hiệu quả Chiến dịch (Marketing & Promotions)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Bảng 3 cột: Tên chương trình, Doanh thu mang lại ("x Tỷ VNĐ"), Số lượng Đơn hàng ("N đơn") | 731-770 |
| Dữ liệu | Back to School 2026 15,2 Tỷ/4.200; Khai trương CN mới 8,5/2.100; Summer Sale 5,4/1.500; Combo Đa tròng 4,1/850 | `data.ts:196-201` |
| Tương tác | Không (không sort, không modal) | — |
| Định dạng | `orders.toLocaleString()` **không truyền locale** → phụ thuộc trình duyệt ("4,200" hoặc "4.200") | 763 |

Lưu ý số liệu: tổng DT chiến dịch 33,2 Tỷ > GMV toàn hệ thống 4,2 Tỷ cùng kỳ (mock không nhất quán quy mô).
- **AC-MK-01 [HT]** Then bảng 4 dòng theo thứ tự dữ liệu (không sắp xếp).

### 4.7. Benchmarking Hiệu suất (Regional Comparison)
**Nguồn:** `src/components/RegionalComparison.tsx`
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Radar 6 trục (Doanh thu, Tỷ lệ chuyển đổi, GTTB Đơn hàng, Lưu lượng KH, Khách quay lại, Độ hài lòng) + danh sách "Điểm chuẩn (Index: 100 = …)" | 171-235 |
| Toggle | "Khu vực" / "Chi nhánh"; đổi toggle reset lựa chọn (KV: base "Hồ Chí Minh" vs "Trung bình Toàn quốc"; CN: base "HMK HN Chi nhánh 1" vs "Trung bình Khu vực") | 72-80, 122-139 |
| Dropdown "Phân tích" | KV: Hồ Chí Minh, Miền Bắc, Miền Trung, Đông Nam Bộ; CN: 5 CN engine | 14-15, 141-152 |
| Dropdown "So với" | "Trung bình Toàn quốc", ("Trung bình Khu vực" nếu CN), các thực thể cùng loại (thực thể đang phân tích bị `disabled`) | 154-167 |
| Dữ liệu | điểm 60–100 (độ hài lòng 80–100) sinh **`Math.random()` khi nạp module** → đổi mỗi lần F5; TB toàn quốc/khu vực cố định | 26-59 |
| **Chuẩn hóa chỉ số (Index)** | `Index_A = round(A/B·100)`; B ≡ 100; nếu B = 0 → 200 (A>0) hoặc 100 | 90-102 |
| Thang radar | `[0, max(120, ceil(maxIndex/20)·20)]` | 105-106 |
| Danh sách điểm chuẩn | mỗi trục: "A_Real vs B_Real" và badge `|Index−100|%` xanh (≥0, icon lên) / đỏ (<0, icon xoay) | 210-233 |
| Tooltip radar | "{index} (Thực tế: {raw})" | 197-200 |

Ghi chú: "Trung bình Khu vực" là hằng số, không phải TB khu vực của chi nhánh được chọn. Giá trị "thực tế" là điểm không đơn vị (Doanh thu = "73"?) (Medium). Hằng `metrics` (17-24) không dùng (Low). Lịch sử: commit `98f5fc4` chuyển sang thang chỉ số 100.
Lệch FRS: FRS "So sánh … (Doanh thu, Đơn hàng) giữa các vùng miền" — code không có "Đơn hàng", thêm 4 trục khác; danh mục khu vực khác bộ lọc toàn cục.
- **AC-BM-01 [HT]** Given base A, compare B, Then với mỗi trục Index = round(A/B × 100), đường B là đa giác chuẩn 100 nét đứt.
- **AC-BM-02 [HT]** When chọn "Chi nhánh", Then base = "HMK HN Chi nhánh 1", so với = "Trung bình Khu vực", và không chọn được chính base ở "So với".
- **AC-BM-03 [HT]** Given Index = 112 ở trục "Doanh thu", Then badge xanh "12%"; Index = 95 → badge đỏ "5%".

### 4.8. Phát hiện Bất thường (Anomaly Detection)
**Nguồn:** `src/components/AnomalyDetectionChart.tsx`
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Composed: Area dải "Khoảng tin cậy (Confidence Interval)", Line MA nét đứt, Line "Doanh thu thực tế", Scatter đỏ "Bất thường" | 163-214 |
| Chuỗi | 30 điểm "1/7…30/7" (cố định, không theo khoảng ngày); random walk `+sin(i/3)·5 + U(−5,5)`; **chèn bất thường** +45 tại i=10, −40 tại i=22 | 19-31 |
| **Thuật toán** | MA trượt **5 điểm, cửa sổ lùi bao gồm điểm hiện tại**; σ = độ lệch chuẩn tổng thể trong cửa sổ; `UB = MA + 2σ + 10`; `LB = max(0, MA − 2σ − 10)`; bất thường nếu `value > UB` hoặc `< LB` | 33-52 |
| Banner | Nếu ≥1 điểm: "Phát hiện {n} điểm bất thường trong chu kỳ 30 ngày qua tại {entity}." | 154-159 |
| Bộ lọc | "Theo Khu vực" (Hồ Chí Minh, Miền Bắc, Miền Trung, Đông Nam Bộ) / "Theo Chi nhánh" (chỉ 3 CN: HN CN1, ĐN CN2, BD CN3); đổi thực thể → **sinh lại ngẫu nhiên** (không có dữ liệu riêng theo thực thể) | 104-151, 108 |
| Tooltip | Doanh thu, Trung bình (MA), Ngưỡng cảnh báo LB–UB, "Phát hiện bất thường!" | 66-101 |

Ghi chú: vì điểm hiện tại nằm trong cửa sổ MA/σ, độ nhạy giảm; số điểm bất thường có thể thay đổi giữa các lần render (Math.random). Lệch FRS: ví dụ FRS là "Tỷ lệ hoàn/hủy tăng đột biến" — code chỉ theo dõi Doanh thu (Medium).
- **AC-AN-01 [HT]** Given chuỗi 30 ngày, Then điểm được đánh dấu đỏ khi nằm ngoài [MA5 − 2σ − 10, MA5 + 2σ + 10].
- **AC-AN-02 [HT]** Given có ≥1 điểm bất thường, Then banner đỏ hiển thị số điểm và tên thực thể đang chọn.
- **AC-AN-03 [FRS/đề xuất]** Then có thể chọn chỉ số theo dõi (Doanh thu, Tỷ lệ hoàn/hủy) và chuỗi theo khoảng ngày toàn cục.

### 4.9. Tỷ lệ Chuyển đổi & Tỷ lệ Hoàn tiền
**Nguồn:** `src/components/ConversionAndRefundAnalysis.tsx`
| Widget | Chi tiết [HT] | Nguồn |
|---|---|---|
| Tỷ lệ Chuyển đổi (Conversion Rate) | Cột ngang; dropdown "Top Cửa hàng" (5 CN thật: Bình Dương 45,2; Shopee 12,5; Q10 38,4; ĐN Lê Duẩn 2 42,1; TikTok 8,5) / "Theo Khu vực" (Bắc 32,5; Trung 28,4; Nam 41,2) / "Toàn Hệ thống" (35,8); cột đầu tiên màu đậm `#10b981`, còn lại `#34d399` — **không sắp xếp** dù tên "Top" | 16-100; `data.ts:587-601` |
| Tỷ lệ Hoàn tiền (Refund Rate) | 2 cột: "Tỷ lệ hoàn tiền (Doanh thu)" 1,2% (đỏ), "(Hóa đơn)" 1,5% (cam) | 103-155; `data.ts:603-606` |

Lệch FRS (Medium-High): FRS yêu cầu "hành trình chuyển đổi (Phễu) và nguyên nhân chi tiết dẫn đến hoàn trả/hủy" (`FRS.md:96-97`) — không có phễu, không có nguyên nhân. Định nghĩa "Tỷ lệ chuyển đổi" không được nêu; thang 8,5–45% ở đây mâu thuẫn thang 20–94% (Số đơn/Traffic) ở heatmap và mục tiêu 60–70% ở module KPI. Tỷ lệ hoàn 1,2% mâu thuẫn Hoàn/Hủy = 5% GMV ở Waterfall/thẻ (High — nhất quán định nghĩa).
- **AC-CR-01 [HT]** Given "Top Cửa hàng", Then 5 thanh theo thứ tự dữ liệu, thanh đầu đậm màu; hover "x%".
- **AC-CR-02 [FRS]** Then hiển thị phễu (Khách vào → Đo mắt → Báo giá → Đặt/Mua) và biểu đồ nguyên nhân hoàn/hủy. *(Chưa có.)*

---

## 5. TRANG "SẢN PHẨM & TỒN KHO" (Product View) — BOD, MANAGER

**File:** `src/views/ProductView.tsx`. Thứ tự: Phân tích Tăng trưởng Sản phẩm → Phân tích Đa chiều → [Cấu trúc Danh mục (Treemap) | Ma trận Phôi Tròng] → [Thương hiệu Phân phối (1/3) | Top Sản phẩm & Vật tư tiêu hao (2/3)] (108-539). Chỉ widget đầu dùng khoảng ngày/chu kỳ; không widget nào dùng khu vực/chi nhánh.

### 5.1. Phân tích Tăng trưởng Sản phẩm
**Nguồn:** `src/components/ProductGrowthAnalysisChart.tsx`
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Line đa tuyến + ReferenceLine y=0 nét đứt; trục Y "%"; tooltip ±x,x% (xanh/đỏ) | 177-198, 98-116 |
| Tab chiều | Ngành hàng (Gọng kính, Tròng kính, Kính áp tròng (Lens), Phụ kiện) / Nhóm SP (6 nhóm) / Thương hiệu (HMK Eyewear, Essilor, Chemi, Zeiss, Hoya) / Nhà CC (A–D); đổi tab reset thực thể = "all" | 22-25, 139-161 |
| Dropdown thực thể | "Top 5 (Tất cả)" = **5 phần tử đầu danh sách** (không xếp hạng) hoặc 1 thực thể | 81-89, 163-172 |
| Trục X | theo Chu kỳ & khoảng ngày toàn cục (`generateChartDataByPeriod`) | 59-79 |
| Giá trị | Ngành hàng: `(GMV_kỳ/1000)·U(−2,2)`; Nhóm SP: `(GMV_kỳ/1000)·U(−2,5;2,5)` — **`Math.random()`**, không phải % tăng trưởng; Thương hiệu/NCC: chỉ sinh 3 khóa `Essilor = lenses/1000·2`, `Chemi = lenses/1000·1,5`, `HMK = frames/1000·3` | 65-75 |
| InfoTooltip | công thức "Tăng trưởng (%) = ((Kỳ hiện tại − Kỳ trước)/Kỳ trước)·100" (không được áp dụng) | 122-133 |

**Bug (High):** tab **Nhà CC** → khóa dữ liệu (Essilor/Chemi/HMK) không trùng tên NCC A–D → **biểu đồ trống**. Tab **Thương hiệu** → chỉ "Essilor", "Chemi" có dữ liệu; "HMK Eyewear" (khóa thực là "HMK"), "Zeiss", "Hoya" trống; giá trị luôn dương, không phải %. State `metric` ("revenue"/"orders") và `comparison` ("wow"/"mom"/"yoy") khai báo nhưng **không có UI và không dùng** (54-55); hàm `generateData` (28-48) chết.
**Lệch FRS (High):** thiếu bộ lọc WoW/MoM/YoY, thiếu phân loại vòng đời (Mới/Tăng trưởng/Bão hòa/Suy thoái), giá trị không phải tăng trưởng thực.
- **AC-PG-01 [HT]** Given tab "Ngành hàng" và "Top 5 (Tất cả)", Then hiển thị 4 đường (4 ngành hàng) với đường tham chiếu 0%.
- **AC-PG-02 [HT]** When chọn tab "Nhà CC", Then legend có 4 NCC nhưng không có đường dữ liệu nào (bug).
- **AC-PG-03 [FRS]** Given chọn so sánh "MoM", Then mỗi điểm = (DT tháng t − DT tháng t−1)/DT tháng t−1 × 100 cho từng thực thể. *(Chưa có.)*

### 5.2. Phân tích Đa chiều (Multi-dimensional Analysis)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Cột dọc; sắp xếp **giảm dần theo chỉ số đang chọn** | 97-101, 192-245 |
| Dropdown chỉ số | "Doanh thu (Tỷ VNĐ)" (`value`, màu `#6366f1`) / "Số lượng (Đơn hàng/Sản phẩm)" (`quantity`, `#10b981`) | 53-56, 136-150 |
| Dropdown chiều | Từng ngành hàng; Nhóm ngành hàng Tròng; Nhóm ngành hàng Gọng; Thương hiệu Tròng; Thương hiệu Gọng; Nhà cung cấp; Chiết suất (Tròng); Màu sắc | 42-51, 151-166 |
| Trục | X xoay −45° nếu > 5 nhãn; Y "NT" (Tỷ) hoặc "x.xk" | 203-224 |
| Tooltip | "x Tỷ VNĐ" / "x SP" | 225-235 |
| Modal | {chiều} + {chỉ số} | 169-188 |
| Dữ liệu | tĩnh `multidimensionalAnalysisData` | `data.ts:261-312` |

Lệch FRS (Medium): FRS chiều = "Loại sản phẩm, Mức giá (Phân khúc giá), Đối tượng khách hàng" (`FRS.md:118`) — code không có Phân khúc giá và Đối tượng KH, thay bằng NCC/chiết suất/màu.
- **AC-MD-01 [HT]** When chọn chiều "Chiết suất (Tròng)" và chỉ số "Số lượng", Then 4 cột 1.56 (4.2k), 1.61 (1.8k), 1.67 (900), 1.74 (300) theo thứ tự giảm dần.

### 5.3. Cấu trúc Danh mục (Product Matrix — Treemap)
**Nguồn:** `ProductView.tsx:250-295`, `src/components/DrilldownTreemap.tsx`
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Dropdown | "Cấu trúc phân cấp (Mặc định)" + 8 chiều của mục 5.2 (dùng `value` làm diện tích) | 262-275, 77-89 |
| Dữ liệu phân cấp | Gọng kính (Nhựa Acetate → 2 SKU; Kim loại Titanium → 2 SKU), Tròng kính (Essilor, Chemi → SKU), Kính mát (Ray-Ban, Gentle Monster), Áp tròng, Phụ kiện | `data.ts:615-684` |
| Size node cha | tổng size con (đệ quy) | `DrilldownTreemap.tsx:74-83` |
| Drill-down | Click ô có `payload.children` → đi sâu 1 cấp; nút "Trở lại: {cấp trên}" + "Đang xem: {cấp hiện tại}"; đổi dropdown → reset về gốc | 47-52, 85-126 |
| Nhãn ô | Tên, chỉ khi ô > 50×30px | 55-67 |
| Tooltip | "Tỷ trọng / Giá trị": giá trị thô | 139-146 |
| Modal | "Danh mục", "Tỷ trọng (%)" — dữ liệu: chế độ phân cấp dùng `treemapData` phẳng (45/40/10/4/1), **khác** dữ liệu đang vẽ; chế độ chiều dùng `size = doanh thu Tỷ` nhưng tiêu đề cột vẫn "Tỷ trọng (%)" | `ProductView.tsx:279-284` |

**Rủi ro bug (High, cần DA xác minh):** `CustomizedContent` đọc `payload?.children` để bắt click (`DrilldownTreemap.tsx:47-52`), nhưng Recharts 3.9.2 truyền thuộc tính node trực tiếp vào `content` (`nodeProps = {...props, ...node, root}` — `node_modules/recharts/lib/chart/Treemap.js:694-696`), **không có khóa `payload`** → click có thể không làm gì, con trỏ không đổi thành "pointer". Ngoài ra Recharts mặc định vẽ cả node con lồng trong node cha (kiểu "flat"), nên người dùng có thể thấy ô SKU ngay ở cấp gốc.
Lệch: VIS doc mong muốn 4 cấp (Ngành → Nhóm → Thương hiệu/NCC → Thuộc tính màu/suất); dữ liệu có tối đa 3 cấp. FRS nhắc "Cash Cow" — không có nhãn/ngưỡng nào.
- **AC-TM-01 [HT/kỳ vọng]** Given chế độ phân cấp, When click ô "Tròng kính", Then treemap hiển thị "Essilor", "Chemi" và nút "Trở lại: Tất cả". *(DA-Q4 xác minh có hoạt động không.)*
- **AC-TM-02 [HT]** When chọn chiều "Thương hiệu Gọng", Then 4 ô HMK Eyewear (12,5), Ray-Ban (4,2), Gentle Monster (2,8), Bolon (0,8), không drill-down.
- **AC-TM-03 [FRS/đề xuất]** Then modal "Xem chi tiết" phải phản ánh đúng dữ liệu đang vẽ, cột giá trị ghi đúng đơn vị.

### 5.4. Ma trận Phôi Tròng (Sphere vs Cylinder)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Scatter: X = SPH (D, "Độ Cận (−) / Viễn (+)"), Y = CYL (D), Z (kích thước 50–400) = Số lượng | 345-386 |
| Màu | theo loại tròng: Trong suốt `#3b82f6`, Đổi màu `#8b5cf6`, Đa tròng `#f59e0b`, Chống AS Xanh `#ec4899` | `data.ts:212-230` |
| Legend tĩnh | chỉ 3 mục (Trong suốt, Đổi màu, Đa tròng) — **thiếu "Chống AS Xanh"** (Low) | 327-340 |
| Tooltip | `CustomTooltip` "Thuộc tính": Sphere, Cylinder, Số lượng | 377-380 |
| Modal | SPH, CYL, Số lượng bán ra, Phân loại | 309-321 |
- **AC-SC-01 [HT]** Then 12 điểm; điểm lớn nhất tại SPH −2,00 / CYL 0 (1.500).

### 5.5. Thương hiệu Phân phối (Brand Distribution)
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Cột ngang, trục X "N Tỷ" | 426-469 |
| Dữ liệu | HMK Eyewear 25,5; Essilor 8,2; Chemi 6,5; Zeiss 3,5; Hoya 2,3 (trường `share` không dùng) | `data.ts:253-259` |
| Modal | cột "Doanh thu (Tỷ VNĐ)" khai báo `key: "revenue"` nhưng dữ liệu là `value` → **cột hiển thị "undefined"** (Medium) | 404-417 |

Lưu ý: HMK Eyewear 25,5 Tỷ ≠ 12,5 Tỷ (Thương hiệu Gọng, mục 5.2) — mock không nhất quán.
- **AC-BD-01 [HT]** Then 5 thanh theo thứ tự dữ liệu (đã giảm dần).
- **AC-BD-02 [FRS/sửa lỗi]** When mở modal chi tiết, Then cột "Doanh thu (Tỷ VNĐ)" hiển thị 25,5 / 8,2 / 6,5 / 3,5 / 2,3. *(HT: "undefined".)*

### 5.6. Top Sản phẩm & Vật tư tiêu hao
| Hạng mục | Chi tiết [HT] | Nguồn |
|---|---|---|
| Loại | Bảng: #, Sản phẩm, Nhà cung cấp, Thuộc tính (Suất / Màu) — chip "Suất: x" / "Màu: x" ẩn nếu "N/A", Số lượng bán ra (chip) | 488-534 |
| Dữ liệu | 8 SKU tĩnh, đã giảm dần (Nước rửa kính 15.037 … Gọng Titanium T8012 1.108) | `data.ts:314-379` |
| Nút "Xem toàn bộ danh mục" | không có `onClick` | 484-486 |
| Định dạng | `quantity.toLocaleString()` không locale | 528 |

Lệch FRS (Medium): thiếu Tồn kho an toàn (Safety Stock) & Điểm đặt hàng lại (Reorder Point) mà FRS nêu là mục đích (`FRS.md:143`); không có tồn kho hiện tại dù tên trang "Sản phẩm & Tồn kho".
- **AC-TPD-01 [HT]** Then bảng 8 dòng; dòng 1 "NƯỚC RỬA KÍNH" — HMK Eyewear — không có chip — 15.037.
- **AC-TPD-02 [FRS/đề xuất]** Then mỗi SKU có Tồn hiện tại, Safety Stock, Reorder Point và cảnh báo khi Tồn ≤ ROP.

---

## 6. TRANG "HIỆU SUẤT NHÂN SỰ" (Personnel View)

**File:** `src/views/PersonnelView.tsx`. Toàn bộ **hard-code/tĩnh**, không dùng bộ lọc. Nhánh hiển thị theo vai trò (29, 178).

### 6.1. Góc nhìn Nhân viên (STAFF) — dòng 29-175
| Widget | Nội dung [HT] | Nguồn | Lệch FRS |
|---|---|---|---|
| Doanh số cá nhân (Tháng) | "128.5 Tr", "+15% so với mục tiêu" (cố định) | 34-47 | khớp mô tả, không tính toán |
| Xếp hạng nội bộ | "Top 2 / 15 Sales", thanh tiến độ 85% (cố định) | 49-67 | khớp |
| Giá trị đơn TB (AOV) | "1.8 Tr/đơn", "+0.2 Tr so với TB Cửa hàng" | 69-84 | khớp mô tả; định dạng dấu chấm thập phân |
| Đánh giá CSKH (NPS) | "4.9 / 5.0" + 5 sao | 86-99 | **NPS chuẩn là −100…+100**, đây là điểm hài lòng 5 sao (Medium, định nghĩa) |
| Tiến độ KPI Tuần | 3 thanh: Tròng kính cận/đa tròng 80%, Gọng kính cao cấp 65%, Kính mát 110% (thanh kẹp 100%) | 103-160 | khớp |
| Vinh danh | "Nhân viên xuất sắc — Chúc mừng bạn đã đạt chỉ tiêu sớm 5 ngày…" luôn hiển thị (không điều kiện) | 162-171 | FRS: hiển thị khi đạt chỉ tiêu sớm — HT không có điều kiện |

### 6.2. Góc nhìn Quản lý/BOD — dòng 178-371
| Bảng | Cột & quy tắc [HT] | Nguồn |
|---|---|---|
| Bảng Xếp Hạng PIC Sales | #, Nhân sự, Tiến độ Doanh số (thanh = `revenue/2 × 100%` → **mục tiêu ngầm 2 Tỷ**, không hiển thị), Doanh số ("x Tỷ"), AOV (Tr/Đơn); sắp xếp Doanh số giảm dần | 182-240; sort 208-209; bar 225 |
| Hiệu suất KTV Khúc Xạ | #, Nhân sự, Tỷ lệ chuyển đổi (thanh = %), Chính xác (%); sắp xếp chuyển đổi giảm dần | 245-304; sort 270-271 |
| Hiệu suất Phòng Lab | #, Phòng Lab, Hoàn thành đúng hạn (thanh = %), Tỷ lệ hư hao (% chữ đỏ luôn); sắp xếp tốc độ giảm dần | 307-366; sort 332-333 |

Ghi chú: không có ngưỡng màu cho hư hao/chuyển đổi; MANAGER thấy toàn bộ nhân sự (không lọc theo cửa hàng); AOV PIC (2,8–5,1 Tr) không nhất quán AOV hệ thống (0,7 Tr). Không có "thời gian xử lý TB/đơn" mà VIS doc §7 đề xuất cho KTV mài lắp.
- **AC-PS-01 [HT]** Given vai trò STAFF, Then hiển thị 4 thẻ (Doanh số cá nhân, Xếp hạng nội bộ, AOV, NPS), khối "Tiến độ KPI Tuần" 3 thanh và khối "Nhân viên xuất sắc".
- **AC-PS-02 [HT]** Given vai trò BOD/MANAGER, Then bảng PIC Sales xếp: Lê Văn C (1,5 Tỷ) → Nguyễn Văn A (1,2) → Hoàng Văn E (1,1) → Trần Thị B (0,95) → Phạm Thị D (0,8); thanh tiến độ Lê Văn C = 75%.
- **AC-PS-03 [HT]** Then bảng KTV Khúc Xạ xếp BS. My (95%) → BS. Tuấn (92%) → KTV. Linh (88%) → KTV. Hoàng (85%); bảng Lab xếp Lab - Hùng (95%) → Lab - Tuấn (92%) → Lab - Dũng (88%).
- **AC-PS-04 [FRS/đề xuất]** Then Tiến độ Doanh số = Doanh số thực / Chỉ tiêu cá nhân (lấy từ KPI) và hiển thị % bên cạnh thanh; Vinh danh chỉ hiện khi đạt ≥100% chỉ tiêu trước kết thúc chu kỳ.

---

## 7. TRANG "QUẢN LÝ KPI" (KPI Management View) — BOD, MANAGER

**File:** `src/views/KPIManagementView.tsx`, `src/components/KPIConfigurationModal.tsx`. Danh sách KPI là **mảng hằng trong component** (`KPIManagementView.tsx:26-34`), không persist, không liên kết với bất kỳ chart nào.

### 7.1. Thẻ thống kê nhanh (Summary Cards) — 57-85
| Thẻ | Giá trị [HT] | Ghi chú |
|---|---|---|
| Tổng số KPI đang áp dụng | "12" (cố định) | danh sách chỉ có 3 dòng `active` → mâu thuẫn |
| KPI đã hoàn thành (Tháng trước) | "8 / 10" (cố định) | |
| Cấp độ phân bổ sâu nhất | "Cấp Chi nhánh" (cố định) | |

### 7.2. Danh sách KPI (KPI Master List) — 87-216
| Cột | Nội dung [HT] |
|---|---|
| Checkbox (+ chọn tất cả ở header) | `selectedRows` (12-24, 111-139) |
| Phạm vi | chip "Toàn công ty" (icon Target) / "Khu vực" / "Chi nhánh" (icon Map) |
| Đối tượng | Tất cả / Hồ Chí Minh / Miền Bắc / HMK HN Chi nhánh 1 / Miền Trung |
| Chu kỳ | tên kỳ + loại (Năm/Tháng/Chiến dịch) |
| Phiên bản | "V1 (Chính thức)", "V2 (Đã điều chỉnh)", "V3 (Bản nháp)", "V1 (Lưu trữ)", "V1" |
| Mục tiêu Doanh thu | chuỗi "180 Tỷ", "15 Tỷ"… |
| Tỷ lệ CĐ | chuỗi "68%"… |
| Trạng thái | `active` → "Đang áp dụng" (xanh lá); `draft` → "Bản nháp" (vàng); `archived` → "Lưu trữ" (xám); khác (`completed`) → "Đã kết thúc" (indigo) (164-185) |
| Thao tác | Sửa / Xóa / … — **không có handler** (187-198) |

7 dòng mock; dòng HCM Tháng 7/2026 có 3 phiên bản (active V2, draft V3, archived V1) — mô phỏng lịch sử phiên bản.
Không hoạt động: ô tìm kiếm (state `searchTerm` **không lọc** danh sách, 91-100); nút Filter (101-103); phân trang tĩnh "Hiển thị 1 - 5 của 12 KPI" + nút 1/2/3 (206-215) trong khi hiển thị 7 dòng. Thiếu cột FRS: Traffic, AOV.

### 7.3. Chỉnh sửa hàng loạt (Bulk Edit) — 220-351
| Bước | Hành vi [HT] |
|---|---|
| FAB | Hiện khi ≥1 dòng được chọn: "{n} KPI đã chọn", nút "Cập nhật mục tiêu", "Thay đổi thời hạn", "Xóa" (không handler), X "Bỏ chọn" (221-256) |
| Modal "Cập nhật mục tiêu hàng loạt" | 2 input text: "Mục tiêu Doanh thu mới" (Tỷ VNĐ), "Tỷ lệ Chuyển đổi mới" (%) — **chỉ giá trị tuyệt đối**, không có Tăng/Giảm theo % (FRS yêu cầu) (281-309) |
| Modal "Thay đổi thời hạn hàng loạt" | select Chu kỳ mới (Tháng/Quý/Năm/Chiến dịch) + input text "Thời gian" (310-330) |
| "Lưu thay đổi" | đóng modal + bỏ chọn; **không đổi dữ liệu**, không validate (339-347) |

### 7.4. Modal Cấu hình Mục tiêu & KPI (wizard 3 bước)
Mở từ: Header "Cấu hình KPI" (BOD) và "Thêm KPI mới" (BOD/MANAGER).
| Bước | Nội dung [HT] | Nguồn |
|---|---|---|
| 1. Phạm vi áp dụng | Toàn công ty / Khu vực (Hồ Chí Minh, Miền Bắc, Miền Trung, Đông Nam Bộ) / Chi nhánh (chỉ 3: HN CN1, ĐN CN2, BD CN3). Chọn cấp → `entity = "Tất cả"` | 123-181; 135; 58-59 |
| 2. Chu kỳ | Cả năm (→ "2026") / Theo tháng (12 tháng 2026, mặc định "Tháng 7, 2026") / Chiến dịch-Lễ (Black Friday, Tết Nguyên Đán 2026, Lễ 8/3, Lễ 30/4 - 1/5) + cảnh báo "Thiết lập mục tiêu cho chiến dịch sẽ ghi đè lên mục tiêu ngày/tháng…". **Không có Quý** | 183-260 |
| 3. Nhập chỉ tiêu | Doanh thu (Tỷ VNĐ) 15; Tỷ lệ Chuyển đổi (%) 65; GTTB Đơn hàng (VNĐ) 850.000; Lưu lượng KH 25.000; Độ hài lòng (%) 90 — `type=number`, **không validate** (âm/rỗng/>100% đều chấp nhận) | 262-317 |
| Phát hiện xung đột | **Giả lập**: lần bấm Lưu đầu tiên, nếu `entity ≠ "Tất cả"` → hiện cảnh báo (nền **vàng/amber**, FRS nói "cảnh báo đỏ") "Phát hiện trùng lặp KPI — Đã tồn tại bộ KPI đang áp dụng cho {entity} trong khoảng thời gian {kỳ}" + 3 radio: Ghi đè hoàn toàn (mặc định) / Giữ mục tiêu cao nhất / Lưu thành phiên bản mới (Bản nháp); nút đổi thành "Xác nhận & Lưu" | 38-44, 319-374, 396 |
| Lưu | spinner 1s → "Đã lưu KPI" 1,5s → đóng, reset bước 1; **không ghi dữ liệu, chính sách xung đột không có tác dụng** | 45-56 |

**Bug (Medium):** chọn cấp "Khu vực"/"Chi nhánh" đặt `entity = "Tất cả"`; dropdown hiển thị phần tử đầu nhưng state vẫn "Tất cả" nếu người dùng không chọn lại → lưu không phát hiện xung đột và lưu KPI khu vực với đối tượng "Tất cả" (`KPIConfigurationModal.tsx:135,150`). Cấp "Toàn công ty" không bao giờ báo xung đột dù danh sách có KPI công ty 2026 đang áp dụng. Đóng bằng X giữ nguyên bước/dữ liệu đã nhập.

### 7.5. Acceptance Criteria — Quản lý KPI
- **AC-KPI-01 [HT]** Given tab Quản lý KPI, Then 3 thẻ thống kê (12; 8 / 10; Cấp Chi nhánh) và bảng 7 dòng với nhãn trạng thái màu tương ứng.
- **AC-KPI-02 [HT]** When tick 2 dòng, Then FAB trượt lên với "2 KPI đã chọn"; tick checkbox header → chọn toàn bộ 7 dòng.
- **AC-KPI-03 [HT]** When gõ "Miền Bắc" vào ô tìm kiếm, Then danh sách **không thay đổi**. **[FRS]** Then chỉ còn các KPI có Đối tượng/Khu vực chứa "Miền Bắc"; có lọc theo Trạng thái/Chu kỳ.
- **AC-KPI-04 [FRS]** Given chọn n KPI → "Cập nhật mục tiêu", When chọn "Tăng 10%", Then Mục tiêu Doanh thu của n KPI tăng 10% và lưu. *(HT: chỉ nhập tuyệt đối, không lưu.)*
- **AC-KPI-05 [HT]** Given modal cấu hình, cấp "Chi nhánh", chọn "HMK ĐN Chi nhánh 2", kỳ "Tháng 7, 2026", When bấm "Lưu cấu hình KPI", Then hiện khối "Phát hiện trùng lặp KPI" với 3 lựa chọn và nút "Xác nhận & Lưu"; bấm lần 2 → "Đã lưu KPI" rồi đóng.
- **AC-KPI-06 [FRS]** Given đã tồn tại KPI "Đang áp dụng" cùng Đối tượng & Chu kỳ, When chọn "Giữ mục tiêu cao nhất" và lưu, Then bản ghi kết quả có từng chỉ số = max(cũ, mới); bản cũ chuyển "Lưu trữ"; Given chọn "Ghi đè", Then bản cũ → "Lưu trữ", bản mới → "Đang áp dụng"; Given "Bản nháp", Then bản mới → "Bản nháp", bản cũ giữ nguyên. *(HT không thực thi.)*
- **AC-KPI-07 [FRS/đề xuất]** Given Tỷ lệ chuyển đổi > 100 hoặc Doanh thu ≤ 0, When lưu, Then báo lỗi và chặn.
- **AC-KPI-08 [FRS/đề xuất]** When KPI được lưu "Đang áp dụng", Then các chỉ tiêu (Target) trên biểu đồ Xu hướng Lũy kế, Heatmap % Target, Bảng xếp hạng, Leaderboard nhân sự dùng giá trị này.

---

## 8. TỪ ĐIỂN CHỈ SỐ HỢP NHẤT & XUNG ĐỘT ĐỊNH NGHĨA (cross-view)

| Tên chỉ số | Định nghĩa FRS | Các cách tính trong code (file:dòng) | Kết luận |
|---|---|---|---|
| **GMV** | Σ giá trị Đơn đặt + Σ Đơn mua thẳng phát sinh trong kỳ, không cộng lại khi đơn đặt chuyển thành đơn hàng (`FRS.md:222-225`) | Engine `gmv` (`chartEngine.ts:34-44`) dùng thống nhất ở mọi widget Executive. Heatmap dùng "Doanh thu" riêng (không GMV). | Nhất quán trong engine; mock không mô hình hóa đơn đặt → đơn hàng |
| **Doanh thu (Gross, cash-basis)** | Σ tiền thực thu (cọc + thanh toán) trước hoàn/hủy (`FRS.md:249-252`) | `gmv × 1.05` (`FinancialOverviewCards.tsx:192`) | Placeholder sai (> GMV) — **High** |
| **Giá trị điều chỉnh** | Upsell/Downsell (Đặt→Hàng) + Hoàn/Hủy cọc (`FRS.md:254-257`) | `−refunds` (5% GMV), trend hard-code 15,4 (`FinancialOverviewCards.tsx:193`); `upsale` (10% GMV) tính nhưng không dùng (`chartEngine.ts:84`) | Thiếu Upsell — **High** |
| **Doanh thu thuần / Thực thu / Net Revenue** | FRS 4.3: GMV + Điều chỉnh; FRS 4.4.5: GMV − Hoàn/Hủy (FRS **tự mâu thuẫn**: `FRS.md:232` vs `:261`) | (1) `netRev` engine 85–90% GMV — thẻ DTT, GMV vs DTT, Xu hướng lũy kế, Growth (`chartEngine.ts:45`); (2) `GMV − refunds` = 95% — Waterfall (`RevenueWaterfallChart.tsx:45`); (3) `GMV × (1 − dropRate băm)` — Bảng xếp hạng cột "Doanh thu" (`TopPerformanceTable.tsx:43`) | 3 giá trị khác nhau cùng kỳ (3.695 / 4.005 / 3.876 Tr) — **High** |
| **Hoàn/Hủy, Tỷ lệ hoàn** | Dòng tiền rút ra do trả hàng/hủy cọc | engine 5% GMV (`chartEngine.ts:83`); "Tỷ lệ trả hàng" băm 5–18,5% (`TopPerformanceTable.tsx:11-14`); "Tỷ lệ hoàn tiền" 1,2% DT / 1,5% HĐ (`data.ts:603-606`) | 3 định nghĩa — **High** |
| **Biên lợi nhuận gộp** | (DTT − Giá vốn)/DTT × 100, 1 chữ số | TB đơn giản biên ngày 70–75%, không có giá vốn (`chartEngine.ts:88,133-135`); trend = % thay đổi tương đối | **Medium** (phương pháp gộp + kiểu trend) |
| **Volume (Đơn hàng)** | Σ đơn Đặt + đơn mua thẳng, không hủy | engine `orders` (`chartEngine.ts:46`) | Nhất quán; tooltip "đã tạo và xử lý thành công" vs sub-info "Đã hoàn thành" vs mock `executiveMetrics` "Completed" (Low) |
| **AOV** | DTT / Volume, "Triệu/Đơn" | Thẻ: `netRev/orders` Tr (`FinancialOverviewCards.tsx:184`); Hiệu quả đơn hàng & Growth: `GMV·10⁶/orders` ₫ (`OrderEfficiencyMetricsChart.tsx:63`, `GrowthAnalysisChart.tsx:198`); KPI modal "GTTB Đơn hàng (VNĐ)"; Personnel tĩnh | 2 công thức, 2 đơn vị (0,7 Tr vs 813.773 ₫) — **High** |
| **UPT** | (không có trong FRS) | `units/orders` (`OrderEfficiencyMetricsChart.tsx:64`) | Chưa tài liệu hóa — Low |
| **Khách hàng mới** | Đếm KH `isFirstTimeBuyer`; mock = 30% đơn (`FRS.md:244-247`) | `round(orders × 0.3)` (`FinancialOverviewCards.tsx:191`) | Khớp ghi chú mock FRS; sub-info "4-5 khách/ngày" sai — Medium |
| **Nợ treo** | Tổng dư nợ dương trên sổ cái phát sinh trong kỳ; sub-info % GMV; tăng = đỏ | Σ debt ngày (luồng, 1,2–1,8% GMV) (`chartEngine.ts:87`); thẻ: integer Tr; Xu hướng: lũy kế + trần 1,5%·42 Tr·ngày | Cộng dồn luồng thay vì số dư — Medium |
| **Tỷ lệ chuyển đổi** | KPI "Tỷ lệ chốt"; FRS KTV: khách đo mắt → mua | Heatmap: Số đơn/Traffic 20–94% (`BranchRevenueComparison.tsx:100`); Conversion chart: số tĩnh 8,5–45% (`data.ts:587-601`); Benchmark: điểm 60–100; KTV: 85–95% | 4 thang khác nhau — **High** (định nghĩa) |
| **Tăng trưởng %** | (Kỳ gốc − Kỳ so sánh)/Kỳ so sánh × 100; kỳ so sánh liền kề cùng độ dài (`FRS.md:285-293`) | Thẻ: đúng logic (kỳ thực) (`FinancialOverviewCards.tsx:146-155`); Growth chart: kỳ trước giả lập (`GrowthAnalysisChart.tsx:201-213`); Product Growth: random | **High** |
| **% đạt Target** | Mục tiêu từ KPI | Xu hướng: 42/35 Tr·ngày hard-code; Heatmap: chỉ tiêu tự sinh; Leaderboard: 2 Tỷ ngầm | Không liên kết KPI — **High** |
| **VAT** | GMV/1.08 (FRS 4.4.1) | `/1.08` cho GMV & AOV (`FinancialOverviewCards.tsx:180,185`) | Khớp; toggle VAT (VIS doc) đã mất |

### Quy ước định dạng số trong code (không nhất quán — Low/Medium)
| Mẫu | Ví dụ | Nơi |
|---|---|---|
| `toFixed(n).replace('.', ',')` (dấu phẩy thập phân, không phân cách nghìn) | "4,22" Tỷ | thẻ tài chính, tooltip GMV/DTT, Breakdown, RevenueTrend |
| `Math.round(x).toLocaleString('vi-VN')` (dấu chấm nghìn) | "4.216 Tr" | tooltip/bảng Executive |
| `toFixed(1)` giữ dấu chấm | "45.2%", "8.2 Tỷ", "x.xB" | Heatmap, Nhân khẩu học, Benchmark, Multi-dim "x.xk" |
| `toLocaleString()` không locale | "4,200 đơn" (en) | Marketing, Top SP |
| Đơn vị tiền | "Tr", "Triệu", "Tr VNĐ", "Tỷ", "Tỷ VNĐ", "T" (=Tỷ), "M"/"B", "₫", "đ", "k" | khắp nơi |

---

## 9. TÍNH XÁC ĐỊNH CỦA DỮ LIỆU (quan trọng cho DA so khớp)
| Widget | Nguồn số | Ổn định qua F5? | Đổi khi tương tác? |
|---|---|---|---|
| 7 widget Executive dùng engine + Product Growth (trục) | engine seed | ✔ (theo múi giờ) | theo bộ lọc |
| Product Growth (giá trị Ngành hàng/Nhóm SP) | `Math.random()` trong `useMemo` | ✘ | ✘ đổi mỗi lần đổi tab chiều/khoảng ngày |
| Heatmap chi nhánh | công thức xác định | ✔ (Traffic nhập tay mất khi F5) | — |
| Time Peak | `Math.random()` khi mount | ✘ (đổi cả khi chuyển tab và quay lại) | — |
| Benchmark (Regional) | `Math.random()` khi nạp module | ✘ (ổn định trong phiên) | — |
| Anomaly | `Math.random()` | ✘ | đổi khi đổi thực thể/cấp |
| Sparkline thẻ tài chính | engine | ✔ | — |
| Còn lại (data.ts tĩnh) | hằng | ✔ | — |

---

## 10. DANH SÁCH GAP & SAI LỆCH (Gap Register)

| ID | Mô tả | Loại | Mức độ | Nguồn |
|---|---|---|---|---|
| G-01 | Thẻ tài chính bỏ qua Khu vực/Chi nhánh toàn cục (đọc biến nhưng không truyền vào engine; deps chỉ `dateRange`) | Bug / FRS 3.1 | **High** | `FinancialOverviewCards.tsx:139,144,149,204` |
| G-02 | "Doanh thu thuần/Thực thu" tính 3 cách khác nhau (thẻ/biểu đồ vs Waterfall vs Bảng xếp hạng) | Công thức không nhất quán | **High** | `chartEngine.ts:45`; `RevenueWaterfallChart.tsx:45`; `TopPerformanceTable.tsx:43` |
| G-03 | FRS tự mâu thuẫn: DTT = GMV + Điều chỉnh (4.3) vs GMV − Hoàn/Hủy (4.4.5) | Tài liệu | **High** | `FRS.md:232,261` |
| G-04 | "DOANH THU" = GMV × 1,05 (> GMV) | Công thức placeholder | **High** | `FinancialOverviewCards.tsx:192` |
| G-05 | "GIÁ TRỊ ĐIỀU CHỈNH" thiếu Upsell/Downsell; trend hard-code "15,4%" đỏ | Công thức/hard-code | **High** | `FinancialOverviewCards.tsx:193` |
| G-06 | AOV 2 định nghĩa (DTT/đơn Tr vs GMV/đơn ₫) | Không nhất quán | **High** | `FinancialOverviewCards.tsx:184`; `OrderEfficiencyMetricsChart.tsx:63`; `GrowthAnalysisChart.tsx:198` |
| G-07 | Growth Analysis không phải scatter góc phần tư (Tăng trưởng × Biên LN); "kỳ trước" là số giả lập | Thiếu tính năng FRS + dữ liệu giả | **High** | `GrowthAnalysisChart.tsx:201-213`; `FRS.md:58-60` |
| G-08 | Top Performance thiếu Top 5 Sản phẩm và % hoàn thành chỉ tiêu; "Tỷ lệ trả hàng" là số băm theo tên | Thiếu FRS + dữ liệu giả | **High** | `TopPerformanceTable.tsx:11-14`; `FRS.md:50-52` |
| G-09 | Target (42/35 Tr/ngày, trần nợ 1,5%) hard-code, không lấy từ module KPI; lũy kế từ "Từ ngày" chứ không YTD | Thiếu tích hợp / FRS | **High** | `RevenueTrendChart.tsx:81-84`; `FRS.md:42-48` |
| G-10 | Product Growth: tab "Nhà CC" không có đường nào; tab "Thương hiệu" 3/5 đường trống; giá trị random không phải %; không có WoW/MoM/YoY | Bug + thiếu FRS | **High** | `ProductGrowthAnalysisChart.tsx:54-55,65-75,81-89`; `FRS.md:104-110` |
| G-11 | Treemap drill-down có thể không click được (đọc `payload.children` không tồn tại trong Recharts 3.9.2) | Bug tiềm ẩn (cần xác minh UI) | **High** | `DrilldownTreemap.tsx:47-52` |
| G-12 | Bộ lọc đa chiều (6 select + "Áp dụng bộ lọc") không gắn state/handler | Filter hiển thị nhưng không wired | **High** | `FilterBar.tsx:103-177` |
| G-13 | Toàn bộ trang Vận hành, Sản phẩm (trừ 1 chart), Nhân sự, KPI và Heatmap không phản ứng với bộ lọc ngày/chu kỳ/khu vực | Filter không wired | **High** | các view tương ứng |
| G-14 | Phân quyền chỉ client-side; MANAGER/STAFF không giới hạn dữ liệu theo cửa hàng/cá nhân | Bảo mật / FRS 2 | **High** | `Header.tsx:43-51`; `FilterBar.tsx:63-74` |
| G-15 | Conversion & Refund: thiếu Phễu và Nguyên nhân hoàn/hủy | Thiếu FRS | **High** | `ConversionAndRefundAnalysis.tsx`; `FRS.md:96-97` |
| G-16 | Tỷ lệ chuyển đổi có 4 thang/định nghĩa; Tỷ lệ hoàn 3 định nghĩa | Không nhất quán | **High** | xem mục 8 |
| G-17 | Module KPI không thực thi: tìm kiếm, lọc, sửa, xóa, phân trang, bulk save, conflict policy đều no-op; summary hard-code | Chức năng mock | **High** (nếu nằm trong phạm vi release) | `KPIManagementView.tsx:57-85,91-103,187-215,243-245,339-347`; `KPIConfigurationModal.tsx:38-56` |
| G-18 | Footer ngày thẻ tài chính hard-code "01/09 — 30/09/2026", không hiển thị kỳ so sánh (FRS 4.5.4) | Hard-code | Medium | `FinancialOverviewCards.tsx:131` |
| G-19 | Mũi tên xu hướng NỢ TREO bị đảo (nợ tăng → ↓ đỏ) | Bug UI | Medium | `FinancialOverviewCards.tsx:106-107,301` |
| G-20 | Sub-info "Bình quân 4-5 khách/ngày" hard-code, sai với số tính (~12,7) | Hard-code | Medium | `FinancialOverviewCards.tsx:232` |
| G-21 | Biên LN gộp = TB đơn giản theo ngày; trend = % tương đối thay vì điểm % | Công thức | Medium | `chartEngine.ts:133-135`; `FinancialOverviewCards.tsx:196` |
| G-22 | Nợ treo cộng dồn luồng ngày thay vì số dư sổ cái | Công thức | Medium | `chartEngine.ts:87,121` |
| G-23 | Combo "Cả 2 (AOV & UPT)" vẽ UPT trên trục AOV | Bug | Medium | `OrderEfficiencyMetricsChart.tsx:882` |
| G-24 | Modal Thương hiệu Phân phối dùng key `revenue` (dữ liệu `value`) → "undefined" | Bug | Medium | `ProductView.tsx:410-415` |
| G-25 | Modal Treemap hiển thị dữ liệu khác chart (treemapData phẳng) và nhãn "Tỷ trọng (%)" sai đơn vị | Bug | Medium | `ProductView.tsx:279-284` |
| G-26 | KPI modal: cấp Khu vực/Chi nhánh mặc định `entity="Tất cả"` → bỏ qua kiểm tra xung đột; cấp Công ty không bao giờ xung đột; không có Quý; không validate | Bug/thiếu | Medium | `KPIConfigurationModal.tsx:39,135,191-210,271-317` |
| G-27 | Bulk edit thiếu Tăng/Giảm theo % | Thiếu FRS | Medium | `KPIManagementView.tsx:281-309`; `FRS.md:211` |
| G-28 | Debt card RevenueTrend luôn "(An toàn)" và "Dưới ngưỡng" màu xanh kể cả khi vượt trần | Logic trạng thái | Medium | `RevenueTrendChart.tsx:553,565-568` |
| G-29 | Paced target phân bổ theo số bucket, không theo số ngày; `days` exclusive (121 thay vì 122) | Công thức | Medium | `RevenueTrendChart.tsx:81,90` |
| G-30 | Heatmap thay cho "Horizontal Bars" FRS; danh mục 80 CN/4 khu vực khác hệ thống; Traffic nhập tay không lưu | Lệch FRS/dữ liệu | Medium | `BranchRevenueComparison.tsx:9-85,415-435`; `FRS.md:54-56` |
| G-31 | GMV vs DTT được FRS gọi "Lũy kế" nhưng code là theo kỳ; tooltip công thức có "Rớt đơn" | Đặt tên | Medium | `GMVNetRevenueChart.tsx:192,197`; `FRS.md:28` |
| G-32 | Basket Size: nhóm giá trị khác FRS (<1/1-3/>3 Tr) và VIS doc; khác nhóm trong bộ lọc đa chiều | Lệch FRS | Medium | `data.ts:160-166`; `FRS.md:80`; `FilterBar.tsx:136-139` |
| G-33 | Payment Methods: không có COD/Ví điện tử như FRS | Lệch FRS | Medium | `data.ts:189-194`; `FRS.md:84` |
| G-34 | Benchmark: không có "Đơn hàng" như FRS; "TB Khu vực" là hằng; giá trị thực là điểm không đơn vị; random mỗi F5 | Lệch FRS/dữ liệu | Medium | `RegionalComparison.tsx:26-59`; `FRS.md:90-91` |
| G-35 | Anomaly chỉ theo dõi Doanh thu (FRS ví dụ Hoàn/hủy); MA cửa sổ gồm điểm hiện tại; ngày cố định tháng 7; thực thể không ảnh hưởng dữ liệu | Lệch FRS/thuật toán | Medium | `AnomalyDetectionChart.tsx:19-64,108` |
| G-36 | Multi-dim thiếu chiều "Mức giá" và "Đối tượng KH" | Thiếu FRS | Medium | `ProductView.tsx:42-51`; `FRS.md:118` |
| G-37 | Top SP thiếu Safety Stock / Reorder Point / Tồn kho | Thiếu FRS | Medium | `ProductView.tsx:474-536`; `FRS.md:143` |
| G-38 | NPS hiển thị thang 5 sao; Vinh danh luôn hiện; Personnel toàn hard-code | Định nghĩa/hard-code | Medium | `PersonnelView.tsx:86-99,162-171` |
| G-39 | Toggle VAT Có/Không (VIS doc) đã bị bỏ, code còn sót | Tính năng mất | Medium | `ExecutiveView.tsx:59,267-287`; `VISUALIZATION_IDEAS.md:8` |
| G-40 | Order Efficiency (AOV-Volume-UPT) không có trong FRS | Code chưa tài liệu hóa | Medium | `OrderEfficiencyMetricsChart.tsx` |
| G-41 | Time Peak/Benchmark/Anomaly dùng `Math.random()` → số đổi giữa các lần xem | Dữ liệu không ổn định | Medium | `OperationalView.tsx:100`; `RegionalComparison.tsx:29-34`; `AnomalyDetectionChart.tsx:25` |
| G-42 | Không validate khoảng ngày (start > end, rỗng) → nguy cơ "NaN" (AOV, % GMV, target) | Bug biên | Medium | `FilterBar.tsx:42,46`; `FinancialOverviewCards.tsx:184,195`; `RevenueTrendChart.tsx:81` |
| G-43 | Order Aging không drill-down vào danh sách đơn (VIS doc) | Thiếu ý tưởng | Low | `OperationalView.tsx:178-254` |
| G-44 | InfoTooltip nhận sai prop (`title/content`) ở 3 chart → tooltip trống | Bug UI | Low | `OrderEfficiencyMetricsChart.tsx:402-409`; `RevenueTrendChart.tsx:359-365`; `GrowthAnalysisChart.tsx:309-312` |
| G-45 | Growth insight "+{maxGrowth}%" ra "+-x%" khi âm | Bug UI | Low | `GrowthAnalysisChart.tsx:488` |
| G-46 | Scatter Phôi Tròng thiếu legend "Chống AS Xanh" | UI | Low | `ProductView.tsx:327-340` |
| G-47 | "Top Cửa hàng" (Conversion) không sắp xếp | UI/nhãn | Low | `ConversionAndRefundAnalysis.tsx:21,41` |
| G-48 | Bucket Tháng nhảy cóc khi "Từ ngày" 29–31; nhãn Tháng/Quý không có năm; seed theo ngày UTC | Engine | Low | `chartEngine.ts:26,175-177,183` |
| G-49 | Định dạng số/đơn vị không thống nhất (mục 8) | UI | Low | nhiều file |
| G-50 | Header & FilterBar cùng `sticky top-0 z-50` có thể chồng nhau; badge chuông "3" & user "Admin" tĩnh; tiêu đề "EBID Workspace" ≠ "Dashboard Kinh Doanh" | UI | Low | `Header.tsx:14,64-80`; `FilterBar.tsx:21`; `index.html:6` |
| G-51 | Nút không handler: "Xem toàn bộ danh mục", Sửa/Xóa/…, Filter (KPI), chip MANAGER/STAFF, chuông | No-op | Low | `ProductView.tsx:484`; `KPIManagementView.tsx:101,189-197`; `FilterBar.tsx:64,70`; `Header.tsx:64` |
| G-52 | Không có tính năng xuất dữ liệu (export) ở bất kỳ đâu | Thiếu (FRS không yêu cầu) | Low | — |
| G-53 | DataDetailModal giữ từ khóa/sort sau khi đóng | UI | Low | `DataDetailModal.tsx:26-28,76` |
| G-54 | Danh mục chi nhánh/khu vực không thống nhất giữa các module (5 / 10 / 80 / 9 tên; 3 vs 4 khu vực) | Dữ liệu chủ | **High** (cho thiết kế dữ liệu thật) | mục 2.3 |

### 10.1. Tính năng trong code nhưng KHÔNG có trong FRS
- Hiệu quả đơn hàng AOV–Volume–UPT với 3 chế độ (`OrderEfficiencyMetricsChart.tsx`).
- Heatmap 4 chỉ số + Nhập Traffic + quy tắc màu 11 sắc độ (`BranchRevenueComparison.tsx`).
- Chế độ Combo trong Xu hướng Lũy kế; 3 thẻ KPI tiến độ; pill trạng thái GMV.
- Benchmark radar chỉ số 100 (`RegionalComparison.tsx`) — FRS chỉ nói "So sánh khu vực".
- Modal "Xem chi tiết dữ liệu" (search + sort 3 trạng thái) trên hầu hết widget.
- Wizard cấu hình KPI 3 bước, chu kỳ Chiến dịch/Lễ, chỉ tiêu GTTB Đơn hàng & Độ hài lòng.

### 10.2. Code chết / không truy cập được
| Hạng mục | Nguồn |
|---|---|
| ExecutiveView: VAT toggle, multi-select 9 CN, `chartData`, `gmvNetRevenueData`, `gmvBreakdownData`, `adjustedMetrics`, `modalConfig` (modal rỗng vẫn render), dữ liệu base T2–CN | `ExecutiveView.tsx:37-287` |
| Component `MetricCard` (không được render ở đâu) | `src/components/MetricCard.tsx` |
| Mock không dùng: `executiveMetrics`, `timeTrendData`, `branchPerformanceData`, `branchRevenueByPeriod`, `growth*Data` (5), `categoryData`, `lensTypeData`, `frameTypeData` | `src/data.ts` |
| Interface `MetricData`, `BranchPerformance` (chỉ dùng bởi code chết) | `src/types.ts:3-52` |
| `ProductGrowthAnalysisChart`: `generateData`, state `metric`, `comparison` | `ProductGrowthAnalysisChart.tsx:28-48,54-55` |
| `RegionalComparison.metrics`; `OperationalView.COLORS`; import chart không dùng ở `PersonnelView` | `RegionalComparison.tsx:17-24`; `OperationalView.tsx:31`; `PersonnelView.tsx:2-13` |
| Script `update_op_view.cjs` tham chiếu `CustomerLifetimeValueAnalysis` (không tồn tại) — dấu vết ý định làm phân tích CLV chưa thực hiện | `update_op_view.cjs` |
| Phụ thuộc `@google/genai`, `GEMINI_API_KEY` (khung AI Studio) — không dùng trong `src/` | `package.json`, `.env.example`, `metadata.json` |

---

## 11. GIÁ TRỊ KỲ VỌNG Ở BỘ LỌC MẶC ĐỊNH (để DA đối chiếu UI)
Tính lại bằng chính `chartEngine.ts` (bundle esbuild, `TZ=Asia/Ho_Chi_Minh`). Nếu trình duyệt DA ở múi giờ khác, sai lệch nhỏ (±1–2%) là bình thường (G-48).
| Widget | Giá trị kỳ vọng |
|---|---|
| Thẻ GMV | 4,22 Tỷ VNĐ ↑21,7%; "Trước VAT: 3,90T | VAT: 0,31T" |
| Thẻ KH mới | 1554 Khách ↑21,2% |
| Thẻ Doanh thu | 4,43 Tỷ VNĐ ↑21,7% |
| Thẻ Điều chỉnh | -211 Tr VNĐ ↓15,4% (đỏ) |
| Thẻ DTT | 3,70 Tỷ VNĐ ↑21,6% |
| Thẻ Nợ treo | 63 Tr VNĐ, "20,9%" đỏ (mũi tên xuống), "Chiếm 1,5% GMV" |
| Thẻ Biên LN | 72,7 % ↑0,1% |
| Thẻ Volume | 5.181 Đơn ↑21,2% |
| Thẻ AOV | 0,7 Triệu/Đơn ↑0,3%; "Trước VAT: 0,66Tr | VAT: 0,05Tr" |
| Waterfall | GMV 4.216 → Hoàn/Hủy −211 → Thực thu 4.005 (95,0%) |
| GMV theo Tháng | T6 856, T7 930, T8 1.307, T9 ~1.123 Tr |
| Hiệu quả đơn hàng (Tuần) | AOV TB 813.773 ₫; Volume TB 288 đơn/kỳ; Tổng 5.181; UPT TB 2,35 |
| Xu hướng lũy kế (Tuần) | GMV 4.216/5.082 → Đạt 83%, "chậm tiến độ -17%"; DTT 3.695/4.235 (87%), 87,6% GMV; Nợ 63,4/76,2 Tr, 1,5% GMV |
| Bảng xếp hạng | xem 3.7 (BD CN3 14,0% tô đỏ; Tổng 4.216 / 3.876 / 8,1%) |
| Local "Miền Bắc" | GMV 1.476 Tr (35,0%) |

---

## 12. CÂU HỎI MỞ CHO PM (cần chốt nghiệp vụ)
1. Định nghĩa chuẩn **Doanh thu thuần**: GMV + Điều chỉnh (gồm Upsell/Downsell) hay GMV − Hoàn/Hủy? (G-03)
2. **Doanh thu (Gross, cash-basis)** lấy từ bảng thu tiền (cọc + thanh toán) — có bao gồm tiền cọc của đơn đặt chưa giao?
3. **AOV** chuẩn: DTT/đơn hay GMV/đơn? Có VAT hay không?
4. **Tỷ lệ chuyển đổi** chuẩn: Số đơn/Traffic (lượt vào cửa hàng) hay Số đơn/Số ca đo mắt? Phân biệt cho cửa hàng vs KTV.
5. **Nợ treo**: số dư cuối kỳ hay phát sinh trong kỳ? Ngưỡng an toàn 1,5% GMV có là quy tắc chính thức?
6. **Growth Analysis**: giữ thiết kế FRS (scatter góc phần tư) hay thiết kế code (time-series)? Nếu scatter — ngưỡng chia góc phần tư (0% tăng trưởng? biên LN trung vị?).
7. **Top Performance**: cần Top 5 SP và % hoàn thành chỉ tiêu? "Tỷ lệ trả hàng" lấy từ Hoàn/Hủy thật?
8. **Branch Performance Map**: chấp nhận heatmap thay cho thanh ngang? Traffic nhập tay có lưu & ai được nhập?
9. Nguồn **Target**: luôn từ module KPI? Khi không có KPI active cho đối tượng → hiển thị gì?
10. Phân khúc **Basket Size** & nhóm **Thanh toán** chuẩn?
11. MANAGER/STAFF có cần **giới hạn dữ liệu** theo cửa hàng/cá nhân thật (RLS)?
12. Có yêu cầu **xuất dữ liệu** (Excel/CSV) từ modal chi tiết không?
13. Bucket **Tuần** theo tuần lịch (Thứ 2–CN, ISO) hay cửa sổ 7 ngày từ "Từ ngày"?

---

## 13. CÂU HỎI CẦN DATA ANALYST XÁC MINH TRÊN UI (Track 2)

| # | Câu hỏi | Kỳ vọng theo code | Liên quan |
|---|---|---|---|
| DA-Q1 | Đổi Khu vực toàn cục = "Miền Bắc": 9 thẻ tài chính có đổi giá trị không? | **Không đổi** (GMV vẫn 4,22) | G-01 |
| DA-Q2 | Đổi Khu vực toàn cục: các Local Filter (GMV vs DTT, Waterfall, Hiệu quả đơn, Breakdown, Xu hướng, Bảng xếp hạng, Tăng trưởng) có tự nhảy theo không? Sau đó đổi Local của 1 chart, chart khác có bị ảnh hưởng không? | Có nhảy theo; local độc lập từng chart | 1.4 |
| DA-Q3 | Mở "Bộ lọc đa chiều", chọn "Tròng kính" + "Áp dụng bộ lọc": có số nào đổi không? | Không | G-12 |
| DA-Q4 | Treemap "Cấu trúc phân cấp": click ô "Tròng kính" có drill-down được không? Con trỏ có thành bàn tay không? Ở cấp gốc có thấy ô SKU con lồng bên trong không? | Có thể **không** drill được | G-11 |
| DA-Q5 | Product Growth: tab "Nhà CC" có đường nào không? Tab "Thương hiệu" có mấy đường? Đổi qua lại tab "Ngành hàng" số có thay đổi không? | Nhà CC: 0 đường; Thương hiệu: 2 (Essilor, Chemi); Ngành hàng: random mỗi lần | G-10 |
| DA-Q6 | Footer các thẻ tài chính hiển thị gì khi đổi khoảng ngày? | Luôn "01/09 — 30/09/2026" | G-18 |
| DA-Q7 | Hiệu quả đơn hàng → Combo → "Cả 2 (AOV & UPT)": đường UPT có nhìn thấy không, trục phải có bị kéo về 0 không? | UPT phẳng sát đáy hoặc trục AOV mất zoom | G-23 |
| DA-Q8 | Thẻ NỢ TREO: mũi tên hướng nào khi % tăng (đỏ)? | Mũi tên **xuống** màu đỏ | G-19 |
| DA-Q9 | So 3 con số "thực thu/doanh thu thuần" cùng bộ lọc: thẻ DTT, cột "Thực thu" Waterfall (tooltip), dòng tổng "Doanh thu" Bảng xếp hạng | 3.695 / 4.005 / 3.876 Tr | G-02 |
| DA-Q10 | Modal chi tiết "Thương hiệu Phân phối": cột "Doanh thu (Tỷ VNĐ)" hiển thị gì? | "undefined" | G-24 |
| DA-Q11 | Modal "Cấu trúc Danh mục" ở chế độ phân cấp: dữ liệu có khớp ô đang vẽ không? | Không (bảng 5 ngành 45/40/10/4/1) | G-25 |
| DA-Q12 | Đặt Từ ngày > Đến ngày, hoặc xóa trống 1 ô ngày: thẻ AOV / "% GMV" / Target xu hướng có hiện "NaN" hay app crash? | Dự kiến "NaN", chart rỗng | G-42 |
| DA-Q13 | Chuyển tab Vận hành → tab khác → quay lại: Time Peak có đổi số không? F5: Benchmark radar có đổi số không? Anomaly: đổi thực thể có đổi số điểm bất thường? | Có đổi (Math.random) | G-41 |
| DA-Q14 | Vai trò MANAGER: số liệu trang Vận hành/Sản phẩm/Nhân sự có khác BOD không? Bấm chip "HMK ĐN LÊ DUẨN 2" có gì xảy ra? | Giống hệt BOD; chip không làm gì | G-14 |
| DA-Q15 | Vai trò MANAGER mở "Thêm KPI mới" → modal có mở được không (dù Header ẩn "Cấu hình KPI")? | Có | 1.3 |
| DA-Q16 | KPI modal: chọn cấp "Khu vực" nhưng KHÔNG đổi dropdown (để mặc định hiển thị "Hồ Chí Minh") rồi Lưu → có hiện cảnh báo trùng lặp không? Chọn lại "Miền Bắc" rồi Lưu → có cảnh báo? | Lần 1: **không** cảnh báo; lần 2: có | G-26 |
| DA-Q17 | Trang KPI: gõ tìm kiếm có lọc bảng không? "Lưu thay đổi" bulk edit có cập nhật giá trị không? Phân trang có chuyển trang không? | Không cả ba | G-17 |
| DA-Q18 | Heatmap: ngưỡng màu ở biên 80% và 60% (% Target), 75% / 50% (Tỷ lệ CĐ) rơi vào màu nào? Nhập Traffic → CR đổi ngay? F5 có mất? | 80→xanh nhạt, 60→vàng nhạt, 75→xanh nhạt, 50→vàng nhạt; CR đổi ngay; F5 mất | 3.8 |
| DA-Q19 | Đổi Chu kỳ toàn cục sang "Theo Quý" với 01/06–30/09: GMV vs DTT có 2 cột "Quý 2" (chỉ tháng 6) và "Quý 3"? Chu kỳ "Theo Ngày": 122 điểm, nhãn có đọc được? | Có; nhãn dày | 2.2 |
| DA-Q20 | Đặt Từ ngày = 31/01/2026, Đến ngày = 31/05/2026, chu kỳ "Theo Tháng": có cột "Tháng 2" không? | Thiếu "Tháng 2" (nhảy cóc) | G-48 |
| DA-Q21 | InfoTooltip (i) cạnh tiêu đề "Hiệu quả đơn hàng", "Xu hướng Lũy kế", "Phân tích Tăng trưởng": hover có nội dung không? | Hộp trống | G-44 |
| DA-Q22 | Cuộn trang: Header và FilterBar có chồng lên nhau không? | Có thể chồng | G-50 |
| DA-Q23 | Giá trị mặc định 9 thẻ & các widget có khớp bảng mục 11 không (cho biết múi giờ máy)? | Khớp ±1–2% | 11 |
| DA-Q24 | Bảng xếp hạng: khi chọn Local KV ≠ "Tất cả", toggle "Theo Khu vực / Theo Chi nhánh" có biến mất? Ô "Tỷ lệ trả hàng" của HMK BD Chi nhánh 3 có tô đỏ? | Có / Có (14,0%) | 3.7 |
| DA-Q25 | Xu hướng Lũy kế: vào Combo khi đang "Đồng bộ cả 3" → có tự chọn "Sức bán GMV" và ẩn nút "Đồng bộ cả 3"? Hover 1 card có đồng bộ tooltip 2 card còn lại? | Có / Có | 3.6 |
| DA-Q26 | Định dạng số trong bảng Marketing ("4.200" hay "4,200") và Top SP theo locale trình duyệt? | Phụ thuộc locale | G-49 |
| DA-Q27 | Modal "Xem chi tiết": đóng rồi mở lại, từ khóa tìm kiếm/sort có còn không? | Còn | G-53 |

---
*Hết tài liệu Track 1 — BA. Mọi tham chiếu dòng dựa trên commit `c3d3cb9`; số liệu mục 11 được tính lại trực tiếp từ `src/utils/chartEngine.ts`.*
