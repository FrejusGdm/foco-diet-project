import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NutritionBadgeProps {
  label: string;
  value: number;
  unit?: string;
  variant?: "calories" | "protein" | "carbs" | "fat";
  className?: string;
}

const variantStyles: Record<string, string> = {
  calories: "bg-[var(--color-calories)]/10 text-[var(--color-calories)] border-[var(--color-calories)]/20",
  protein: "bg-[var(--color-protein)]/10 text-[var(--color-protein)] border-[var(--color-protein)]/20",
  carbs: "bg-[var(--color-carbs)]/10 text-[var(--color-carbs)] border-[var(--color-carbs)]/20",
  fat: "bg-[var(--color-fat)]/10 text-[var(--color-fat)] border-[var(--color-fat)]/20",
};

export default function NutritionBadge({
  label,
  value,
  unit = "g",
  variant = "calories",
  className,
}: NutritionBadgeProps) {
  const displayUnit = variant === "calories" ? "kcal" : unit;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full font-normal", variantStyles[variant], className)}
    >
      <span className="text-xs opacity-70">{label}</span>
      <span className="tabular-nums font-semibold">
        {value} {displayUnit}
      </span>
    </Badge>
  );
}
