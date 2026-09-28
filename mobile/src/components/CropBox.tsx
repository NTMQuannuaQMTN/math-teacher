import { useLayoutEffect, useRef, useState } from "react";
import { PanResponder, StyleSheet, View, type GestureResponderHandlers } from "react-native";
import { useStrings } from "@/i18n";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  /** Where the image is drawn inside the container (crop can't leave it). */
  bounds: Rect;
  rect: Rect;
  onChange: (rect: Rect) => void;
}

type Edges = { left?: boolean; top?: boolean; right?: boolean; bottom?: boolean; move?: boolean };

const MIN_SIZE = 56;
const HANDLE_HIT = 48;

const HANDLES: { key: string; edges: Edges }[] = [
  { key: "tl", edges: { left: true, top: true } },
  { key: "tr", edges: { right: true, top: true } },
  { key: "bl", edges: { left: true, bottom: true } },
  { key: "br", edges: { right: true, bottom: true } },
  { key: "t", edges: { top: true } },
  { key: "b", edges: { bottom: true } },
  { key: "l", edges: { left: true } },
  { key: "r", edges: { right: true } },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Pure geometry, exported for reasoning/testing: applies a drag to a rect within bounds. */
export function dragRect(start: Rect, edges: Edges, dx: number, dy: number, bounds: Rect): Rect {
  if (edges.move) {
    return {
      ...start,
      x: clamp(start.x + dx, bounds.x, bounds.x + bounds.width - start.width),
      y: clamp(start.y + dy, bounds.y, bounds.y + bounds.height - start.height),
    };
  }
  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;
  if (edges.left) left = clamp(left + dx, bounds.x, right - MIN_SIZE);
  if (edges.right) right = clamp(right + dx, left + MIN_SIZE, bounds.x + bounds.width);
  if (edges.top) top = clamp(top + dy, bounds.y, bottom - MIN_SIZE);
  if (edges.bottom) bottom = clamp(bottom + dy, top + MIN_SIZE, bounds.y + bounds.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

type Latest = { current: { rect: Rect; bounds: Rect; onChange: (rect: Rect) => void } };

function createHandlers(latest: Latest): Record<string, GestureResponderHandlers> {
  const make = (edges: Edges): GestureResponderHandlers => {
    let start: Rect | null = null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start = latest.current.rect;
      },
      onPanResponderMove: (_, g) => {
        if (!start) return;
        latest.current.onChange(dragRect(start, edges, g.dx, g.dy, latest.current.bounds));
      },
      onPanResponderRelease: () => {
        start = null;
      },
    }).panHandlers;
  };
  return {
    move: make({ move: true }),
    ...Object.fromEntries(HANDLES.map((h) => [h.key, make(h.edges)])),
  };
}

/** Draggable crop rectangle with corner/edge handles and a dimmed outside. */
export function CropBox({ bounds, rect, onChange }: Props) {
  const s = useStrings();
  // Gesture callbacks outlive renders, so they read the latest props through a ref.
  const latest = useRef({ rect, bounds, onChange });
  useLayoutEffect(() => {
    latest.current = { rect, bounds, onChange };
  });

  // Responders are created once; `latest` is only dereferenced inside gesture callbacks
  // (createHandlers never reads .current synchronously), which the lint can't see through.
  // eslint-disable-next-line react-hooks/refs
  const [handlers] = useState(() => createHandlers(latest));
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const shade = "rgba(0,0,0,0.55)";

  const handlePosition = (key: string) => {
    const cx = key.includes("l") ? rect.x : key.includes("r") ? right : rect.x + rect.width / 2;
    const cy = key.includes("t") ? rect.y : key.includes("b") ? bottom : rect.y + rect.height / 2;
    return { left: cx - HANDLE_HIT / 2, top: cy - HANDLE_HIT / 2 };
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim everything outside the crop */}
      <View pointerEvents="none" style={[styles.shade, { backgroundColor: shade, left: bounds.x, top: bounds.y, width: bounds.width, height: rect.y - bounds.y }]} />
      <View pointerEvents="none" style={[styles.shade, { backgroundColor: shade, left: bounds.x, top: bottom, width: bounds.width, height: bounds.y + bounds.height - bottom }]} />
      <View pointerEvents="none" style={[styles.shade, { backgroundColor: shade, left: bounds.x, top: rect.y, width: rect.x - bounds.x, height: rect.height }]} />
      <View pointerEvents="none" style={[styles.shade, { backgroundColor: shade, left: right, top: rect.y, width: bounds.x + bounds.width - right, height: rect.height }]} />

      {/* The crop area itself: drag to move */}
      <View {...handlers.move} style={[styles.frame, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]}>
        <View pointerEvents="none" style={[styles.gridV, { left: "33.33%" }]} />
        <View pointerEvents="none" style={[styles.gridV, { left: "66.66%" }]} />
        <View pointerEvents="none" style={[styles.gridH, { top: "33.33%" }]} />
        <View pointerEvents="none" style={[styles.gridH, { top: "66.66%" }]} />
      </View>

      {HANDLES.map(({ key }) => {
        const isCorner = key.length === 2;
        return (
          <View
            key={key}
            {...handlers[key]}
            style={[styles.hit, handlePosition(key)]}
            accessible={isCorner}
            accessibilityLabel={isCorner ? s.a11y.cropHandle : undefined}
            hitSlop={8}
          >
            {isCorner ? (
              <View
                pointerEvents="none"
                style={[
                  styles.corner,
                  key.includes("t") ? { top: HANDLE_HIT / 2 - 3, borderTopWidth: 4 } : { bottom: HANDLE_HIT / 2 - 3, borderBottomWidth: 4 },
                  key.includes("l") ? { left: HANDLE_HIT / 2 - 3, borderLeftWidth: 4 } : { right: HANDLE_HIT / 2 - 3, borderRightWidth: 4 },
                ]}
              />
            ) : (
              <View pointerEvents="none" style={[styles.edge, key === "t" || key === "b" ? styles.edgeH : styles.edgeV]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { position: "absolute" },
  frame: { position: "absolute", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.95)" },
  gridV: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.45)" },
  gridH: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.45)" },
  hit: { position: "absolute", width: HANDLE_HIT, height: HANDLE_HIT, alignItems: "center", justifyContent: "center" },
  corner: { position: "absolute", width: 22, height: 22, borderColor: "#FFFFFF" },
  edge: { backgroundColor: "#FFFFFF", borderRadius: 2 },
  edgeH: { width: 28, height: 4 },
  edgeV: { width: 4, height: 28 },
});
