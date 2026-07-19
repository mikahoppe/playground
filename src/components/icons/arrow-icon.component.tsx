import type { ReactElement, SVGProps } from "react";

/** Direction a history arrow points. */
type ArrowDirection = "back" | "forward";

/** Props for {@link ArrowIcon}: a direction plus any SVG attributes. */
type ArrowIconProps = SVGProps<SVGSVGElement> & {
  /** Which way the chevron points. */
  direction: ArrowDirection;
};

/** Chevron path data per direction, drawn on a 24x24 viewBox. */
const ARROW_PATHS: Record<ArrowDirection, string> = {
  back: "M15 6l-6 6 6 6",
  forward: "M9 6l6 6-6 6",
};

/**
 * Render a directional chevron used by the header's history controls. The icon
 * is decorative; the surrounding button carries the accessible label.
 * @param {ArrowIconProps} props - The direction plus any SVG attributes.
 * @returns {ReactElement} The rendered chevron SVG.
 */
export function ArrowIcon(props: ArrowIconProps): ReactElement {
  const { direction, ...svgProps } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
    >
      <path d={ARROW_PATHS[direction]} />
    </svg>
  );
}
