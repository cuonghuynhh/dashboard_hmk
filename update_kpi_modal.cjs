const fs = require('fs');
let code = fs.readFileSync('src/components/KPIConfigurationModal.tsx', 'utf8');

const importTarget = `import { X, Save, Target, Calendar, Map, CheckCircle2, AlertCircle } from "lucide-react";`;
code = code.replace(importTarget, `import { X, Save, Target, Calendar, Map, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";`);

const stateTarget = `  const [isSaved, setIsSaved] = useState(false);`;
const stateReplacement = `  const [isSaved, setIsSaved] = useState(false);\n  const [conflictPolicy, setConflictPolicy] = useState("overwrite");\n  const [showConflictWarning, setShowConflictWarning] = useState(false);`;
code = code.replace(stateTarget, stateReplacement);

const saveTarget = `  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
        setStep(1);
      }, 1500);
    }, 1000);
  };`;
const saveReplacement = `  const handleSave = () => {
    if (!showConflictWarning && entity !== "Tất cả") {
      // Simulate conflict detection for specific entities
      setShowConflictWarning(true);
      return;
    }
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setShowConflictWarning(false);
        onClose();
        setStep(1);
      }, 1500);
    }, 1000);
  };`;
code = code.replace(saveTarget, saveReplacement);

const kpiInputsTarget = `                </div>

                <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-100">`;
const conflictUIReplacement = `                </div>

                {showConflictWarning && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <h4 className="text-sm font-bold text-amber-800">Phát hiện trùng lặp KPI</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Đã tồn tại bộ KPI đang áp dụng cho <strong>{entity}</strong> trong khoảng thời gian <strong>{timeGranularity === 'year' ? '2026' : timeValue}</strong>. Vui lòng chọn cách xử lý:
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 p-2 bg-white rounded border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors">
                          <input 
                            type="radio" 
                            name="conflictPolicy" 
                            value="overwrite" 
                            checked={conflictPolicy === "overwrite"} 
                            onChange={() => setConflictPolicy("overwrite")} 
                            className="text-amber-600 focus:ring-amber-500" 
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-800">Ghi đè hoàn toàn</p>
                            <p className="text-xs text-slate-500">Bộ KPI cũ sẽ bị vô hiệu hóa</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white rounded border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors">
                          <input 
                            type="radio" 
                            name="conflictPolicy" 
                            value="highest" 
                            checked={conflictPolicy === "highest"} 
                            onChange={() => setConflictPolicy("highest")} 
                            className="text-amber-600 focus:ring-amber-500" 
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-800">Giữ mục tiêu cao nhất</p>
                            <p className="text-xs text-slate-500">Hệ thống sẽ lấy giá trị cao hơn giữa bản cũ và mới cho từng chỉ số</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white rounded border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors">
                          <input 
                            type="radio" 
                            name="conflictPolicy" 
                            value="versioning" 
                            checked={conflictPolicy === "versioning"} 
                            onChange={() => setConflictPolicy("versioning")} 
                            className="text-amber-600 focus:ring-amber-500" 
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-800">Lưu thành phiên bản mới (Bản nháp)</p>
                            <p className="text-xs text-slate-500">Chờ quản lý cấp cao phê duyệt trước khi áp dụng</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-100">`;
code = code.replace(kpiInputsTarget, conflictUIReplacement);

const buttonTarget = `                      <><Save className="w-5 h-5" /> Lưu cấu hình KPI</>
                    )}
                  </button>`;
const buttonReplacement = `                      <><Save className="w-5 h-5" /> {showConflictWarning ? "Xác nhận & Lưu" : "Lưu cấu hình KPI"}</>
                    )}
                  </button>`;
code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/components/KPIConfigurationModal.tsx', code);
