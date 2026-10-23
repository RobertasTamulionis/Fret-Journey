"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "./select.scss";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
};

export type SelectProps<T extends string = string> = {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  leadingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  id?: string;
};

export default function Select<T extends string>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  label,
  size = "md",
  leadingIcon,
  fullWidth = false,
  className = "",
  id: providedId,
}: SelectProps<T>) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const listboxId = `${id}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = options.findIndex((option) => option.value === value);
    return index >= 0 ? index : 0;
  });
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !(target instanceof Element && target.closest(".select__menu"))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const index = options.findIndex((option) => option.value === value);
    setActiveIndex(index >= 0 ? index : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (open)
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    const position = () => {
      const trigger = rootRef.current?.querySelector(".select__trigger");
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16);
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      // Estimate the rendered menu height so upward menus stay close to the
      // trigger instead of reserving the full 320px for short option lists.
      const menuHeight = Math.min(
        320,
        Math.max(48, options.length * 46 + 10),
        window.innerHeight * 0.5,
      );
      const shouldOpenAbove =
        rect.bottom + menuHeight + 6 > window.innerHeight &&
        rect.top > menuHeight + 6;
      setMenuStyle({
        top: shouldOpenAbove
          ? Math.max(8, rect.top - menuHeight - 6)
          : rect.bottom + 6,
        left: Math.max(8, left),
        maxHeight: `min(320px, ${Math.max(160, shouldOpenAbove ? rect.top - 14 : window.innerHeight - rect.bottom - 14)}px)`,
        width,
      });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, options.length]);

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else setOpen(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      let next = activeIndex;
      do next = (next + direction + options.length) % options.length;
      while (options[next]?.disabled && next !== activeIndex);
      setActiveIndex(next);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="select__menu"
            id={listboxId}
            role="listbox"
            aria-label={label}
            style={menuStyle}
          >
            {options.map((option, index) => (
              <button
                aria-selected={option.value === value}
                className={`select__option ${index === activeIndex ? "select__option--active" : ""} ${option.value === value ? "select__option--selected" : ""}`}
                disabled={option.disabled}
                key={option.value}
                onClick={() => choose(index)}
                onMouseEnter={() => setActiveIndex(index)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {option.description && <small>{option.description}</small>}
                {option.value === value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={`select ${fullWidth ? "select--fullWidth" : ""} ${className}`}
      ref={rootRef}
    >
      {label && (
        <label className="select__label" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`select__trigger select__trigger--${size}`}
        disabled={disabled}
        id={id}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        {leadingIcon}
        <span className={!selected ? "select__placeholder" : ""}>
          {selected?.label ?? placeholder}
        </span>
        <span
          aria-hidden="true"
          className={`select__chevron ${open ? "select__chevron--open" : ""}`}
        >
          ⌄
        </span>
      </button>
      {menu}
    </div>
  );
}
