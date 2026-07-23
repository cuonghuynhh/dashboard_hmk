const fs = require('fs');
let code = fs.readFileSync('src/views/OperationalView.tsx', 'utf8');

const importStatement = `import { ConversionAndRefundAnalysis } from "../components/ConversionAndRefundAnalysis";\nimport { RegionalComparison } from "../components/RegionalComparison";\nimport { AnomalyDetectionChart } from "../components/AnomalyDetectionChart";`;
code = code.replace(`import { ConversionAndRefundAnalysis } from "../components/ConversionAndRefundAnalysis";\nimport { RegionalComparison } from "../components/RegionalComparison";`, importStatement);

const renderChart = `      <RegionalComparison />\n\n      <AnomalyDetectionChart />\n\n      <ConversionAndRefundAnalysis />`;
code = code.replace(`      <RegionalComparison />\n\n      <ConversionAndRefundAnalysis />`, renderChart);

fs.writeFileSync('src/views/OperationalView.tsx', code);
