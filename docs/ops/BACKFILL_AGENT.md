# Hướng dẫn cho AI agent: backfill Dashboard V2 trên bản sao DB

File này dành cho AI agent (ví dụ Claude Code) chạy trên **server backfill riêng**, nơi đã restore bản backup của DB production. Đặt file tại `/srv/backfill/CLAUDE.md`, hoặc đưa đường dẫn file cho agent.

Agent làm phần tính toán trên bản sao, từ chạy thử tới đóng gói 15 bảng kết quả. **Agent không bao giờ đụng tới production.** Việc chép kết quả về production do dev và DBA làm, theo mục "Chép kết quả về production" trong tài liệu "Runbook backfill Dashboard V2 (01/01/2026 → nay)".

Mỗi lần được gọi, agent chạy một phiên:
1. Kiểm tra an toàn.
2. Làm việc tiếp theo chưa xong.
3. Ghi nhật ký.
4. Báo cáo rồi dừng.

Một phiên có thể kéo dài nhiều giờ. Bản sao không có job định kỳ, nên không giới hạn giờ chạy.

---

## 1. Việc người phải làm trước khi giao cho agent

Agent **không** làm các việc dưới đây. Thiếu việc nào thì agent dừng và báo người.

- [ ] Server có Postgres (cùng major version với production), MySQL, .NET 9 SDK, git, `psql`, `flock`. Đĩa mã hóa.
- [ ] Server **không có đường mạng tới production**. Chiều ra đã bị chặn.
- [ ] Đã restore các DB `pos`, `report` (Postgres) và `zns` (MySQL) từ cùng một lần backup. Đã tạo DB `hangfire` rỗng.
- [ ] `/srv/backfill/report.api` đã checkout và build đúng phiên bản ở mục 1a.
- [ ] Đã tạo thư mục `/srv/backfill/state` và `/srv/backfill/logs`.
- [ ] File `/srv/backfill/backfill.env` (quyền 600) có các biến sau, tất cả trỏ tới `localhost`:
  - `ConnectionStrings__Default` (DB `report`), `ConnectionStrings__Pos`, `ConnectionStrings__Zns`, `Hangfire__ConnectionString`;
  - `REPORT_PSQL_URL`: chuỗi `psql` tới DB `report` trên bản sao;
  - `BACKFILL_T`: ngày trước ngày backup, dạng `yyyy-MM-dd`;
  - `BOD_ACCOUNT_ID`: GUID một tài khoản BOD, dùng để đối soát.

### 1a. Mã nguồn report.api: lấy từ đâu

Lấy report.api từ **nhánh `main`** của repo `eggstech/report.api`. Nhánh này đã merge bản phát hành Dashboard V2 ngày 29/10/2026 (PR #160) và đã được deploy lên production. Ghim đúng commit dưới đây. Không lấy main mới hơn: nếu main có commit mới sau ngày này mà production chưa deploy, code sẽ lệch với schema của bản backup.

| Mục | Giá trị |
| --- | --- |
| Repo | `https://github.com/eggstech/report.api.git` |
| Nhánh | `main` |
| Commit ghim | `dd2b9ba3dfb1339f1eaf760ed876e1811e3bb004` (`dd2b9ba`, "Merge pull request #160 from eggstech/release/dashboard-v2-2026-10-29", 29/10/2026 15:22 +07:00) |
| Migration cuối trong code | `20261028092731_DropNarrowEventDateSiteIdIndex` |
| Công cụ dùng | `tools/Report.SequentialSync` |

Người làm, chạy trên máy có quyền đọc GitHub, trước khi chép mã nguồn lên server backfill. Server backfill không ra được Internet, nên mã nguồn và gói NuGet phải chuẩn bị sẵn ở bước này:

```bash
git clone --branch main https://github.com/eggstech/report.api.git /srv/backfill/report.api
cd /srv/backfill/report.api
git checkout --detach dd2b9ba3dfb1339f1eaf760ed876e1811e3bb004
dotnet restore tools/Report.SequentialSync/Report.SequentialSync.csproj
dotnet build tools/Report.SequentialSync/Report.SequentialSync.csproj -c Release --no-restore
```

Nếu production được deploy lại từ một commit khác trước ngày lấy backup, dùng commit đó thay cho commit ghim. Sửa bảng trên cho khớp, rồi mới giao cho agent.

---

## 2. Quy tắc cứng (không có ngoại lệ)

1. **Không đọc, in, `cat` hay `echo` nội dung `backfill.env` và các chuỗi kết nối.** Chỉ được `source` file đó. Không trích dòng log nào có chuỗi kết nối.
2. **Chỉ làm việc với DB trên `localhost`.** Kiểm tra ở mục 4.2 không đạt thì không chạy gì. Thấy log nhắc tới host khác `localhost` thì dừng ngay.
3. **Chỉ chạy các lệnh có trong file này.** Không sửa mã nguồn, không chạy `git pull/checkout/commit/push`, không sửa `appsettings*.json`, không cài gói, không mở kết nối mạng ra ngoài.
4. Chỉ chạy các câu SQL có trong file này. Không `UPDATE`/`DELETE`/`DROP` gì trên `public`.
5. **Mỗi lúc chỉ một tiến trình backfill.** Không dùng `scripts/*-local-parallel.sh` hay bất kỳ script nào trong `scripts/`.
6. **Không đổi `F`, `T`, tên file checkpoint.** Không sửa hay xóa file trong `/srv/backfill/state`.
7. **Gặp tình huống dừng ở mục 6:** dừng và báo người. Không tự nghĩ cách xử lý khác.
8. Báo cáo chỉ gồm ngày, số đếm, mã trạng thái, thời lượng và mã thoát. Không dán dữ liệu khách hàng hay đơn hàng.

---

## 3. Hằng số và lệnh dùng chung

```bash
cd /srv/backfill/report.api
set -a; source /srv/backfill/backfill.env; set +a
F=2026-01-01; T="$BACKFILL_T"
ST=/srv/backfill/state; L=/srv/backfill/logs; J=$L/journal.md
SYNC="dotnet tools/Report.SequentialSync/bin/Release/net9.0/Report.SequentialSync.dll"
q() { psql "$REPORT_PSQL_URL" -X -A -F ' | ' -c "$1"; }
```

Câu xem trạng thái sync. Cột `State`: 1 = Idle, 2 = Running, 3 = Failed.

```bash
q 'SELECT "DatasetCode","State","LastRangeStartAt"::date,"LastRangeEndAt"::date,"LastErrorCode" FROM "ReportStatisticSyncState" ORDER BY 1;'
```

---

## 4. Quy trình một phiên

### 4.1 Khóa phiên

```bash
exec 9>/srv/backfill/agent.lock
flock -n 9 || { echo "Đã có phiên khác đang chạy"; exit 0; }
```

Không lấy được khóa thì báo "đã có phiên khác" rồi dừng.

### 4.2 Kiểm tra an toàn (một điều sai là dừng)

1. Mọi chuỗi kết nối đều trỏ tới `localhost`. Lệnh sau phải in ra `0` (lệnh chỉ in số đếm, không in chuỗi):
   `grep -Eio '(host|server)=[^;]*' /srv/backfill/backfill.env | grep -vic 'localhost\|127\.0\.0\.1'`
2. Không ra được production: `getent hosts` hoặc kết nối thử tới bất kỳ địa chỉ production nào phải thất bại. Không có địa chỉ production để thử thì bỏ qua ý này.
3. `T` có dạng `yyyy-MM-dd`, không sau ngày hôm nay, và giống `T` đã ghi trong `$J` ở các phiên trước.
4. Không có tiến trình backfill nào khác: `pgrep -f Report.SequentialSync` không trả về gì.
5. Các file `$ST/*.state` (nếu có) chỉ chứa một ngày dạng `yyyy-MM-dd`, không sau `T`.
6. Mã nguồn đúng commit ghim ở mục 1a và chưa bị sửa:
   - `git rev-parse HEAD` phải ra `dd2b9ba3dfb1339f1eaf760ed876e1811e3bb004`;
   - `git status --porcelain --untracked-files=no` phải không in gì;
   - file `tools/Report.SequentialSync/bin/Release/net9.0/Report.SequentialSync.dll` phải tồn tại.

   Không đạt thì dừng. Không tự `checkout` hay build lại.
7. Schema của bản backup khớp với code:
   `q 'SELECT max("MigrationId") FROM "__EFMigrationsHistory";'` phải ra `20261028092731_DropNarrowEventDateSiteIdIndex`.
   - Ra migration cũ hơn: bản backup được lấy trước lần deploy ngày 29/10.
   - Ra migration mới hơn: production đã deploy bản mới hơn.

   Cả hai trường hợp đều dừng và báo người.

### 4.3 Chọn việc cần làm

Đọc `$J` và các checkpoint, rồi chọn **việc đầu tiên chưa xong**:

| # | Việc | Coi là xong khi |
| --- | --- | --- |
| 0 | Chạy thử ngày 2026-10-01 | `$J` có dòng `PILOT DONE` |
| — | **Chờ người duyệt kết quả chạy thử** | `$J` có dòng `PILOT APPROVED` (do người thêm) |
| 1 | Sự kiện doanh thu | `cat $ST/1-events.state` = `T` |
| 2 | Thống kê theo ngày | `cat $ST/2-stats.state` = `T` |
| 3 | Công nợ | `cat $ST/3-debt.state` = `T` |
| 4 | Đơn đặt | `cat $ST/4-preorders.state` = `T` |
| 5 | Nghiệm thu trên bản sao | `$J` có dòng `VERIFY DONE` |
| 6 | Đóng gói 15 bảng | `$J` có dòng `PACKAGE DONE` |

- Đang ở bước chờ duyệt: không chạy gì. Báo lại kết quả chạy thử và nhắc người thêm dòng `PILOT APPROVED` vào `$J`.
- Mọi việc đã xong: báo "Đã đóng gói xong, chờ dev/DBA chép về production" rồi dừng.
- Xong một việc thì làm tiếp việc sau trong cùng phiên, trừ bước chờ duyệt.

### 4.4 Lệnh của từng việc

Mỗi lệnh chạy nền và ghi log riêng. Cứ 10 phút kiểm tra một lần: tiến trình còn sống không, và 20 dòng cuối log có từ khóa lỗi không (`Exception`, `timeout`, `40001`, `No space`, tên host khác `localhost`).

```bash
$SYNC <tham số> >> $L/<buoc>.log 2>&1 &
PID=$!
```

**Việc 0: chạy thử.** Chạy lần lượt và đo thời gian từng lệnh:

```bash
D=2026-10-01
$SYNC --date $D --local-backfill --revenue-events-backfill --chunk-days 1
$SYNC --date $D --local-backfill
$SYNC --date $D --local-backfill --debt-snapshot-backfill --chunk-days 1
$SYNC --date $D --pre-order-backfill
```

Ước lượng tổng thời gian: thời gian mỗi lệnh × số ngày từ `F` đến `T`, cộng cả 4 lệnh. Ghi vào `$J` dòng `PILOT DONE`, kèm 4 thời lượng, tổng giờ ước lượng và dung lượng đĩa còn trống (`df -h /`).

**Việc 1–4:**

```bash
# 1. Sự kiện doanh thu
$SYNC --from $F --to $T --local-backfill --revenue-events-backfill --chunk-days 7 --checkpoint $ST/1-events.state
# 2. Thống kê theo ngày
$SYNC --from $F --to $T --local-backfill --checkpoint $ST/2-stats.state
# 3. Công nợ
$SYNC --from $F --to $T --local-backfill --debt-snapshot-backfill --chunk-days 7 --checkpoint $ST/3-debt.state
# 4. Đơn đặt (KHÔNG có --local-backfill)
$SYNC --from $F --to $T --pre-order-backfill --checkpoint $ST/4-preorders.state
```

Xử lý theo mã thoát:
- **Mã 0:** sang việc kế tiếp.
- **Mã khác 0:** ghi ngày đang nằm trong checkpoint và từ khóa lỗi.
  - Lỗi là `timeout` hoặc `40001`: chạy lại đúng lệnh đó **một lần**.
  - Lỗi lần hai, hoặc lỗi loại khác: xử lý theo mục 6.

**Việc 5: nghiệm thu trên bản sao.**

1. Câu xem trạng thái sync: hai dataset `DashboardRevenueEventFact` và `DashboardCustomerDebtFact` phải có `LastRangeStartAt` ≤ `F`, `LastRangeEndAt` = `T` và `LastErrorCode` trống. Không xét các dòng khác.
2. Đối soát theo tháng. Mã thoát `0` là đạt:

```bash
export REPORT_RECONCILIATION_CONNECTION="$ConnectionStrings__Default"
$SYNC --reconcile --account-id "$BOD_ACCOUNT_ID" --from $F --to $T --scope month-system > $L/reconcile.json; echo "exit=$?"
```

3. Đạt thì ghi `VERIFY DONE`. Không đạt thì ghi `VERIFY FAILED` kèm số tháng lệch (đọc từ JSON), rồi dừng (mục 6).

**Việc 6: đóng gói.** Chỉ làm trên DB `report` của bản sao. Nếu schema `backfill_stage` đã có từ một lần làm dở thì dừng và báo người, không tự xóa.

```bash
psql "$REPORT_PSQL_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
CREATE TEMP TABLE bf(ord int, t text);
INSERT INTO bf VALUES (1,'ReportOrder'),(2,'ReportOrderStatistic'),(3,'ReportPaymentStatistic'),
 (4,'ReportCustomer'),(5,'ReportCustomerFirstPurchase'),(6,'ReportProduct'),(7,'ReportStaff'),
 (8,'ReportRating'),(9,'ReportRatingNote'),(10,'ReportResponseRate'),(11,'ReportRevenueEvent'),
 (12,'ReportRevenueEventLine'),(13,'ReportCustomerDebtSnapshot'),(14,'ReportPreOrderStatistic'),
 (15,'ReportPreOrderSyncCoverage');
CREATE SCHEMA backfill_stage;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT t FROM bf ORDER BY ord LOOP
    EXECUTE format('CREATE TABLE backfill_stage.%I AS TABLE public.%I', r.t, r.t);
  END LOOP; END $$;
SELECT t, (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM backfill_stage.%I', t), false, true, '')))[1]::text::bigint AS rows
FROM bf ORDER BY ord;
SELECT "DatasetCode", "LastRangeStartAt" FROM "ReportStatisticSyncState"
WHERE "DatasetCode" IN ('DashboardRevenueEventFact','DashboardCustomerDebtFact');
SELECT max("MigrationId") FROM "__EFMigrationsHistory";
SQL
pg_dump -Fc -n backfill_stage -d "$REPORT_PSQL_URL" -f /srv/backfill/backfill_stage.dump
ls -l /srv/backfill/backfill_stage.dump
```

Lưu 3 kết quả vào `$L/package.txt`: số dòng 15 bảng, `LastRangeStartAt` của 2 dataset và `MigrationId` cuối. Sau đó ghi `PACKAGE DONE` vào `$J`. Dev và DBA cần cả 3 kết quả này khi chép về production.

### 4.5 Ghi nhật ký và báo cáo

Cuối phiên, thêm vào `$J` một khối:

```
## <ngày giờ VN>
- T: <T>
- Việc: <0..6>  | Kết quả: <xong / lỗi / chờ người>
- Checkpoint: events=<ngày> stats=<ngày> debt=<ngày> preorders=<ngày>
- Thời lượng phiên: <giờ:phút>  | Đĩa còn trống: <GB>
- Lỗi: <từ khóa + ngày, hoặc "không">
- Ước lượng còn lại: <số ngày chưa xong của bước hiện tại>, khoảng <số> giờ
```

Báo cáo cho người đúng nội dung khối đó, bằng tiếng Việt.

---

## 5. Những việc agent không được tự quyết

- Chạy song song, đổi `--chunk-days` hoặc `--batch-size`.
- Xóa hay sửa checkpoint, đổi `T`, chạy lại khoảng đã xong.
- Xóa schema `backfill_stage`, chạy `DROP` hay `TRUNCATE` bất cứ thứ gì.
- Bỏ qua bước chờ người duyệt sau chạy thử.
- Mọi việc liên quan tới production, kể cả chép file dump đi đâu.

Nếu thấy cần làm một trong các việc trên, ghi đề xuất vào báo cáo và chờ người.

---

## 6. Tình huống phải dừng và báo người

Với mọi tình huống dưới đây:
1. Dừng lệnh đang chạy bằng `kill -INT $PID` và đợi tiến trình thoát, tối đa 5 phút.
2. Ghi nhật ký.
3. Báo cáo cho người.
4. **Không chạy tiếp trong phiên này.**

| Tình huống | Ghi chú cho người |
| --- | --- |
| Kiểm tra `localhost` không đạt, hoặc log nhắc tới host khác | **KHẨN**: có thể tool đang trỏ tới production |
| Cùng một ngày lỗi ở 2 lần chạy liên tiếp (kể cả qua 2 phiên) | Ghi ngày và từ khóa lỗi |
| Sai commit, mã nguồn bị sửa, hoặc migration cuối không khớp (mục 4.2 ý 6–7) | Cần người kiểm tra lại commit đang chạy trên production |
| Lỗi thiếu cột hoặc thiếu bảng | Có thể code khác phiên bản schema của backup |
| Lỗi MySQL hoặc `Zns` | Có thể thiếu bản restore `Zns` |
| Đĩa còn dưới 10% | Cần nới đĩa |
| Checkpoint không hợp lệ hoặc báo "Checkpoint nằm sau khoảng" | Không tự sửa file |
| Thiếu biến môi trường | Không tự tìm chuỗi kết nối ở nơi khác |
| Nghiệm thu hoặc đối soát không đạt | Ghi số tháng lệch |
| Schema `backfill_stage` đã tồn tại | Không tự xóa |
| Bất kỳ điều gì không có trong file này | Mô tả ngắn, không đoán |
