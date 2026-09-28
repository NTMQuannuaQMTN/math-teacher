import katex from "katex";
import { Fragment, useLayoutEffect, useMemo, useRef } from "react";
import { Text } from "react-native";
import { mathTextToPlain } from "@shared/mathText";
import { useTheme } from "@/theme";
import { KATEX_CSS } from "./katexAssets.generated";
import { BASE_CSS, KATEX_OPTIONS, fitDisplays, layoutSegments } from "./mathHtml";
import type { MathTextProps } from "./MathText";

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = KATEX_CSS + BASE_CSS.replace(/#root/g, ".math-root");
  document.head.appendChild(style);
  stylesInjected = true;
}

/** Web implementation: KaTeX renders straight into the DOM (no WebView on web). */
export function MathText({ text, fontSize = 18, color, align = "left", placeholder, testID }: MathTextProps) {
  const { colors } = useTheme();
  injectStyles();
  const segments = useMemo(() => layoutSegments(text), [text]);
  const plain = useMemo(() => mathTextToPlain(text), [text]);
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (rootRef.current) fitDisplays(rootRef.current);
  }, [segments, fontSize]);

  if (!text.trim() && placeholder) {
    return <Text style={{ color: colors.textMuted, fontSize: fontSize - 2, fontStyle: "italic" }}>{placeholder}</Text>;
  }

  return (
    <div
      ref={rootRef}
      data-testid={testID}
      className="math-root"
      role="math"
      aria-label={plain}
      style={{ fontSize, color: color ?? colors.text, textAlign: align }}
    >
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          const lines = segment.value.split("\n");
          return (
            <Fragment key={index}>
              {lines.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </Fragment>
          );
        }
        let html: string;
        try {
          // KaTeX escapes its input; with trust:false it emits no links or raw HTML.
          html = katex.renderToString(segment.value, { ...KATEX_OPTIONS, displayMode: segment.display });
        } catch {
          return <span key={index} className="raw">{segment.value}</span>;
        }
        const Tag = segment.display ? "div" : "span";
        return <Tag key={index} className={segment.display ? "display" : "inline"} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
