import React, { useState } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { TreemapNode, hierarchicalTreemapData } from "../data";
import { CustomTooltip } from "./CustomTooltip";
import { ChevronLeft } from "lucide-react";

interface CustomizedContentProps {
  root: any;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: any;
  colors: string[];
  rank: number;
  name: string;
  fill: string;
  onNodeClick: (payload: any) => void;
}

const CustomizedContent: React.FC<CustomizedContentProps> = ({
  root,
  depth,
  x,
  y,
  width,
  height,
  index,
  payload,
  name,
  fill,
  onNodeClick,
}) => {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill || payload?.fill || "#8884d8",
          stroke: "#fff",
          strokeWidth: 2,
          cursor: payload?.children ? "pointer" : "default",
        }}
        onClick={() => {
          if (payload?.children) {
            onNodeClick(payload);
          }
        }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          pointerEvents="none"
        >
          {name}
        </text>
      )}
    </g>
  );
};

export const DrilldownTreemap: React.FC<{ data?: any[] }> = ({ data }) => {
  // Recursive function to ensure all nodes have a size
  const addSizeRecursively = (nodes: any[]): any[] => {
    return nodes.map(node => {
      if (node.children) {
        const children = addSizeRecursively(node.children);
        const size = children.reduce((sum, child) => sum + (child.size || 0), 0);
        return { ...node, children, size };
      }
      return node;
    });
  };

  const processedData = addSizeRecursively([{ name: "Tất cả", children: data || hierarchicalTreemapData }]);
  const [path, setPath] = useState<any[]>([processedData[0]]);

  // Reset path when data changes
  React.useEffect(() => {
    const newProcessedData = addSizeRecursively([
      { name: "Tất cả", children: data || hierarchicalTreemapData },
    ]);
    setPath([newProcessedData[0]]);
  }, [data]);

  const currentData = path[path.length - 1].children || [];
  const canGoBack = path.length > 1;

  const handleNodeClick = (node: any) => {
    if (node && node.children && node.children.length > 0) {
      setPath([...path, node]);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setPath(path.slice(0, -1));
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {canGoBack && (
        <div className="flex items-center mb-2">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Trở lại: {path[path.length - 2].name}
          </button>
          <span className="ml-3 text-xs text-slate-500 font-medium">
            Đang xem: {path[path.length - 1].name}
          </span>
        </div>
      )}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={currentData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#6366f1"
            content={
              (<CustomizedContent onNodeClick={handleNodeClick} />) as any
            }
          >
            <Tooltip
              content={
                <CustomTooltip
                  titleLabel="Tỷ trọng / Giá trị"
                  valueFormatter={(val) => val}
                />
              }
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
