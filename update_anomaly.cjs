const fs = require('fs');
let code = fs.readFileSync('src/components/AnomalyDetectionChart.tsx', 'utf8');

code = code.replace("tickFormatter={(val) => \\`\\${val} Tr\\`}", "tickFormatter={(val) => `${val} Tr`}");
fs.writeFileSync('src/components/AnomalyDetectionChart.tsx', code);
