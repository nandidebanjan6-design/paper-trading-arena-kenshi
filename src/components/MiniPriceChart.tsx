import React from 'react';

interface MiniPriceChartProps {
  points: number[];
  isPositive?: boolean;
  height?: number;
  className?: string;
  showSecondaryLine?: number[];
}

export const MiniPriceChart: React.FC<MiniPriceChartProps> = ({
  points,
  isPositive = true,
  height = 112,
  className = '',
  showSecondaryLine,
}) => {
  const width = 420;
  const padX = 12;
  const padY = 16;

  const allValues = showSecondaryLine ? [...points, ...showSecondaryLine] : points;
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const totalSteps = showSecondaryLine
    ? points.length + showSecondaryLine.length - 2
    : points.length - 1;

  const toCoords = (val: number, index: number) => {
    const x = padX + (index / Math.max(totalSteps, 1)) * (width - padX * 2);
    const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
    return { x, y };
  };

  const coords = points.map((v, i) => toCoords(v, i));
  const pathD = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const lastPt = coords[coords.length - 1];

  let secondaryPathD = '';
  let finalOutcomePt: { x: number; y: number } | null = null;
  if (showSecondaryLine && showSecondaryLine.length > 0) {
    const secCoords = showSecondaryLine.map((v, i) =>
      toCoords(v, points.length - 1 + i)
    );
    secondaryPathD = secCoords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');
    finalOutcomePt = secCoords[secCoords.length - 1];
  }

  const strokeColor = isPositive ? '#156F43' : '#B4322B';

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block overflow-visible"
        role="img"
        aria-label="Asset price trajectory chart"
      >
        {/* Subtle horizontal reference grid lines */}
        <line
          x1={padX}
          y1={padY}
          x2={width - padX}
          y2={padY}
          stroke="#E6E4DF"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <line
          x1={padX}
          y1={height / 2}
          x2={width - padX}
          y2={height / 2}
          stroke="#E6E4DF"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="#E6E4DF"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Primary historical price line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-line"
        />

        {/* Optional simulated outcome trajectory */}
        {secondaryPathD && (
          <path
            d={secondaryPathD}
            fill="none"
            stroke="#141413"
            strokeWidth="1.75"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-line"
          />
        )}

        {/* Current price anchor point */}
        {lastPt && (
          <g className="animate-price-point">
            <circle
              cx={lastPt.x}
              cy={lastPt.y}
              r="6"
              fill={strokeColor}
              fillOpacity="0.14"
            />
            <circle
              cx={lastPt.x}
              cy={lastPt.y}
              r="3.2"
              fill={strokeColor}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* Outcome terminal point if simulated */}
        {finalOutcomePt && (
          <g className="animate-price-point">
            <circle
              cx={finalOutcomePt.x}
              cy={finalOutcomePt.y}
              r="4"
              fill="#141413"
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
