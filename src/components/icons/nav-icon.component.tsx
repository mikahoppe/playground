import type { ReactElement, SVGProps } from "react";
import type { IconName } from "@/lib/navigation";

/** Props for {@link NavIcon}: an icon name plus any standard SVG attributes. */
type NavIconProps = SVGProps<SVGSVGElement> & {
  /** Which glyph to render. */
  name: IconName;
};

/**
 * Stroke path data for each navigation glyph, drawn on a 24x24 viewBox. Paths
 * are intentionally minimal so the icon inherits `currentColor` and scales
 * crisply at any size.
 */
const ICON_PATHS: Record<IconName, string> = {
  dashboard: "M4 4h7v7H4zM13 4h7v5h-7zM13 13h7v7h-7zM4 15h7v5H4z",
  projects: "M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4z",
  team: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a7 7 0 0 1 14 0M17 11a3 3 0 1 0-2-5.2M22 20a7 7 0 0 0-5-6.7",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V7a1.7 1.7 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

/**
 * Render a navigation glyph as an inline, theme-aware SVG. The icon is purely
 * decorative (it always accompanies a text label) and is hidden from assistive
 * technology.
 * @param {NavIconProps} props - The icon name plus any SVG attributes to forward.
 * @returns {ReactElement} The rendered SVG element.
 */
export function NavIcon(props: NavIconProps): ReactElement {
  const { name, ...svgProps } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
