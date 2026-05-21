// components/results/RadarChart.tsx
import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

interface RadarData {
  label: string;
  value: number; // 0–100
}

interface Props {
  data: RadarData[];
  size?: number;
  color?: string;
}

export default function RadarChart({
  data,
  size = 200,
  color = "#003366",
}: Props) {
  const center = size / 2;
  const radius = (size / 2) * 0.6;
  const numAxes = data.length;
  if (numAxes < 1) return null;

  const angleSlice = (2 * Math.PI) / (numAxes || 1);

  const getPoint = (i: number, value: number) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = radius * (value / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = data
    .map((d, i) => {
      const p = getPoint(i, d.value);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const axes = data.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      label: d.label,
    };
  });

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => {
          const pts = data
            .map((_, i) => {
              const p = getPoint(i, level * 100);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <Polygon
              key={level}
              points={pts}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}
        {axes.map((a, i) => (
          <Line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={a.x}
            y2={a.y}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}
        <Polygon
          points={polygonPoints}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth="2"
        />
        {data.map((d, i) => {
          const p = getPoint(i, d.value);
          return (
            <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r="4" fill={color} />
          );
        })}
        {data.map((d, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const x = center + (radius + 18) * Math.cos(angle);
          const y = center + (radius + 18) * Math.sin(angle);
          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y}
              fontSize="9"
              fontWeight="bold"
              fill="#475569"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
