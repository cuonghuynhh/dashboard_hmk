# Track 1 — BA trả lời 8 điểm mới từ DA
Tham chiếu dòng ở commit `c3d3cb9`. Các con số đã được tính lại bằng cách bundle `src/utils/chartEngine.ts` (TZ Asia/Ho_Chi_Minh) và khớp **chính xác** với số DA đo được.

---

## 1. "Tăng trưởng chung" GMV thay đổi theo chu kỳ (−1,2 / −1,4 / −2,1 / +16,1 / +13,7%) trong khi thẻ ↑21,7%
**Xác nhận cơ chế: seed theo `s.getTime()` của mốc đầu từng bucket.**
- `GrowthAnalysisChart.tsx:202-203`: `seed = s.getTime()`; `variation = 0.82 + seededRandom(seed)·0.36` ∈ [0,82; 1,18].
- `:207`: `prevGmv = currentGmv / variation` → tăng trưởng mỗi bucket = `variation − 1` (`:232`). "Kỳ trước" **không phải dữ liệu thật**, chỉ là kỳ này chia cho một hệ số ngẫu nhiên.
- `:255-257`: "Tăng trưởng chung" = Σkỳ này / Σ(kỳ này/variationᵢ) − 1, tức trung bình hệ số theo trọng số GMV.
- Hệ quả: kết quả phụ thuộc vào cách chia bucket, không phụ thuộc kinh doanh.
  - Ngày (122 bucket) và Tuần (18 bucket): nhiều hệ số nên trung bình ≈ 1, tăng trưởng ≈ 0 (−1,2% / −1,4%).
  - Tháng (4 bucket): trung bình hệ số 1,017 nhưng tăng trưởng gia quyền vẫn âm (−2,1%), vì tháng 8 có GMV lớn nhất lại nhận hệ số 0,869.
  - Quý (2 bucket, hệ số 1,137 và 1,168) cho +16,1%.
  - Năm (1 bucket, hệ số 1,137) cho +13,7%.
  - Mọi chế độ có bucket đầu bắt đầu 01/06 đều dùng cùng seed nên cùng hệ số 1,137 cho bucket đầu. Đây chính là +13,7% của chế độ Năm.
- Thẻ tài chính tính đúng theo FRS 4.5 (`FinancialOverviewCards.tsx:146-155`): kỳ trước thật 30/01–31/05 → +21,7%.

**Quy tắc đề xuất:**
1. Kỳ so sánh của **toàn khoảng** dùng đúng FRS 4.5: `[S − (E−S) − 1 ngày, S − 1 ngày]`, tổng hợp bằng `aggregateMetrics` với cùng KV/CN.
2. "Tăng trưởng chung" = Σkỳ này / Σkỳ so sánh − 1, phải **bằng % trên thẻ** (cùng bộ lọc) và **độc lập với Chu kỳ gom nhóm**.
3. Mỗi bucket so với bucket tương ứng có **cùng số ngày, dịch lùi đúng độ dài bucket**. Tùy chọn: so YoY (cùng bucket năm trước).
4. Bucket lẻ (vd tuần 18 chỉ 3 ngày) so với 3 ngày tương ứng, hoặc gắn cờ "kỳ chưa đủ".
5. Với AOV/UPT, "chung" = tỷ số của tổng (ΣGMV/Σđơn), không lấy trung bình đơn giản (`:255`).

## 2. Heatmap Tuần/Tháng hiện "N ngày đầu" thay vì giá trị gộp
**Xác nhận.** Code không gộp dữ liệu, nhưng cũng không "lấy ngày". Mỗi chế độ được sinh **lại bằng cùng một công thức**, và công thức chỉ phụ thuộc chỉ số chi nhánh `branchIdx` và chỉ số cột `pIdx`, không phụ thuộc tên hay độ dài kỳ:
- `BranchRevenueComparison.tsx:24-76` (`generateData(periods)`): seed `(branchIdx·17 + pIdx·23) mod 100` (`:29`), chỉ tiêu `400 + (branchIdx·11 + pIdx·7) mod 250` (`:32`), traffic `120 + (branchIdx·9 + pIdx·13) mod 220` (`:63`).
- `:79-81`: `day/week/month` gọi cùng hàm với 31/4/7 nhãn.
- ⇒ ô "Tuần k" ≡ ô ngày "k/7"; ô "Tháng k" ≡ ô ngày "k/7" (k = 1…7). Quy mô cũng giống hệt (chỉ tiêu 400–649 Tr cho cả ngày, tuần lẫn tháng).

**Đề xuất:**
- Sinh dữ liệu ngày, sau đó Tuần/Tháng = Σ Doanh thu, Σ Chỉ tiêu, Σ Đơn, Σ Traffic.
- % Target = ΣDT/ΣChỉ tiêu; CR = ΣĐơn/ΣTraffic.

## 3. Anomaly không bao giờ đánh dấu điểm nào
**Xác nhận: về mặt toán học là không thể đánh dấu**, với mọi dữ liệu.
- Code: `AnomalyDetectionChart.tsx:33-52`. Cửa sổ MA gồm 5 điểm **bao gồm cả điểm hiện tại** (`j = i−4…i`). σ là độ lệch chuẩn tổng thể (chia n, `:47`). `UB = MA + 2σ + 10`, `LB = MA − 2σ − 10` (`:48-49`).
- **Bất đẳng thức Samuelson:** với n điểm có trung bình m và σ tổng thể, mọi điểm thỏa |x − m| ≤ σ·√(n−1).
  - n = 5 ⇒ |x − MA| ≤ 2σ, dấu bằng chỉ khi 4 điểm còn lại bằng nhau. Với n < 5 (4 ngày đầu) thì cận còn chặt hơn.
  - Vì vậy `x > MA + 2σ + 10` **không bao giờ** đúng; khoản đệm +10 chỉ càng chắc chắn hơn.
  - Mô phỏng 20.000 chuỗi × 30 điểm: 0 điểm bị đánh dấu; max |x − MA|/σ = 2,0000.
- **Lỗi thứ hai:** cú sốc được tiêm vào **biến random walk** (`currentVal += 45` tại `:27`, `−= 40` tại `:28`). Do đó đó là **dịch mức vĩnh viễn**, không phải gai đơn lẻ: các ngày sau vẫn ở mức mới.
  - Ví dụ không nhiễu, ngày 10/7: giá trị 174,0, MA 136,7, σ 18,8 → UB 184,3. Khớp với tooltip DA thấy: 156,9 / MA 120,1 / UB 167,3.

**Đề xuất:**
- MA và σ tính trên **cửa sổ quá khứ không gồm điểm hiện tại** (vd 7 ngày trước), σ dùng mẫu (n−1).
- Ngưỡng k = 2–3σ; bỏ +10 tuyệt đối hoặc thay bằng % MA.
- Mock tiêm gai đơn lẻ: `rawValues[i] += 45` mà không cộng dồn vào `currentVal`.

## 4. Tooltip lộ khóa thô "value"/"rate" và modal Nhân khẩu học có số âm
**Lộ khóa thô.** `CustomTooltip` in `entry.name` (`CustomTooltip.tsx:41`). Khi `<Bar>` không có prop `name`, Recharts dùng `dataKey` làm tên:
- Phân bổ Nhóm tuổi: `OperationalView.tsx:495` `<Bar dataKey="value">` → "value".
- Tỷ lệ Chuyển đổi: `ConversionAndRefundAnalysis.tsx:84-85` `dataKey="rate"` → "rate".
- Tỷ lệ Hoàn tiền: `ConversionAndRefundAnalysis.tsx:147` `dataKey="value"` → "value".
- Liên quan (tên tiếng Anh, không phải khóa thô): tooltip Ma trận Phôi Tròng hiện "Sphere"/"Cylinder" (`ProductView.tsx:352,363`).
- Các series khác đã có `name`: Order Aging `:224-248`, tháp dân số `:588,596`, Multi-dim `ProductView.tsx:241`, Brand `:466`.

**Số âm cho Nam.**
- Modal "Dữ liệu Chân dung Khách hàng" truyền thẳng `populationData[demographicsType]` (`OperationalView.tsx:380-390`). Cột `male` không có `render`, mà dữ liệu Nam được lưu **âm** để vẽ tháp (`data.ts:147-156`).
- Biểu đồ tháp che dấu âm bằng `Math.abs` ở trục (`OperationalView.tsx:529-531`) và tooltip (`:565`), nhưng modal thì không.
- Sửa: thêm `render: v => Math.abs(v)` cho cột Nam. Kèm đơn vị (% hoặc Tỷ) cho cả modal này và modal Order Aging (`:147-151`).

## 5. "Độ lệch %" → Volume: cột không xuất phát từ 0
**Trong code, mốc gốc của cột là 0.**
- `<Bar>` không có `baseValue`/`domain` tùy biến (`OrderEfficiencyMetricsChart.tsx:953-997`; YAxis `:964-969`).
- Recharts 3.9.2 lấy gốc = 0 khi miền trục chứa 0 (`node_modules/recharts/lib/util/ChartUtils.js:417-433`; dùng ở `cartesian/Bar.js:587-603`). Miền trục chắc chắn chứa 0 vì có cả độ lệch dương lẫn âm.

**Nguyên nhân khả dĩ nhất: DA đọc DOM/ảnh lúc đang animation.**
- Ba tab % Lệch AOV/UPT/Volume dùng **cùng một `<Bar>`**, chỉ đổi `dataKey` (`:972-979`).
- Recharts animate từ hình chữ nhật cũ sang mới trong 400 ms (`Bar.js:502` `animationDuration: 400`, `isAnimationActive: 'auto'`).
- Ở trạng thái trung gian, `y` và `height` được nội suy, nên cột "lơ lửng" không chạm 0.
- Nhờ DA chụp lại sau ≥ 1 giây.
- Nguyên nhân phụ ít khả năng hơn: `radius={[4,4,4,4]}` (`:980`) với chiều cao âm.
- Sửa: đặt `key={varianceMetric}` cho `<Bar>` (mount lại thay vì nội suy) hoặc `isAnimationActive={false}`.

**Một méo mó có thật, liên quan:** trung bình Volume/kỳ tính cả **tuần 18 chỉ 3 ngày** (`:102`). TB bị kéo xuống, các tuần đủ bị đẩy về phía dương và tuần 18 lệch rất âm. Đề xuất chuẩn hóa theo số đơn/ngày hoặc loại kỳ lẻ khỏi TB.

## 6. "HMK ĐN LÊ DUẨN 2" (chip MANAGER) có ánh xạ chi nhánh engine không?
**Không.**
- Chip là chuỗi cứng trong một `<button>` không có `onClick` và không ghi `globalBranch` (`FilterBar.tsx:63-68`).
- Tên này không có trong `BRANCH_TO_REGION` (`constants.ts:1-7`; engine chỉ biết 5 tên "HMK … Chi nhánh n", `chartEngine.ts:48-54`).
- Tên chỉ xuất hiện trong `branchPerformanceData` (`data.ts:442`, không được render) và `conversionRateData.store` (`data.ts:592`, biểu đồ Tỷ lệ chuyển đổi).
- Gần nhất về địa lý là "HMK ĐN Chi nhánh 2" (Miền Trung), nhưng code không nối hai tên này.

## 7. Quy tắc mũi tên/màu cho chỉ số "nghịch" (inverse), ngoài những gì đã ghi
- **Cơ chế chung có nhưng là code chết:** `MetricData.isInverse` (`types.ts:20`) và `MetricCard.tsx:133-148`.
  - Nếu `isInverse`: tăng là xấu (đỏ). Nếu không khai báo: chỉ tiêu đề "REMAKE RATE" được coi là nghịch.
  - Mũi tên trong cơ chế này luôn theo chiều thật của số liệu; chỉ màu đảo (`:194-197`). Đây là hành vi đúng, nhưng `MetricCard` không được render.
- **Thẻ tài chính đang dùng** (`FinancialOverviewCards.tsx:106-107`): một biến `isPositive` điều khiển cả màu lẫn mũi tên.
  - NỢ TREO đảo bằng `!isPos` (`:301`), nên mũi tên đảo theo (đã ghi G-19).
  - GIÁ TRỊ ĐIỀU CHỈNH: `isPos:false` cứng (`:193`), luôn ↓ đỏ.
- **Mới phát hiện — Xu hướng Lũy kế, chỉ số Công nợ không áp dụng quy tắc nghịch:**
  - Tooltip mini-card (`RevenueTrendChart.tsx:264-265`) và tooltip chế độ đơn lẻ (`:191-193`): nợ vượt trần tiến độ (độ lệch ≥ 0) hiển thị **xanh** "+x% (Vượt tiến độ)". Đúng ra phải là đỏ "vượt trần".
  - Thẻ nợ luôn "(An toàn)" và "Dưới ngưỡng" màu xanh (`:553,565-568`, đã ghi G-28).
- **Màu cố định khác:**
  - Waterfall: giá trị âm luôn đỏ (`RevenueWaterfallChart.tsx:13,20`).
  - Bảng xếp hạng: Tỷ lệ trả hàng > 12% thì đỏ, ≤ 12% thì xám (`TopPerformanceTable.tsx:163`); không có xanh.
  - Phòng Lab: Tỷ lệ hư hao luôn chữ đỏ, không ngưỡng (`PersonnelView.tsx:358`).
  - Anomaly: điểm bất thường đỏ.
- Growth, Order Efficiency và Heatmap không có chỉ số nghịch (≥ 0 thì xanh, < 0 thì đỏ).
- **Đề xuất quy tắc chung:** mũi tên = chiều thật của số liệu; màu = tốt/xấu theo cờ `isInverse`. Áp cờ này cho Nợ treo, Giá trị điều chỉnh (âm), Tỷ lệ hoàn/trả, Hư hao, Tồn đọng.

## 8. MANAGER tạo được KPI "Toàn công ty"
**Xác nhận: không có kiểm tra vai trò.**
- `KPIConfigurationModal.tsx` không import `useAppContext` (dòng 1-2) và chỉ nhận props `isOpen/onClose` (`:4-7`).
- Ba cấp "Toàn công ty / Khu vực / Chi nhánh" render vô điều kiện (`:128-132`).
- Cấp công ty còn **không bao giờ** kích hoạt cảnh báo xung đột (`:39`, `entity === "Tất cả"`).
- Đường vào cho MANAGER: tab KPI được phép (`App.tsx:52,119`) → nút "Thêm KPI mới" (`KPIManagementView.tsx:48-54`, không kiểm tra vai trò; file này cũng không dùng `role`).
- Chỉ nút ở Header bị giới hạn cho BOD (`Header.tsx:55`).

**Đề xuất:**
- MANAGER chỉ được tạo KPI cho chi nhánh/khu vực mình quản lý.
- "Toàn công ty" chỉ dành cho BOD.
- Kiểm tra phía server.
