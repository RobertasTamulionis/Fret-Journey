import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import "./materialButton.scss";

export type MaterialButtonMaterial = "glass" | "metal" | "porcelain" | "dark";
export type MaterialButtonShape = "pill" | "rounded" | "circle";
export type MaterialButtonSize =
  | "small"
  | "medium"
  | "large"
  | "icon"
  | "custom";

export type MaterialButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children?: ReactNode;
  decorative?: boolean;
  material?: MaterialButtonMaterial;
  shape?: MaterialButtonShape;
  size?: MaterialButtonSize;
};

export default function MaterialButton({
  children,
  className = "",
  decorative = false,
  material = "glass",
  shape = "rounded",
  size = "medium",
  style,
  type = "button",
  ...buttonProps
}: MaterialButtonProps) {
  const materialButtonClassName = [
    "materialButton",
    `materialButton--${material}`,
    `materialButton--${shape}`,
    `materialButton--size-${size}`,
    decorative ? "materialButton--decorative" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className="materialButton__face">
      <span className="materialButton__content">{children}</span>
    </span>
  );

  if (decorative) {
    return (
      <span
        aria-hidden="true"
        className={materialButtonClassName}
        style={style as CSSProperties}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      {...buttonProps}
      className={materialButtonClassName}
      style={style}
      type={type}
    >
      {content}
    </button>
  );
}
