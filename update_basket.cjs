const fs = require('fs');
let code = fs.readFileSync('chart_basket.txt', 'utf8');

const oldChart = `<BarChart
                  data={basketSizeData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    type="number"
                    tickFormatter={(val) => \`\${val}%\`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        titleLabel="Phân khúc"
                        valueFormatter={(val) => \`\${val}%\`}
                      />
                    }
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {basketSizeData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>`;

const newChart = `<PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={basketSizeData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                  >
                    {basketSizeData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip
                        titleLabel="Phân khúc"
                        valueFormatter={(val) => \`\${val}%\`}
                      />
                    }
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", right: 0 }}
                  />
                </PieChart>`;

code = code.replace(oldChart, newChart);
fs.writeFileSync('chart_basket_updated.txt', code);
