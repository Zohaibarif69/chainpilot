import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#3157D5] text-white hover:bg-[#2748B8] focus-visible:ring-2 focus-visible:ring-[#3157D5] focus-visible:ring-offset-1",
  secondary: "bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F7F8FA] focus-visible:ring-2 focus-visible:ring-[#3157D5] focus-visible:ring-offset-1",
  destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-1",
  ghost: "text-[#667085] hover:bg-[#F1F3F5] hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#3157D5] focus-visible:ring-offset-1",
  outline: "text-[#3157D5] border border-[#3157D5] hover:bg-[#EEF2FF] focus-visible:ring-2 focus-visible:ring-[#3157D5] focus-visible:ring-offset-1",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-[14px] gap-2",
  lg: "h-10 px-5 text-[14px] gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
