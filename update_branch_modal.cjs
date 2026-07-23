const fs = require('fs');
let code = fs.readFileSync('src/components/BranchRevenueComparison.tsx', 'utf8');

const oldImports = `import { Filter } from "lucide-react";`;
const newImports = `import { Filter, Users, X } from "lucide-react";`;
code = code.replace(oldImports, newImports);

const oldComponentStart = `export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  
  const currentData = data[period];`;

const newComponentStart = `export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  
  const currentData = data[period];`;
code = code.replace(oldComponentStart, newComponentStart);

const oldFilterButton = `          <button className="border border-slate-200 bg-white text-slate-700 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Tất cả chi nhánh
          </button>`;

const newFilterButton = `          <button className="border border-slate-200 bg-white text-slate-700 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Tất cả chi nhánh
          </button>
          <button 
            onClick={() => setIsTrafficModalOpen(true)}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            Nhập Traffic
          </button>`;
code = code.replace(oldFilterButton, newFilterButton);

const oldTd = `                  if (metric === "traffic") {
                    return (
                      <td key={p} className="p-1 border-b border-slate-100">
                        <input
                          type="number"
                          value={value || ""}
                          onChange={(e) => handleTrafficChange(row.branch, p, parseInt(e.target.value) || 0)}
                          className="w-full h-full py-1.5 px-1 text-center rounded text-xs font-semibold bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    );
                  }`;

const newTd = `                  // Removed input for traffic to only display it on the tab`;
code = code.replace(oldTd, newTd);

const modalComponent = `
      {isTrafficModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Nhập Traffic</h3>
                <p className="text-sm text-slate-500">Cập nhật lưu lượng khách hàng cho các chi nhánh</p>
              </div>
              <button 
                onClick={() => setIsTrafficModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-grow bg-slate-50">
              <div className="space-y-6">
                {currentData.periods.slice(0, 7).map((p) => (
                  <div key={p} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 mb-3">{p}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentData.data.slice(0, 12).map((row) => (
                        <div key={row.branch} className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600 truncate" title={row.branch}>
                            {row.branch}
                          </label>
                          <input
                            type="number"
                            value={row[p].traffic || ""}
                            onChange={(e) => handleTrafficChange(row.branch, p, parseInt(e.target.value) || 0)}
                            className="w-full py-1.5 px-2 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-center text-slate-500 mt-4">* Đang hiển thị 12 chi nhánh và 7 chu kỳ để demo</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsTrafficModalOpen(false)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

code = code.replace(`    </div>\n  );\n};`, modalComponent);

fs.writeFileSync('src/components/BranchRevenueComparison.tsx', code);
