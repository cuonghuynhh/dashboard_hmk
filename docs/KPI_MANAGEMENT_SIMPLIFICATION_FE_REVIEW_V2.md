# KPI Management Simplification — Frontend Developer Review (V2)

**Ngày review:** 26/10/2026  
**Reviewer:** Frontend Developer (React 19 + TypeScript, Tailwind CSS 4)  
**Plan gốc:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` (section 7 — quyết định BOD vòng 2)  
**Review trước:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_REVIEW.md`, `docs/KPI_MANAGEMENT_SIMPLIFICATION_UX_REVIEW_V2.md` (UX V2), `docs/KPI_MANAGEMENT_SIMPLIFICATION_BACKEND_REVIEW_V2.md` (BE V2)  
**Phạm vi:** Đánh giá 6 quyết định mới đã chốt: (1) All-or-nothing partial save, (2) Bulk fill chỉ row đang hiển thị, (3) Checkbox per-metric, (4) Bỏ audit log, (5) Single branch, (6) Excel-like grid 1 màn hình — từ góc nhìn implement FE.

> **Lưu ý về stack:** Plan và các review trước tham chiếu component Vue (`*.vue`). Codebase thực tế trong repo này là **React 19 + TypeScript (TSX)** với Tailwind 4 (`src/views/KPIManagementView.tsx`, `src/components/KPIConfigurationModal.tsx`). Các nhận xét dưới đây viết theo React/TS; nếu target thực sự là `pos.gui` (Vue), phần "React/TS considerations" cần dịch sang Vue/TS tương đương (Composition API + `<script setup>` + TS). Điểm thiết kế (state, bug, a11y) vẫn áp dụng cho cả hai.

---

## 1. Kết luận tổng quan (FE)

6 quyết định mới **đi đúng hướng và giảm đáng kể complexity FE** so với V1:

- **Bỏ audit log** là quyết định có tác động lớn nhất: loại bỏ view audit, DTO audit, masking audit, và test audit → FE chỉ còn grid + bulk fill.
- **All-or-nothing** đơn giản hóa state machine: không còn partial result handling, không cần retry per-cell.
- **Single branch** làm state nhỏ (~31 ngày × 2 metric), không cần virtualization, render nhanh.
- **Bulk fill FE-driven** (iterate filtered rows) → không cần endpoint bulk riêng; FE tự build list cells.
- **Per-metric checkbox** khớp với backend cell-level update; FE chỉ gửi metric được tick.

**Effort FE điều chỉnh:** từ **L** (V1, có audit + multi-branch + wizard) xuống **M** (grid inline edit + bulk fill + filter + guard). Phần nặng nhất không phải UI mà là **state machine dirty/validation + keyboard/a11y + test**.

**Rủi ro chính còn lại (FE):**
1. Hidden invalid cells (filter đang bật) vẫn block save → cần tổng hợp + link nhảy tới ô lỗi.
2. Bulk fill chỉ visible rows → dễ gây hiểu nhầm nếu filter state không hiển thị rõ.
3. Performance re-render cho grid 31×2 cells khi dùng controlled input naive.
4. Concurrency conflict (409) cần UX refresh grid mà không discard edits user mới nhập.

---

## 2. Ánh xạ 6 quyết định mới → tác động FE

| # | Quyết định (plan 7.0) | Tác động FE |
|---|---|---|
| 1 | All-or-nothing partial save | Disable nút lưu nếu `invalidCount > 0` (kể cả dòng ẩn). State machine `clean → dirty → invalid → saving → saved/error`. Giữ edits khi 400/409. |
| 2 | Bulk fill chỉ row đang hiển thị | FE iterate **filtered rows** (useMemo), không mutate hidden rows. Backend không biết filter. |
| 3 | Checkbox per-metric | 2 checkbox độc lập (GMV/Traffic). Bulk fill build item per-metric; metric trống = skip. |
| 4 | Bỏ audit log | Xóa audit view/state/types/masking. Giữ last-modified metadata (optional, nếu backend expose `UpdatedAt`/`UpdatorName`). |
| 5 | Single branch | Dropdown Chi nhánh (required) + Month picker. Grid 1 chi nhánh. Guard pending changes khi đổi branch/month. |
| 6 | Excel-like grid (Option C) | 1 component grid editable inline thay 4 component xóa + 2 đơn giản hóa. Keyboard nav + ARIA grid + sticky + input mask. |

---

## 3. Đánh giá implementation complexity theo từng quyết định

### 3.1 All-or-nothing partial save

**Complexity: S–M (UI) + M (state/validation)**

**Implement:**
- State machine rõ ràng: `status: 'clean' | 'dirty' | 'invalid' | 'saving' | 'saved' | 'error'`.
- Validation per-cell: GMV > 0 (bắt buộc), Traffic ≥ 0 (tùy chọn). Empty cell (`null`/`''`) = chưa nhập, không invalid (chỉ invalid khi có giá trị sai).
- Aggregate `invalidCount` bao gồm **cả dòng đang ẩn** (filter không loại trừ validation).
- Nút "Xác nhận lưu" `disabled = dirtyCount === 0 || invalidCount > 0 || saving`.
- Khi save fail (400): giữ grid dirty, highlight invalid cells, toast nêu số ô lỗi + link "Xem ô lỗi" (clear filter / scroll tới ô lỗi đầu tiên).
- Khi 409 (concurrency): hiển thị giá trị hiện tại từ response, không discard edits user mới nhập (P1: giữ bản nháp để merge; MVP: refresh + toast).

**React/TS considerations:**
- Dùng `useMemo` cho `invalidCount`, `dirtyCount` để tránh recompute toàn grid mỗi keystroke.
- Dirty tracking nên dùng `Map<string, CellEdit>` keyed by `${date}|${metric}` (metric: `'gmv' | 'traffic'`) thay vì mutate row object (tránh re-render cascade).
- Validation function pure: `(value: string, metric: Metric) => ValidationResult` — dễ test.
- Controlled input per cell với `onChange` cập nhật Map → re-render chỉ cell đó nếu dùng `React.memo` + stable props. Nếu naive `useState` cho cả grid, mỗi keystroke re-render 62 inputs → lag. Khuyến nghị: uncontrolled input + ref, hoặc store edits trong `useRef` + force update targeted. MVP có thể dùng controlled nhưng phải `memo` cell component.
- TS: định nghĩa `type Metric = 'gmv' | 'traffic'`, `type CellKey = \`${string}|${Metric}\``, `interface CellEdit { original: number | null; current: string; error?: string }`.

**Potential bugs:**
1. Hidden invalid cells không được đếm → save enable sai. **Mitigation:** validation chạy trên toàn bộ rows, không chỉ visible.
2. Sau bulk fill, validation state stale (ô mới điền GMV=0 không được mark invalid). **Mitigation:** bulk fill cũng trigger recompute validation.
3. Save fail discard edits nếu `setEdits(new Map())` trong `finally`. **Mitigation:** chỉ clear edits khi save thành công (200).
4. Double submit: user nhấn Enter + click nút cùng lúc → 2 request. **Mitigation:** `saving` flag disable cả button và keyboard shortcut.
5. `beforeunload` guard phải check `dirtyCount > 0`, không chỉ `status === 'dirty'` (status có thể 'invalid' nhưng vẫn có edits).
6. Optimistic update: nếu save 200, update original values từ response; nếu không sync, dirty count không về 0 → nút lưu vẫn enable. **Mitigation:** on success, replace `original` bằng response values và clear edits.

### 3.2 Bulk fill chỉ row đang hiển thị

**Complexity: S (logic) + S (UX guard)**

**Implement:**
- `visibleRows = useMemo(() => rows.filter(matchesFilter), [rows, filterDayType, filterStatus])`.
- Bulk fill handler iterate `visibleRows` (không phải `rows`):
  - Với mỗi row, nếu `filterDayType` khớp day-type được chọn (Trong tuần / Cuối tuần) và checkbox metric ticked:
    - GMV: nếu `gmvValue !== ''` và (checkbox GMV ticked) và (checkbox "chỉ điền ô trống" unticked OR row.gmv == null) → build item `{date, metric: 'GMV', value: gmvValue}`.
    - Traffic tương tự.
  - Nếu filter result rỗng → disable nút apply + tooltip.
- Gọi `PATCH /DailyTargets` với list cells (per-metric).
- Toast nêu phạm vi: `Đã điền N dòng đang hiển thị (Trong tuần).`

**React/TS considerations:**
- Filter state phải là source of truth duy nhất; bulk fill không được copy filter logic riêng (tránh drift). Dùng cùng `visibleRows`.
- Day-type của row phải derive từ `Date` (không tin client gửi), nhưng FE có thể derive để hiển thị/filter. Consistency với backend.
- TS: `type DayTypeFilter = 'all' | 'weekday' | 'weekend'`, `type StatusFilter = 'all' | 'entered' | 'empty'`.

**Potential bugs:**
1. Filter state không hiển thị rõ → user không biết bulk chỉ áp dụng dòng đang thấy. **Mitigation:** filter chip + banner cố định khi filter ≠ 'Tất cả' (UX P0).
2. Bulk apply 0 dòng (filter không khớp day-type) → không feedback. **Mitigation:** disable bulk + tooltip `Không có dòng nào khớp bộ lọc`.
3. Đếm "đã thay đổi" không phân biệt visible/hidden → nhầm. **Mitigation:** save bar `N ô chưa lưu (gồm M dòng đang ẩn)`.
4. Race: user đổi filter giữa lúc bulk đang apply (async) → bulk apply trên snapshot cũ. **Mitigation:** capture `visibleRows` snapshot trước khi gọi API; nếu filter đổi trong lúc pending, cancel/ignore result hoặc disable filter khi saving.
5. Bulk fill ghi đè dữ liệu đã có khi checkbox untick mà không confirm. **Mitigation:** confirm dialog nếu overwrite (UX P0 #5-6).
6. Duplicate items: nếu user nhấn "Áp dụng" 2 lần nhanh → 2 request. **Mitigation:** disable nút khi `saving`.

### 3.3 Checkbox per-metric (GMV/Traffic độc lập)

**Complexity: S**

**Implement:**
- 2 checkbox riêng: `gmvOnlyEmpty`, `trafficOnlyEmpty` (default `true`).
- Label câu khẳng định: `☑ Chỉ điền ô GMV còn trống` / `☑ Chỉ điền ô Traffic còn trống`.
- Input và checkbox độc lập: input luôn cho phép nhập; checkbox chỉ điều khiển overwrite.
- Empty input → skip metric đó (không thay đổi, không lỗi); yêu cầu ít nhất 1 metric có giá trị để enable nút apply.
- Nếu checkbox untick + input non-empty + có ngày đã có giá trị → confirm trước apply.
- Preview count cập nhật theo checkbox: `GMV: bỏ qua 2 ngày đã có` vs `GMV: ghi đè 2 ngày đã có`.

**React/TS considerations:**
- State bulk form: `interface BulkFillForm { gmvValue: string; trafficValue: string; gmvOnlyEmpty: boolean; trafficOnlyEmpty: boolean }`.
- Derived `canApply = gmvValue !== '' || trafficValue !== ''` (ít nhất 1 metric).
- Derived `overwriteCount = visibleRows.filter(r => (gmvOnlyEmpty? r.gmv != null : false) ...).length` để hiển thị confirm.
- Checkbox default ticked: dùng `useState(true)`.

**Potential bugs:**
1. Checkbox bị hiểu là "bật/tắt metric" thay vì "chỉ điền ô trống". **Mitigation:** label câu khẳng định + tooltip.
2. Empty input + checkbox ticked → không rõ skip hay lỗi. **Mitigation:** empty input = skip metric, không lỗi; nút apply disable nếu cả 2 empty.
3. Cả 2 checkbox untick + cả 2 input có giá trị → 1 confirm gộp. **Mitigation:** build confirm message liệt kê cả 2 metric.
4. Preview count không khớp checkbox state (off-by-one). **Mitigation:** unit test cho derive function.

### 3.4 Bỏ audit log

**Complexity: S (giảm từ M)**

**Implement:**
- Xóa component audit view, state `auditOpen`, types `KpiDailyTargetAudit*`, masking audit trong response post-processor (nếu FE có).
- Giữ metadata nhẹ: tooltip row/cell `Cập nhật: {updatedAt} bởi {updatorName}` nếu backend expose `Version`/`UpdateAt`/`UpdatorName` (optional fields, backward compatible).
- Toast xác nhận lưu chi tiết: `Đã lưu N ngày lúc HH:mm bởi [Tên].`
- Không hiển thị nút "Lịch sử thay đổi" (tránh nhầm là audit).

**React/TS considerations:**
- Optional fields trong TS interface: `updatedAt?: string; updatorName?: string; version?: number`. Dùng optional để tương thích FE cũ.
- Khi bỏ audit, kiểm tra grep toàn repo cho `audit`/`Audit` references để tránh leftover compile errors (`tsc --noEmit`).
- Không còn masking audit → response post-processor FE (nếu có) không cần xử lý audit DTO.

**Potential bugs:**
1. Leftover references đến audit type → compile error. **Mitigation:** grep + tsc.
2. BOD mất traceability → lo lắng. **Mitigation:** bù bằng last-modified tooltip + toast chi tiết (P1).
3. Nếu compliance yêu cầu audit sau → cần thêm ở pha sau; hiện tại không block (reversible).

### 3.5 Single branch

**Complexity: S**

**Implement:**
- Dropdown Chi nhánh `required` đặt đầu panel điều khiển; Month picker bên cạnh.
- Grid header hiển thị `Chi nhánh: X · Tháng: Y`.
- Save bar hiển thị chi nhánh đang lưu.
- Pending changes guard khi đổi Chi nhánh hoặc Tháng: `Bạn có thay đổi chưa lưu. Hủy thay đổi và tải chi nhánh mới?`
- Empty state: `Chưa có mục tiêu cho chi nhánh X tháng Y. Dùng "Điền..." hoặc "Import mục tiêu" để bắt đầu.`
- Mobile: dropdown full-width, grid scroll ngang với cột Ngày sticky.

**React/TS considerations:**
- `selectedBranch` và `selectedMonth` là state lifting lên container; grid nhận props.
- Guard: dùng `useEffect` cleanup hoặc handler `onChange` check `dirtyCount > 0` trước khi set.
- Reset edits khi đổi branch/month: `setEdits(new Map())` sau khi load xong data mới (không reset trước, tránh mất data nếu load fail).
- Cache key FE (nếu có) phải include `branch+month`.
- Race: đổi branch khi request load cũ chưa xong → dùng request seq / AbortController để ignore stale response.

**Potential bugs:**
1. Đổi branch trong lúc saving → state corruption. **Mitigation:** disable dropdown khi `saving`.
2. Load fail nhưng đã reset edits → mất data. **Mitigation:** reset edits chỉ sau khi load thành công.
3. Stale response ghi đè data mới. **Mitigation:** request seq counter (đã có pattern `dailyRequestSeq` trong QC notes).

### 3.6 Excel-like grid (1 màn hình)

**Complexity: M–L (UI + a11y + keyboard)**

**Implement:**
- 1 component grid editable inline (thay 4 component xóa + 2 đơn giản hóa).
- Cell states: mờ (chưa nhập, slate-500), đậm (đã nhập), dirty (dot/viền), invalid (đỏ + tooltip).
- Keyboard navigation: ↑↓←→, Enter/F2 vào edit, Tab/Shift+Tab cell tiếp, Esc hủy edit, Ctrl+S lưu.
- Sticky header row + sticky cột Ngày.
- Input mask số (vnđ) + traffic số nguyên; phân cách sau blur.
- Save bar sticky bottom (desktop + mobile) với Hủy + Xác nhận lưu.
- Panel "Nhập hàng loạt" collapse/expand (ghi nhớ trạng thái), mặc định mở lần đầu.
- Empty state + onboarding hint.
- `beforeunload` guard khi dirty.

**React/TS considerations:**
- ARIA grid: `role="grid"`, `role="row"`, `role="gridcell"`, `aria-colindex`, `aria-rowindex`, `aria-selected`. Focus management: single tabindex=0 trên cell active, roving tabindex.
- Keyboard handler ở grid container (keydown) → dispatch action (move/edit/commit/cancel). Dùng `useReducer` cho grid state (focus, editMode, dirty) thay vì nhiều useState.
- Controlled vs uncontrolled input: cell edit mode render `<input>`; commit on blur/Enter, cancel on Esc. Dùng uncontrolled input + ref để tránh re-render toàn grid.
- Number formatting: parse on change (strip separators), format on blur. Cẩn thận IME/comma. Dùng `Intl.NumberFormat('vi-VN')` hoặc custom. Traffic phải số nguyên → validate `Number.isInteger`.
- Sticky: CSS `position: sticky; top: 0` cho header, `left: 0` cho cột Ngày. Cần `z-index` đúng (header corner z cao nhất).
- Mobile: grid scroll ngang; save bar sticky `position: sticky; bottom: 0`. Nếu parent có `overflow` khác, sticky fail → test.
- Performance: 62 cells × re-render; dùng `React.memo` cho cell, stable callback via `useCallback`, key stable `${date}|${metric}`.

**Potential bugs:**
1. Focus loss sau re-render (controlled input) → user không gõ được. **Mitigation:** uncontrolled input + ref, commit on blur.
2. Sticky header bị che bởi modal overlay z-index. **Mitigation:** z-index scale chuẩn (header 10, modal 50).
3. Keyboard nav conflict với input (Arrow keys trong input). **Mitigation:** khi edit mode, Arrow keys move caret trong input; khi view mode, Arrow keys move cell. Phân biệt qua `isEditing`.
4. `beforeunload` chỉ hoạt động nếu dirtyCount > 0; nếu user refresh khi saving → mất. **Mitigation:** disable unload khi saving? Không thể; chấp nhận (saving nhanh).
5. Paste từ Excel (P2) chưa làm → user kỳ vọng paste nhưng không hoạt động; cần disable/hint.
6. Mobile horizontal scroll + sticky cột Ngày: trên iOS Safari sticky trong overflow container có bug → test thực tế.

---

## 4. Potential bugs tổng hợp (FE)

| # | Bug | Quyết định liên quan | Mức | Mitigation |
|---|---|---|---|---|
| B1 | Hidden invalid cells block save nhưng user không thấy | All-or-nothing | Cao | Validation toàn bộ rows; link "Xem ô lỗi" clear filter/scroll. |
| B2 | Bulk fill iterate visible rows nhưng filter state không rõ → hiểu nhầm | Bulk scope | Cao | Filter chip + banner + count trong nút bulk. |
| B3 | Bulk apply 0 dòng không feedback | Bulk scope | Trung bình | Disable nút + tooltip. |
| B4 | Checkbox untick + input non-empty overwrite không confirm | Per-metric | Cao | Confirm dialog trước apply. |
| B5 | Save fail discard edits (finally clear) | All-or-nothing | Cao | Chỉ clear edits khi 200. |
| B6 | Double submit (Enter + click) | All-or-nothing | Trung bình | `saving` flag disable mọi trigger. |
| B7 | Stale response ghi đè data mới khi đổi branch/month | Single branch | Trung bình | Request seq / AbortController. |
| B8 | Reset edits trước khi load xong → mất data nếu load fail | Single branch | Trung bình | Reset edits chỉ sau load thành công. |
| B9 | Leftover audit references → compile error | Bỏ audit | Thấp | Grep + `tsc --noEmit`. |
| B10 | Controlled input re-render toàn grid → lag | Excel grid | Trung bình | Uncontrolled input + `React.memo` cell. |
| B11 | Keyboard nav conflict với input caret | Excel grid | Trung bình | Phân biệt edit/view mode. |
| B12 | Sticky header/cột bị che bởi modal | Excel grid | Thấp | z-index scale. |
| B13 | `beforeunload` guard không cover status 'invalid' | All-or-nothing | Thấp | Check `dirtyCount > 0`. |
| B14 | Concurrency 409 discard edits user mới nhập | All-or-nothing | Trung bình | Giữ edits + hiển thị giá trị hiện tại + toast. |
| B15 | Optimistic update không sync original → dirty count không về 0 | All-or-nothing | Trung bình | Replace original từ response khi save 200. |
| B16 | Mobile sticky fail trong overflow container | Excel grid | Thấp | Test thực tế iOS Safari. |

---

## 5. React/TS considerations (chi tiết)

### 5.1 State model đề xuất

```ts
type Metric = 'gmv' | 'traffic';
type CellKey = `${string}|${Metric}`; // `${yyyy-MM-dd}|gmv`

interface CellEdit {
  original: number | null;   // giá trị từ server (null = chưa nhập)
  current: string;           // input value (raw string)
  error?: string;            // validation error message
}

interface GridState {
  branchId: string;          // required
  month: string;             // yyyy-MM
  rows: DayRow[];            // ~31 ngày
  edits: Map<CellKey, CellEdit>;
  filterDayType: 'all' | 'weekday' | 'weekend';
  filterStatus: 'all' | 'entered' | 'empty';
  status: 'clean' | 'dirty' | 'invalid' | 'saving' | 'saved' | 'error';
}

interface DayRow {
  date: string;              // yyyy-MM-dd
  dayType: 'weekday' | 'weekend'; // derived from Date (FE derive for display/filter only)
  gmv: number | null;
  traffic: number | null;
  version: number;           // concurrency token
  updatedAt?: string;
  updatorName?: string;
}
```

Derived (useMemo):
- `dirtyCount = edits.size` (chỉ cells có `current !== original`).
- `invalidCount = rows.flatMap(cells).filter(c => c.error).length` (toàn bộ rows, kể cả ẩn).
- `visibleRows = rows.filter(matchesFilter)`.
- `canSave = dirtyCount > 0 && invalidCount === 0 && status !== 'saving'`.

### 5.2 Validation

```ts
function validateCell(value: string, metric: Metric): string | undefined {
  if (value === '') return undefined; // empty = chưa nhập, không invalid
  const n = Number(value.replace(/[^\d.-]/g, ''));
  if (Number.isNaN(n)) return 'Giá trị không phải số';
  if (metric === 'gmv' && !(n > 0)) return 'GMV phải > 0';
  if (metric === 'traffic' && !(n >= 0)) return 'Traffic phải ≥ 0';
  if (metric === 'traffic' && !Number.isInteger(n)) return 'Traffic phải là số nguyên';
  return undefined;
}
```

Chạy validation trên toàn bộ rows (không chỉ visible) mỗi khi edits thay đổi. Dùng `useMemo` với dependency `[rows, edits]`.

### 5.3 Dirty tracking & performance

- Dùng `Map` + `new Map(prev)` khi update (immutable) để React detect change.
- Cell component `React.memo` với props: `value`, `original`, `error`, `onChange`, `onCommit`. Callbacks stable qua `useCallback`.
- Commit on blur/Enter, không commit mỗi keystroke vào parent state (chỉ update local input state). Chỉ update `edits` Map khi cell blur hoặc Enter. Điều này giảm re-render.

### 5.4 Keyboard & ARIA

- Grid container: `role="grid"`, `aria-rowcount`, `aria-colcount`.
- Roving tabindex: chỉ cell active có `tabIndex={0}`, còn lại `tabIndex={-1}`.
- Keydown handler dispatch:
  - Arrow keys → move focus (nếu không editing).
  - Enter/F2 → enter edit mode (focus input).
  - Tab/Shift+Tab → move to next/prev cell (commit current first).
  - Esc → cancel edit, revert to original.
  - Ctrl/Cmd+S → trigger save (prevent default).
- Khi editing, Arrow keys điều khiển caret trong input (không move cell) — phân biệt qua state `editingCell`.

### 5.5 Number formatting

- Input uncontrolled, raw value lưu trong ref.
- On change: strip non-digit (giữ dấu `.` cho vnđ? Traffic integer only).
- On blur: format với `Intl.NumberFormat('vi-VN')` cho GMV; traffic hiển thị số nguyên.
- Traffic phải integer → validate `Number.isInteger`.
- Cẩn thận paste có dấu phẩy/chấm → normalize.

### 5.6 Concurrency (Version)

- Read response trả `version` per row. FE gửi `version` trong body item khi save (optional nhưng khuyến nghị).
- Nếu 409: response chứa giá trị hiện tại → hiển thị diff (original vs current server vs user input) + toast `Dữ liệu đã thay đổi bởi người khác.` + nút `Tải lại dữ liệu mới`.
- MVP: refresh grid (giữ edits trong Map riêng để user có thể merge thủ công) — P1.

### 5.7 Guard unsaved changes

- `beforeunload` listener khi `dirtyCount > 0`.
- Route change guard (nếu dùng router): prompt `Bạn có thay đổi chưa lưu. Rời trang?`.
- Đổi branch/month: prompt + nếu confirm thì discard edits + load mới.

---

## 6. Testing (FE)

**Unit tests:**
- `validateCell` (GMV >0, Traffic ≥0 integer, empty skip).
- Derived `invalidCount` includes hidden rows.
- Bulk fill iterate visible rows only (mock filter).
- Per-metric checkbox logic (empty input skip, overwrite confirm count).
- Dirty count returns 0 after successful save.

**Integration tests:**
- All-or-nothing: 1 invalid cell → save disabled; sau khi sửa → enable.
- Bulk fill với filter active → chỉ visible rows thay đổi; hidden rows không đổi.
- Filter rỗng → bulk disable.
- Đổi branch với pending changes → confirm dialog.
- Save 400 → edits giữ nguyên + invalid highlight.
- Save 200 → edits cleared + toast.
- Keyboard nav: Arrow/Enter/Tab/Esc/Ctrl+S.

**A11y tests:**
- ARIA grid roles + roving tabindex.
- Focus visible ring.
- Tooltip lỗi truy cập bằng keyboard.
- Screen reader announces dirty count (aria-live).

**E2E (nếu có):**
- Full flow: chọn branch + month → bulk fill Trong tuần → edit 1 cell → save → reload verify.

---

## 7. Priority (FE)

### P0 (bắt buộc trước khi code)
1. State machine + validation toàn bộ rows (kể cả ẩn) + disable save.
2. Bulk fill iterate visible rows + filter chip/banner/count + disable khi rỗng.
3. Per-metric checkbox default ticked + empty skip + confirm overwrite + preview count.
4. Pending changes guard (branch/month) + reset edits sau load thành công.
5. Request seq / AbortController cho load (tránh stale response).
6. Uncontrolled input + `React.memo` cell (performance).
7. Keyboard nav + ARIA grid + focus visible.
8. Sticky header/cột Ngày + save bar sticky (mobile).
9. `beforeunload` guard (`dirtyCount > 0`).
10. Giữ edits khi 400/409 + toast chi tiết.

### P1 (nên có)
11. Undo lần bulk fill gần nhất.
12. Xử lý 409: hiển thị giá trị hiện tại + refresh + giữ edits.
13. Last-modified tooltip + toast lưu chi tiết (timestamp + người dùng).
14. Tóm tắt thay đổi trước lưu khi có overwrite.
15. Collapse panel bulk fill (ghi nhớ trạng thái).
16. Empty state + onboarding hint.
17. Input mask số + unit.

### P2 (nice-to-have)
18. Copy từ tháng/chi nhánh trước.
19. Paste từ Excel (clipboard).
20. Autosave draft (localStorage) tránh mất dữ liệu.
21. Mobile card view (nếu BOD dùng mobile thường xuyên).
22. Onboarding tooltip.

---

## 8. Câu hỏi mở cho BOD/PM/BE

1. All-or-nothing: có cần "lưu nháp" (draft) để tránh mất dữ liệu khi có lỗi? (FE có thể autosave localStorage P2.)
2. Bulk scope: nếu filter đang bật, có nên thêm nút nhanh "Áp dụng toàn bộ tháng" (escape hatch) dù bulk mặc định chỉ visible?
3. Per-metric checkbox default ticked có OK với BOD không?
4. Bỏ audit: có yêu cầu traceability tối thiểu (last-modified từ `UpdatedAt`/`UpdatorName`) hay không cần gì? (BE cần expose optional fields.)
5. `Version` bắt buộc gửi hay optional? Khuyến nghị FE gửi để an toàn (BE đã recommend optional, last-write-wins nếu omitted).
6. Null semantics: FE muốn "không đổi" → không gửi item; `null` value = xóa giá trị (fallback). Đã chốt BE — FE phải tuân thủ.
7. Conflict 409: FE tự refresh + retry hay báo user? Khuyến nghị báo user + refresh (BE recommend).
8. Có cần ETag/`If-Match` hay đủ `Version` trong body? Khuyến nghị `Version` trong body (đơn giản hơn cho FE) — đã chốt BE.

---

## 9. Đề xuất cập nhật Plan (section cần sửa)

- **4.2 "Nút Xác nhận lưu":** đổi partial save → all-or-nothing; disable nếu có invalid (kể cả dòng ẩn); giữ dirty khi fail; đếm bao gồm dòng ẩn.
- **4.2 "Audit log" row:** xóa hoặc đổi thành "Metadata last-modified (từ UpdatedAt/UpdatorName)".
- **4.2 "Nhập hàng loạt":** scope = dòng đang hiển thị; per-metric checkbox; preview count; confirm khi ghi đè.
- **4.2 "Checkbox per-metric":** thêm 2 checkbox riêng GMV/Traffic (default ticked).
- **7.0 #1–#4:** phản ánh đúng quyết định mới (đã có).
- **Acceptance criteria:** cập nhật theo UX V2 mục 6 + FE mục 6 ở đây.

---

## 10. Ghi chú về stack (Vue vs React)

Plan tham chiếu component Vue (`KpiManagementView.vue`, `KpiTable.vue`, ...). Codebase thực tế trong repo này là React 19 + TSX. Nếu target triển khai là `pos.gui` (Vue), các nhận xét "React/TS considerations" cần ánh xạ sang Vue 3 Composition API + `<script setup lang="ts">` + Pinia/Vuex (nếu có), nhưng **state model, validation, bug, a11y** vẫn áp dụng nguyên vẹn. Khuyến nghị: thống nhất stack trước khi code để tránh mismatch giữa docs và code.

---

*Tài liệu này là góp ý FE developer, không thay thế plan kỹ thuật. Nên cập nhật `KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` section 4.2 và 7 theo các điều chỉnh P0 trước khi triển khai.*