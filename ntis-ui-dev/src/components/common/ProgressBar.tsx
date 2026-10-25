import { cn } from '@/lib/utils/cn';

type ProgressBarSize = "sm" | "md";
type ProgressBarColor = "blue" | "green" | "orange" | "red";

interface ProgressBarProps {
  percentage: number;
  showPercentage?: boolean;
  size?: ProgressBarSize;
  color?: ProgressBarColor;
  className?: string;
}

const sizeStyles: Record<
  ProgressBarSize,
  {
    container: string;
    bar: string;
    text: string;
  }
> = {
  sm: {
    container: "h-1.5 w-20",
    bar: "h-1.5",
    text: "text-xs",
  },
  md: {
    container: "h-1 w-full",
    bar: "h-1",
    text: "text-sm",
  },
};

const colorStyles: Record<ProgressBarColor, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

export function ProgressBar({
  percentage,
  showPercentage = false,
  size = "sm",
  color = "blue",
  className,
}: ProgressBarProps) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  const styles = sizeStyles[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-slate-200",
          styles.container
        )}
      >
        <div
          className={cn(
            "rounded-full transition-all duration-300",
            styles.bar,
            colorStyles[color]
          )}
          style={{ width: `${safePercentage}%` }}
        />
      </div>

      {showPercentage && (
        <span className={cn("whitespace-nowrap text-slate-700", styles.text)}>
          {safePercentage}%
        </span>
      )}
    </div>
  );
}