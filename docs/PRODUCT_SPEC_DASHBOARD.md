# ĐẶC TẢ CHUẨN — DASHBOARD QUẢN TRỊ KINH DOANH HMK (EBID Workspace)

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | **2.2 — Tài liệu chuẩn (baseline)**; toàn bộ quyết định nghiệp vụ đã được chốt |
| Ngày | 16/10/2026 |
| Chủ sở hữu | Product Manager |
| Mục đích | **Gốc đối chiếu duy nhất** về công thức tính và tính năng UI, dùng để QC code dashboard do đội phát triển triển khai |
| Thay thế | Toàn bộ phần định nghĩa chỉ số và đặc tả widget trong `docs/FRS.md` |
| Tài liệu liên quan | [Báo cáo đánh giá prototype](analysis/PROTOTYPE_GAP_REPORT.md) · [Báo cáo BA — mã nguồn](analysis/track1_code_BA.md) · [Báo cáo DA — giao diện](analysis/track2_ui_DA.md) · [Trả lời chéo BA](analysis/track1_BA_answers.md) |

**Lịch sử thay đổi**
| Phiên bản | Ngày | Nội dung |
|---|---|---|
| **2.2** | 18/10/2026 | **Chốt toàn bộ quyết định** (QĐ-16 … QĐ-31). Thay đổi chính: ngày ghi nhận Đơn hàng = `SubmitAt` (thời điểm đơn được lập thật, không phải lúc mở nháp); 100% đơn xuất VAT; Doanh thu thực thu = Σ phiếu thu; MANAGER theo "Cửa hàng đang quản lý" (phân quyền Identity); Khu vực & Cụm cửa hàng lấy từ HRM (Khu vực → Cụm → Chi nhánh); Order Aging theo 2 chặng Đặt hàng / Hoàn thành đơn hàng; chiến dịch và phương thức thanh toán theo mã trên đơn; hoãn Lab |
| 1.0 | 16/10/2026 | Hợp nhất 2 luồng phân tích (BA đọc code + DA kiểm UI của prototype) |
| 1.1 | 16/10/2026 | Áp 15 quyết định nghiệp vụ QĐ-01…QĐ-15 |
| **2.1** | 17/10/2026 | Áp **tạm** các phương án PM đề xuất sau QC code thật (QĐ-16 … QĐ-25, nhãn "tạm áp — chờ xác nhận"): giá trị đơn và VAT theo mô hình POS (VAT cộng thêm khi xuất hóa đơn); ngày tạo đơn = `CreateAt`; đơn đặt chuyển một phần; đổi hàng sau bán (E10); loại khách lẻ khỏi Khách hàng mới; giữ số liệu chi nhánh đã đóng; mã quyền theo vai trò; danh mục khu vực chung; KPI theo mục tiêu ngày theo loại ngày |
| 2.0 | 16/10/2026 | Chốt 9 điểm phát sinh và quy tắc hủy đơn đặt. **Tách tài liệu**: bản này chỉ mô tả hành vi chuẩn; đánh giá prototype chuyển sang `analysis/PROTOTYPE_GAP_REPORT.md`. Thêm mô hình dữ liệu nghiệp vụ & bảng sự kiện ghi nhận (mục 2), công thức dạng giả mã (mục 3), bộ dữ liệu kiểm thử chuẩn kèm kết quả kỳ vọng (mục 9), hướng dẫn và mẫu báo cáo QC (mục 11) |

---

## 0. Cách dùng tài liệu

### 0.1. Nguyên tắc
- Tài liệu chỉ mô tả **hành vi đúng (to-be)**. Không phụ thuộc cách triển khai của bất kỳ bản code nào (prototype hay code dev).
- Code được coi là **đạt** khi thỏa mọi quy tắc `BR`, công thức `M`, bất biến `INV`, kết quả kiểm thử `TC` và tiêu chí chấp nhận `AC` trong phạm vi bản 1.
- Khi code hoặc tài liệu khác mâu thuẫn với tài liệu này, **tài liệu này đúng** cho tới khi có phiên bản mới được duyệt.

### 0.2. Hệ thống mã
| Mã | Ý nghĩa |
|---|---|
| `M-xx` | Chỉ số và công thức chuẩn (mục 3) |
| `BR-xxx-nn` | Quy tắc nghiệp vụ |
| `INV-nn` | Bất biến số liệu: điều kiện luôn đúng với mọi bộ lọc (mục 3.4) |
| `FR-xx-nn` | Tính năng / widget |
| `AC-xx-nn` | Tiêu chí chấp nhận dạng Given / When / Then |
| `TC-nn` | Ca kiểm thử trên bộ dữ liệu chuẩn (mục 9) |
| `QĐ-nn` | Quyết định nghiệp vụ đã chốt (mục 10) |

### 0.3. Phạm vi yêu cầu
| Nhãn | Ý nghĩa |
|---|---|
| *(không nhãn)* | Bắt buộc trong bản 1 |
| **[P2]** | Làm sau bản 1; không tính là lỗi nếu chưa có |
| **[Hoãn]** | Chưa có dữ liệu nguồn (QĐ-13); **không được hiển thị** trong bản 1 |

### 0.4. Phân loại lỗi khi QC
| Mức | Định nghĩa | Ví dụ |
|---|---|---|
| **Nghiêm trọng** | Sai số liệu so với công thức chuẩn, vi phạm bất biến, sai phân quyền | GMV đếm cả đơn hàng sinh từ đơn đặt; MANAGER xem được chi nhánh khác |
| **Lớn** | Thiếu tính năng bắt buộc; bộ lọc không tác động widget lẽ ra phải tác động; sai ngày ghi nhận | Thẻ KPI không đổi khi lọc chi nhánh |
| **Nhỏ** | Định dạng, nhãn, màu, thứ tự, trải nghiệm | Dùng "4,200" thay vì "4.200" |

---

## 1. Tổng quan sản phẩm

### 1.1. Mục tiêu
Dashboard BI nội bộ cho chuỗi bán lẻ kính mắt HMK:
- **BOD** theo dõi sức bán, doanh thu thuần, dòng tiền, nợ treo, tiến độ kế hoạch theo vùng/chi nhánh.
- **Quản lý cửa hàng** phát hiện điểm nghẽn vận hành và theo dõi đội ngũ.
- **Nhân viên** theo dõi doanh số và thứ hạng cá nhân.

### 1.2. Cấu trúc trang
| Trang | Vai trò truy cập | Mục 7 |
|---|---|---|
| Tổng quan | BOD | 7.1 |
| Vận hành & Khách hàng | BOD, MANAGER | 7.2 |
| Sản phẩm & Tồn kho | BOD, MANAGER | 7.3 |
| Hiệu suất Nhân sự | BOD, MANAGER (bảng xếp hạng); STAFF (góc nhìn cá nhân) | 7.4 |
| Quản lý KPI | BOD (toàn quyền), MANAGER (chỉ xem) | 7.5 |

### 1.3. Ngoài phạm vi bản 1
- KPI cá nhân (QĐ-08).
- **[Hoãn]** Tỷ lệ chuyển đổi KTV, bảng hiệu suất KTV khúc xạ, độ chính xác đo khám, phễu chuyển đổi (báo giá), nguyên nhân trả hàng/hủy (QĐ-13).
- Phân loại vòng đời sản phẩm (QĐ-14).
- Công đoạn mài lắp / "Đo khám" trong Cảnh báo tồn đọng (POS chưa ghi công đoạn; Order Aging dùng 2 chặng Đặt hàng / Hoàn thành đơn hàng — QĐ-29).
- **[Hoãn]** Bảng hiệu suất phòng Lab / KTV mài lắp (chưa có Lab — QĐ-31).
- Thông báo (chuông), ứng dụng di động riêng.

### 1.4. Quy ước chung
| Quy ước | Giá trị |
|---|---|
| Múi giờ nghiệp vụ | Asia/Ho_Chi_Minh (UTC+7). Mọi phép cắt "ngày" dùng múi giờ này |
| Kỳ báo cáo | Khoảng ngày đóng `[Từ ngày 00:00:00, Đến ngày 23:59:59]` |
| Tiền tệ | VNĐ. Mọi phép tính ở đơn vị ₫ đầy đủ; chỉ làm tròn **khi hiển thị** |
| Làm tròn hiển thị | Half-up (0,05 → 0,1) |
| Thời điểm dữ liệu (data-as-of) | Mọi số liệu tính theo trạng thái dữ liệu tại thời điểm "Dữ liệu tính đến" hiển thị trên Header |

---

## 2. Mô hình dữ liệu nghiệp vụ

### 2.1. Thực thể và trường tối thiểu dashboard cần
| Thực thể | Trường tối thiểu | Ghi chú |
|---|---|---|
| **Đơn đặt** | mã, chi nhánh, người bán, khách hàng, ngày tạo, trạng thái, ngày kết thúc, ngày hủy, mã Đơn hàng đi kèm (nếu có) | Đơn có cọc / cắt kính / đặt mẫu |
| **Đơn hàng** | mã, mã Đơn đặt gốc (nếu sinh từ đơn đặt), chi nhánh, người bán, khách hàng, kênh bán, ngày tạo, trạng thái, ngày hoàn thành, mã chiến dịch | Gồm đơn lắp sẵn (mua thẳng) và đơn sinh từ Đơn đặt |
| **Dòng hàng** | mã đơn, sản phẩm, số lượng, đơn giá, giảm giá dòng, giảm giá cấp đơn phân bổ, thuế suất VAT áp dụng | Thuế suất **chốt tại thời điểm tạo đơn** (QĐ-09) |
| **Phí vận chuyển** | mã đơn, số tiền | Lưu tách khỏi dòng hàng; **không** vào GMV |
| **Trả hàng** | mã, mã Đơn hàng gốc, dòng hàng trả, số lượng trả, ngày trả | |
| **Phiếu thu / chi** | mã, mã đơn, loại chứng từ (phiếu thu / phiếu chi), số tiền, mã phương thức thanh toán, ngày | POS **chỉ có chứng từ phiếu thu**, không phân biệt cọc / thanh toán / thu nợ (QĐ-26). Chuyển cọc khi đổi hàng không tạo phiếu thu mới; hoàn tiền là phiếu chi |
| **Sổ công nợ khách hàng** | khách hàng, mã đơn, số dư tại cuối mỗi ngày | Dùng cho Nợ treo |
| **Sản phẩm** | mã, tên, ngành hàng, nhóm, thương hiệu, nhà cung cấp, thuộc tính (chiết suất, màu, SPH, CYL, loại tròng), lịch sử thuế suất | |
| **Chi nhánh / Khu vực** | mã, tên, khu vực, kênh (cửa hàng / online), trạng thái hoạt động | Danh mục chủ duy nhất (BR-MD-01) |
| **Nhân viên** | mã, tên, chi nhánh, vai trò | |
| **Traffic** | chi nhánh, ngày, số lượt khách | Dữ liệu nhập tay / import (QĐ-11, QĐ-13) |
| **KPI** | xem 7.5 | |
| **Độ hài lòng / NPS** | chi nhánh, nhân viên (nếu có), ngày, điểm, thang điểm | Đã có trong hệ thống nguồn (QĐ-13) |
| **Lệnh gia công (Lab)** | mã đơn, kỹ thuật viên, ngày nhận, hạn cam kết, ngày xong, số phôi dùng, số phôi hỏng, công đoạn hiện tại | |

### 2.2. Trạng thái đơn
**Đơn đặt**
| Trạng thái nghiệp vụ | Ý nghĩa | Tính GMV? |
|---|---|---|
| Đơn tạm | Đơn đặt đã tạo, chưa chuyển thành Đơn hàng | **Có**, từ ngày tạo |
| Đã chuyển Đơn hàng (Hoàn thành) | Đã ra Đơn hàng đi kèm | Có (giữ nguyên giá trị đã ghi nhận) |
| Kết thúc (không ra Đơn hàng) | Thu ngân bấm "Kết thúc" — nghiệp vụ đổi hàng | Có tại ngày tạo; **trừ** tại ngày kết thúc |
| Hủy (sau khi là Đơn tạm) | Khách hủy, hoàn cọc | Có tại ngày tạo; **trừ** tại ngày hủy |
| Nháp / chưa lưu (nếu hệ thống có) | Chưa thành Đơn tạm | Không |

**Đơn hàng**
| Trạng thái nghiệp vụ | Tính GMV? |
|---|---|
| Hoàn thành, **không** sinh từ Đơn đặt | **Có**, theo ngày tạo đơn |
| Hoàn thành, sinh từ Đơn đặt | **Không** (giá trị đã tính ở Đơn đặt) |
| Chưa hoàn thành (đang xử lý, chờ giao…) | Không — khi hoàn thành mới được tính, vào ngày tạo đơn |
| Hủy | Không |

**Bảng ánh xạ trạng thái (QC điền khi nhận code dev)**
| Trạng thái nghiệp vụ | Mã / tên trạng thái trong hệ thống dev | Bảng / trường | Người xác nhận |
|---|---|---|---|
| Đơn đặt — Đơn tạm | | | |
| Đơn đặt — Đã chuyển Đơn hàng | | | |
| Đơn đặt — Kết thúc | | | |
| Đơn đặt — Hủy | | | |
| Đơn hàng — Hoàn thành | | | |
| Đơn hàng — Hủy | | | |
| Công đoạn: Mài lắp / gia công | | | |
| Công đoạn: Vận chuyển | | | |

### 2.3. Sự kiện ghi nhận (bảng gốc của mọi công thức)
| # | Sự kiện | Tác động | Giá trị | Ngày ghi nhận | Chi nhánh / người bán được gán |
|---|---|---|---|---|---|
| E1 | Đơn đặt trở thành **Đơn tạm** | +GMV, +Volume gộp | Giá trị Đơn đặt | **Ngày tạo** Đơn đặt | Của Đơn đặt |
| E2 | Đơn hàng **không** từ Đơn đặt đạt **Hoàn thành** | +GMV, +Volume gộp | Giá trị Đơn hàng | **Ngày tạo** Đơn hàng | Của Đơn hàng |
| E3 | Đơn đặt chuyển thành Đơn hàng | Không tác động GMV | — | — | — |
| E4 | **Trả hàng** | −Giá trị điều chỉnh (thành phần Trả hàng) | Giá trị các dòng trả (BR-VAL-04) | **Ngày trả** | Của **Đơn hàng gốc** |
| E5 | Đơn đặt **Kết thúc** không ra Đơn hàng | −Giá trị điều chỉnh (thành phần Đổi hàng), −Volume | Giá trị Đơn đặt | **Ngày bấm Kết thúc** | Của Đơn đặt |
| E6 | Đơn đặt **Hủy** sau khi là Đơn tạm | −Giá trị điều chỉnh (thành phần Hủy đơn đặt), −Volume | Giá trị Đơn đặt | **Ngày hủy** | Của Đơn đặt |
| E7 | Đơn hàng Hủy (chưa hoàn thành) | Không tác động | — | — | — |
| E8 | Phiếu thu | +Doanh thu thực thu | Số tiền phiếu thu (không gồm phí ship) | Ngày thu | Của đơn |
| E9 | Chuyển cọc từ Đơn đặt sang Đơn hàng mới (đổi hàng) | Không phải tiền thu mới | — | — | — |

**Quy tắc kèm theo**
- **BR-EVT-01.** Giá trị Đơn hàng sinh từ Đơn đặt **luôn bằng** giá trị Đơn đặt — hệ thống nguồn chặn chênh lệch (đã siết luồng). Dashboard không có khoản Upsell/Downsell. Nếu dữ liệu xuất hiện chênh lệch, đó là **lỗi dữ liệu nguồn**: dashboard vẫn dùng giá trị Đơn đặt và đưa đơn vào danh sách cảnh báo chất lượng dữ liệu (P2).
- **BR-EVT-02 — Số liệu quá khứ có thể tăng.** Đơn hàng tạo ngày D nhưng hoàn thành sau D (vd đơn online chờ giao) được cộng vào GMV **của ngày D** khi hoàn thành. Vì vậy GMV của các ngày gần đây có thể tăng khi dữ liệu cập nhật. Header luôn hiển thị "Dữ liệu tính đến HH:MM DD/MM/YYYY".
- **BR-EVT-04 — Ngày tạo đơn (QĐ-17).** "Ngày tạo" của **Đơn hàng** và **Đơn đặt** là thời điểm đơn **được lập thật** trên POS: `SubmitAt`. Khi thu ngân bấm "tạo mới đơn", POS ghi ngay một bản nháp (`SALE_ORDER_DRAFT` / `PRE_ORDER_DRAFT`) và `CreateAt` là lúc mở nháp — **không dùng** `CreateAt`; nháp bị bỏ không bao giờ hoàn thành nên không vào GMV. Đơn bán tại quầy trả tiền mặt hoàn thành ngay, POS gán `SubmitAt` = thời điểm hoàn thành. Không dùng `IssueAt` (bị ghi đè bằng thời điểm hoàn thành). Mọi mốc quy đổi về UTC+7.
- **BR-EVT-05 — Đơn đặt chuyển một phần (QĐ-18).** Một Đơn đặt có thể sinh nhiều Đơn hàng. GMV ghi **toàn bộ** giá trị Đơn đặt tại ngày tạo; mọi Đơn hàng sinh từ nó đều không cộng vào GMV và M02g. Khi Kết thúc hoặc Hủy, khoản trừ (E5, E6) chỉ bằng **phần chưa chuyển** thành Đơn hàng còn hiệu lực. M02 chỉ trừ 1 khi Đơn đặt chưa chuyển phần nào.
- **BR-EVT-06 — Đổi hàng sau bán (QĐ-19).** Khi khách đổi hàng đã mua (POS tạo phiếu trả kèm đơn đổi), phiếu trả là sự kiện **E4 Trả hàng**, đơn đổi là sự kiện **E2** (Đơn hàng mới tính GMV bình thường) — gọi chung là **E10**.
- **BR-EVT-03 — Điều chỉnh có thể rơi vào kỳ khác.** Trả hàng, Kết thúc, Hủy ghi nhận tại ngày phát sinh, nên có thể làm giảm Doanh thu thuần của một kỳ khác kỳ ghi GMV. Doanh thu thuần của một kỳ hoặc một phạm vi **có thể âm**; hiển thị đúng giá trị âm, không ép về 0.

### 2.4. Giá trị đơn và dòng hàng (BR-VAL)
- **BR-VAL-01 — Giá trị dòng** = số lượng × đơn giá − giảm giá dòng − giảm giá cấp đơn phân bổ **+ VAT của dòng**, là số tiền khách cam kết trả cho hàng hóa. *(QĐ-16: POS lưu giá chưa VAT và cộng VAT khi xuất hóa đơn; **100% đơn đều xuất VAT**.)*
- **BR-VAL-02 — Phân bổ giảm giá cấp đơn** xuống các dòng **theo tỷ lệ** giá trị dòng trước giảm giá cấp đơn. Phần lẻ do làm tròn dồn vào dòng có giá trị lớn nhất.
- **BR-VAL-03 — Giá trị đơn** = Σ giá trị dòng. **Không** gồm phí vận chuyển (lưu dòng riêng).
- **BR-VAL-04 — Giá trị trả hàng** = Σ (số lượng trả × giá trị một đơn vị của dòng gốc theo BR-VAL-01), gồm VAT, không phí ship.
- **BR-VAL-05 — VAT của dòng** = số VAT POS đã tính cho dòng (`VatAmount`) theo thuế suất của sản phẩm **tại thời điểm tạo đơn** (QĐ-09). Hàng trả dùng thuế suất của dòng gốc.

### 2.5. Quy tắc gán chiều phân tích
| Chiều | Gán theo |
|---|---|
| Chi nhánh / Khu vực | Chi nhánh của đơn phát sinh GMV. Trả hàng, Kết thúc, Hủy gán theo chi nhánh của **đơn gốc** (kể cả khi trả hàng tại chi nhánh khác) |
| Người bán (PIC Sales) | Người bán được gán trên đơn phát sinh GMV. Các khoản điều chỉnh gán cho người bán của **đơn gốc** |
| Sản phẩm, ngành hàng, thương hiệu, NCC | Theo **dòng hàng**. Khoản điều chỉnh của Kết thúc/Hủy phân bổ theo các dòng của Đơn đặt; trả hàng theo dòng trả |
| Kênh bán | Theo chi nhánh/kênh của đơn. Chỉ số dựa trên Traffic chỉ áp dụng kênh cửa hàng |
| Chiến dịch | Mã chiến dịch trên đơn |
| Khách hàng (giới tính, tuổi) | Theo hồ sơ khách tại thời điểm tạo đơn. Thiếu thông tin thì xếp nhóm "Không xác định" |

**BR-DIM-01 — Đếm đơn khi lọc theo chiều dòng hàng.** Khi lọc theo ngành hàng / thương hiệu / NCC, GMV là tổng các **dòng** khớp bộ lọc; số đơn là số đơn có **ít nhất một dòng** khớp.

**BR-DIM-02 — Chỉ số dùng cho xếp hạng.** Phân tích **hiệu suất bán** (xếp hạng nhân viên, sản phẩm, thương hiệu, phân tích đa chiều, treemap) dùng **GMV** và số lượng. Phân tích **tài chính** (thẻ tài chính, Waterfall, bảng xếp hạng chi nhánh) dùng cả GMV và Doanh thu thuần như đặc tả từng widget.

---

## 3. Từ điển chỉ số — công thức chuẩn

### 3.1. Văn bản định nghĩa chính thức (QĐ-01, bắt buộc và duy nhất)

> **GMV (Sức bán)** = tổng giá trị các đơn hợp lệ phát sinh trong kỳ:
> - tính theo **giá khách cam kết trả**: đã trừ giảm giá trên đơn, **đã gồm VAT**;
> - **không** gồm phí vận chuyển;
> - ghi nhận theo **ngày tạo đơn**;
> - **chưa trừ** trả hàng / kết thúc / hủy sau bán;
> - **Đơn đặt** được tính khi ở trạng thái **"Đơn tạm"** (tức ngay khi tạo). **Đơn hàng** được tính khi ở trạng thái **"Hoàn thành"**. Đơn hàng sinh ra từ một Đơn đặt **không** được tính lại.
>
> **Giá trị điều chỉnh** = − (Trả hàng) − (Đơn đặt **Kết thúc** không có Đơn hàng đi kèm) − (Đơn đặt **Hủy** sau khi đã là Đơn tạm). Mỗi khoản ghi nhận tại **ngày phát sinh** (ngày trả / ngày bấm Kết thúc / ngày hủy). Luôn ≤ 0.
>
> **Doanh thu thuần (DTT)** = GMV + Giá trị điều chỉnh.

Mọi widget, tooltip (i), modal, API và file xuất dữ liệu phải dùng đúng định nghĩa này và đúng tên gọi này.

### 3.2. Bảng tóm tắt chỉ số
| Mã | Tên hiển thị | Công thức ngắn | Chiều tốt |
|---|---|---|---|
| M01 | GMV (Sức bán) | Σ E1 + Σ E2 | ↑ |
| M01a | VAT / GMV trước VAT | Σ VAT dòng của đơn trong M01; Trước VAT = M01 − VAT | — |
| M02g | Đơn hàng gộp | COUNT(E1) + COUNT(E2) | ↑ |
| M02 | Đơn hàng (Volume) | M02g − COUNT(E5) − COUNT(E6) | ↑ |
| M03 | Khách hàng mới | Khách có đơn ghi nhận GMV đầu tiên trong lịch sử rơi vào kỳ | ↑ |
| M04 | Doanh thu (thực thu) | Σ E8 theo ngày thu | ↑ |
| M05 | Giá trị điều chỉnh | −(M05a + M05b + M05c) | nghịch |
| M05a | Trả hàng | Σ E4 | nghịch |
| M05b | Đổi hàng từ đơn đặt (Kết thúc) | Σ E5 | nghịch |
| M05c | Hủy đơn đặt | Σ E6 | nghịch |
| M06 | Doanh thu thuần (DTT) | M01 + M05 | ↑ |
| M07 | Biên lợi nhuận gộp | (M06 − Giá vốn thuần) / M06 | ↑ |
| M08 | AOV (Giá trị đơn TB) | M06 / M02 | ↑ |
| M09 | UPT (Số SP / đơn) | Σ số lượng dòng của đơn trong M01 / M02g | ↑ |
| M10 | Nợ treo | Số dư nợ dương cuối ngày "Đến ngày" | nghịch |
| M11 | Tỷ trọng nguồn GMV | GMV Đơn đặt / M01; GMV Đơn hàng không từ đơn đặt / M01 | — |
| M12 | Tỷ lệ trả hàng (giá trị) | M05a / M01 | nghịch |
| M13 | Tỷ lệ trả hàng (hóa đơn) | Số Đơn hàng có phát sinh trả hàng trong kỳ / M02g | nghịch |
| M13b | Tỷ lệ đổi hàng từ đơn đặt | M05b / M01 | nghịch |
| M13c | Tỷ lệ hủy đơn đặt | M05c / M01 | nghịch |
| M14 | Tỷ lệ chuyển đổi cửa hàng | M02g / Traffic (chỉ kênh cửa hàng) | ↑ |
| M15 | Tỷ lệ chuyển đổi KTV | **[Hoãn]** | ↑ |
| M16 | % đạt mục tiêu | Thực tế / Mục tiêu phân bổ (BR-TGT) | ↑ |
| M17 | Tăng trưởng % | (Kỳ gốc − Kỳ so sánh) / Kỳ so sánh (BR-CMP) | theo chỉ số |
| M18 | Tỷ lệ khách quay lại | Khách có đơn trong kỳ và đã có đơn trước kỳ / Khách có đơn trong kỳ | ↑ |
| M19 | Độ hài lòng | Trung bình điểm hài lòng/NPS trong kỳ, theo thang của nguồn | ↑ |

### 3.3. Đặc tả chi tiết (giả mã)
Giả mã dùng tên thực thể ở mục 2.1. `K = [Từ ngày, Đến ngày]`, `P` = phạm vi lọc (chi nhánh, khu vực, chiều đa chiều), `gia_tri()` theo BR-VAL-03.

**M01 — GMV**
```
GMV(K, P) =
    Σ gia_tri(dd)  với dd ∈ Đơn đặt,  dd đã đạt "Đơn tạm",            dd.ngay_tao ∈ K, dd ∈ P
  + Σ gia_tri(dh)  với dh ∈ Đơn hàng, dh.ma_don_dat IS NULL,
                                      dh.trang_thai = "Hoàn thành",   dh.ngay_tao ∈ K, dh ∈ P
```
- Đơn đặt bị Kết thúc/Hủy **vẫn** nằm trong GMV của kỳ tạo (khoản trừ nằm ở M05).
- Đơn hàng có `ma_don_dat` **không bao giờ** cộng vào GMV.
- Hiển thị: đơn vị tự động (BR-FMT-02).

**M01a — VAT**
```
VAT(K, P)          = Σ gia_tri_dong × t_dong / (1 + t_dong)   trên các dòng của đơn thuộc M01
GMV_truoc_VAT(K,P) = GMV(K, P) − VAT(K, P)
```

**M02g / M02 — Đơn hàng**
```
M02g(K, P) = COUNT(dd thuộc vế 1 của M01) + COUNT(dh thuộc vế 2 của M01)
M02(K, P)  = M02g(K, P)
           − COUNT(dd Kết thúc không có Đơn hàng, dd.ngay_ket_thuc ∈ K, dd ∈ P)
           − COUNT(dd Hủy sau Đơn tạm,           dd.ngay_huy ∈ K,       dd ∈ P)
```
- Trả hàng **không** làm giảm số đơn.
- Thẻ "Đơn hàng (Volume)" hiển thị M02, phụ đề "Gộp: M02g · Kết thúc/Hủy: −k".

**M03 — Khách hàng mới**
```
M03(K, P) = COUNT DISTINCT kh  với  MIN(ngày tạo các đơn ghi nhận GMV của kh trên toàn hệ thống) ∈ K
                                và  đơn đầu tiên đó ∈ P
                                và  kh không phải khách lẻ không định danh (KHACHLE)   // QĐ-20
```

**M04 — Doanh thu (thực thu)**
```
M04(K, P) = Σ phieu_thu.so_tien  với ngay ∈ K, đơn ∈ P        // mọi phiếu thu (QĐ-26)
            (không gồm phí vận chuyển; không trừ hoàn tiền; không tính phiếu "chuyển cọc")
```
- M04 có thể lớn hơn M01 trong một kỳ (thu tiền của đơn kỳ trước) — hợp lệ.

**M05 — Giá trị điều chỉnh**
```
M05a(K, P) = Σ gia_tri_tra(th)  với th ∈ Trả hàng,  th.ngay_tra ∈ K,      đơn gốc ∈ P
M05b(K, P) = Σ gia_tri(dd)      với dd Kết thúc không có Đơn hàng, dd.ngay_ket_thuc ∈ K, dd ∈ P
M05c(K, P) = Σ gia_tri(dd)      với dd Hủy sau Đơn tạm,           dd.ngay_huy ∈ K,       dd ∈ P
M05(K, P)  = −(M05a + M05b + M05c)
```

**M06 — Doanh thu thuần**
```
M06(K, P) = M01(K, P) + M05(K, P)        // có thể âm (BR-EVT-03)
```

**M07 — Biên lợi nhuận gộp**
```
Gia_von_thuan = Σ giá vốn các dòng thuộc M01 − Σ giá vốn các dòng thuộc M05a, M05b, M05c (cùng kỳ ghi nhận)
M07 = (M06 − Gia_von_thuan) / M06 × 100      // M06 ≤ 0 → hiển thị "—"
```
- Tính trên tổng kỳ (gia quyền), **không** lấy trung bình theo ngày. Thay đổi so kỳ trước hiển thị theo **điểm %**.

**M08 — AOV**
```
M08(K, P) = M06(K, P) / M02(K, P)        // M02 ≤ 0 → "—"
```
- Mọi widget hiển thị AOV dùng đúng công thức này. "AOV trung bình" của nhiều kỳ = ΣM06 / ΣM02 (gia quyền), **không** lấy trung bình các AOV kỳ.

**M09 — UPT**
```
M09(K, P) = Σ so_luong các dòng của đơn thuộc M01 / M02g      // M02g = 0 → "—"
```

**M10 — Nợ treo**
```
M10(P, D) = Σ max(0, so_du_cong_no(kh, đơn))  tại cuối ngày D = "Đến ngày", đơn ∈ P
Phụ đề: "Chiếm x,x% GMV" = M10 / M01(K, P)
So sánh kỳ trước: M10 tại cuối ngày trước "Từ ngày"
```

**M12 – M13c — Tỷ lệ**
```
M12  = M05a / M01 × 100
M13  = COUNT DISTINCT Đơn hàng gốc có th.ngay_tra ∈ K / M02g × 100
M13b = M05b / M01 × 100
M13c = M05c / M01 × 100          // mẫu số 0 → "—"
```

**M14 — Tỷ lệ chuyển đổi cửa hàng**
```
M14(K, P) = M02g(K, P ∩ kênh cửa hàng) / Σ traffic(K, P ∩ kênh cửa hàng) × 100
```
- Chỉ tính trên các (chi nhánh, ngày) **đã có Traffic**. Cặp thiếu Traffic bị loại khỏi cả tử và mẫu, và widget hiển thị số ngày thiếu dữ liệu.

**M16 — % đạt mục tiêu**: theo BR-TGT (mục 4.2). **M17 — Tăng trưởng**: theo BR-CMP (mục 4.1).

**M18 — Tỷ lệ khách quay lại**
```
M18 = COUNT DISTINCT kh (có đơn ghi nhận GMV trong K  VÀ  có đơn ghi nhận GMV trước Từ ngày)
      / COUNT DISTINCT kh (có đơn ghi nhận GMV trong K) × 100
```

### 3.4. Bất biến số liệu (kiểm thử tự động)
| Mã | Bất biến (đúng với mọi K, P) |
|---|---|
| INV-01 | M06 = M01 + M05 |
| INV-02 | M05 = −(M05a + M05b + M05c) và M05 ≤ 0 |
| INV-03 | Σ M01 theo các chi nhánh của khu vực = M01 khu vực; Σ khu vực = toàn hệ thống. Tương tự cho M05, M06, M02 |
| INV-04 | M01 = GMV Đơn đặt + GMV Đơn hàng không từ đơn đặt (khớp widget Phân rã nguồn GMV) |
| INV-05 | Σ M01 theo ngành hàng (theo dòng) = M01 |
| INV-06 | M08 × M02 = M06 (sai số chỉ do làm tròn hiển thị) |
| INV-07 | M01a: VAT + GMV trước VAT = M01 |
| INV-08 | Cột đầu Waterfall = thẻ GMV; cột cuối Waterfall = thẻ DTT = điểm cuối lũy kế DTT ở Xu hướng lũy kế = dòng tổng DTT của Bảng xếp hạng (cùng K, P) |
| INV-09 | Σ GMV theo nhân viên = M01 của phạm vi (đơn không gán người bán gom vào dòng "Chưa gán") |
| INV-10 | Không đơn hàng nào có `ma_don_dat` khác rỗng đóng góp vào M01 hoặc M02g |
| INV-11 | Mọi tổng tiền ở trang Vận hành, Sản phẩm, Nhân sự (cùng K, P) khớp M01 hoặc M06 theo đúng chỉ số mà widget công bố |
| INV-12 | Cùng K, P và cùng thời điểm dữ liệu → mọi widget trả cùng một số qua các lần tải lại (không ngẫu nhiên) |

---

## 4. Quy tắc chung

### 4.1. So sánh kỳ (BR-CMP)
- **BR-CMP-01 — Kỳ so sánh.** Kỳ gốc `[S, E]` có `n` ngày (tính cả 2 đầu) → kỳ so sánh `[S − n, S − 1]`.
- **BR-CMP-02 — Tăng trưởng tổng** của một widget = (Σ kỳ gốc − Σ kỳ so sánh) / Σ kỳ so sánh, **không phụ thuộc** cách gom nhóm Chu kỳ, và **bằng** % trên thẻ tương ứng.
- **BR-CMP-03 — Tăng trưởng từng bucket** = so với bucket liền trước cùng độ dài (tuần trước, tháng trước…). **[P2]** tùy chọn cùng kỳ năm trước.
- **BR-CMP-04 — Mẫu số 0 hoặc âm** → hiển thị "—".
- **BR-CMP-05 — Mũi tên và màu.** Mũi tên theo **chiều thay đổi thực** của giá trị (↑ tăng, ↓ giảm). Màu theo cột "Chiều tốt": chỉ số thuận tăng = xanh, giảm = đỏ; chỉ số **nghịch** (Nợ treo, các tỷ lệ trả/đổi/hủy, độ lớn của Giá trị điều chỉnh) tăng = đỏ, giảm = xanh.
- **BR-CMP-06 — Chân thẻ** hiển thị kỳ gốc và kỳ so sánh: `DD/MM/YYYY — DD/MM/YYYY`.
- **BR-CMP-07 — Chỉ số dạng tỷ lệ** (biên LN, các tỷ lệ) hiển thị thay đổi theo **điểm %** ("+0,3 điểm %").

### 4.2. Mục tiêu (BR-TGT)
- **BR-TGT-01 — Nguồn duy nhất.** Mọi mục tiêu trên dashboard lấy từ KPI **"Đang áp dụng"** ở module Quản lý KPI. KPI chỉ có cấp Công ty / Khu vực / Chi nhánh (QĐ-08). Không có giá trị mục tiêu mặc định ngầm trong code.
- **BR-TGT-02 — Theo phạm vi.** Mục tiêu của phạm vi = KPI của đúng phạm vi đó. Nếu không có, dùng tổng KPI các phạm vi con (chi nhánh → khu vực → công ty).
- **BR-TGT-03 — Phân bổ theo ngày.** Mục tiêu của một khoảng ngày = **Σ mục tiêu từng ngày**. KPI chi nhánh khai báo theo tháng bằng **mục tiêu ngày theo loại ngày** — Trong tuần (T2–T6) · Cuối tuần (T7, CN) · Ngày lễ (QĐ-24, theo cấu trúc thật trong `data-store-kpi.md`). KPI chỉ khai báo tổng chu kỳ thì chia đều theo ngày. Đường tiến độ chuẩn tích lũy theo mục tiêu từng ngày của bucket.
- **BR-TGT-07 — Mục tiêu là GMV (QĐ-25).** Mục tiêu doanh số trong KPI (kể cả dữ liệu `data-store-kpi.md`) là mục tiêu **GMV**; % đạt = GMV / mục tiêu.
- **BR-TGT-04 — Chiến dịch ghi đè.** Trong các ngày của KPI Chiến dịch, mục tiêu ngày lấy từ KPI Chiến dịch. Các ngày còn lại của tháng chia đều phần mục tiêu tháng còn lại (QĐ-08).
- **BR-TGT-05 — Không có KPI** → hiển thị "Chưa thiết lập mục tiêu", ẩn % đạt và đường kế hoạch.
- **BR-TGT-06 — Nhãn lũy kế.** Chỉ gọi "YTD / Lũy kế năm" khi tính từ 01/01; ngược lại gọi "Lũy kế trong kỳ".

### 4.3. Định dạng hiển thị (BR-FMT)
- **BR-FMT-01 — Locale vi-VN cố định:** phân cách nghìn bằng dấu chấm, thập phân bằng dấu phẩy (`5.181`, `21,7%`, `2,35`). Không phụ thuộc locale trình duyệt.
- **BR-FMT-02 — Đơn vị tiền tự động (QĐ-01):**

| Độ lớn \|x\| | Đơn vị | Số lẻ | Ví dụ |
|---|---|---|---|
| ≥ 1 tỷ | Tỷ | 2 | 4,22 Tỷ |
| 10 triệu – < 1 tỷ | Tr | 0 | 512 Tr (không hiển thị "0,51 Tỷ") |
| 1 triệu – < 10 triệu | Tr | 1 | 5,7 Tr |
| < 1 triệu | ₫ | 0 | 713.200 ₫ |

  - Trong **một trục biểu đồ** hoặc **một cột bảng**, mọi giá trị dùng chung đơn vị, chọn theo giá trị có độ lớn lớn nhất.
  - Thẻ KPI, nhãn đơn lẻ và tooltip chọn đơn vị riêng cho từng số. Tooltip và modal **luôn kèm giá trị đầy đủ** bằng ₫.
  - Nếu làm tròn khiến hai giá trị khác nhau trong cùng widget hiển thị giống nhau, tăng thêm 1 số lẻ.
  - Chỉ dùng `Tỷ`, `Tr`, `₫`. Không dùng "T", "M", "B", "k", "đ", "Triệu".
- **BR-FMT-03.** Tỷ lệ: 1 số lẻ (`21,7%`), riêng % đạt mục tiêu 0 số lẻ. Số âm có dấu "−" phía trước.
- **BR-FMT-04.** Không bao giờ hiển thị `NaN`, `undefined`, `Infinity`, `null` hoặc khóa kỹ thuật (`value`, `rate`…). Giá trị không tính được hiển thị "—".
- **BR-FMT-05 — Thuật ngữ:** "Tỷ lệ" (không "Tỉ lệ"); "Doanh thu thuần"; "Đơn lắp sẵn" cho Đơn hàng không qua đơn đặt; "Đơn đặt trước" cho Đơn đặt; ngày dạng `DD/MM/YYYY`.

### 4.4. Dữ liệu chủ & tính xác định (BR-MD, BR-DATA)
- **BR-MD-01 — Danh mục khu vực từ HRM (QĐ-28).** Khu vực và Cụm cửa hàng lấy từ **HRM — Thiết lập chấm công → Khu vực & Cụm cửa hàng** (có CRUD ở đó): **Khu vực** (`StoreCluster`) → **Cụm cửa hàng** (`BuddyStoreGroup`) → **Chi nhánh** (`BuddyStoreGroupSite`). Dashboard đồng bộ danh mục này (không tự tạo, không seed từ `data-store-kpi.md`), dùng cho mọi bộ lọc, widget, KPI và import. Chi nhánh chưa thuộc cụm nào gom vào nhóm "Chưa phân khu vực".
- **BR-MD-04 — Chi nhánh đã đóng (QĐ-21).** Số liệu lịch sử của chi nhánh ngừng hoạt động vẫn tính vào tổng khu vực và toàn hệ thống; bộ chọn chi nhánh hiển thị chúng trong nhóm "Đã đóng".
- **BR-MD-02.** Phân biệt kênh cửa hàng và kênh online. Traffic, Tỷ lệ chuyển đổi cửa hàng và Time Peak chỉ áp dụng kênh cửa hàng.
- **BR-MD-03.** Danh mục ngành hàng chuẩn: Gọng kính · Tròng kính · Kính mát · Kính áp tròng · Phụ kiện & Vật tư. Một tên duy nhất cho mỗi ngành ở mọi widget.
- **BR-DATA-01.** Không sinh số ngẫu nhiên hoặc số giả lập ở bất kỳ widget nào (INV-12).

---

## 5. Phân quyền

| Hạng mục | BOD | MANAGER | STAFF |
|---|---|---|---|
| Phạm vi dữ liệu | Toàn hệ thống | Các cửa hàng được gán | Chỉ dữ liệu của chính mình |
| Tab Tổng quan | ✔ | ✘ | ✘ |
| Tab Vận hành, Sản phẩm | ✔ | ✔ | ✘ |
| Tab Nhân sự | Bảng xếp hạng toàn hệ thống | Bảng xếp hạng cửa hàng mình | Góc nhìn cá nhân |
| Tab Quản lý KPI | Toàn quyền (tạo, sửa, xóa, import) | **Chỉ xem** KPI cửa hàng mình và khu vực/công ty chứa nó | ✘ |
| Nhập / import Traffic | Mọi cửa hàng | Cửa hàng mình | ✘ |
| Xuất dữ liệu từ modal [P2] | ✔ | ✔ (trong phạm vi) | ✘ |
| Bộ chọn Khu vực/Chi nhánh | ✔ | Chỉ cửa hàng được gán (nếu > 1) | ✘ (chip "PIC: <tên>") |

- **BR-ROLE-01.** Vai trò và phạm vi lấy từ tài khoản đăng nhập. Người dùng **không** tự chọn vai trò. Mã quyền (QĐ-22): `dashboard-v2.bod`, `dashboard-v2.manager`, `dashboard-v2.staff`, `dashboard-v2.gmv.read`, `dashboard-v2.kpi.write`, `dashboard-v2.traffic.write`. **Cửa hàng được gán của MANAGER = "Cửa hàng đang quản lý"** trong hồ sơ nhân viên, tức các chi nhánh tài khoản có vai trò trong Identity (`AccountSite` của app, bỏ vai trò `NOAUTHORIZED` và phạm vi trống) (QĐ-27). Tài khoản không có quyền GMV nhận các trường GMV là `null` kèm cờ `gmvHidden` (trang vẫn dùng được).
- **BR-ROLE-02.** Phạm vi dữ liệu áp **ở tầng API/dữ liệu** (row-level security), không chỉ ẩn ở giao diện.
- **BR-ROLE-03.** Vai trò không có quyền với tab đang mở → chuyển về tab đầu tiên được phép.
- **BR-ROLE-04.** Mọi lối vào cùng một chức năng áp cùng một quy tắc quyền.

**AC**
- **AC-ROLE-01** Given MANAGER được gán cửa hàng X, When xem bất kỳ widget nào, Then mọi số liệu chỉ thuộc X.
- **AC-ROLE-02** Given MANAGER gọi API dữ liệu của cửa hàng Y, Then nhận lỗi 403 và không có dữ liệu.
- **AC-ROLE-03** Given STAFF A, Then GMV, số đơn, AOV cá nhân của A **bằng** dòng của A trên bảng xếp hạng mà MANAGER/BOD thấy cho cùng kỳ.
- **AC-ROLE-04** Given MANAGER ở tab Quản lý KPI, Then không có nút Thêm KPI, Import mục tiêu, Sửa, Xóa, chỉnh sửa hàng loạt.
- **AC-ROLE-05** Given STAFF, Then chỉ có tab Hiệu suất Nhân sự (góc nhìn cá nhân).

---

## 6. Bộ lọc

### FR-FLT-01 — Thanh lọc toàn cục
| Điều khiển | Giá trị / hành vi |
|---|---|
| Chu kỳ | Theo Ngày / Tuần / Tháng / Quý / Năm — mặc định **Tuần** |
| Từ ngày – Đến ngày | Mặc định **từ ngày 1 của tháng hiện tại đến hôm qua** (QĐ-07). Nếu hôm nay là ngày 1 thì dùng cả tháng trước |
| Khu vực → Cụm cửa hàng → Chi nhánh | Cascade theo danh mục HRM (BR-MD-01) |
| Bộ lọc đa chiều | FR-FLT-03 |
| Đồng bộ | Tải lại dữ liệu từ nguồn, cập nhật "Dữ liệu tính đến" |

- **BR-FLT-01 — Cascade 3 cấp.** Đổi Khu vực → danh sách Cụm và Chi nhánh chỉ còn phần thuộc khu vực đó; đổi Cụm → danh sách Chi nhánh chỉ còn chi nhánh của cụm. Cấp dưới về "Tất cả" khi cấp trên đổi. Chọn Chi nhánh khi cấp trên = "Tất cả" → Cụm và Khu vực tự đặt theo chi nhánh.
- **BR-FLT-02 — Validate ngày.** Không cho Từ > Đến, không để trống, khoảng tối đa 3 năm. Vi phạm → báo lỗi tại ô, giữ nguyên số liệu của bộ lọc hợp lệ gần nhất.
- **BR-FLT-03 — Phạm vi áp dụng** theo ma trận ở FR-FLT-05.
- **BR-FLT-04 — Lưu trạng thái** bộ lọc trong URL để chia sẻ link và giữ khi tải lại trang [P2].

### FR-FLT-02 — Bộ lọc cục bộ (Local Filter)
Áp cho 7 widget trang Tổng quan có bộ chọn Khu vực/Chi nhánh riêng (FR-EX-02 … FR-EX-07, FR-EX-09).
- **BR-FLT-05.** Khởi tạo = giá trị toàn cục. Đổi toàn cục → **ghi đè** mọi bộ lọc cục bộ. Đổi cục bộ chỉ tác động widget đó. Chu kỳ ("Chu kỳ") của từng thẻ biểu đồ cũng là bộ lọc cục bộ, dùng cùng quy tắc ghi đè: khởi tạo bằng chu kỳ toàn cục, đổi chu kỳ toàn cục thì ghi đè chu kỳ của mọi thẻ, đổi chu kỳ ở một thẻ chỉ tác động thẻ đó.
- **BR-FLT-06.** Khi bộ lọc cục bộ khác toàn cục, widget hiển thị nhãn "Đang lọc riêng: <phạm vi>". Nhãn này bao gồm cả chu kỳ khi chu kỳ của thẻ khác toàn cục (ví dụ "Đang lọc riêng: Miền Bắc · Chu kỳ Quý"); thẻ hiển thị nút "↺ Theo bộ lọc chung" để đưa chu kỳ về giá trị toàn cục.
- **BR-FLT-07.** Bộ lọc cục bộ chỉ được chọn trong phạm vi quyền.

### FR-FLT-03 — Bộ lọc đa chiều
Nhóm: Ngành hàng · Thương hiệu · Giới tính khách · Phân khúc hóa đơn · Người bán (PIC Sales) · Trạng thái đơn.
- **BR-FLT-08.** Giá trị lấy từ danh mục chủ; danh sách PIC theo phạm vi quyền. **Không** có mục "KTV khúc xạ" trong bản 1 (QĐ-13).
- **BR-FLT-09.** "Áp dụng" tác động mọi widget có chiều tương ứng (BR-DIM-01). Widget không hỗ trợ một chiều đang lọc hiển thị "Không áp dụng bộ lọc: <chiều>".
- **BR-FLT-10.** Nút "Bộ lọc đa chiều" có badge số bộ lọc đang bật và nút "Xóa bộ lọc".
- **BR-FLT-11.** Phân khúc hóa đơn dùng cùng dải với widget Basket Size (FR-OP-04).

### FR-FLT-04 — Gom nhóm theo Chu kỳ
| Chu kỳ | Quy tắc | Nhãn |
|---|---|---|
| Ngày | 1 bucket / ngày | `DD/MM` |
| Tuần | Tuần **ISO** (Thứ 2 – Chủ nhật) (QĐ-05) | `Tuần NN (DD/MM–DD/MM)` |
| Tháng | Tháng lịch | `MM/YYYY` |
| Quý | Quý lịch | `Qn/YYYY` |
| Năm | Năm lịch | `YYYY` |
- **BR-FLT-12 — Kỳ lẻ.** Bucket đầu/cuối bị cắt bởi khoảng lọc gắn nhãn "(một phần: n ngày)", nhận mục tiêu theo số ngày thực (BR-TGT-03) và không được dùng để tính trung bình mà không chuẩn hóa theo ngày.
- **BR-FLT-13.** Khi số nhãn trục vượt độ rộng hiển thị, tự giãn nhãn (bỏ bớt nhãn xen kẽ); nhãn không được chồng lên nhau.

### FR-FLT-05 — Ma trận tác động bộ lọc
| Widget | Ngày | Chu kỳ | Khu vực / Chi nhánh | Đa chiều |
|---|---|---|---|---|
| Thẻ tài chính (FR-EX-01) | ✔ | — | ✔ | ✔ |
| GMV vs DTT, Hiệu quả đơn hàng, Phân rã GMV, Tăng trưởng | ✔ | ✔ | ✔ | ✔ |
| Waterfall, Bảng xếp hạng | ✔ | — | ✔ | ✔ |
| Xu hướng lũy kế (gồm mục tiêu) | ✔ | ✔ | ✔ | ✔ (mục tiêu không đổi theo đa chiều; hiển thị chú thích) |
| Bản đồ hiệu suất chi nhánh | ✔ | tab riêng Ngày/Tuần/Tháng | ✔ | — |
| Trang Vận hành | ✔ | ✔ (widget có trục thời gian) | ✔ | ✔ |
| Trang Sản phẩm | ✔ | ✔ (Product Growth) | ✔ | ✔ |
| Trang Nhân sự | ✔ | — | ✔ | ✔ (Ngành hàng, Thương hiệu) |
| Trang KPI | lọc theo chu kỳ KPI riêng | — | ✔ (phạm vi) | — |

**AC**
- **AC-FLT-01** Given Khu vực = Miền Nam, Then danh sách Chi nhánh chỉ gồm chi nhánh Miền Nam.
- **AC-FLT-02** Given đổi Khu vực toàn cục, Then mọi bộ lọc cục bộ nhận cùng giá trị; đổi cục bộ một widget chỉ widget đó cập nhật.
- **AC-FLT-03** When Từ ngày > Đến ngày, Then hiện lỗi tại ô ngày và không widget nào hiển thị NaN.
- **AC-FLT-04** Given 31/01/2026 – 31/05/2026, Chu kỳ Tháng, Then trục có 5 nhãn 01/2026 … 05/2026.
- **AC-FLT-05** Given 01/06/2026 – 30/09/2026, Chu kỳ Quý, Then 2 bucket "Q2/2026 (một phần: 30 ngày)" và "Q3/2026".
- **AC-FLT-06** Given bộ lọc đa chiều Ngành hàng = Tròng kính, When Áp dụng, Then GMV mọi widget = tổng các dòng tròng kính và badge hiển thị "1".

---

## 7. Đặc tả UI theo trang

Mỗi widget: **Mục đích · Hiển thị · Chỉ số · Tương tác · Quy tắc · AC.** Mọi widget đều tuân BR-FMT, BR-CMP, FR-FLT-05 và có trạng thái rỗng / lỗi / đang tải theo FR-CMN-03.

### 7.0. Khung ứng dụng
**FR-SHELL-01 — Header:** logo + "EBID Workspace — Eyewear Business Intelligence Dashboard" (tiêu đề tab trình duyệt dùng cùng tên); "Dữ liệu tính đến HH:MM DD/MM/YYYY"; nút "Cấu hình KPI" (chỉ BOD); avatar hiển thị tên và vai trò người đăng nhập.
**FR-SHELL-02 — Thanh tab:** 5 tab theo mục 1.2, ẩn tab không có quyền. Thanh lọc dính (sticky) ở đỉnh khi cuộn, không che Header.
- **AC-SHELL-01** When bấm Đồng bộ, Then hiển thị trạng thái đang tải, dữ liệu được tải lại và "Dữ liệu tính đến" cập nhật theo thời điểm dữ liệu mới nhất.

### 7.1. Trang Tổng quan — BOD
Thứ tự: (1) Thẻ tài chính → (2) GMV vs DTT | Waterfall → (3) Hiệu quả đơn hàng → (4) Phân rã nguồn GMV → (5) Xu hướng lũy kế & Tiến độ kế hoạch → (6) Bảng xếp hạng → (7) Bản đồ hiệu suất chi nhánh → (8) Phân tích Tăng trưởng.

#### FR-EX-01 — Thẻ chỉ số tài chính (9 thẻ)
**Hiển thị:** hàng 1: GMV · Khách hàng mới · Doanh thu (thực thu) · Giá trị điều chỉnh · Doanh thu thuần. Hàng 2: Nợ treo · Biên lợi nhuận gộp · Đơn hàng (Volume) · AOV.
Mỗi thẻ có: giá trị + đơn vị, phụ đề, % so kỳ trước (mũi tên + màu), sparkline theo ngày, chân thẻ khoảng ngày, icon (i).
| Thẻ | Giá trị | Phụ đề |
|---|---|---|
| GMV (Sức bán) | M01 | "Trước VAT: … · VAT: …" (M01a) |
| Khách hàng mới | M03 | "Bình quân x,x khách/ngày" = M03 / số ngày kỳ |
| Doanh thu (thực thu) | M04 | "Tiền thu trong kỳ (trước hoàn tiền)" |
| Giá trị điều chỉnh | M05 | "Trả hàng −a · Đổi hàng −b · Hủy đơn đặt −c" |
| Doanh thu thuần | M06 | "x,x% GMV" |
| Nợ treo | M10 | "Chiếm x,x% GMV" |
| Biên lợi nhuận gộp | M07 | "Trên Doanh thu thuần" |
| Đơn hàng (Volume) | M02 | "Gộp: M02g · Kết thúc/Hủy: −k" |
| AOV | M08 | "Trước VAT: …" |

**Tương tác:** hover/focus icon (i) → định nghĩa + công thức theo mục 3; hover sparkline → giá trị ngày [P2].
**AC**
- **AC-EX01-01** Given K, P bất kỳ, Then 9 thẻ hiển thị đúng M01, M03, M04, M05, M06, M10, M07, M02, M08 của (K, P), kể cả khi P là một khu vực hoặc chi nhánh.
- **AC-EX01-02** Then thẻ DTT = thẻ GMV + thẻ Giá trị điều chỉnh (INV-01), và công thức trong (i) tái tạo được con số.
- **AC-EX01-03** Then % so kỳ trước theo BR-CMP-01; chân thẻ hiển thị 2 khoảng ngày (BR-CMP-06).
- **AC-EX01-04** Given Nợ treo tăng so kỳ trước, Then mũi tên ↑ màu đỏ; giảm → ↓ màu xanh.
- **AC-EX01-05** Given GMV của phạm vi = 512.300.000 ₫, Then thẻ hiển thị "512 Tr"; tooltip có "512.300.000 ₫".
- **AC-EX01-06** Given Volume = 0, Then thẻ AOV hiển thị "—".
- **AC-EX01-07** Given DTT âm, Then thẻ DTT hiển thị giá trị âm (vd "−1,6 Tr") màu đỏ.
- **AC-EX01-08** Given đơn có sản phẩm thuế suất 8% và 10%, Then VAT trên thẻ GMV = Σ VAT theo dòng (BR-VAL-05).

#### FR-EX-02 — GMV vs Doanh thu thuần theo kỳ
**Hiển thị:** cột GMV + đường DTT theo Chu kỳ; nhãn "−x,x%" trên đỉnh cột = (M01 − M06) / M01.
**Quy tắc:** trục Y của cột **bắt đầu từ 0**; bucket lẻ theo BR-FLT-12.
- **AC-EX02-01** Given Chu kỳ Tháng, Then mỗi bucket hiển thị cột GMV, điểm DTT và % chênh đúng công thức.
- **AC-EX02-02** When hover, Then tooltip: GMV, DTT, Chênh lệch, % chênh, kèm giá trị ₫ đầy đủ.
- **AC-EX02-03** Then Σ GMV các bucket = thẻ GMV; Σ DTT các bucket = thẻ DTT.

#### FR-EX-03 — Thác nước Doanh thu (Waterfall)
**Hiển thị:** 5 cột theo thứ tự: **Tổng GMV** → **Trả hàng** → **Đổi hàng từ đơn đặt** (Đơn đặt Kết thúc) → **Hủy đơn đặt** → **Doanh thu thuần**. Tổng theo cả khoảng ngày (không theo Chu kỳ).
**Quy tắc:** cột đầu = M01; 3 cột giữa = −M05a, −M05b, −M05c; cột cuối = M06. Cột có giá trị 0 vẫn hiển thị với nhãn "0". DTT âm → cột cuối nằm dưới trục 0.
- **AC-EX03-01** Then các cột thỏa INV-08 với thẻ tài chính cùng (K, P).
- **AC-EX03-02** When hover cột giảm trừ, Then tooltip: giá trị, % so với GMV, số đơn liên quan.
- **AC-EX03-03** When đổi Chu kỳ, Then Waterfall không đổi.
- **AC-EX03-04** Then nhãn trục không bị cắt; đơn vị trục theo BR-FMT-02.

#### FR-EX-04 — Hiệu quả đơn hàng: AOV – Volume – UPT
**Hiển thị:** 3 thẻ tóm tắt: AOV kỳ (M08 gia quyền); Volume TB / bucket và tổng (M02); UPT (M09). 3 chế độ:
- (a) **Phóng to trục Y:** 3 biểu đồ riêng; đường trung bình; cột Volume ≥ TB tô đậm. Biểu đồ **đường** được phép phóng to trục; biểu đồ **cột** bắt đầu từ 0.
- (b) **Combo:** cột Volume + đường AOV + đường UPT; chọn "Cả 2 / Chỉ AOV / Chỉ UPT"; mỗi chuỗi có trục riêng theo đơn vị.
- (c) **Độ lệch % so với TB:** cột phân kỳ cho AOV, UPT, Volume, neo tại 0%.

**Quy tắc:** trung bình dùng làm mốc độ lệch là trung bình **gia quyền**; bucket lẻ chuẩn hóa theo số ngày (BR-FLT-12). "Biên độ" = (max − min) / min.
- **AC-EX04-01** Then AOV của widget = thẻ AOV cùng (K, P).
- **AC-EX04-02** Given Combo "Cả 2", Then cả 2 đường AOV và UPT đều nhìn thấy, trên 2 trục khác nhau.
- **AC-EX04-03** Then tổng Volume trong modal chi tiết = thẻ Volume.

#### FR-EX-05 — Phân rã nguồn hình thành GMV
**Hiển thị:** cột chồng 2 nguồn: **Đơn đặt trước** (E1) và **Đơn lắp sẵn** (E2) + đường Tổng GMV; nhãn % trong từng khúc.
- **AC-EX05-01** Then % 2 khúc cộng 100% và chiều cao cột = GMV bucket (INV-04).
- **AC-EX05-02** Then nhãn % ẩn khi khúc quá nhỏ (không chồng chữ); tooltip vẫn hiển thị đủ.

#### FR-EX-06 — Xu hướng lũy kế & Tiến độ kế hoạch
**Hiển thị:**
- Chế độ **Tiến độ kế hoạch** — "Đồng bộ cả 3": 3 thẻ (GMV lũy kế, DTT lũy kế, Nợ treo) + biểu đồ lũy kế thực tế vs đường tiến độ chuẩn cho GMV và DTT (đồng bộ hover). **Chart Nợ treo bị chủ đích bỏ đi ở bản 1 (UI-07)**; chỉ hiển thị thẻ Nợ treo. Mỗi biểu đồ có nút phóng to; chế độ đơn lẻ có nút "← Quay lại xem đồng bộ cả 3".
- Chế độ **Combo**: cột phát sinh từng bucket + đường lũy kế + đường kế hoạch. Vào Combo từ "Đồng bộ cả 3" → tự chọn GMV, ẩn nút "Đồng bộ cả 3".
- Nhãn trạng thái: "Vượt tiến độ +x%" (xanh) / "Chậm tiến độ −x%" (đỏ); hộp "Nhận xét tiến độ".

**Quy tắc:**
- Mục tiêu GMV / DTT theo BR-TGT (KPI có trường Mục tiêu GMV bắt buộc, Mục tiêu DTT tùy chọn — mục 7.5). Thiếu mục tiêu DTT → thẻ DTT chỉ hiển thị "x,x% GMV".
- % lệch tiến độ = (lũy kế − tiến độ chuẩn) / tiến độ chuẩn.
- Nợ treo so với **trần an toàn** = tham số cấu hình (mặc định 1,5% GMV kế hoạch, QĐ-03). ≤ trần → "An toàn" (xanh); > trần → "Vượt trần" (đỏ). Nợ là chỉ số nghịch: tooltip vượt kế hoạch tô **đỏ**.
- **AC-EX06-01** Given KPI "Đang áp dụng" của chi nhánh X tháng 9 = T, When lọc X, 01/09–30/09, Then Mục tiêu GMV = T và % đạt = lũy kế / T.
- **AC-EX06-02** Given lọc 01/09–15/09 trên KPI tháng 9 = T, Then mục tiêu = T × 15/30.
- **AC-EX06-03** Given không có KPI cho phạm vi, Then "Chưa thiết lập mục tiêu", không có đường kế hoạch.
- **AC-EX06-04** When hover một biểu đồ ở "Đồng bộ cả 3", Then 2 biểu đồ còn lại hiện tooltip cùng mốc.
- **AC-EX06-05** Given Nợ treo > trần, Then nhãn "Vượt trần" đỏ và chênh lệch "+x vượt trần".
- **AC-EX06-06** Then điểm cuối lũy kế DTT = thẻ DTT (INV-08).

#### FR-EX-07 — Bảng xếp hạng hiệu suất
**Hiển thị:** 2 tab.
- **Chi nhánh / Khu vực:** #, Tên, GMV, Tỷ trọng GMV, DTT, Tỷ trọng DTT, % đạt mục tiêu (M01 / Mục tiêu GMV), Tỷ lệ trả hàng (M12). Toggle "Theo Khu vực / Theo Chi nhánh" chỉ hiện khi Khu vực cục bộ = "Tất cả". Dòng tổng ghi đúng phạm vi ("Tổng hệ thống" / "Tổng <khu vực>").
- **Sản phẩm:** Top 5 sản phẩm theo GMV: #, Sản phẩm, Ngành hàng, GMV, Tỷ trọng, Số lượng.

**Quy tắc:** sắp xếp GMV giảm dần; mặc định hiển thị Top 5, có "Xem tất cả"; tô đỏ ô tỷ lệ trả hàng > ngưỡng cấu hình (mặc định 12%, QĐ-03); [P2] sắp xếp theo cột.
- **AC-EX07-01** Then dòng tổng: GMV = thẻ GMV, DTT = thẻ DTT; tỷ trọng cộng 100%.
- **AC-EX07-02** Given Khu vực cục bộ = Miền Nam, Then toggle ẩn, bảng chỉ có chi nhánh Miền Nam, dòng tổng "Tổng Miền Nam".
- **AC-EX07-03** Given tỷ lệ trả hàng một dòng = 12,1%, Then ô tô đỏ; = 12,0% thì không.

#### FR-EX-08 — Bản đồ hiệu suất chi nhánh (Heatmap)
**Hiển thị:** bảng nhiệt, hàng = chi nhánh (hoặc khu vực), cột = bucket thời gian trong khoảng lọc; tab kỳ Ngày / Tuần / Tháng; tab chỉ số **% Mục tiêu · GMV · Traffic · Tỷ lệ chuyển đổi**; toggle Chi nhánh / Khu vực; chú thích màu theo chỉ số; tooltip ô; nút "Nhập Traffic" và "Import Traffic" (FR-IMP-01).
**Quy tắc:**
- Bucket Tuần/Tháng là giá trị **gộp**: Σ GMV, Σ Traffic, Σ đơn; % Mục tiêu = Σ GMV / Σ mục tiêu phân bổ; Tỷ lệ chuyển đổi = M14 của bucket.
- Hàng Khu vực = gộp các chi nhánh của khu vực theo cùng quy tắc.
- Thang màu **% Mục tiêu**: ≥ 115 Xuất sắc · 100–114 Đạt chuẩn · 90–99 Đạt tốt · 80–89 Đạt yêu cầu (nhóm xanh) · 74–79 Tiệm cận · 67–73 Trung bình · 60–66 Cần theo dõi (nhóm vàng) · 50–59 Chưa đạt · 40–49 Cảnh báo thấp · 30–39 Nguy cơ cao · < 30 Nghiêm trọng (nhóm đỏ). Chú thích ghi biên dạng "≥ 80%".
- Thang màu **Tỷ lệ chuyển đổi**: ≥ 90 · 85–89 · 80–84 · 75–79 (xanh) · 67–74 · 58–66 · 50–57 (vàng) · 40–49 · 30–39 · 20–29 · < 20 (đỏ).
- Thang màu **GMV, Traffic**: 4 mức theo tứ phân vị của các ô đang hiển thị.
- Ô thiếu Traffic: chỉ số Traffic và Tỷ lệ chuyển đổi hiển thị "—", màu trung tính, tooltip "Chưa nhập Traffic".
- Nhập Traffic tay: số nguyên ≥ 0, lưu ngay, có lịch sử người sửa; quyền theo mục 5.
- **AC-EX08-01** Given lọc Miền Nam 01/09–30/09, Then chỉ có chi nhánh Miền Nam và các cột ngày tháng 9.
- **AC-EX08-02** Given kỳ Tuần, Then ô = giá trị gộp của tuần ISO đó.
- **AC-EX08-03** Given % Mục tiêu = 80,0%, Then ô thuộc nhóm xanh; 79,9% thuộc nhóm vàng.
- **AC-EX08-04** When nhập Traffic −10 hoặc để trống, Then báo lỗi, không lưu.
- **AC-EX08-05** When nhập Traffic hợp lệ rồi tải lại trang, Then giá trị vẫn còn.

#### FR-EX-09 — Phân tích Tăng trưởng
**Hiển thị:** tab chỉ số GMV · DTT · AOV · Volume · UPT. Đường "Kỳ này", đường đứt "Kỳ trước", cột "Tăng trưởng %" (xanh ≥ 0, đỏ < 0); nhãn "Tổng / TB kỳ này · Tăng trưởng chung"; nhận xét kỳ tăng cao nhất / thấp nhất. **[P2]** Tab "Ma trận chi nhánh": scatter mỗi chi nhánh 1 điểm, X = tăng trưởng DTT %, Y = biên LN gộp %, ngưỡng chia góc phần tư X = 0%, Y = biên LN toàn hệ thống cùng kỳ (QĐ-12).
**Quy tắc:** BR-CMP-02, BR-CMP-03. AOV, UPT tổng kỳ dùng giá trị gia quyền.
- **AC-EX09-01** Then "Tăng trưởng chung" của GMV = % trên thẻ GMV và không đổi khi đổi Chu kỳ.
- **AC-EX09-02** Then "Kỳ trước" của mỗi bucket = giá trị thật của bucket liền trước cùng độ dài.
- **AC-EX09-03** Given giá trị tăng trưởng cao nhất âm, Then nhận xét hiển thị "−x,x%".

### 7.2. Trang Vận hành & Khách hàng — BOD, MANAGER
Thứ tự: Cảnh báo tồn đọng | Thời gian bán hàng tối ưu → Nhân khẩu học → Phân khúc hóa đơn | Hình thức thanh toán → Hiệu quả chiến dịch → Benchmark → Phát hiện bất thường → Tỷ lệ chuyển đổi | Tỷ lệ trả hàng & đổi hàng.

#### FR-OP-01 — Cảnh báo tồn đọng (Order Aging)
**Hiển thị:** thanh ngang chồng; hàng = **2 chặng** (QĐ-29): **Đặt hàng** (Đơn đặt đã lập, chưa ra đủ Đơn hàng — tuổi tính từ `SubmitAt` của Đơn đặt) và **Hoàn thành đơn hàng** (Đơn hàng đã lập từ Đơn đặt nhưng chưa Hoàn thành — tuổi tính từ `SubmitAt` của Đơn hàng). POS chưa ghi công đoạn mài lắp nên không có chặng "Mài lắp", "Đo khám". Khúc = tuổi đơn **0–5 · 6–10 · 11–20 · > 20 ngày** (xanh → vàng → cam → đỏ); toggle Số lượng / Giá trị.
**Quy tắc:** tuổi = số ngày từ mốc vào chặng tới cuối ngày "Đến ngày" (snapshot); chỉ tính đơn còn ở chặng đó tại thời điểm snapshot (bỏ đơn đã Hủy / Kết thúc); Giá trị = giá trị phần còn mở của đơn.
- **AC-OP01-01** Then tooltip nêu công đoạn, nhóm tuổi, số đơn / giá trị; modal có đơn vị.
- **AC-OP01-02** [P2] When click khúc đỏ, Then mở danh sách mã đơn tương ứng.

#### FR-OP-02 — Thời gian bán hàng tối ưu (Time Peak)
**Hiển thị:** lưới 7 ngày (Thứ 2 – Chủ nhật) × 7 khung giờ (8–10h … 20–22h); toggle Số đơn / GMV.
**Quy tắc:** ô = tổng của các ngày cùng thứ trong khoảng lọc, theo giờ tạo đơn; chỉ kênh cửa hàng; độ đậm theo min–max của lưới; mọi ô có tooltip.
- **AC-OP02-01** Then Σ mọi ô (chế độ GMV) = GMV kênh cửa hàng của (K, P), trừ đơn tạo ngoài khung 8–22h (hiển thị chú thích số đơn ngoài khung).
- **AC-OP02-02** Given cùng bộ lọc, Then giá trị không đổi giữa các lần mở tab (INV-12).

#### FR-OP-03 — Nhân khẩu học khách hàng
**Hiển thị:** donut Giới tính; cột Nhóm tuổi (< 25 · 25–34 · 35–49 · ≥ 50 · Không xác định); tháp dân số (Nam trái, Nữ phải); toggle Số đơn (%) / GMV.
- **AC-OP03-01** Then tổng chế độ GMV = M01 của (K, P); tổng % = 100%.
- **AC-OP03-02** Then tooltip và modal hiển thị giá trị dương cho cả Nam và Nữ.

#### FR-OP-04 — Phân khúc hóa đơn (Basket Size)
**Hiển thị:** donut tỷ trọng số đơn theo giá trị đơn (BR-VAL-03): **< 0,5 · 0,5–1 · 1–3 · 3–5 · > 5 Tr** (QĐ-06); chú thích theo thứ tự tăng dần.
- **AC-OP04-01** Then tổng = 100% và tổng số đơn = M02g.

#### FR-OP-05 — Hình thức thanh toán
**Hiển thị:** thanh 100% chồng ngang: Tiền mặt · Chuyển khoản · Thẻ (POS) · Ví điện tử · COD (online) · Trả góp (QĐ-06). Nhóm theo **mã phương thức thanh toán** trên phiếu thu (QĐ-30; bảng ánh xạ mã → nhóm cấu hình được, mã chưa ánh xạ vào "Khác"). Tỷ trọng theo **giá trị phiếu thu** trong kỳ (E8).
- **AC-OP05-01** Then mọi khúc có tooltip "tên: x,x% · giá trị"; tổng giá trị = M04.

#### FR-OP-06 — Hiệu quả chiến dịch
**Hiển thị:** bảng Chiến dịch · GMV · DTT · Số đơn (M02g) · AOV; sắp GMV giảm dần. Chiến dịch = **mã chiến dịch đi kèm đơn** khi đơn áp dụng CTKM / voucher (QĐ-30); đơn không áp dụng gom vào "Không có chiến dịch".
- **AC-OP06-01** Then Σ GMV các chiến dịch + GMV đơn không có chiến dịch = M01.

#### FR-OP-07 — Benchmarking hiệu suất (radar)
**Hiển thị:** radar 6 trục — DTT, Tỷ lệ chuyển đổi (M14), AOV (M08), Traffic, Tỷ lệ khách quay lại (M18), Độ hài lòng (M19); toggle Khu vực / Chi nhánh; chọn "Phân tích" và "So với" (Trung bình toàn hệ thống / Trung bình khu vực của chi nhánh / thực thể cùng loại).
**Quy tắc:** Index = A / B × 100; đa giác chuẩn B = 100; danh sách bên cạnh hiển thị giá trị thật có đơn vị và chênh lệch (Index − 100)%; không cho chọn so với chính nó; trục thiếu dữ liệu hiển thị "—".
- **AC-OP07-01** Given Index 112, Then nhãn xanh "+12%"; Index 95 → đỏ "−5%".
- **AC-OP07-02** Then "Trung bình khu vực" = trung bình các chi nhánh cùng khu vực với chi nhánh đang phân tích.

#### FR-OP-08 — Phát hiện bất thường
**Hiển thị:** đường giá trị theo ngày trong khoảng lọc, đường MA, dải tin cậy, điểm bất thường tô đỏ, banner số điểm; chọn chỉ số (DTT · Số đơn · Tỷ lệ trả hàng) và thực thể (khu vực / chi nhánh).
**Quy tắc:** MA và σ (độ lệch chuẩn **mẫu**) tính trên **7 ngày trước đó, không gồm ngày đang xét**; bất thường khi |giá trị − MA| > k × σ, k = 2 (tham số cấu hình); ngày có < 7 ngày lịch sử thì không đánh giá.
- **AC-OP08-01** Given chuỗi DTT 7 ngày 100, 102, 98, 101, 99, 100, 103 (Tr) và ngày thứ 8 = 130 Tr, Then ngày 8 được đánh dấu bất thường.
- **AC-OP08-02** Given cùng thực thể và bộ lọc, Then số điểm bất thường không đổi giữa các lần tải.

#### FR-OP-09 — Tỷ lệ chuyển đổi cửa hàng
**Hiển thị:** thanh ngang M14 theo chi nhánh (Top, sắp giảm dần) / theo khu vực / toàn hệ thống; trục 0–100%.
- **AC-OP09-01** Given chi nhánh chưa có Traffic trong kỳ, Then thanh hiển thị "Chưa có Traffic", không phải 0%.
- **[Hoãn]** Phễu chuyển đổi Khách vào → Đo mắt → Báo giá → Mua (chưa có dữ liệu ca đo mắt, báo giá).

#### FR-OP-10 — Tỷ lệ trả hàng & đổi hàng
**Hiển thị:** cột M12 (trả hàng theo giá trị), M13 (trả hàng theo hóa đơn), M13b (đổi hàng từ đơn đặt), M13c (hủy đơn đặt); [P2] xu hướng theo Chu kỳ.
- **AC-OP10-01** Then M12 × M01 = cột "Trả hàng" của Waterfall cùng (K, P); tương tự M13b, M13c.
- **[Hoãn]** Phân rã nguyên nhân trả hàng/hủy (chưa có mã lý do).

### 7.3. Trang Sản phẩm & Tồn kho — BOD, MANAGER
Quy tắc chung: BR-DIM-01, BR-DIM-02 (dùng GMV và số lượng).

#### FR-PR-01 — Tăng trưởng sản phẩm
**Hiển thị:** đường đa tuyến % tăng trưởng GMV theo bucket, đường tham chiếu 0%; tab chiều Ngành hàng / Nhóm SP / Thương hiệu / Nhà cung cấp; chọn so sánh **Kỳ liền trước / Cùng kỳ năm trước**; chọn "Top 5" (theo GMV kỳ, sắp theo hạng) hoặc 1 thực thể. Không phân loại vòng đời (QĐ-14).
- **AC-PR01-01** Then số đường = số thực thể trong chú thích (tối đa 5) ở mọi tab.
- **AC-PR01-02** Then giá trị điểm = (GMV bucket − GMV bucket so sánh) / GMV bucket so sánh × 100.

#### FR-PR-02 — Phân tích đa chiều
**Hiển thị:** cột dọc sắp giảm dần; chỉ số GMV / Số lượng × chiều: Ngành hàng, Nhóm tròng, Nhóm gọng, Thương hiệu tròng, Thương hiệu gọng, Nhà cung cấp, Chiết suất, Màu sắc, Phân khúc giá, Nhóm khách hàng.
- **AC-PR02-01** Then Σ theo mọi chiều cùng cấp = M01 (hoặc tổng số lượng) của (K, P); Σ thương hiệu tròng = GMV ngành Tròng kính.
- **AC-PR02-02** Then tooltip ghi tên cột, giá trị và đơn vị.

#### FR-PR-03 — Cấu trúc danh mục (Treemap)
**Hiển thị:** treemap diện tích = GMV; chế độ "Phân cấp" (Ngành → Nhóm / Thương hiệu → Sản phẩm) có drill-down và breadcrumb "Trở lại"; hoặc phẳng theo 1 chiều của FR-PR-02.
- **AC-PR03-01** When click ô "Tròng kính", Then hiển thị cấp con của Tròng kính và breadcrumb "Tất cả › Tròng kính".
- **AC-PR03-02** Then modal chi tiết khớp các ô đang hiển thị, có cột GMV và % tỷ trọng.

#### FR-PR-04 — Ma trận phôi tròng (SPH × CYL)
**Hiển thị:** bubble: X = SPH, Y = CYL (bước 0,25D), kích thước = số lượng bán, màu = loại tròng (Trong suốt, Đổi màu, Đa tròng, Chống ánh sáng xanh). Chú thích đủ mọi loại đang vẽ; tooltip nêu SPH, CYL, loại, số lượng.
- **AC-PR04-01** Then Σ số lượng các điểm = số lượng tròng kính bán ra của (K, P).

#### FR-PR-05 — Thương hiệu phân phối
**Hiển thị:** thanh ngang GMV theo thương hiệu, sắp giảm dần; modal chi tiết.
- **AC-PR05-01** Then GMV mỗi thương hiệu khớp FR-PR-02 cùng thương hiệu; modal hiển thị đủ giá trị.

#### FR-PR-06 — Top sản phẩm & vật tư tiêu hao
**Hiển thị:** bảng #, Sản phẩm, Nhà cung cấp, Thuộc tính (Suất / Màu), Số lượng bán, Tồn hiện tại, Tồn an toàn (SS), Điểm đặt hàng lại (ROP), cảnh báo; "Xem toàn bộ danh mục".
**Quy tắc (QĐ-15):** SS = 1,65 × σ(nhu cầu ngày) × √(lead time); ROP = nhu cầu TB ngày × lead time + SS; nhu cầu tính trên 90 ngày gần nhất; cảnh báo đỏ khi Tồn ≤ ROP.
- **AC-PR06-01** Then sắp xếp số lượng bán giảm dần; số định dạng "15.037".
- **AC-PR06-02** Given Tồn ≤ ROP, Then dòng có cảnh báo đỏ.

### 7.4. Trang Hiệu suất Nhân sự
Quy tắc chung: nhân viên được gán theo **người bán trên đơn** (mục 2.5); **không có mục tiêu cá nhân** (QĐ-08); xếp hạng theo **GMV** của nhân viên.

#### FR-HR-01 — Góc nhìn nhân viên (STAFF)
| Thẻ | Nội dung |
|---|---|
| GMV cá nhân | M01 của các đơn có người bán = tôi; % so với kỳ trước |
| Xếp hạng nội bộ | "Hạng r / n" theo GMV trong cửa hàng, cùng vai trò; thanh = (n − r + 1) / n |
| AOV cá nhân | M08 trên đơn của tôi (điều chỉnh gán theo người bán của đơn gốc); so với AOV cửa hàng |
| Độ hài lòng khách hàng | M19 của tôi, theo đúng tên và thang của nguồn (NPS: −100…+100; CSAT: /5) |
| Nhân viên xuất sắc | Hiển thị khi tôi thuộc **Top 3 GMV** cửa hàng trong kỳ (N = 3, tham số cấu hình) |

- **AC-HR01-01** Then số liệu khớp dòng của chính nhân viên trên bảng xếp hạng (AC-ROLE-03).
- **AC-HR01-02** Given nhân viên hạng 4, Then không hiển thị "Nhân viên xuất sắc".
- **AC-HR01-03** Then không có thành phần nào hiển thị "mục tiêu", "chỉ tiêu", "Tiến độ KPI" cá nhân.

#### FR-HR-02 — Bảng xếp hạng PIC Sales (BOD, MANAGER)
**Hiển thị:** #, Nhân viên, Chi nhánh, GMV, Tỷ trọng GMV trong phạm vi (thanh + %), Số đơn (M02g), AOV (M08); sắp GMV giảm dần; dòng "Chưa gán người bán" nếu có.
- **AC-HR02-01** Then Σ GMV các dòng = M01 của phạm vi (INV-09); tỷ trọng cộng 100%.

#### FR-HR-03 — Hiệu suất KTV khúc xạ — [Hoãn]
Không hiển thị trong bản 1: chưa có dữ liệu ca đo mắt và độ chính xác đo khám (QĐ-13).

#### FR-HR-04 — Hiệu suất phòng Lab / KTV mài lắp — [Hoãn]
Không hiển thị trong bản 1: hiện chưa có Lab và chưa có dữ liệu lệnh gia công (QĐ-31). Định nghĩa giữ lại để triển khai sau: Tỷ lệ hoàn thành đúng hạn = số lệnh xong ≤ hạn cam kết / tổng lệnh xong; Tỷ lệ hư hao = phôi hỏng / phôi dùng.

### 7.5. Trang Quản lý KPI

**Mô hình KPI**
| Trường | Ràng buộc |
|---|---|
| Phạm vi | Công ty / Khu vực / Chi nhánh |
| Đối tượng | Mã theo danh mục chủ; bắt buộc khi phạm vi ≠ Công ty |
| Chu kỳ | Năm (chọn năm) / Quý / Tháng / Chiến dịch (ngày bắt đầu – kết thúc) |
| Mục tiêu GMV (₫) | **Bắt buộc**, > 0. Với KPI chi nhánh theo tháng: khai báo dạng **mục tiêu ngày theo loại ngày** — Trong tuần / Cuối tuần / Ngày lễ (QĐ-24); tổng tháng = Σ mục tiêu từng ngày |
| Mục tiêu DTT (₫) | Tùy chọn, > 0 |
| Tỷ lệ chuyển đổi (%), Độ hài lòng | Tùy chọn, 0–100 (hoặc theo thang nguồn) |
| AOV (₫), Traffic | Tùy chọn, số nguyên > 0 |
| Phiên bản | Hệ thống sinh, tăng theo (Đối tượng, Chu kỳ) |
| Trạng thái | Bản nháp · Đang áp dụng · Đã kết thúc · Lưu trữ |
| Audit | Người tạo/sửa, thời điểm, nguồn (Wizard / Import + tên file) |

**Quyết định (UI-08 — chủ đích, không phải bug):** Bản 1 chỉ triển khai phạm vi **Chi nhánh** và các chỉ số **GMV/Traffic**. Các chỉ số DTT/conversion/AOV/CSAT và phạm vi Công ty/Khu vực được hoãn lại; không coi là thiếu hụt cần sửa. Sẽ bổ sung ở bản sau nếu cần.

**Vòng đời:** Bản nháp → Đang áp dụng → Đã kết thúc (tự động khi hết chu kỳ); Đang áp dụng → Lưu trữ (khi bị ghi đè hoặc xóa).
- **BR-KPI-01.** Mỗi (Đối tượng, khoảng ngày) có tối đa **1** KPI "Đang áp dụng" (ngoại trừ chiến dịch theo BR-TGT-04).
- **BR-KPI-02 — Xung đột.** Lưu KPI trùng Đối tượng và chu kỳ giao nhau với KPI "Đang áp dụng" → cảnh báo **đỏ** với 3 lựa chọn: **Ghi đè hoàn toàn** (mặc định: cũ → Lưu trữ, mới → Đang áp dụng) · **Giữ mục tiêu cao nhất** (mới = max từng chỉ số; cũ → Lưu trữ) · **Lưu thành bản nháp** (cũ giữ nguyên).
- **BR-KPI-03.** Sửa KPI "Đang áp dụng" tạo phiên bản mới, không sửa đè. Xóa là xóa mềm (chuyển Lưu trữ).

#### FR-KPI-01 — Thẻ thống kê
Số KPI đang áp dụng; KPI đạt mục tiêu kỳ trước (đạt / tổng); cấp phân bổ sâu nhất. Tính từ dữ liệu.
- **AC-KPI01-01** Then "Đang áp dụng" = số dòng trạng thái Đang áp dụng.

#### FR-KPI-02 — Danh sách KPI
Thanh công cụ: Tìm kiếm · Lọc (Trạng thái, Chu kỳ, Phạm vi) · Import mục tiêu · Thêm KPI mới. Cột: chọn, Phạm vi, Đối tượng, Chu kỳ, Phiên bản, Mục tiêu GMV, Mục tiêu DTT, Tỷ lệ chuyển đổi, Traffic, AOV, Trạng thái (Đang áp dụng xanh lá · Bản nháp vàng · Đã kết thúc chàm · Lưu trữ xám), Thao tác (Sửa, Xóa, Lịch sử phiên bản). Phân trang 10 dòng.
- **AC-KPI02-01** When tìm "Miền Bắc", Then chỉ còn KPI có Đối tượng chứa "Miền Bắc".
- **AC-KPI02-02** Then chân bảng "Hiển thị a–b của N KPI" đúng số.
- **AC-KPI02-03** When Xóa, Then hộp xác nhận; xác nhận → trạng thái Lưu trữ.

#### FR-KPI-03 — Chỉnh sửa hàng loạt (BOD)
Chọn ≥ 1 dòng → thanh hành động "N KPI đã chọn · Cập nhật mục tiêu · Thay đổi thời hạn · Xóa · ×". "Cập nhật mục tiêu" hỗ trợ **Tăng/Giảm theo %** và **Giá trị tuyệt đối** cho Mục tiêu GMV, Mục tiêu DTT, Tỷ lệ chuyển đổi.
- **AC-KPI03-01** Given 5 KPI chọn, When "Tăng 10%" Mục tiêu GMV → Lưu, Then mỗi KPI có phiên bản mới với Mục tiêu GMV × 1,1 và thông báo "Đã cập nhật 5 KPI".

#### FR-KPI-04 — Wizard cấu hình KPI (BOD)
3 bước: Phạm vi → Chu kỳ → Nhập mục tiêu; tóm tắt bước ở cột trái; "Quay lại" giữ lựa chọn; đóng rồi mở lại → về bước 1.
- **AC-KPI04-01** Given chọn cấp Khu vực và không chạm dropdown, Then đối tượng ghi nhận = giá trị đang hiển thị trong dropdown.
- **AC-KPI04-02** Given đã có KPI HCM tháng 7/2026 Đang áp dụng, When tạo KPI HCM tháng 7/2026, Then hiện cảnh báo xung đột (BR-KPI-02); áp dụng cho cả cấp Công ty.
- **AC-KPI04-03** Given Mục tiêu GMV ≤ 0 hoặc tỷ lệ > 100, Then báo lỗi tại trường và chặn lưu.
- **AC-KPI04-04** When lưu thành công, Then bảng có dòng mới, thẻ thống kê cập nhật; tải lại trang vẫn còn.
- **AC-KPI04-05** When KPI chuyển Đang áp dụng, Then mục tiêu ở Xu hướng lũy kế, Heatmap, Bảng xếp hạng dùng giá trị mới.

### 7.6. Nhập liệu & import Excel (QĐ-11)

**Quy tắc chung (BR-IMP)**
- **BR-IMP-01.** Nút "Tải file mẫu" (.xlsx): sheet dữ liệu + sheet hướng dẫn (ý nghĩa cột, định dạng, danh sách mã hợp lệ theo phạm vi người dùng).
- **BR-IMP-02.** Nhận `.xlsx` / `.csv` UTF-8, ≤ 5 MB, ≤ 10.000 dòng, đủ cột của mẫu (thứ tự tùy ý); sai mẫu → từ chối cả file, nêu cột thiếu/thừa.
- **BR-IMP-03.** Quy trình **Tải lên → Xem trước & kiểm tra → Xác nhận**. Bước xem trước hiển thị số dòng hợp lệ / lỗi / cảnh báo / sẽ ghi đè và bảng lỗi theo dòng–cột. Không ghi dữ liệu trước khi xác nhận.
- **BR-IMP-04.** Mã chi nhánh/khu vực phải khớp danh mục chủ và đang hoạt động; cột "Tên" chỉ để tham khảo.
- **BR-IMP-05.** Dòng ngoài phạm vi quyền → lỗi "Không có quyền với <mã>".
- **BR-IMP-06.** Ngày `DD/MM/YYYY` hoặc ô ngày Excel; tiền nhập bằng **₫ đầy đủ**, không ký hiệu đơn vị.
- **BR-IMP-07.** "Tải file lỗi" = file gốc + cột "Lỗi / Cảnh báo".
- **BR-IMP-08.** Lưu lịch sử import (file gốc, người, thời điểm, số dòng thêm / ghi đè / bỏ qua); giá trị bị ghi đè lưu vào lịch sử bản ghi.

#### FR-IMP-01 — Import Traffic (BOD, MANAGER)
Cột mẫu: Mã chi nhánh · Tên chi nhánh (tham khảo) · Ngày · Traffic.
- Khóa (Mã chi nhánh, Ngày); bản ghi đã có → **ghi đè**. Traffic là số nguyên ≥ 0; ngày không ở tương lai; trùng khóa trong file → lỗi cả 2 dòng.
- Cảnh báo (không chặn): Traffic < số đơn của chi nhánh trong ngày (tỷ lệ chuyển đổi > 100%).
- **Nhập một phần:** dòng hợp lệ được nhập, dòng lỗi bỏ qua.
- **AC-IMP01-01** Given file 300 dòng hợp lệ, When xác nhận, Then 300 bản ghi được lưu và Heatmap hiển thị đúng; tải lại vẫn còn.
- **AC-IMP01-02** Given 1 dòng Traffic −5 và 1 dòng mã "ABC", Then 2 lỗi đúng dòng/cột, các dòng khác vẫn nhập, file lỗi có 2 dòng.
- **AC-IMP01-03** Given đã có Traffic 200, When import 250 cùng khóa, Then bước xem trước báo "1 dòng ghi đè (200 → 250)"; lịch sử lưu 200.
- **AC-IMP01-04** Given MANAGER cửa hàng X import dòng của cửa hàng Y, Then dòng đó lỗi "Không có quyền".
- **AC-IMP01-05** When Hủy ở bước xem trước, Then không bản ghi nào thay đổi.

#### FR-IMP-02 — Import mục tiêu hàng loạt (BOD)
Cột mẫu: Phạm vi · Mã đối tượng (trống khi Công ty) · Loại chu kỳ · Kỳ (`YYYY`, `Qn/YYYY`, `MM/YYYY` hoặc tên chiến dịch) · Từ ngày, Đến ngày (bắt buộc với Chiến dịch) · Mục tiêu GMV (₫) **hoặc** Mục tiêu GMV ngày Trong tuần / Cuối tuần / Lễ (₫, cho KPI chi nhánh theo tháng — QĐ-24; định dạng của `data-store-kpi.md` nhập được trực tiếp) · Mục tiêu DTT (₫) · Tỷ lệ chuyển đổi (%) · AOV (₫) · Traffic · Độ hài lòng.
- Kiểm tra như wizard (AC-KPI04-03); phạm vi "Cá nhân" → lỗi; trùng (Đối tượng, chu kỳ giao nhau) trong file → lỗi.
- Xung đột với KPI Đang áp dụng: bước xem trước liệt kê từng xung đột (cũ → mới); chọn **một chính sách cho cả file** theo BR-KPI-02.
- Trạng thái sau nhập: "Áp dụng ngay" hoặc "Lưu bản nháp" (mặc định) cho cả file.
- **Tất cả hoặc không:** có 1 dòng lỗi thì không nhập dòng nào.
- Cảnh báo phân cấp (không chặn): tổng mục tiêu các chi nhánh ≠ mục tiêu khu vực cùng kỳ.
- **AC-IMP02-01** Given 24 dòng hợp lệ, "Lưu bản nháp", Then 24 KPI Bản nháp, nguồn "Import: <tên file>".
- **AC-IMP02-02** Given 1 dòng tỷ lệ 150%, Then nút Xác nhận bị vô hiệu hóa, không nhập dòng nào.
- **AC-IMP02-03** Given xung đột với KPI Đang áp dụng, Then phải chọn chính sách trước khi xác nhận.
- **AC-IMP02-04** Given "Giữ mục tiêu cao nhất" + "Áp dụng ngay", Then KPI mới = max từng chỉ số, KPI cũ → Lưu trữ, Xu hướng lũy kế dùng mục tiêu mới.
- **AC-IMP02-05** Given MANAGER, Then không có nút Import mục tiêu.

### 7.7. Thành phần dùng chung

#### FR-CMN-01 — Modal "Xem chi tiết dữ liệu"
Bảng đúng dữ liệu widget đang vẽ, có đơn vị ở tiêu đề cột; tìm kiếm theo giá trị đã định dạng (không phân biệt hoa thường); sort 3 trạng thái (tăng → giảm → mặc định); "Không có dữ liệu" khi rỗng; đóng bằng X, Esc, click nền; mở lại về trạng thái mặc định. **[P2]** "Xuất Excel" đúng các dòng đang hiển thị, trong phạm vi quyền (QĐ-10).
- **AC-CMN01-01** Then không cột nào hiển thị "undefined" hoặc số âm sai nghĩa.

#### FR-CMN-02 — Tooltip định nghĩa (i)
Mọi thẻ và widget có (i): định nghĩa + công thức theo mục 3; mở bằng hover hoặc focus bàn phím trên **icon**.
- **AC-CMN02-01** Then không có tooltip rỗng; công thức tái tạo được số đang hiển thị.

#### FR-CMN-03 — Trạng thái rỗng / lỗi / đang tải
- Rỗng: "Không có dữ liệu cho bộ lọc hiện tại" + "Xóa bộ lọc".
- Lỗi: thông báo trong widget + "Thử lại"; widget khác vẫn hoạt động.
- Đang tải: skeleton theo hình dạng widget.

---

## 8. Yêu cầu phi chức năng
| Mã | Yêu cầu |
|---|---|
| NFR-01 | Trang Tổng quan tải ≤ 3 giây (P95) với khoảng 1 năm toàn hệ thống; đổi bộ lọc cập nhật ≤ 1,5 giây |
| NFR-02 | Dữ liệu trễ ≤ 15 phút so với hệ thống nguồn (hoặc theo lịch ETL công bố) |
| NFR-03 | Xác thực theo tài khoản; RLS ở API; audit cho KPI, Traffic, import |
| NFR-04 | Tính xác định: INV-12 |
| NFR-05 | Hiển thị được ở độ rộng 360px: thẻ xếp 1–2 cột, bảng cuộn ngang trong khung, trang không cuộn ngang |
| NFR-06 | Màu không là kênh duy nhất truyền tải trạng thái (kèm mũi tên / nhãn); tương phản WCAG AA |
| NFR-07 | Biểu đồ cột bắt đầu trục từ 0; nhãn trục không chồng, không cắt; mỗi chuỗi có trục phù hợp đơn vị |
| NFR-08 | Có bộ kiểm thử tự động cho INV-01…INV-12 và TC ở mục 9 |

---

## 9. Bộ dữ liệu kiểm thử chuẩn (golden dataset)

Bộ dữ liệu nhỏ, tính tay được, bao phủ mọi sự kiện ở mục 2.3. Dùng để: (a) nạp vào môi trường thử của dev rồi so kết quả trên UI/API; hoặc (b) chạy tay qua logic trong code khi review. **Mọi giá trị là ₫.** Kết quả kỳ vọng đã được tính lại độc lập bằng [`analysis/golden_dataset_check.py`](analysis/golden_dataset_check.py).

### 9.1. Danh mục
| Loại | Dữ liệu |
|---|---|
| Chi nhánh | **CN-A** (Miền Bắc, kênh cửa hàng) · **CN-B** (Miền Nam, kênh cửa hàng) |
| Nhân viên | **NV1**, **NV2** thuộc CN-A · **NV3** thuộc CN-B |
| Sản phẩm | **G1** Gọng, 1.100.000, VAT 10% · **G2** Gọng, 1.320.000, VAT 10% · **G3** Gọng, 1.650.000, VAT 10% · **T1** Tròng, 1.080.000, VAT 8% · **PK2** Phụ kiện: 216.000 và VAT **8% đến 30/09/2026**; 220.000 và VAT **10% từ 01/10/2026** |

### 9.2. Đơn và sự kiện (năm 2026)
| Đơn | Loại | CN | NV | Ngày tạo | Dòng hàng | Giá trị đơn | Diễn biến |
|---|---|---|---|---|---|---|---|
| O1 | Đơn hàng (lắp sẵn) | A | NV1 | 05/09 | G1 × 1 | 1.100.000 | Hoàn thành 05/09. Phí ship 30.000 (không vào GMV) |
| O2 | Đơn hàng | A | NV2 | 10/09 | G2 × 1, PK2 × 1; giảm giá cấp đơn 10% | 1.382.400 (G2 1.188.000 + PK2 194.400) | Hoàn thành 10/09. **Trả PK2** ngày 25/09 |
| O3 | Đơn đặt | A | NV1 | 12/09 | T1 × 2 | 2.160.000 | Đơn tạm 12/09 → chuyển Đơn hàng O3-H, hoàn thành 20/09 |
| O4 | Đơn đặt | B | NV3 | 15/09 | T1 × 1 | 1.080.000 | Đơn tạm 15/09 → **Kết thúc không ra Đơn hàng 03/10** (khách đổi sang O5) |
| O5 | Đơn hàng | B | NV3 | 03/10 | G3 × 1 | 1.650.000 | Hoàn thành 03/10; dùng 1.080.000 cọc chuyển từ O4, khách trả thêm 570.000 |
| O6 | Đơn hàng | B | NV3 | 20/09 | G1 × 2 | 2.200.000 | Hoàn thành 20/09. **Trả toàn bộ** ngày 02/10 |
| O7 | Đơn đặt | A | NV2 | 25/09 | T1 × 1 | 1.080.000 | Đơn tạm 25/09, cọc 500.000 → **Hủy 05/10**, hoàn cọc |
| O8 | Đơn hàng | A | NV1 | 28/09 | G1 × 1 | 1.100.000 | **Hủy 28/09 trước khi hoàn thành** |
| O9 | Đơn đặt | B | NV3 | 29/09 | T1 × 2 | 2.160.000 | Đơn tạm, cọc 1.000.000; còn mở đến 31/10 |
| O10 | Đơn hàng (giao hàng) | B | NV3 | 30/09 | G1 × 1 | 1.100.000 | **Hoàn thành 02/10** (tạo 30/09) |
| O11 | Đơn hàng | A | NV2 | 10/10 | PK2 × 5 | 1.100.000 | Hoàn thành 10/10 (VAT PK2 = 10%) |
| O12 | Đơn đặt | A | NV2 | 08/10 | T1 × 3 | 3.240.000 | Đơn tạm 08/10 → chuyển Đơn hàng O12-H, hoàn thành 15/10 |

**Phiếu thu (cho M04):** O1 1.100.000 (05/09) · O2 1.382.400 (10/09) · O3 1.000.000 (12/09) + 1.160.000 (20/09) · O4 1.080.000 (15/09) · O6 2.200.000 (20/09) · O7 500.000 (25/09) · O9 1.000.000 (29/09) · O10 1.100.000 (02/10) · O5 570.000 (03/10) · O11 1.100.000 (10/10) · O12 1.500.000 (08/10) + 1.740.000 (15/10). Hoàn tiền: O2 194.400 (25/09), O6 2.200.000 (02/10), O7 500.000 (05/10). Chuyển cọc O4 → O5 1.080.000 (03/10, **không** phải tiền thu mới). Phí ship O1 30.000 không tính.

**Số dư công nợ (đầu vào cho M10):** cuối 30/09: O7 580.000 + O9 1.160.000 = **1.740.000**. Cuối 31/10: O9 **1.160.000**.

**KPI (đầu vào cho M16):** CN-A tháng 9/2026 Mục tiêu GMV 6.000.000 · CN-B tháng 9/2026 6.000.000 · Công ty tháng 9/2026 15.000.000.

### 9.3. Kết quả kỳ vọng
Dữ liệu tính đến 31/10/2026 23:59 (trừ TC-05).

**TC-01 — Tháng 9 (01/09–30/09), toàn hệ thống**
| Chỉ số | Kỳ vọng | Giải thích |
|---|---|---|
| M01 GMV | **12.262.400** | O1 + O2 + O3 + O4 + O6 + O7 + O9 + O10. **Không** có O3-H (sinh từ đơn đặt), **không** có O8 (hủy) |
| M01a VAT | **1.002.400** | 100.000 + 122.400 (G2 108.000 + PK2 @8% 14.400) + 160.000 + 80.000 + 200.000 + 80.000 + 160.000 + 100.000 |
| GMV trước VAT | 11.260.000 | |
| M02g | 8 | |
| M05a Trả hàng | 194.400 | O2 trả PK2 ngày 25/09 |
| M05b / M05c | 0 / 0 | O4 kết thúc và O7 hủy rơi vào tháng 10 |
| M05 | **−194.400** | |
| M06 DTT | **12.068.000** | |
| M02 Volume | **8** | |
| M08 AOV | **1.508.500** | 12.068.000 / 8 → hiển thị "1,5 Tr" |
| M09 UPT | 1,50 | 12 sản phẩm / 8 đơn |
| M04 Thực thu | **9.422.400** | Không gồm phí ship 30.000 |
| M10 Nợ treo | 1.740.000 | "Chiếm 14,2% GMV" |
| M12 | 1,6% | 194.400 / 12.262.400 |
| M13 | 12,5% | 1 đơn có trả / 8 |
| M11 Nguồn GMV | Đơn đặt 6.480.000 (52,8%) · Đơn lắp sẵn 5.782.400 (47,2%) | O3+O4+O7+O9 / O1+O2+O6+O10 |
| % đạt mục tiêu (Công ty) | **82%** | 12.262.400 / 15.000.000 = 81,7% |

**TC-02 — Tháng 10 (01/10–31/10), toàn hệ thống**
| Chỉ số | Kỳ vọng | Giải thích |
|---|---|---|
| M01 GMV | **5.990.000** | O5 + O11 + O12. **Không** có O12-H. **Không** có O10 (tạo 30/09 → thuộc tháng 9) |
| M01a VAT | **490.000** | O5 150.000 + O11 100.000 (PK2 @10%) + O12 240.000 |
| M02g | 3 | |
| M05a Trả hàng | 2.200.000 | O6 trả 02/10 |
| M05b Đổi hàng | 1.080.000 | O4 Kết thúc 03/10 |
| M05c Hủy đơn đặt | 1.080.000 | O7 Hủy 05/10 |
| M05 | **−4.360.000** | |
| M06 DTT | **1.630.000** | |
| M02 Volume | **1** | 3 − 1 (Kết thúc O4) − 1 (Hủy O7) |
| M08 AOV | 1.630.000 | |
| M09 UPT | 3,00 | 9 sản phẩm / 3 đơn |
| M04 Thực thu | **6.010.000** | O10 1.100.000 + O5 570.000 + O11 1.100.000 + O12 3.240.000. Không tính 1.080.000 chuyển cọc |
| M10 Nợ treo | 1.160.000 | So với cuối 30/09: −33,3%, mũi tên ↓ **màu xanh** |
| M12 / M13b / M13c | 36,7% / 18,0% / 18,0% | |
| M13 | 33,3% | 1 / 3 |

**TC-03 — Theo chi nhánh**
| Kỳ | Chi nhánh | GMV | M05 | DTT | M02 | AOV |
|---|---|---|---|---|---|---|
| Tháng 9 | CN-A | 5.722.400 | −194.400 | 5.528.000 | 4 | 1.382.000 |
| Tháng 9 | CN-B | 6.540.000 | 0 | 6.540.000 | 4 | 1.635.000 |
| Tháng 10 | CN-A | 4.340.000 | −1.080.000 (hủy O7) | 3.260.000 | 1 | 3.260.000 |
| Tháng 10 | CN-B | 1.650.000 | −3.280.000 (trả O6, kết thúc O4) | **−1.630.000** | **0** | **"—"** |

Kiểm tra INV-03: tổng 2 chi nhánh = TC-01 / TC-02. Bảng xếp hạng tháng 9: CN-B #1 (GMV 53,3%, DTT 54,2%, trả hàng 0,0%), CN-A #2 (46,7%, 45,8%, 3,4%); % đạt mục tiêu CN-A **95%**, CN-B **109%**.

**TC-04 — Theo nhân viên (GMV, dùng để xếp hạng)**
| Kỳ | Hạng | Nhân viên | GMV |
|---|---|---|---|
| Tháng 9 | 1 | NV3 | 6.540.000 |
| Tháng 9 | 2 | NV1 | 3.260.000 |
| Tháng 9 | 3 | NV2 | 2.462.400 |
| Tháng 10 | 1 | NV2 | 4.340.000 |
| Tháng 10 | 2 | NV3 | 1.650.000 |
| Tháng 10 | 3 | NV1 | 0 |

Trong CN-A tháng 9: NV1 hạng 1/2, NV2 hạng 2/2. Điều chỉnh tháng 10 gán theo người bán đơn gốc: NV3 −3.280.000 (O6, O4); NV2 −1.080.000 (O7).

**TC-05 — Thời điểm dữ liệu (BR-EVT-02).** Dữ liệu tính đến 01/10/2026 23:59 (O10 chưa hoàn thành): GMV tháng 9 = **11.162.400**, M02 = 7, DTT = 10.968.000. Sau khi O10 hoàn thành ngày 02/10: GMV tháng 9 = 12.262.400 (TC-01).

**TC-06 — VAT theo thời điểm (BR-VAL-05).** Cùng sản phẩm PK2: dòng của O2 (10/09) VAT 8% = **14.400**; dòng của O11 (10/10) VAT 10% = **100.000**. Nếu code dùng thuế suất hiện tại cho mọi đơn sẽ ra 17.673 cho O2 → **sai**; nếu dùng 8% cố định sẽ ra 81.481 cho O11 → **sai**.

**TC-07 — Tăng trưởng tháng 10 so với kỳ trước** (kỳ so sánh 31/08–30/09, BR-CMP-01): GMV **−51,2%** · DTT **−86,5%** · Volume **−87,5%** · AOV **+8,1%**.

**TC-08 — Waterfall**
| Phạm vi | Tổng GMV | Trả hàng | Đổi hàng | Hủy đơn đặt | DTT |
|---|---|---|---|---|---|
| Tháng 9, toàn hệ thống | 12.262.400 | −194.400 | 0 | 0 | 12.068.000 |
| Tháng 10, toàn hệ thống | 5.990.000 | −2.200.000 | −1.080.000 | −1.080.000 | 1.630.000 |
| Tháng 10, CN-B | 1.650.000 | −2.200.000 | −1.080.000 | 0 | **−1.630.000** (cột dưới trục 0) |

**TC-09 — Đơn vị hiển thị (BR-FMT-02)**
| Giá trị | Hiển thị |
|---|---|
| 12.262.400 | "12 Tr" |
| 5.722.400 | "5,7 Tr" |
| 1.508.500 | "1,5 Tr" |
| −1.630.000 | "−1,6 Tr" |
| 194.400 | "194.400 ₫" |
| 512.300.000 | "512 Tr" |
| 4.216.000.000 | "4,22 Tỷ" |

**TC-10 — Lọc đa chiều (BR-DIM-01).** Tháng 9, Ngành hàng = Tròng kính: GMV **6.480.000** (O3, O4, O7, O9), số đơn **4**. Gọng kính: 5.588.000 (O1, G2 của O2, O6, O10), số đơn 4. Phụ kiện: 194.400 (PK2 của O2), số đơn 1. Tổng 3 ngành = 12.262.400 (INV-05).

**TC-11 — Mục tiêu phân bổ (BR-TGT-03).** Lọc Công ty 01/09–15/09: mục tiêu = 15.000.000 × 15/30 = **7.500.000**; GMV = 5.722.400 (O1, O2, O3, O4) → **76%**.

---

## 10. Nhật ký quyết định nghiệp vụ

| Mã | Quyết định | Áp vào |
|---|---|---|
| QĐ-01 | Định nghĩa GMV / Giá trị điều chỉnh / DTT (mục 3.1); đơn vị hiển thị tự động | 2.3, 3, BR-FMT-02, FR-EX-01, FR-EX-03 |
| QĐ-01.1 | Đơn đặt **Kết thúc** không ra Đơn hàng = hoàn/đổi hàng, ghi nhận tại **ngày bấm Kết thúc** | E5, M05b |
| QĐ-01.2 | Hệ thống không cho giá trị Đơn hàng khác Đơn đặt → không có Upsell/Downsell | BR-EVT-01 |
| QĐ-01.3 | Đơn đặt tính GMV ở trạng thái **Đơn tạm**; Đơn hàng tính GMV ở trạng thái **Hoàn thành** | E1, E2, M01 |
| QĐ-01.4 | Đơn đặt **Hủy** sau khi đã là Đơn tạm → trừ vào Giá trị điều chỉnh tại **ngày hủy** | E6, M05c |
| QĐ-01.5 | Volume trừ Đơn đặt Kết thúc / Hủy | M02 |
| QĐ-01.6 | Giá trị trả hàng theo dòng gốc, gồm VAT, không phí ship | BR-VAL-04 |
| QĐ-01.7 | Phí ship là dòng riêng, loại khỏi GMV; giảm giá cấp đơn phân bổ theo tỷ lệ giá trị dòng | BR-VAL-02, BR-VAL-03 |
| QĐ-02 | AOV = DTT / Volume, gồm VAT | M08 |
| QĐ-03 | Nợ treo = số dư cuối kỳ; trần nợ và ngưỡng tô đỏ là tham số cấu hình (mặc định 1,5% GMV kế hoạch; 12% trả hàng; 2% hư hao) | M10, FR-EX-06, FR-EX-07, FR-HR-04 |
| QĐ-04 | Tỷ lệ chuyển đổi cửa hàng = Đơn / Traffic; online tách riêng; cơ cấu vùng theo cơ cấu quản lý thực tế | M14, BR-MD-01 |
| QĐ-05 | Tuần ISO; kỳ lẻ gắn nhãn | FR-FLT-04 |
| QĐ-06 | Basket < 0,5 / 0,5–1 / 1–3 / 3–5 / > 5 Tr; danh mục thanh toán 6 nhóm | FR-OP-04, FR-OP-05 |
| QĐ-07 | Khoảng ngày mặc định: đầu tháng đến hôm qua | FR-FLT-01 |
| QĐ-08 | Bỏ KPI cá nhân; MANAGER chỉ xem KPI; chiến dịch ghi đè KPI tháng theo ngày | 5, 7.4, 7.5, BR-TGT |
| QĐ-08.1 | Xếp hạng nhân viên theo **GMV** của người bán gán trên đơn; "Nhân viên xuất sắc" = Top 3 GMV cửa hàng | FR-HR-01, FR-HR-02 |
| QĐ-09 | VAT theo thuế suất của từng sản phẩm tại thời điểm tạo đơn | BR-VAL-05 |
| QĐ-10 | Xuất Excel từ modal [P2] | FR-CMN-01 |
| QĐ-11 | Chấp nhận Heatmap; Traffic nhập tay có lưu; import Excel Traffic và mục tiêu hàng loạt | FR-EX-08, 7.6 |
| QĐ-12 | Giữ chuỗi thời gian + tab Ma trận chi nhánh [P2] | FR-EX-09 |
| QĐ-13 | Traffic: nhập. Chưa có: ca đo mắt, báo giá, lý do hoàn/hủy, độ chính xác đo khám. Đã có: độ hài lòng/NPS. Không có trạng thái "Đo khám" trên đơn | 1.3, M14, M15, M19, FR-OP-01, FR-HR-03 |
| QĐ-14 | Không phân loại vòng đời sản phẩm | FR-PR-01 |
| QĐ-15 | SS = 1,65 × σ × √LT; ROP = nhu cầu TB × LT + SS | FR-PR-06 |

**Quyết định chốt sau khi QC code thật (chốt 18/10/2026; câu hỏi gốc ở `docs/qc/QC_TONG_HOP.md` §3)**
| Mã | Nội dung | Câu hỏi gốc | Áp vào |
|---|---|---|---|
| QĐ-16 | Giá trị đơn = tiền khách cam kết trả cho hàng hóa sau giảm giá, cộng VAT, không gồm phí ship; VAT = `VatAmount` của dòng; **100% đơn xuất VAT** | A1 | BR-VAL-01, BR-VAL-05 |
| QĐ-17 | Ngày tạo đơn = **`SubmitAt`** (thời điểm đơn được lập thật; không dùng `CreateAt` của bản nháp) | A2 | BR-EVT-04 |
| QĐ-18 | Đơn đặt chuyển một phần: GMV toàn bộ tại ngày tạo; Kết thúc/Hủy trừ phần chưa chuyển | A3, A4 | BR-EVT-05 |
| QĐ-19 | Đổi hàng sau bán: phiếu trả = E4, đơn đổi = E2 | A5 | BR-EVT-06 |
| QĐ-20 | Loại khách lẻ `KHACHLE` khỏi Khách hàng mới; giá vốn đơn đặt = giá vốn hiện hành tại ngày tạo | A6, A7 | M03, M07 |
| QĐ-21 | Giữ số liệu chi nhánh đã đóng trong tổng | A8 | BR-MD-04 |
| QĐ-22 | Mã quyền theo vai trò; ẩn GMV bằng `null` + `gmvHidden` | B1, B4, B5 | BR-ROLE-01 |
| QĐ-23 | (thay bằng QĐ-28) | B3 | — |
| QĐ-24 | KPI chi nhánh theo mục tiêu ngày theo loại ngày (Trong tuần / Cuối tuần / Lễ) | C1 | BR-TGT-03, 7.5 |
| QĐ-25 | Mục tiêu doanh số là GMV | C2 | BR-TGT-07 |
| QĐ-26 | Doanh thu thực thu = Σ phiếu thu (POS chỉ có chứng từ phiếu thu) | A10 | M04, E8 |
| QĐ-27 | Cửa hàng của MANAGER = "Cửa hàng đang quản lý" (phân quyền chi nhánh của tài khoản trong Identity) | B2 | BR-ROLE-01 |
| QĐ-28 | Khu vực & Cụm cửa hàng lấy từ HRM; bộ lọc 3 cấp Khu vực → Cụm → Chi nhánh | B3 | BR-MD-01, BR-FLT-01 |
| QĐ-29 | Order Aging theo 2 chặng: Đặt hàng, Hoàn thành đơn hàng | D1 | FR-OP-01 |
| QĐ-30 | Chiến dịch theo mã chiến dịch trên đơn (CTKM / voucher); phương thức thanh toán theo mã riêng | D3 | FR-OP-05, FR-OP-06 |
| QĐ-31 | Hoãn bảng Lab (chưa có Lab) | D4 | FR-HR-04 |

**Quyết định PM bổ sung để tài liệu nhất quán** (đổi được nếu BOD muốn khác):
| Mã | Nội dung |
|---|---|
| PM-01 | KPI có **Mục tiêu GMV** (bắt buộc) và **Mục tiêu DTT** (tùy chọn); % đạt mục tiêu dùng GMV |
| PM-02 | Điều chỉnh (trả hàng, kết thúc, hủy) gán theo chi nhánh và người bán của **đơn gốc** |
| PM-03 | Phân tích theo sản phẩm, thương hiệu, nhân viên dùng **GMV** (BR-DIM-02) |
| PM-04 | Waterfall tách 3 cột giảm trừ (Trả hàng, Đổi hàng, Hủy đơn đặt) để minh bạch |
| PM-05 | Tỷ lệ trả hàng theo hóa đơn dùng mẫu số Volume gộp (M02g) |
| PM-06 | Bộ lọc đa chiều (FR-FLT-03, làm ngày 18/10). Phạm vi áp dụng theo FR-FLT-05.<br>**Ngành hàng / Thương hiệu:** lọc theo **dòng hàng** (BR-DIM-01).<br>**Giới tính khách:** theo hồ sơ khách tại thời điểm tạo đơn; có thêm nhóm "Không xác định".<br>**Phân khúc hóa đơn:** theo **giá trị đơn gốc** (BR-VAL-03), cùng 5 dải với FR-OP-04.<br>**Người bán (PIC):** người bán gán trên đơn gốc (PM-02).<br>**Trạng thái đơn:** trạng thái **hiện tại** của **chứng từ gốc** (`RootOrderId`), gồm 5 giá trị:<br>• Đơn đặt **Đang mở**: POS `PRE_ORDER_DRAFT` (Đơn tạm), `PRE_ORDER_VERIFIED`, `PRE_ORDER_SHIPPING`.<br>• Đơn đặt **Hoàn thành**: `PRE_ORDER_COMPLETED` và không có sự kiện Kết thúc.<br>• Đơn đặt **Kết thúc**: có sự kiện E5.<br>• Đơn đặt **Hủy**: có sự kiện E6, hoặc `PRE_ORDER_CANCELLED`.<br>• **Đơn hàng bán trực tiếp (Hoàn thành)**: chứng từ gốc không phải đơn đặt.<br>Không có lựa chọn "Đơn hàng chưa hoàn thành", vì đơn hàng chỉ phát sinh doanh số khi Hoàn thành (E2). Trạng thái chỉ suy ra từ sự kiện doanh thu và bảng mirror đơn đặt của V2, **không** dùng bảng `ReportOrderStatistic` cũ.<br>**Phân khúc hóa đơn** lấy giá trị của **sự kiện ghi nhận đơn gốc** (E1/E2 cùng `RootOrderId`), kể cả cho sự kiện trả / kết thúc / hủy.<br>**Widget không áp dụng một chiều đang lọc:** API trả danh sách chiều không áp dụng, giao diện hiện "Không áp dụng bộ lọc: &lt;chiều&gt;". Mục tiêu KPI không đổi theo đa chiều. |
| PM-07 | Tab Sản phẩm của bảng xếp hạng (FR-EX-07): Top theo GMV của dòng hàng trong phạm vi; cột Tỷ trọng = GMV sản phẩm / GMV phạm vi; khi GMV bị ẩn thì ẩn cột GMV, giữ Tỷ trọng và Số lượng |
| PM-08 | "Xem toàn bộ danh mục" (FR-PR-06) mở modal "Xem chi tiết dữ liệu" (FR-CMN-01) với toàn bộ danh sách sản phẩm của bảng, không giới hạn Top |

---

## 11. Hướng dẫn QC đối chiếu code dev

### 11.1. Quy trình
1. **Ánh xạ dữ liệu.** Điền bảng ánh xạ trạng thái (mục 2.2) và bảng ánh xạ thực thể (11.2) từ schema/code của dev. Trường nào không tìm thấy → ghi nhận là lỗi Lớn hoặc câu hỏi cho dev.
2. **Đối chiếu công thức.** Với từng M-xx, tìm hàm/truy vấn tính trong code, so từng điều kiện với giả mã mục 3.3: trạng thái được tính, ngày ghi nhận, loại trừ đơn sinh từ Đơn đặt, phí ship, VAT, dấu của điều chỉnh, mẫu số.
3. **Chạy bộ dữ liệu chuẩn.** Nạp mục 9 vào môi trường thử (hoặc mô phỏng tay qua code) và so TC-01 … TC-11.
4. **Kiểm bất biến.** Kiểm INV-01 … INV-12 trên dữ liệu thử và dữ liệu thật.
5. **Kiểm UI.** Đi qua mục 5, 6, 7 theo từng AC; kiểm định dạng BR-FMT.
6. **Báo cáo.** Ghi theo mẫu 11.3, phân loại mức độ theo mục 0.4.

### 11.2. Bảng ánh xạ thực thể (QC điền)
| Thực thể nghiệp vụ (2.1) | Bảng / model trong code dev | Trường chính | Ghi chú |
|---|---|---|---|
| Đơn đặt | | | |
| Đơn hàng | | | |
| Dòng hàng | | | |
| Phí vận chuyển | | | |
| Trả hàng | | | |
| Phiếu thu / chi | | | |
| Sổ công nợ | | | |
| Sản phẩm (kèm lịch sử thuế suất) | | | |
| Chi nhánh / Khu vực | | | |
| Nhân viên | | | |
| Traffic | | | |
| KPI | | | |
| Độ hài lòng / NPS | | | |
| Lệnh gia công | | | |

### 11.3. Mẫu báo cáo QC
| ID yêu cầu | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế | Kết quả | Mức độ | Bằng chứng (file:dòng / ảnh) |
|---|---|---|---|---|---|---|---|
| M01 | GMV loại trừ đơn sinh từ Đơn đặt | Đọc truy vấn GMV; chạy TC-01 | 12.262.400 | | Đạt / Không đạt | | |
| INV-08 | Waterfall = thẻ DTT | So 2 số trên UI, bộ lọc tháng 10 | 1.630.000 | | | | |

### 11.4. Danh sách kiểm nhanh các lỗi dễ gặp
| # | Điểm kiểm | Liên quan |
|---|---|---|
| 1 | GMV có cộng Đơn hàng sinh từ Đơn đặt (tính trùng)? | M01, INV-10 |
| 2 | Đơn đặt có được tính ngay từ "Đơn tạm" hay chỉ khi chuyển Đơn hàng? | QĐ-01.3 |
| 3 | Kết thúc / Hủy đơn đặt trừ đúng **ngày phát sinh** hay bị trừ hồi tố vào ngày tạo? | E5, E6 |
| 4 | GMV có gồm phí ship? Giảm giá cấp đơn có được trừ? | BR-VAL |
| 5 | VAT tính theo thuế suất hiện tại hay thuế suất tại ngày tạo đơn? | TC-06 |
| 6 | AOV có cùng công thức ở mọi widget? Trung bình nhiều kỳ có gia quyền? | M08 |
| 7 | Thẻ tài chính có đổi theo Khu vực / Chi nhánh? | AC-EX01-01 |
| 8 | Tăng trưởng tổng có phụ thuộc Chu kỳ gom nhóm? | BR-CMP-02 |
| 9 | Mục tiêu có lấy từ KPI, có co theo phạm vi và số ngày? | BR-TGT |
| 10 | Có số ngẫu nhiên / hằng số giả lập trong tính toán? | INV-12 |
| 11 | Nợ treo là số dư hay cộng dồn phát sinh? | M10 |
| 12 | Mũi tên / màu của chỉ số nghịch | BR-CMP-05 |
| 13 | DTT âm và Volume 0 có hiển thị đúng ("−x", "—")? | TC-03, TC-08 |
| 14 | MANAGER có xem được dữ liệu / KPI ngoài phạm vi qua API? | AC-ROLE-02 |
| 15 | Đơn vị hiển thị tự động, locale vi-VN | BR-FMT |

---

## Phụ lục A — Truy vết FRS → Tài liệu chuẩn
| Mục FRS | Tài liệu chuẩn | Thay đổi chính |
|---|---|---|
| §2 Phân quyền | 5 | Thêm RLS, MANAGER chỉ xem KPI |
| §3.1 Tổng quan | 7.1 | Thêm FR-EX-04; Heatmap thay thanh ngang; Waterfall 5 cột; Tăng trưởng giữ chuỗi thời gian + Ma trận chi nhánh [P2] |
| §3.2 Vận hành | 7.2 | Bỏ "Đo khám"; hoãn phễu và nguyên nhân hoàn/hủy |
| §3.3 Sản phẩm | 7.3 | Bỏ vòng đời SP; thêm SS/ROP |
| §3.4 Nhân sự | 7.4 | Bỏ mục tiêu cá nhân; xếp hạng theo GMV; hoãn bảng KTV |
| §3.5 KPI | 7.5, 7.6 | Mô hình KPI, vòng đời, import mục tiêu |
| §4.1–4.3 GMV, Điều chỉnh | 2.3, 3.1 | Thay bằng QĐ-01 (Đơn tạm / Hoàn thành; điều chỉnh = trả hàng + kết thúc + hủy đơn đặt) |
| §4.4 Checklist chỉ số | 3.2, 3.3 | Thay thế |
| §4.5 So sánh kỳ | 4.1 | Mở rộng cho biểu đồ theo bucket |

## Phụ lục B — Thuật ngữ
| Thuật ngữ | Nghĩa |
|---|---|
| Đơn đặt (Đơn đặt trước) | Đơn có cọc / cắt kính / đặt mẫu; trạng thái đầu là "Đơn tạm" |
| Đơn hàng | Đơn giao hàng; gồm Đơn lắp sẵn (không qua Đơn đặt) và Đơn hàng sinh từ Đơn đặt |
| Đơn lắp sẵn | Đơn hàng không qua Đơn đặt (mua thẳng) |
| Kết thúc | Hoàn thành Đơn đặt mà không ra Đơn hàng — dùng cho nghiệp vụ đổi hàng |
| Kỳ gốc / kỳ so sánh | Khoảng ngày đang lọc / khoảng liền trước cùng số ngày |
| Bucket | Một điểm trên trục thời gian sau khi gom theo Chu kỳ |
| Phạm vi (P) | Tập chi nhánh / khu vực / chiều đa chiều đang lọc, giao với phạm vi quyền |
