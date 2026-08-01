import type { HTMLAttributes, ReactNode } from "react";
import "./materialContainer.scss";

export type MaterialContainerElement = "article" | "div" | "section";
export type MaterialContainerMaterial = "glass" | "smoked";
export type MaterialContainerPadding = "none" | "small" | "medium" | "large";
export type MaterialContainerShape = "panel" | "pill" | "rounded";

export type MaterialContainerProps = HTMLAttributes<HTMLElement> & {
  as?: MaterialContainerElement;
  children?: ReactNode;
  material?: MaterialContainerMaterial;
  padding?: MaterialContainerPadding;
  shape?: MaterialContainerShape;
};

export default function MaterialContainer({
  as: Component = "div",
  children,
  className = "",
  material = "glass",
  padding = "medium",
  shape = "rounded",
  ...containerProps
}: MaterialContainerProps) {
  const materialContainerClassName = [
    "materialContainer",
    `materialContainer--${material}`,
    `materialContainer--${shape}`,
    `materialContainer--padding-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component {...containerProps} className={materialContainerClassName}>
      <span aria-hidden="true" className="materialContainer__face" />
      <div className="materialContainer__content">{children}</div>
    </Component>
  );
}
