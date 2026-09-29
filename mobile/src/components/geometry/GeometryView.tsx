import { Ionicons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent, type GestureResponderHandlers } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import {
  angleDeg,
  dist,
  dragTo,
  evaluateFigureCheck,
  figureBounds,
  fitTransform,
  resolveFigure,
  toWorld,
  zoomAt,
  type Override,
  type Vec,
  type ViewTransform,
} from "@shared/geometry";
import { buildScene, hitTest, type Emphasis, type Scene } from "@shared/figureScene";
import type { Figure } from "@shared/solution";
import { useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";

interface Props {
  figure: Figure;
  /** Objects to emphasise (driven by the current hint or step). */
  highlight: string[];
  /** Construction elements revealed so far. */
  shownConstructions: string[];
  height: number;
  onSelect?: (id: string | null) => void;
}

interface Live {
  figure: Figure;
  scene: Scene;
  resolved: ReturnType<typeof resolveFigure>;
  transform: ViewTransform;
  fit: ViewTransform;
  setTransform: (t: ViewTransform) => void;
  setDrag: (id: string, world: Vec) => void;
  select: (id: string | null) => void;
  refitIfOutside: () => void;
}

const TAP_SLOP = 6;
/** Space kept free for the chip row (top) and the toolbar (bottom) when fitting the figure. */
const TOP_BAND = 30;
const BOTTOM_BAND = 40;

function fitInBand(bounds: ReturnType<typeof figureBounds>, width: number, height: number): ViewTransform {
  if (!bounds || width <= 0) return { scale: 1, tx: 0, ty: 0 };
  const t = fitTransform(bounds, width, height - TOP_BAND - BOTTOM_BAND, 30);
  return { ...t, ty: t.ty + TOP_BAND };
}

function touchPoint(e: GestureResponderEvent, i = 0): Vec {
  const t = e.nativeEvent.touches[i] ?? e.nativeEvent;
  return { x: t.locationX, y: t.locationY };
}

/**
 * Gesture handling (created once; reads current state through `live`):
 * one finger drags a draggable point or pans; two fingers pinch-zoom;
 * a short touch without movement is a tap that selects the object under it.
 */
function createGestures(live: { current: Live }): GestureResponderHandlers {
  let mode: "pan" | "drag" | "pinch" = "pan";
  let dragId: string | null = null;
  let start: ViewTransform = live.current.transform;
  let startPoint: Vec = { x: 0, y: 0 };
  let pinchStart = { d: 1, mid: { x: 0, y: 0 } };
  let moved = false;

  const beginPinch = (e: GestureResponderEvent) => {
    const a = touchPoint(e, 0);
    const b = touchPoint(e, 1);
    mode = "pinch";
    start = live.current.transform;
    pinchStart = { d: Math.max(dist(a, b), 1), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      moved = false;
      start = live.current.transform;
      startPoint = touchPoint(e);
      if (e.nativeEvent.touches.length >= 2) {
        beginPinch(e);
        return;
      }
      const hit = hitTest(live.current.scene, startPoint);
      const point = hit?.kind === "point" ? live.current.scene.points.find((p) => p.id === hit.id) : undefined;
      mode = point?.draggable ? "drag" : "pan";
      dragId = point?.draggable ? point.id : null;
    },
    onPanResponderMove: (e, g) => {
      if (Math.abs(g.dx) > TAP_SLOP || Math.abs(g.dy) > TAP_SLOP) moved = true;
      if (e.nativeEvent.touches.length >= 2) {
        if (mode !== "pinch") beginPinch(e);
        const a = touchPoint(e, 0);
        const b = touchPoint(e, 1);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const fit = live.current.fit.scale;
        const factor = Math.min(Math.max(dist(a, b) / pinchStart.d, (fit * 0.5) / start.scale), (fit * 8) / start.scale);
        const zoomed = zoomAt(start, factor, pinchStart.mid);
        live.current.setTransform({ ...zoomed, tx: zoomed.tx + mid.x - pinchStart.mid.x, ty: zoomed.ty + mid.y - pinchStart.mid.y });
        moved = true;
        return;
      }
      if (mode === "pinch") return; // lifted one finger: wait for release
      if (mode === "drag" && dragId) {
        const p = { x: startPoint.x + g.dx, y: startPoint.y + g.dy };
        live.current.setDrag(dragId, toWorld(p, live.current.transform));
        return;
      }
      live.current.setTransform({ ...start, tx: start.tx + g.dx, ty: start.ty + g.dy });
    },
    onPanResponderRelease: () => {
      if (mode === "drag" && moved) live.current.refitIfOutside();
      if (!moved) {
        const hit = hitTest(live.current.scene, startPoint);
        live.current.select(hit?.id ?? null);
      }
      mode = "pan";
      dragId = null;
    },
  }).panHandlers;
}

export function GeometryView({ figure, highlight, shownConstructions, height, onSelect }: Props) {
  const { colors } = useTheme();
  const s = useStrings();
  const container = useRef<View>(null);
  const [width, setWidth] = useState(0);
  const [transform, setTransform] = useState<ViewTransform | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const resolved = useMemo(() => resolveFigure(figure, overrides), [figure, overrides]);
  const baseResolved = useMemo(() => resolveFigure(figure), [figure]);
  const fit = useMemo(() => {
    const visible = new Set(figure.points.filter((p) => !p.hidden).map((p) => p.id));
    const bounds = figureBounds(baseResolved, visible);
    return fitInBand(bounds, width, height);
  }, [baseResolved, figure.points, width, height]);
  const view = transform ?? fit;

  const highlighted = useMemo(() => new Set(selected ? [...highlight, selected] : highlight), [highlight, selected]);
  const shown = useMemo(() => new Set(shownConstructions), [shownConstructions]);
  const scene = useMemo(
    () => buildScene(figure, resolved, view, { highlighted, shownConstructions: shown, showLabels }),
    [figure, resolved, view, highlighted, shown, showLabels],
  );

  const select = (id: string | null) => {
    setSelected((current) => (current === id ? null : id));
    onSelect?.(id);
  };

  const live = useRef<Live>({
    figure,
    scene,
    resolved,
    transform: view,
    fit,
    setTransform: (t) => setTransform(t),
    // GeoGebra-style: free points follow the finger, points on a segment/circle slide along it,
    // and every dependent object is re-constructed on each move.
    setDrag: (id, world) => {
      const def = live.current.figure.points.find((p) => p.id === id);
      const override = def ? dragTo(def, live.current.resolved, world) : null;
      if (override) setOverrides((o) => ({ ...o, [id]: override }));
    },
    select,
    refitIfOutside: () => undefined,
  });
  useLayoutEffect(() => {
    // After a drag, bring the whole (moved) figure back into view if part of it left the frame.
    const refitIfOutside = () => {
      const margin = 12;
      const outside = scene.points.some(
        (p) => p.p.x < margin || p.p.y < TOP_BAND || p.p.x > width - margin || p.p.y > height - BOTTOM_BAND,
      );
      if (!outside) return;
      const visible = new Set(figure.points.filter((p) => !p.hidden).map((p) => p.id));
      const bounds = figureBounds(resolved, visible);
      if (bounds) setTransform(fitInBand(bounds, width, height));
    };
    live.current = { ...live.current, figure, scene, resolved, transform: view, fit, select, refitIfOutside };
  });
  // Gesture callbacks read the latest state through `live`, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [handlers] = useState(() => createGestures(live));

  // Mouse-wheel / trackpad zoom on web.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = container.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = node.getBoundingClientRect();
      const current = live.current.transform;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const next = current.scale * factor;
      if (next < live.current.fit.scale * 0.5 || next > live.current.fit.scale * 8) return;
      setTransform(zoomAt(current, factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const ink = colors.text;
  const accent = colors.primary;
  const opacity = (e: Emphasis) => (e === "dim" ? 0.22 : 1);
  const strokeFor = (e: Emphasis) => (e === "highlight" ? accent : ink);

  const selectionInfo = useMemo(() => describeSelection(figure, resolved, selected), [figure, resolved, selected]);
  const hasDraggable = scene.points.some((p) => p.draggable);
  const moved = Object.keys(overrides).length > 0;
  // After a drag, tell the student if the figure no longer matches the problem's numbers/conditions.
  const givensBroken = useMemo(
    () => moved && figure.checks.some((c) => c.role === "given" && !evaluateFigureCheck(c, resolved).passed),
    [moved, figure.checks, resolved],
  );

  return (
    <View style={[styles.wrap, { height, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View
        ref={container}
        style={[StyleSheet.absoluteFill, styles.noSelect]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...handlers}
        accessible
        accessibilityRole="image"
        accessibilityLabel={s.solve.figure}
        accessibilityHint={s.solve.figureHint}
      >
        {width > 0 ? (
          <Svg width={width} height={height} pointerEvents="none">
            {scene.circles.map((c) => (
              <Circle
                key={c.id}
                cx={c.c.x}
                cy={c.c.y}
                r={c.r}
                fill="none"
                stroke={strokeFor(c.emphasis)}
                strokeWidth={c.emphasis === "highlight" ? 3 : 1.6}
                strokeDasharray={c.construction ? "6 5" : undefined}
                opacity={opacity(c.emphasis)}
              />
            ))}
            {scene.angles.map((a) => (
              <G key={a.id} opacity={opacity(a.emphasis)}>
                {a.emphasis === "highlight" ? (
                  <Path d={`${a.path} L${a.vertex.x} ${a.vertex.y} Z`} fill={accent} fillOpacity={0.18} stroke="none" />
                ) : null}
                <Path d={a.path} fill="none" stroke={a.emphasis === "highlight" ? accent : colors.textMuted} strokeWidth={a.emphasis === "highlight" ? 2.4 : 1.4} />
              </G>
            ))}
            {scene.lines.map((l) => (
              <Line
                key={l.id}
                x1={l.a.x}
                y1={l.a.y}
                x2={l.b.x}
                y2={l.b.y}
                stroke={l.construction && l.emphasis !== "highlight" ? colors.textMuted : strokeFor(l.emphasis)}
                strokeWidth={l.emphasis === "highlight" ? 3.4 : 2}
                strokeDasharray={l.construction ? "7 5" : undefined}
                strokeLinecap="round"
                opacity={opacity(l.emphasis)}
              />
            ))}
            {scene.marks.map((m, i) => (
              <Path key={`m${i}`} d={m.path} stroke={strokeFor(m.emphasis)} strokeWidth={1.8} fill="none" opacity={opacity(m.emphasis)} />
            ))}
            {scene.angles.map((a) =>
              a.label ? (
                <SvgText
                  key={`al-${a.id}`}
                  x={a.labelAt.x}
                  y={a.labelAt.y + 4}
                  fontSize={12}
                  fontWeight="600"
                  fill={a.emphasis === "highlight" ? accent : colors.textMuted}
                  textAnchor="middle"
                  opacity={opacity(a.emphasis)}
                >
                  {a.label}
                </SvgText>
              ) : null,
            )}
            {scene.lines.map((l) =>
              l.label && l.labelAt ? (
                <SvgText key={`ll-${l.id}`} x={l.labelAt.x} y={l.labelAt.y + 4} fontSize={12} fill={colors.textMuted} textAnchor="middle" opacity={opacity(l.emphasis)}>
                  {l.label}
                </SvgText>
              ) : null,
            )}
            {scene.points.map((p) => (
              <G key={p.id} opacity={opacity(p.emphasis)}>
                {p.draggable ? <Circle cx={p.p.x} cy={p.p.y} r={11} fill={accent} fillOpacity={0.15} /> : null}
                <Circle
                  cx={p.p.x}
                  cy={p.p.y}
                  r={p.draggable ? 6 : 4}
                  fill={p.draggable ? accent : p.emphasis === "highlight" ? accent : ink}
                  stroke={colors.surface}
                  strokeWidth={1.5}
                />
                {showLabels ? (
                  <SvgText x={p.labelAt.x} y={p.labelAt.y + 5} fontSize={15} fontWeight="700" fontStyle="italic" fill={p.emphasis === "highlight" ? accent : ink} textAnchor="middle">
                    {p.label}
                  </SvgText>
                ) : null}
              </G>
            ))}
          </Svg>
        ) : null}
      </View>

      <View style={styles.topRow} pointerEvents="box-none">
        <View style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[typography.label, { color: colors.textMuted }]}>
            {figure.scale === "exact" ? s.solve.figureExact : s.solve.figureSchematic}
          </Text>
        </View>
        {givensBroken ? (
          <View style={[styles.chip, { backgroundColor: colors.warningSoft }]} accessibilityLiveRegion="polite">
            <Text style={[typography.label, { color: colors.warning }]}>{s.solve.figureChanged}</Text>
          </View>
        ) : null}
        {selectionInfo ? (
          <View style={[styles.chip, { backgroundColor: colors.primarySoft }]} accessibilityLiveRegion="polite">
            <Text style={[typography.label, { color: colors.primary }]}>{selectionInfo(figure.scale === "exact")}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.tools} pointerEvents="box-none">
        {hasDraggable && !moved ? <Text style={[typography.caption, styles.dragHint, { color: colors.textMuted }]}>{s.solve.dragHint}</Text> : null}
        <ToolButton icon={showLabels ? "text" : "text-outline"} label={s.solve.figureLabels} onPress={() => setShowLabels((v) => !v)} />
        <ToolButton
          icon="scan-outline"
          label={s.solve.figureReset}
          onPress={() => {
            setTransform(null);
            setOverrides({});
            setSelected(null);
          }}
        />
      </View>
    </View>
  );
}

function ToolButton({ icon, label, onPress }: { icon: "text" | "text-outline" | "scan-outline"; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.tool, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border }]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

/** Name (and measurement, if the figure is to scale) of the selected object. */
function describeSelection(figure: Figure, resolved: ReturnType<typeof resolveFigure>, id: string | null) {
  if (!id) return null;
  const label = (pid: string) => figure.points.find((p) => p.id === pid)?.label ?? pid;
  const P = (pid: string) => resolved.points[pid];
  const round = (n: number) => (Math.round(n * 100) / 100).toString();
  const line = figure.lines.find((l) => l.id === id);
  if (line) {
    const a = P(line.from);
    const b = P(line.to);
    const name = `${label(line.from)}${label(line.to)}`;
    return (exact: boolean) => (exact && a && b && line.kind === "segment" ? `${name} ≈ ${round(dist(a, b))}` : name);
  }
  const angle = figure.angles.find((a) => a.id === id);
  if (angle) {
    const [f, v, t] = [P(angle.from), P(angle.vertex), P(angle.to)];
    const name = `∠${label(angle.from)}${label(angle.vertex)}${label(angle.to)}`;
    return (exact: boolean) => (exact && f && v && t ? `${name} ≈ ${round(angleDeg(f, v, t))}°` : name);
  }
  const circle = figure.circles.find((c) => c.id === id);
  if (circle) return () => `(${label(circle.center)})`;
  const point = figure.points.find((p) => p.id === id);
  if (point) return () => point.label;
  return null;
}

const styles = StyleSheet.create({
  // Web: dragging with the mouse must not select the SVG label text.
  noSelect: Platform.OS === "web" ? ({ userSelect: "none", cursor: "grab" } as object) : {},
  wrap: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  topRow: { position: "absolute", top: spacing.sm, left: spacing.sm, right: spacing.sm, flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  tools: { position: "absolute", right: spacing.sm, bottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  tool: { width: 40, height: 40, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  dragHint: { marginRight: spacing.xs },
});
