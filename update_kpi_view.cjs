const fs = require('fs');
let code = fs.readFileSync('src/views/KPIManagementView.tsx', 'utf8');

const kpisTarget = `  const kpis = [
    { id: 1, level: "Toàn công ty", entity: "Tất cả", type: "Năm", period: "2026", revenue: "180 Tỷ", conversion: "68%", status: "active" },
    { id: 2, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "15 Tỷ", conversion: "65%", status: "active" },
    { id: 3, level: "Khu vực", entity: "Miền Bắc", type: "Tháng", period: "Tháng 7, 2026", revenue: "12 Tỷ", conversion: "62%", status: "active" },
    { id: 4, level: "Chi nhánh", entity: "HMK HN Chi nhánh 1", type: "Chiến dịch", period: "Lễ 30/4 - 1/5", revenue: "1.5 Tỷ", conversion: "70%", status: "completed" },
    { id: 5, level: "Khu vực", entity: "Miền Trung", type: "Tháng", period: "Tháng 6, 2026", revenue: "8 Tỷ", conversion: "60%", status: "completed" },
  ];`;

const kpisReplacement = `  const kpis = [
    { id: 1, level: "Toàn công ty", entity: "Tất cả", type: "Năm", period: "2026", revenue: "180 Tỷ", conversion: "68%", status: "active", version: "V1 (Chính thức)" },
    { id: 2, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "15 Tỷ", conversion: "65%", status: "active", version: "V2 (Đã điều chỉnh)" },
    { id: 6, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "16.5 Tỷ", conversion: "68%", status: "draft", version: "V3 (Bản nháp)" },
    { id: 7, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "14 Tỷ", conversion: "62%", status: "archived", version: "V1 (Lưu trữ)" },
    { id: 3, level: "Khu vực", entity: "Miền Bắc", type: "Tháng", period: "Tháng 7, 2026", revenue: "12 Tỷ", conversion: "62%", status: "active", version: "V1 (Chính thức)" },
    { id: 4, level: "Chi nhánh", entity: "HMK HN Chi nhánh 1", type: "Chiến dịch", period: "Lễ 30/4 - 1/5", revenue: "1.5 Tỷ", conversion: "70%", status: "completed", version: "V1" },
    { id: 5, level: "Khu vực", entity: "Miền Trung", type: "Tháng", period: "Tháng 6, 2026", revenue: "8 Tỷ", conversion: "60%", status: "completed", version: "V1" },
  ];`;
code = code.replace(kpisTarget, kpisReplacement);

const tableHeaderTarget = `                <th className="px-6 py-4">Chu kỳ</th>
                <th className="px-6 py-4">Mục tiêu Doanh thu</th>`;
const tableHeaderReplacement = `                <th className="px-6 py-4">Chu kỳ</th>
                <th className="px-6 py-4">Phiên bản</th>
                <th className="px-6 py-4">Mục tiêu Doanh thu</th>`;
code = code.replace(tableHeaderTarget, tableHeaderReplacement);

const tableBodyTarget = `                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{kpi.period}</span>
                      <span className="text-xs text-slate-500">{kpi.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">`;
const tableBodyReplacement = `                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{kpi.period}</span>
                      <span className="text-xs text-slate-500">{kpi.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{kpi.version}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">`;
code = code.replace(tableBodyTarget, tableBodyReplacement);

const statusTarget = `                  <td className="px-6 py-4">
                    {kpi.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang áp dụng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Đã kết thúc
                      </span>
                    )}
                  </td>`;
const statusReplacement = `                  <td className="px-6 py-4">
                    {kpi.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang áp dụng
                      </span>
                    ) : kpi.status === 'draft' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Bản nháp
                      </span>
                    ) : kpi.status === 'archived' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Lưu trữ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Đã kết thúc
                      </span>
                    )}
                  </td>`;
code = code.replace(statusTarget, statusReplacement);

fs.writeFileSync('src/views/KPIManagementView.tsx', code);
