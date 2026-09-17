import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, View, StyleSheet } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText, G } from "react-native-svg";
import type { GeometrySpec } from "../api/types";
import { COLORS } from "../constants";

const CANVAS = 100; // matches the 0-100 normalized space the AI generates specs in
const PADDING = 10;

interface Props {
  spec: GeometrySpec;
}

/**
 * Renders the AI-generated geometry scene graph as an interactive SVG.
 * "Interactive" here means: tap a point/label to highlight it. Points that
 * reference ids not present in `spec.points` are skipped defensively, since
 * the schema validates shape but not cross-references (see schema.test.ts).
 */
export function GeometryDiagram({ spec }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState(300);

  const pointById = useMemo(() => {
    const map = new Map<string, { x: number; y: number; label?: string }>();
    for (const p of spec.points) map.set(p.id, p);
    return map;
  }, [spec.points]);

  function onLayout(e: LayoutChangeEvent) {
    setSize(e.nativeEvent.layout.width);
  }

  const scale = (size - PADDING * 2) / CANVAS;
  const toPx = (v: number) => PADDING + v * scale;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {spec.title ? null : null}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {spec.polygons.map((polygon, i) => {
            const pts = polygon.points
              .map((id) => pointById.get(id))
              .filter((p): p is { x: number; y: number } => !!p)
              .map((p) => `${toPx(p.x)},${toPx(p.y)}`)
              .join(" ");
            if (!pts) return null;
            return (
              <Polygon
                key={`poly-${i}`}
                points={pts}
                fill={polygon.fill ? `${COLORS.primary}33` : "none"}
                stroke={COLORS.primary}
                strokeWidth={2}
              />
            );
          })}

          {spec.circles.map((circle, i) => {
            const center = pointById.get(circle.center);
            if (!center) return null;
            return (
              <Circle
                key={`circle-${i}`}
                cx={toPx(center.x)}
                cy={toPx(center.y)}
                r={circle.radius * scale}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth={2}
              />
            );
          })}

          {spec.segments.map((segment, i) => {
            const from = pointById.get(segment.from);
            const to = pointById.get(segment.to);
            if (!from || !to) return null;
            return (
              <Line
                key={`seg-${i}`}
                x1={toPx(from.x)}
                y1={toPx(from.y)}
                x2={toPx(to.x)}
                y2={toPx(to.y)}
                stroke={COLORS.text}
                strokeWidth={2}
                strokeDasharray={segment.style === "dashed" ? "6,4" : undefined}
              />
            );
          })}

          {spec.angles.map((angle, i) => {
            const vertex = pointById.get(angle.vertex);
            if (!vertex) return null;
            const label = angle.label ?? (angle.degrees !== undefined ? `${angle.degrees}°` : null);
            if (!label) return null;
            return (
              <SvgText
                key={`angle-${i}`}
                x={toPx(vertex.x) - 10}
                y={toPx(vertex.y) + 16}
                fill={COLORS.success}
                fontSize={12}
                fontWeight="600"
              >
                {label}
              </SvgText>
            );
          })}

          {spec.points.map((point) => {
            const isSelected = selectedId === point.id;
            return (
              <G
                key={point.id}
                onPress={() => setSelectedId(isSelected ? null : point.id)}
              >
                <Circle
                  cx={toPx(point.x)}
                  cy={toPx(point.y)}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? COLORS.warning : COLORS.primaryText}
                  stroke={COLORS.primary}
                  strokeWidth={2}
                />
                <SvgText
                  x={toPx(point.x) + 9}
                  y={toPx(point.y) - 9}
                  fill={isSelected ? COLORS.warning : COLORS.text}
                  fontSize={14}
                  fontWeight={isSelected ? "700" : "500"}
                >
                  {point.label ?? point.id}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
});
