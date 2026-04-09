function buildButtonClass(variant, size, className) {
  return [
    "btn",
    variant === "primary" ? "btn--primary" : "btn--secondary",
    size === "lg" ? "btn--lg" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function PrimaryButton({ children, className = "", size = "md", ...props }) {
  return (
    <button className={buildButtonClass("primary", size, className)} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", size = "md", ...props }) {
  return (
    <button className={buildButtonClass("secondary", size, className)} {...props}>
      {children}
    </button>
  );
}
