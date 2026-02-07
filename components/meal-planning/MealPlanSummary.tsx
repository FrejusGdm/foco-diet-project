"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CalorieProgress from "./CalorieProgress";
import NutritionBadge from "./NutritionBadge";
import { Trash2, UtensilsCrossed, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MealItem {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  mealType: string;
}

interface MealPlanSummaryProps {
  date: string;
  calorieGoal: number;
  meals: {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
  };
  onRemoveMeal?: (mealType: string, itemId: string) => void;
  onClearPlan?: () => void;
  onSuggest?: () => void;
}

/**
 * Summary card showing the user's meal plan for a given day.
 * Displays selected meals grouped by type, total nutrition,
 * and progress toward calorie goal.
 */
export default function MealPlanSummary({
  date,
  calorieGoal,
  meals,
  onRemoveMeal,
  onClearPlan,
  onSuggest,
}: MealPlanSummaryProps) {
  const allMeals = [
    ...meals.breakfast,
    ...meals.lunch,
    ...meals.dinner,
  ];
  const totalCalories = allMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = allMeals.reduce((sum, m) => sum + m.protein, 0);

  const mealSections = [
    { key: "breakfast", label: "Breakfast", items: meals.breakfast },
    { key: "lunch", label: "Lunch", items: meals.lunch },
    { key: "dinner", label: "Dinner", items: meals.dinner },
  ] as const;

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-xl">Your Meal Plan</CardTitle>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          {allMeals.length > 0 && onClearPlan && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={onClearPlan}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CalorieProgress current={totalCalories} goal={calorieGoal} />

        <div className="flex gap-2">
          <NutritionBadge
            label="Total Cal"
            value={totalCalories}
            variant="calories"
          />
          <NutritionBadge
            label="Total Protein"
            value={totalProtein}
            variant="protein"
          />
        </div>

        {onSuggest && totalCalories < calorieGoal && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            onClick={onSuggest}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Suggest items ({Math.max(0, calorieGoal - totalCalories)} kcal remaining)
          </Button>
        )}

        <Separator className="bg-border/60" />

        {allMeals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <UtensilsCrossed className="h-8 w-8" />
            <p className="text-sm">No meals selected yet</p>
            <p className="text-xs">
              Browse the menu and add items to your plan
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {mealSections.map(
              (section) =>
                section.items.length > 0 && (
                  <div key={section.key}>
                    <h4 className="mb-2 font-display text-sm text-muted-foreground">
                      {section.label}
                    </h4>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums text-sm font-medium" style={{ color: "var(--color-calories)" }}>
                              {item.calories} kcal
                            </span>
                            {onRemoveMeal && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  onRemoveMeal(section.key, item._id)
                                }
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
