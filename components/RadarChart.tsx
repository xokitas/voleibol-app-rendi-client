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
  if (numAxes < 3) return null;

  const angleSlice = (2 * Math.PI) / numAxes;

  // Convertir valor a coordenada en el radio
  const getPoint = (i: number, value: number) => {
    const angle = angleSlice * i - Math.PI / 2; // empezar desde arriba
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

  // Ejes y etiquetas
  const axes = data.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const xLabel = center + (radius + 20) * Math.cos(angle);
    const yLabel = center + (radius + 20) * Math.sin(angle);
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      label: d.label,
      labelPos: { x: xLabel, y: yLabel },
    };
  });

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* Web de fondo */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => {
          const points = data
            .map((_, i) => {
              const p = getPoint(i, level * 100);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <Polygon
              key={level}
              points={points}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}
        {/* Ejes */}
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
        {/* Polígono de datos */}
        <Polygon
          points={polygonPoints}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth="2"
        />
        {/* Puntos */}
        {data.map((d, i) => {
          const p = getPoint(i, d.value);
          return (
            <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r="4" fill={color} />
          );
        })}
        {/* Etiquetas */}
        {axes.map((a, i) => (
          <SvgText
            key={`label-${i}`}
            x={a.labelPos.x}
            y={a.labelPos.y}
            fontSize="8"
            fontWeight="bold"
            fill="#475569"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {a.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
