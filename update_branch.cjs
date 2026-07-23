const fs = require('fs');
let code = fs.readFileSync('src/components/BranchRevenueComparison.tsx', 'utf8');

const oldType = `type MetricType = "target" | "revenue";`;
const newType = `type MetricType = "target" | "revenue" | "traffic" | "conversionRate";`;
code = code.replace(oldType, newType);

const oldGenRow = `        row[period] = {
          target: Math.floor(Math.random() * 200) + 10, // 10% to 210%
          revenue: Math.floor(Math.random() * 800) + 50, // 50M to 850M
        };`;
const newGenRow = `        row[period] = {
          target: Math.floor(Math.random() * 200) + 10,
          revenue: Math.floor(Math.random() * 800) + 50,
          orders: Math.floor(Math.random() * 150) + 20,
          traffic: Math.floor(Math.random() * 500) + 200,
        };`;
code = code.replace(oldGenRow, newGenRow);

const oldComponentStart = `export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  
  const currentData = mockData[period];`;

const newComponentStart = `export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  
  const currentData = data[period];

  const handleTrafficChange = (branch: string, p: string, newTraffic: number) => {
    setData((prev) => {
      const newData = { ...prev };
      const periodData = { ...newData[period] };
      periodData.data = periodData.data.map((row: any) => {
        if (row.branch === branch) {
          return {
            ...row,
            [p]: {
              ...row[p],
              traffic: newTraffic,
            },
          };
        }
        return row;
      });
      newData[period] = periodData;
      return newData;
    });
  };`;
code = code.replace(oldComponentStart, newComponentStart);

const oldGetColor = `  const getColorClass = (value: number, metricType: MetricType) => {
    if (metricType === "target") {
      if (value < 30) return "bg-[#fb7185] text-white"; // rose-400
      if (value < 60) return "bg-[#fbbf24] text-slate-800"; // amber-400
      if (value < 100) return "bg-[#34d399] text-white"; // emerald-400
      return "bg-[#10b981] text-white"; // emerald-500
    } else {
      if (value < 200) return "bg-[#fb7185] text-white";
      if (value < 400) return "bg-[#fbbf24] text-slate-800";
      if (value < 600) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    }
  };

  const formatValue = (value: number, metricType: MetricType) => {
    return metricType === "target" ? \`\${value}%\` : \`\${value}M\`;
  };`;

const newGetColor = `  const getColorClass = (value: number, metricType: MetricType, cellData?: any) => {
    if (metricType === "target") {
      if (value < 30) return "bg-[#fb7185] text-white";
      if (value < 60) return "bg-[#fbbf24] text-slate-800";
      if (value < 100) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "revenue") {
      if (value < 200) return "bg-[#fb7185] text-white";
      if (value < 400) return "bg-[#fbbf24] text-slate-800";
      if (value < 600) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "traffic") {
      return "bg-slate-100 text-slate-800";
    } else if (metricType === "conversionRate") {
      const cr = cellData?.traffic ? (cellData.orders / cellData.traffic) * 100 : 0;
      if (cr < 10) return "bg-[#fb7185] text-white";
      if (cr < 20) return "bg-[#fbbf24] text-slate-800";
      if (cr < 30) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    }
    return "bg-slate-100 text-slate-800";
  };

  const formatValue = (value: number, metricType: MetricType, cellData?: any) => {
    if (metricType === "target") return \`\${value}%\`;
    if (metricType === "revenue") return \`\${value}M\`;
    if (metricType === "traffic") return \`\${value}\`;
    if (metricType === "conversionRate") {
      if (!cellData?.traffic) return "0%";
      return \`\${((cellData.orders / cellData.traffic) * 100).toFixed(1)}%\`;
    }
    return value;
  };`;
code = code.replace(oldGetColor, newGetColor);

const oldMetrics = `            {[
              { id: "target", label: "% Target" },
              { id: "revenue", label: "Doanh thu" },
            ].map((tab) => (`;

const newMetrics = `            {[
              { id: "target", label: "% Target" },
              { id: "revenue", label: "Doanh thu" },
              { id: "traffic", label: "Traffic" },
              { id: "conversionRate", label: "Tỷ lệ CĐ" },
            ].map((tab) => (`;
code = code.replace(oldMetrics, newMetrics);

const oldTd = `                {currentData.periods.map((p) => {
                  const cellData = row[p];
                  const value = cellData[metric];
                  return (
                    <td key={p} className="p-1 border-b border-slate-100">
                      <div 
                        className={\`w-full h-full py-1.5 px-1 text-center rounded text-xs font-semibold \${getColorClass(value, metric)}\`}
                      >
                        {formatValue(value, metric)}
                      </div>
                    </td>
                  );
                })}`;

const newTd = `                {currentData.periods.map((p) => {
                  const cellData = row[p];
                  const value = cellData[metric];
                  
                  if (metric === "traffic") {
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
                  }

                  return (
                    <td key={p} className="p-1 border-b border-slate-100">
                      <div 
                        className={\`w-full h-full py-1.5 px-1 text-center rounded text-xs font-semibold \${getColorClass(value, metric, cellData)}\`}
                      >
                        {formatValue(value, metric, cellData)}
                      </div>
                    </td>
                  );
                })}`;
code = code.replace(oldTd, newTd);

fs.writeFileSync('src/components/BranchRevenueComparison.tsx', code);
