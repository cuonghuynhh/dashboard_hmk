const fs = require('fs');
let code = fs.readFileSync('src/views/KPIManagementView.tsx', 'utf8');

const importTarget = `import { Target, Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, Calendar, Map, CheckCircle2 } from "lucide-react";`;
const importReplacement = `import { Target, Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, Calendar, Map, CheckCircle2, X } from "lucide-react";`;
code = code.replace(importTarget, importReplacement);

const stateTarget = `  const [searchTerm, setSearchTerm] = useState("");`;
const stateReplacement = `  const [searchTerm, setSearchTerm] = useState("");
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
  };`;
code = code.replace(stateTarget, stateReplacement);

const tableHeaderTarget = `            <thead className="text-slate-500 bg-slate-50/50 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Phạm vi</th>`;
const tableHeaderReplacement = `            <thead className="text-slate-500 bg-slate-50/50 font-medium border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={selectedRows.length === kpis.length && kpis.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">Phạm vi</th>`;
code = code.replace(tableHeaderTarget, tableHeaderReplacement);

const tableBodyTarget = `              {kpis.map((kpi) => (
                <tr key={kpi.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">`;
const tableBodyReplacement = `              {kpis.map((kpi) => (
                <tr key={kpi.id} className={\`border-b border-slate-50 last:border-0 transition-colors \${selectedRows.includes(kpi.id) ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50/50'}\`}>
                  <td className="px-4 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={selectedRows.includes(kpi.id)}
                      onChange={() => handleSelectRow(kpi.id)}
                    />
                  </td>
                  <td className="px-6 py-4">`;
code = code.replace(tableBodyTarget, tableBodyReplacement);

const endTarget = `      <KPIConfigurationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};`;
const endReplacement = `      <KPIConfigurationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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
};`;
code = code.replace(endTarget, endReplacement);

fs.writeFileSync('src/views/KPIManagementView.tsx', code);
