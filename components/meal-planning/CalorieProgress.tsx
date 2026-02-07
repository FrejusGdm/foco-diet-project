"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CalorieProgressProps {
  current: number;
  goal: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * Visual progress bar showing calories consumed vs daily goal.
 * Changes color based on how close the user is to their goal:
 * - Green: Under 80% of goal (on track)
 * - Amber: 80-100% of goal (approaching limit)
 * - Red: Over 100% of goal (exceeded)
 */
export default function CalorieProgress({
  current,
  goal,
  className,
  showLabel = true,
}: CalorieProgressProps) {
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const remaining = Math.max(goal - current, 0);
  const isOver = current > goal;

  const getColor = () => {
    if (percentage >= 100) return "text-red-600 dark:text-red-400";
    if (percentage >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getProgressColor = () => {
    if (percentage >= 100)
      return "[&>div]:bg-red-500";
    if (percentage >= 80)
      return "[&>div]:bg-amber-500";
    return "[&>div]:bg-emerald-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {current.toLocaleString()} / {goal.toLocaleString()} kcal
          </span>
          <span className={cn("font-medium", getColor())}>
            {isOver
              ? `${(current - goal).toLocaleString()} over`
              : `${remaining.toLocaleString()} remaining`}
          </span>
        </div>
      )}
      <Progress
        value={Math.min(percentage, 100)}
        className={cn("h-3", getProgressColor())}
      />
      {showLabel && (
        <p className={cn("text-xs font-medium text-center", getColor())}>
          {percentage}% of daily goal
        </p>
      )}
    </div>
  );
}
