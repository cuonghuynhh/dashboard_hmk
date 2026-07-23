const fs = require('fs');
let code = fs.readFileSync('src/views/OperationalView.tsx', 'utf8');

const tableCodeStr = `                    {hourOfDayData.map((hour, hIdx) => {
                      // Generate heatmap intensity based on hour and day (mocking real density)
                      const isWeekend =
                        day.name === "Thứ 7" || day.name === "Chủ Nhật";
                      const isEvening =
                        hour.name === "16-18h" || hour.name === "18-20h";

                      let intensity = 0.1;
                      if (isWeekend) intensity += 0.4;
                      if (isEvening) intensity += 0.3;
                      if (!isWeekend && hour.name === "10-12h")
                        intensity += 0.2;
                      if (!isWeekend && hour.name === "8-10h") intensity = 0.05;

                      intensity = Math.min(
                        Math.max(intensity + (Math.random() * 0.2 - 0.1), 0.05),
                        1,
                      );
                      const bgColor = \`rgba(99, 102, 241, \${intensity})\`; // Indigo 500 base
                      const textColor =
                        intensity > 0.5 ? "text-white" : "text-slate-700";
                      const valQuantity = Math.floor(intensity * 150);
                      const valValue = (intensity * 45).toFixed(1); // Doanh thu Tr
                      
                      const displayVal = timePeakMetric === "quantity" ? valQuantity : \`\${valValue}Tr\`;
                      const tooltipText = timePeakMetric === "quantity" ? \`\${valQuantity} đơn\` : \`\${valValue} Triệu VNĐ\`;

                      return (
                        <td key={hour.name} className="p-1 min-w-[50px]">
                          <div
                            className={\`w-full h-9 flex items-center justify-center rounded-md text-[11px] font-medium transition-all hover:ring-2 hover:ring-indigo-300 cursor-pointer \${textColor}\`}
                            style={{ backgroundColor: bgColor }}
                            title={\`\${day.name} \${hour.name}: \${tooltipText}\`}
                          >
                            {(timePeakMetric === "quantity" && valQuantity > 10) || (timePeakMetric === "value" && parseFloat(valValue) > 3) ? displayVal : ""}
                          </div>
                        </td>
                      );
                    })}`;

const newTableCodeStr = `                    {hourOfDayData.map((hour) => {
                      const cellData = timePeakFlattenedData.find(d => d.day === day.name && d.hour === hour.name);
                      if (!cellData) return <td key={hour.name} className="p-1 min-w-[50px]"></td>;
                      
                      const intensity = cellData.intensity;
                      const bgColor = \`rgba(99, 102, 241, \${intensity})\`;
                      const textColor = intensity > 0.5 ? "text-white" : "text-slate-700";
                      const valQuantity = cellData.orders;
                      const valValue = cellData.revenueValue;
                      
                      const displayVal = timePeakMetric === "quantity" ? valQuantity : \`\${valValue}Tr\`;
                      const tooltipText = timePeakMetric === "quantity" ? \`\${valQuantity} đơn\` : \`\${valValue} Triệu VNĐ\`;

                      return (
                        <td key={hour.name} className="p-1 min-w-[50px]">
                          <div
                            className={\`w-full h-9 flex items-center justify-center rounded-md text-[11px] font-medium transition-all hover:ring-2 hover:ring-indigo-300 cursor-pointer \${textColor}\`}
                            style={{ backgroundColor: bgColor }}
                            title={\`\${day.name} \${hour.name}: \${tooltipText}\`}
                          >
                            {(timePeakMetric === "quantity" && valQuantity > 10) || (timePeakMetric === "value" && parseFloat(valValue) > 3) ? displayVal : ""}
                          </div>
                        </td>
                      );
                    })}`;

code = code.replace(tableCodeStr, newTableCodeStr);

const memoStr = `  const timePeakFlattenedData = useMemo(() => {
    const flattened: any[] = [];
    dayOfWeekData.forEach((day, dIdx) => {
      hourOfDayData.forEach((hour, hIdx) => {
        const isWeekend = day.name === "Thứ 7" || day.name === "Chủ Nhật";
        const isEvening = hour.name === "16-18h" || hour.name === "18-20h";

        let intensity = 0.1;
        if (isWeekend) intensity += 0.4;
        if (isEvening) intensity += 0.3;
        if (!isWeekend && hour.name === "10-12h") intensity += 0.2;
        if (!isWeekend && hour.name === "8-10h") intensity = 0.05;

        intensity = Math.min(
          Math.max(intensity + (Math.random() * 0.2 - 0.1), 0.05),
          1,
        );
        const val = Math.floor(intensity * 150);
        const revenue = (intensity * 45).toFixed(1);
        flattened.push({ day: day.name, hour: hour.name, orders: val, revenue: \`\${revenue} Tr\` });
      });
    });
    return flattened;
  }, []);`;

const newMemoStr = `  const timePeakFlattenedData = useMemo(() => {
    const flattened: any[] = [];
    dayOfWeekData.forEach((day, dIdx) => {
      hourOfDayData.forEach((hour, hIdx) => {
        const isWeekend = day.name === "Thứ 7" || day.name === "Chủ Nhật";
        const isEvening = hour.name === "16-18h" || hour.name === "18-20h";

        let intensity = 0.1;
        if (isWeekend) intensity += 0.4;
        if (isEvening) intensity += 0.3;
        if (!isWeekend && hour.name === "10-12h") intensity += 0.2;
        if (!isWeekend && hour.name === "8-10h") intensity = 0.05;

        intensity = Math.min(
          Math.max(intensity + (Math.random() * 0.2 - 0.1), 0.05),
          1,
        );
        const val = Math.floor(intensity * 150);
        const revenueValue = (intensity * 45).toFixed(1);
        flattened.push({ 
          day: day.name, 
          hour: hour.name, 
          orders: val, 
          revenueValue,
          revenue: \`\${revenueValue} Tr\`,
          intensity
        });
      });
    });
    return flattened;
  }, []);`;

code = code.replace(memoStr, newMemoStr);

fs.writeFileSync('src/views/OperationalView.tsx', code);
