import React, { useState } from "react";
import { Target, Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, Calendar, Map, CheckCircle2, X } from "lucide-react";
import { KPIConfigurationModal } from "../components/KPIConfigurationModal";

export const KPIManagementView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditType, setBulkEditType] = useState<"revenue" | "deadline">("revenue");

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(kpis.map(kpi => kpi.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const kpis = [
    { id: 1, level: "Toàn công ty", entity: "Tất cả", type: "Năm", period: "2026", revenue: "180 Tỷ", conversion: "68%", status: "active", version: "V1 (Chính thức)" },
    { id: 2, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "15 Tỷ", conversion: "65%", status: "active", version: "V2 (Đã điều chỉnh)" },
    { id: 6, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "16.5 Tỷ", conversion: "68%", status: "draft", version: "V3 (Bản nháp)" },
    { id: 7, level: "Khu vực", entity: "Hồ Chí Minh", type: "Tháng", period: "Tháng 7, 2026", revenue: "14 Tỷ", conversion: "62%", status: "archived", version: "V1 (Lưu trữ)" },
    { id: 3, level: "Khu vực", entity: "Miền Bắc", type: "Tháng", period: "Tháng 7, 2026", revenue: "12 Tỷ", conversion: "62%", status: "active", version: "V1 (Chính thức)" },
    { id: 4, level: "Chi nhánh", entity: "HMK HN Chi nhánh 1", type: "Chiến dịch", period: "Lễ 30/4 - 1/5", revenue: "1.5 Tỷ", conversion: "70%", status: "completed", version: "V1" },
    { id: 5, level: "Khu vực", entity: "Miền Trung", type: "Tháng", period: "Tháng 6, 2026", revenue: "8 Tỷ", conversion: "60%", status: "completed", version: "V1" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Quản lý Mục tiêu & KPI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập, theo dõi và quản lý các chỉ tiêu hiệu suất trên toàn hệ thống
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm KPI mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tổng số KPI đang áp dụng</p>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">KPI đã hoàn thành (Tháng trước)</p>
            <p className="text-2xl font-bold text-slate-800">8 / 10</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Cấp độ phân bổ sâu nhất</p>
            <p className="text-lg font-bold text-slate-800">Cấp Chi nhánh</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">Danh sách KPI đã thiết lập</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm khu vực, chi nhánh..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50/50 font-medium border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={selectedRows.length === kpis.length && kpis.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">Phạm vi</th>
                <th className="px-6 py-4">Đối tượng</th>
                <th className="px-6 py-4">Chu kỳ</th>
                <th className="px-6 py-4">Phiên bản</th>
                <th className="px-6 py-4">Mục tiêu Doanh thu</th>
                <th className="px-6 py-4">Tỷ lệ CĐ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr key={kpi.id} className={`border-b border-slate-50 last:border-0 transition-colors ${selectedRows.includes(kpi.id) ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-4 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={selectedRows.includes(kpi.id)}
                      onChange={() => handleSelectRow(kpi.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {kpi.level === "Toàn công ty" ? <Target className="w-3 h-3" /> : <Map className="w-3 h-3" />}
                      {kpi.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {kpi.entity}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{kpi.period}</span>
                      <span className="text-xs text-slate-500">{kpi.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{kpi.version}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">
                    {kpi.revenue}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {kpi.conversion}
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Hiển thị 1 - 5 của 12 KPI</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">Trước</button>
            <button className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">3</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Sau</button>
          </div>
        </div>
      </div>

      <KPIConfigurationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Floating Action Bar for Bulk Edit */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/20 text-indigo-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
              {selectedRows.length}
            </div>
            <span className="font-medium text-sm">KPI đã chọn</span>
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setBulkEditType("revenue"); setIsBulkEditModalOpen(true); }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cập nhật mục tiêu
            </button>
            <button 
              onClick={() => { setBulkEditType("deadline"); setIsBulkEditModalOpen(true); }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              Thay đổi thời hạn
            </button>
            <button className="px-3 py-1.5 text-rose-400 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
              Xóa
            </button>
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <button 
            onClick={() => setSelectedRows([])}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Bỏ chọn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {bulkEditType === "revenue" ? "Cập nhật mục tiêu hàng loạt" : "Thay đổi thời hạn hàng loạt"}
              </h3>
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-start gap-3">
                <Target className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-800">
                  Bạn đang chỉnh sửa <strong>{selectedRows.length}</strong> KPI. Những thay đổi này sẽ được áp dụng đồng loạt.
                </p>
              </div>
              
              {bulkEditType === "revenue" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu Doanh thu mới</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ví dụ: 15" 
                        className="w-full pl-3 pr-16 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-slate-500 text-sm font-medium">Tỷ VNĐ</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tỷ lệ Chuyển đổi mới</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ví dụ: 65" 
                        className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-slate-500 text-sm font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Chu kỳ mới</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
                      <option>Tháng</option>
                      <option>Quý</option>
                      <option>Năm</option>
                      <option>Chiến dịch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Tháng 8, 2026" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  setIsBulkEditModalOpen(false);
                  setSelectedRows([]);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
