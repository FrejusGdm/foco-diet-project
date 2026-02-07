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
  calories: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  protein: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  carbs: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  fat: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
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
      className={cn("gap-1 font-normal", variantStyles[variant], className)}
    >
      <span className="text-xs opacity-70">{label}</span>
      <span className="font-semibold">
        {value}
        {displayUnit}
      </span>
    </Badge>
  );
}
