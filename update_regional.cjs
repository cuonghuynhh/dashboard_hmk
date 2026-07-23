const fs = require('fs');
let code = fs.readFileSync('src/components/RegionalComparison.tsx', 'utf8');

const newDataGeneration = `const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
const branches = ["HMK HN Chi nhánh 1", "HMK ĐN Chi nhánh 2", "HMK BD Chi nhánh 3", "HMK Chi nhánh 4", "HMK HN Chi nhánh 5"];

const metrics = [
  { key: "revenue", label: "Doanh thu", domain: [0, 100] },
  { key: "conversion", label: "Tỷ lệ chuyển đổi", domain: [0, 100] },
  { basketSize: "basketSize", label: "GTTB Đơn hàng", domain: [0, 100] },
  { traffic: "traffic", label: "Lưu lượng KH", domain: [0, 100] },
  { returning: "returning", label: "Khách quay lại", domain: [0, 100] },
  { satisfaction: "satisfaction", label: "Độ hài lòng", domain: [0, 100] },
];

const generateDataForEntities = (entities) => {
  return entities.map(entity => ({
    name: entity,
    revenue: Math.floor(Math.random() * 40) + 60, // 60-100
    conversion: Math.floor(Math.random() * 40) + 60,
    basketSize: Math.floor(Math.random() * 40) + 60,
    traffic: Math.floor(Math.random() * 40) + 60,
    returning: Math.floor(Math.random() * 40) + 60,
    satisfaction: Math.floor(Math.random() * 20) + 80,
  }));
};

const mockRegionsData = generateDataForEntities(regions);
const mockBranchesData = generateDataForEntities(branches);

const nationalAverage = {
  name: "Trung bình Toàn quốc",
  revenue: 75,
  conversion: 70,
  basketSize: 72,
  traffic: 78,
  returning: 68,
  satisfaction: 85,
};

const regionalAverage = {
  name: "Trung bình Khu vực",
  revenue: 80,
  conversion: 75,
  basketSize: 76,
  traffic: 82,
  returning: 70,
  satisfaction: 88,
};

const allRegionData = [...mockRegionsData, nationalAverage];
const allBranchData = [...mockBranchesData, regionalAverage, nationalAverage];

type CompareType = "region" | "branch";

export const RegionalComparison: React.FC = () => {
  const [compareType, setCompareType] = useState<CompareType>("region");
  const [baseEntity, setBaseEntity] = useState<string>("Hồ Chí Minh");
  const [compareEntity, setCompareEntity] = useState<string>("Trung bình Toàn quốc");

  // Effect to handle switching comparison types
  React.useEffect(() => {
    if (compareType === "region") {
      setBaseEntity("Hồ Chí Minh");
      setCompareEntity("Trung bình Toàn quốc");
    } else {
      setBaseEntity("HMK HN Chi nhánh 1");
      setCompareEntity("Trung bình Khu vực");
    }
  }, [compareType]);

  const chartData = useMemo(() => {
    const dataset = compareType === "region" ? allRegionData : allBranchData;
    const fallbackBase = compareType === "region" ? mockRegionsData[0] : mockBranchesData[0];
    const fallbackCompare = compareType === "region" ? nationalAverage : regionalAverage;
    
    const base = dataset.find(d => d.name === baseEntity) || fallbackBase;
    const compare = dataset.find(d => d.name === compareEntity) || fallbackCompare;

    return [
      { subject: "Doanh thu", A: base.revenue, B: compare.revenue },
      { subject: "Tỷ lệ chuyển đổi", A: base.conversion, B: compare.conversion },
      { subject: "GTTB Đơn hàng", A: base.basketSize, B: compare.basketSize },
      { subject: "Lưu lượng KH", A: base.traffic, B: compare.traffic },
      { subject: "Khách quay lại", A: base.returning, B: compare.returning },
      { subject: "Độ hài lòng", A: base.satisfaction, B: compare.satisfaction },
    ];
  }, [baseEntity, compareEntity, compareType]);`;

const oldDataStart = `const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];`;
const oldDataEnd = `    ];
  }, [baseRegion, compareRegion]);`;

code = code.substring(0, code.indexOf(oldDataStart)) + newDataGeneration + code.substring(code.indexOf(oldDataEnd) + oldDataEnd.length);

const oldJSXHeader = `        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            Benchmarking Khu vực (Regional Comparison)
          </h2>
          <p className="text-xs text-slate-500">
            So sánh hiệu suất giữa các khu vực hoặc với trung bình toàn quốc
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Phân tích:</span>
            <select
              value={baseRegion}
              onChange={(e) => setBaseRegion(e.target.value)}
              className="border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">So với:</span>
            <select
              value={compareRegion}
              onChange={(e) => setCompareRegion(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm"
            >
              <option value="Trung bình Toàn quốc">Trung bình Toàn quốc</option>
              {regions.map(r => (
                <option key={r} value={r} disabled={r === baseRegion}>{r}</option>
              ))}
            </select>
          </div>
        </div>`;

const newJSXHeader = `        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            Benchmarking Hiệu suất (Performance Comparison)
          </h2>
          <p className="text-xs text-slate-500">
            So sánh hiệu suất giữa các chi nhánh, khu vực hoặc với điểm chuẩn
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md mr-2">
            <button
              onClick={() => setCompareType("region")}
              className={\`px-3 py-1 rounded text-sm font-medium transition-colors \${
                compareType === "region" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }\`}
            >
              Khu vực
            </button>
            <button
              onClick={() => setCompareType("branch")}
              className={\`px-3 py-1 rounded text-sm font-medium transition-colors \${
                compareType === "branch" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }\`}
            >
              Chi nhánh
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Phân tích:</span>
            <select
              value={baseEntity}
              onChange={(e) => setBaseEntity(e.target.value)}
              className="border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm max-w-[150px]"
            >
              {(compareType === "region" ? regions : branches).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">So với:</span>
            <select
              value={compareEntity}
              onChange={(e) => setCompareEntity(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm max-w-[150px]"
            >
              <option value="Trung bình Toàn quốc">Trung bình Toàn quốc</option>
              {compareType === "branch" && <option value="Trung bình Khu vực">Trung bình Khu vực</option>}
              {(compareType === "region" ? regions : branches).map(r => (
                <option key={r} value={r} disabled={r === baseEntity}>{r}</option>
              ))}
            </select>
          </div>
        </div>`;
code = code.replace(oldJSXHeader, newJSXHeader);

const oldRadar1 = `              <Radar
                name={baseRegion}
                dataKey="A"`;
const newRadar1 = `              <Radar
                name={baseEntity}
                dataKey="A"`;
code = code.replace(oldRadar1, newRadar1);

const oldRadar2 = `              <Radar
                name={compareRegion}
                dataKey="B"`;
const newRadar2 = `              <Radar
                name={compareEntity}
                dataKey="B"`;
code = code.replace(oldRadar2, newRadar2);

fs.writeFileSync('src/components/RegionalComparison.tsx', code);
