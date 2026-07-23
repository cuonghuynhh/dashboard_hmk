import React, { useState } from "react";
import { X, Save, Target, Calendar, Map, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

interface KPIConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ApplyLevel = "company" | "region" | "branch";
type TimeGranularity = "year" | "month" | "holiday";

export const KPIConfigurationModal: React.FC<KPIConfigurationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [level, setLevel] = useState<ApplyLevel>("company");
  const [entity, setEntity] = useState<string>("Tất cả");
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>("month");
  const [timeValue, setTimeValue] = useState<string>("Tháng 7, 2026");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [conflictPolicy, setConflictPolicy] = useState("overwrite");
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // Mock form state
  const [kpiForm, setKpiForm] = useState({
    revenue: "15",
    conversion: "65",
    basketSize: "850000",
    traffic: "25000",
    satisfaction: "90",
  });

  if (!isOpen) return null;

  const handleSave = () => {
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
  };

  const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
  const branches = ["HMK HN Chi nhánh 1", "HMK ĐN Chi nhánh 2", "HMK BD Chi nhánh 3"];
  const holidays = ["Black Friday", "Tết Nguyên Đán 2026", "Lễ 8/3", "Lễ 30/4 - 1/5"];
  const months = Array.from({length: 12}, (_, i) => `Tháng ${i+1}, 2026`);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cấu hình Mục tiêu & KPI</h2>
              <p className="text-xs text-slate-500">Thiết lập bộ chỉ tiêu để theo dõi và đối chuẩn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Sidebar / Steps */}
          <div className="w-full md:w-1/3 flex flex-col gap-6 border-r border-slate-100 pr-4">
            <div className={`cursor-pointer transition-colors p-3 rounded-lg border ${step >= 1 ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-white opacity-50"}`} onClick={() => setStep(1)}>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                Phạm vi áp dụng
              </h3>
              {step > 1 && (
                <p className="text-xs text-slate-500 mt-2 ml-8">
                  {level === 'company' ? 'Toàn công ty' : level === 'region' ? `Khu vực: ${entity}` : `Chi nhánh: ${entity}`}
                </p>
              )}
            </div>

            <div className={`cursor-pointer transition-colors p-3 rounded-lg border ${step >= 2 ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-white opacity-50"}`} onClick={() => { if(step > 1) setStep(2) }}>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${step >= 2 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"} flex items-center justify-center text-xs`}>2</span>
                Chu kỳ thời gian
              </h3>
              {step > 2 && (
                <p className="text-xs text-slate-500 mt-2 ml-8">
                  {timeGranularity === 'year' ? 'Cả năm 2026' : timeValue}
                </p>
              )}
            </div>

            <div className={`cursor-pointer transition-colors p-3 rounded-lg border ${step >= 3 ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-white opacity-50"}`} onClick={() => { if(step > 2) setStep(3) }}>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${step >= 3 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"} flex items-center justify-center text-xs`}>3</span>
                Nhập liệu chỉ tiêu
              </h3>
            </div>
          </div>

          {/* Form Area */}
          <div className="w-full md:w-2/3">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Chọn Đối tượng thiết lập KPI</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "company", label: "Toàn công ty" },
                    { id: "region", label: "Khu vực" },
                    { id: "branch", label: "Chi nhánh" }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => { setLevel(lvl.id as ApplyLevel); setEntity("Tất cả"); }}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-sm font-medium ${
                        level === lvl.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      <Map className="w-6 h-6" />
                      {lvl.label}
                    </button>
                  ))}
                </div>

                {level === "region" && (
                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium text-slate-700">Chọn Khu vực</label>
                    <select 
                      value={entity} 
                      onChange={e => setEntity(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
                    >
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {level === "branch" && (
                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium text-slate-700">Chọn Chi nhánh</label>
                    <select 
                      value={entity} 
                      onChange={e => setEntity(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
                    >
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setStep(2)}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Thiết lập Chu kỳ thời gian</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Độ phân giải (Granularity)</label>
                    <div className="flex gap-2">
                      {[
                        { id: "year", label: "Cả năm" },
                        { id: "month", label: "Theo tháng" },
                        { id: "holiday", label: "Chiến dịch / Lễ" }
                      ].map(gran => (
                        <button
                          key={gran.id}
                          onClick={() => {
                            setTimeGranularity(gran.id as TimeGranularity);
                            if (gran.id === 'year') setTimeValue('2026');
                            else if (gran.id === 'month') setTimeValue(months[6]);
                            else if (gran.id === 'holiday') setTimeValue(holidays[0]);
                          }}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            timeGranularity === gran.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {gran.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {timeGranularity === "month" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Chọn Tháng</label>
                      <select 
                        value={timeValue} 
                        onChange={e => setTimeValue(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
                      >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}

                  {timeGranularity === "holiday" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Chọn Ngày lễ / Sự kiện đặc biệt</label>
                      <select 
                        value={timeValue} 
                        onChange={e => setTimeValue(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
                      >
                        {holidays.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                        <AlertCircle className="w-4 h-4" /> 
                        Thiết lập mục tiêu cho chiến dịch sẽ ghi đè lên mục tiêu ngày/tháng trong khoảng thời gian đó.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 mt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-slate-600 px-4 py-2.5 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-bold text-slate-800">Nhập liệu Chỉ tiêu (KPI)</h3>
                  <div className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded font-medium border border-emerald-200">
                    Mục tiêu: {timeGranularity === 'year' ? '2026' : timeValue}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Doanh thu (Tỷ VNĐ)</label>
                    <input 
                      type="number" 
                      value={kpiForm.revenue}
                      onChange={(e) => setKpiForm({...kpiForm, revenue: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tỷ lệ Chuyển đổi (%)</label>
                    <input 
                      type="number" 
                      value={kpiForm.conversion}
                      onChange={(e) => setKpiForm({...kpiForm, conversion: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">GTTB Đơn hàng (VNĐ)</label>
                    <input 
                      type="number" 
                      value={kpiForm.basketSize}
                      onChange={(e) => setKpiForm({...kpiForm, basketSize: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Lưu lượng KH</label>
                    <input 
                      type="number" 
                      value={kpiForm.traffic}
                      onChange={(e) => setKpiForm({...kpiForm, traffic: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Độ hài lòng (%)</label>
                    <input 
                      type="number" 
                      value={kpiForm.satisfaction}
                      onChange={(e) => setKpiForm({...kpiForm, satisfaction: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                    />
                  </div>
                </div>

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

                <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setStep(2)}
                    className="text-slate-600 px-4 py-2.5 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                      isSaved ? "bg-emerald-600 text-white" : 
                      "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {isSaving ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : isSaved ? (
                      <><CheckCircle2 className="w-5 h-5" /> Đã lưu KPI</>
                    ) : (
                      <><Save className="w-5 h-5" /> {showConflictWarning ? "Xác nhận & Lưu" : "Lưu cấu hình KPI"}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
