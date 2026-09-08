import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  label: ReactNode;
  description: string;
  formula?: string;
  tooltipWidth?: string;
  iconColor?: string;
  tooltipPosition?: 'left' | 'center' | 'right';
  labelClassName?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  label, 
  description, 
  formula,
  tooltipWidth = "w-56",
  iconColor = "text-slate-400 hover:text-indigo-500",
  tooltipPosition = "left",
  labelClassName = "text-sm text-slate-500 font-medium"
}) => {
  let tooltipPositionClasses = "";
  let arrowClasses = "";

  switch (tooltipPosition) {
    case "center":
      tooltipPositionClasses = "left-1/2 -translate-x-1/2";
      arrowClasses = "left-1/2 -translate-x-1/2";
      break;
    case "right":
      tooltipPositionClasses = "right-0";
      arrowClasses = "right-4";
      break;
    case "left":
    default:
      tooltipPositionClasses = "left-0";
      arrowClasses = "left-4 -translate-x-1/2";
      break;
  }

  return (
    <div className="flex items-center gap-1.5 mb-1 group relative">
      <div className={labelClassName}>{label}</div>
      <Info className={`w-3.5 h-3.5 transition-colors cursor-help ${iconColor}`} />
      
      <div className={`pointer-events-none absolute bottom-full ${tooltipPositionClasses} mb-2 ${tooltipWidth} opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded p-2.5 shadow-lg z-[100]`}>
        <p className="leading-relaxed">{description}</p>
        
        {formula && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-slate-300 font-semibold mb-1">Công thức:</p>
            <p className="font-mono text-indigo-300 bg-slate-900/50 p-1.5 rounded">{formula}</p>
          </div>
        )}
        
        <div className={`absolute top-full border-4 border-transparent border-t-slate-800 ${arrowClasses}`}></div>
      </div>
    </div>
  );
};
