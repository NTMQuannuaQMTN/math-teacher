import { latexToPlain, vietnameseMathText, parseMathText, repairLatex, wrapBareLatex, type MathSegment } from "@shared/mathText";

export interface MathPayload {
  segments: MathSegment[];
  fontSize: number;
  fontWeight: string;
  color: string;
  align: "left" | "center";
}

/**
 * Display maths is already its own block, so one newline right before or
 * after it would render as an extra blank line. Drop exactly one.
 */
export function layoutSegments(text: string): MathSegment[] {
  // repairLatex also fixes lessons stored before the server repaired them ("\n", "\[2pt]").
  const segments = parseMathText(vietnameseMathText(wrapBareLatex(repairLatex(text))));
  return segments
    .map((segment, i) => {
      if (segment.kind !== "text") return segment;
      let value = segment.value;
      const prev = segments[i - 1];
      const next = segments[i + 1];
      if (prev?.kind === "math" && prev.display) value = value.replace(/^[ \t]*\n/, "");
      if (next?.kind === "math" && next.display) value = value.replace(/\n[ \t]*$/, "");
      return { ...segment, value };
    })
    .filter((segment) => segment.kind !== "text" || segment.value.length > 0);
}

export function toPayload(text: string, fontSize: number, color: string, align: "left" | "center", fontWeight = "normal"): MathPayload {
  return { segments: layoutSegments(text).map(s=>s.kind === "math" ? {...s, plain: latexToPlain(s.value)} : s), fontSize, fontWeight, color, align };
}

/**
 * KaTeX options shared by native and web. `trust: false` disables \href,
 * \includegraphics, \htmlClass etc., so OCR/user text can never inject links
 * or markup. Size/expansion caps stop pathological input from freezing the view.
 */
export const KATEX_OPTIONS = {
  throwOnError: true,
  trust: false,
  strict: "ignore",
  maxSize: 20,
  maxExpand: 300,
  output: "htmlAndMathml",
} as const;

/**
 * Shrinks display equations that are wider than the screen (down to 70%),
 * so long expressions stay readable without scrolling; beyond that they scroll.
 * Web calls this directly; the WebView gets FIT_DISPLAYS_JS below. Keep them in sync.
 */
export function fitDisplays(root: HTMLElement): void {
  // Long inline formulas (especially in hint titles) must remain accessible
  // without stretching or being clipped by the page. Keep ordinary inline
  // math in the prose; only formulas wider than the whole line scroll.
  const inline = root.querySelectorAll<HTMLElement>(".inline");
  for (const el of inline) {
    const inner = el.querySelector<HTMLElement>(".katex");
    el.classList.toggle("wide", !!inner && root.clientWidth > 0 && Math.max(inner.scrollWidth, inner.getBoundingClientRect().width) > root.clientWidth);
  }
  const blocks = root.querySelectorAll<HTMLElement>(".display");
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i]!;
    const inner = el.querySelector<HTMLElement>(".katex-display > .katex") ?? (el.firstElementChild as HTMLElement | null);
    if (!inner) continue;
    el.style.fontSize = "";
    const available = el.clientWidth;
    const needed = inner.scrollWidth;
    if (available > 0 && needed > available) {
      el.style.fontSize = `${Math.max(0.7, (available - 2) / needed)}em`;
    }
  }
}

/**
 * WebView copy of fitDisplays. It must be a string literal: Hermes release
 * builds don't keep function source, so fitDisplays.toString() would yield
 * "[bytecode]" in production.
 */
const FIT_DISPLAYS_JS = `function fitDisplays(root) {
    var inline = root.querySelectorAll(".inline");
    for (var j = 0; j < inline.length; j++) {
      var innerInline = inline[j].querySelector(".katex");
      inline[j].classList.toggle("wide", !!innerInline && root.clientWidth > 0 && Math.max(innerInline.scrollWidth, innerInline.getBoundingClientRect().width) > root.clientWidth);
    }
    var blocks = root.querySelectorAll(".display");
    for (var i = 0; i < blocks.length; i++) {
      var el = blocks[i];
      var inner = el.querySelector(".katex-display > .katex") || el.firstElementChild;
      if (!inner) continue;
      el.style.fontSize = "";
      var available = el.clientWidth;
      var needed = inner.scrollWidth;
      if (available > 0 && needed > available) {
        el.style.fontSize = Math.max(0.7, (available - 2) / needed) + "em";
      }
    }
  }`;

/**
 * Script that runs inside the WebView. Prose is inserted with textContent
 * (never innerHTML), and maths goes through katex.render, so no string from
 * OCR or the student is ever interpreted as HTML.
 */
export const RENDER_SCRIPT = `
(function () {
  var root = document.getElementById("root");
  var options = ${JSON.stringify(KATEX_OPTIONS)};
  var lastHeight = 0;
  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  function reportHeight() {
    var h = Math.ceil(root.getBoundingClientRect().height);
    if (h !== lastHeight) { lastHeight = h; post({ type: "height", value: h }); }
  }
  function appendText(parent, text) {
    var lines = text.split("\\n");
    for (var i = 0; i < lines.length; i++) {
      if (i > 0) parent.appendChild(document.createElement("br"));
      if (lines[i]) parent.appendChild(document.createTextNode(lines[i]));
    }
  }
  ${FIT_DISPLAYS_JS}
  window.renderMath = function (payload) {
    root.style.fontSize = payload.fontSize + "px";
    root.style.fontWeight = payload.fontWeight || "normal";
    root.style.color = payload.color;
    root.style.textAlign = payload.align;
    root.textContent = "";
    var failures = 0;
    payload.segments.forEach(function (seg) {
      if (seg.kind === "text") { appendText(root, seg.value); return; }
      var el = document.createElement(seg.display ? "div" : "span");
      el.className = seg.display ? "display" : "inline";
      try {
        katex.render(seg.value, el, Object.assign({ displayMode: seg.display }, options));
      } catch (e) {
        failures++;
        el.textContent = seg.plain || "Không thể hiển thị công thức này.";
        el.className += " raw";
      }
      root.appendChild(el);
    });
    fitDisplays(root);
    post({ type: "rendered", failures: failures });
    requestAnimationFrame(reportHeight);
  };
  function relayout() { fitDisplays(root); reportHeight(); }
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(root);
  window.addEventListener("resize", relayout);
  window.addEventListener("load", relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  post({ type: "ready" });
})();
`;

export const BASE_CSS = `
html, body { margin: 0; padding: 0; background: transparent; }
body { -webkit-text-size-adjust: 100%; overflow-x: hidden; }
#root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.55; word-wrap: break-word; overflow-wrap: anywhere; padding: 2px 0;
  min-width: 0; max-width: 100%;
}
.katex { font-size: 1.1em; }
.display { overflow-x: auto; overflow-y: hidden; padding: 4px 0; -webkit-overflow-scrolling: touch; }
.display .katex-display { margin: 0.35em 0; }
.inline .katex { white-space: nowrap; }
.inline.wide { display: inline-block; max-width: 100%; overflow-x: auto; overflow-y: hidden; vertical-align: middle; padding: 4px 0; }
.inline.wide .katex { display: inline-block; }
.raw { font-family: Menlo, monospace; font-size: 0.9em; opacity: 0.8; }
`;
