import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

type LogoVariant = "default" | "footer" | "admin";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  /** Controls wordmark color to match the surface it sits on. */
  variant?: LogoVariant;
  /** Controls overall scale. */
  size?: LogoSize;
  /** Route to navigate to on click. Pass `null` to render a non-interactive span (e.g. read-only contexts). */
  linkTo?: string | null;
  /** Extra logic to run on click, on top of navigation (e.g. resetting homepage filters). */
  onClick?: () => void;
  className?: string;
  title?: string;
}

const WORDMARK_COLOR: Record<LogoVariant, string> = {
  default: "text-[#0B0F1A]",
  footer: "text-white",
  admin: "text-zinc-900",
};

const ACCENT_COLOR: Record<LogoVariant, string> = {
  default: "text-[#3D5AFE]",
  footer: "text-[#3D5AFE]",
  admin: "text-indigo-600",
};

const MARK_SIZE: Record<LogoSize, string> = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const TEXT_SIZE: Record<LogoSize, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

/**
 * The single source of truth for the Nexora brand mark: logo image on the
 * left, "NEXORA" wordmark on the right. Used in the site header, footer,
 * static page header, and the admin shell/login screen so the brand never
 * drifts between contexts.
 */
export default function Logo({
  variant = "default",
  size = "md",
  linkTo = "/",
  onClick,
  className = "",
  title,
}: LogoProps) {
  const content = (
    <>
      <img
        src={logo}
        alt="Nexora"
        className={`${MARK_SIZE[size]} shrink-0 object-contain`}
      />
      <span
        className={`font-display font-bold tracking-tight ${TEXT_SIZE[size]} ${WORDMARK_COLOR[variant]}`}
      >
        NEX<span className={ACCENT_COLOR[variant]}>ORA</span>
      </span>
    </>
  );

  if (linkTo === null) {
    return <span className={`flex items-center gap-2 ${className}`}>{content}</span>;
  }

  return (
    <Link to={linkTo} onClick={onClick} title={title} className={`flex items-center gap-2 shrink-0 ${className}`}>
      {content}
    </Link>
  );
}
