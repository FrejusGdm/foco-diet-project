"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { MenuItem, MealPlan, UserPreferences } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MealItemCard from "@/components/meal-planning/MealItemCard";
import MealPlanSummary from "@/components/meal-planning/MealPlanSummary";
import {
  Search,
  Coffee,
  Sun,
  Moon,
  Loader2,
  Database,
  Sparkles,
  X,
} from "lucide-react";

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

type MealType = "breakfast" | "lunch" | "dinner";

/**
 * Meal Planner page - main planning interface.
 * Shows available menu items filtered by meal type, allows
 * adding/removing items from the daily plan, and displays
 * a running summary with calorie progress.
 */
export default function MealPlannerPage() {
  const today = getTodayISO();
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const preferences = useQuery(api.userPreferences.get) as UserPreferences | null | undefined;
  const menuItems = useQuery(api.menuItems.list, {
    date: today,
    mealType: activeMeal,
  }) as MenuItem[] | undefined;
  const mealPlan = useQuery(api.mealPlans.getByDate, { date: today }) as MealPlan | null | undefined;

  const addMeal = useMutation(api.mealPlans.addMeal);
  const removeMeal = useMutation(api.mealPlans.removeMeal);
  const clearPlan = useMutation(api.mealPlans.clear);
  const seedDemo = useMutation(api.menuItems.seedDemoData);

  const calorieGoal = preferences?.dailyCalorieGoal ?? 2000;

  // Get selected item IDs for the current meal type
  const selectedIds = new Set(
    (mealPlan?.meals?.[activeMeal] ?? []).map((id: string) => id.toString())
  );

  // Filter items by search term
  const filteredItems = (menuItems ?? []).filter(
    (item) =>
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMeal = async (menuItemId: string) => {
    await addMeal({
      date: today,
      mealType: activeMeal,
      menuItemId,
    });
  };

  const handleRemoveMeal = async (mealType: string, menuItemId: string) => {
    await removeMeal({
      date: today,
      mealType: mealType as MealType,
      menuItemId,
    });
  };

  const handleClearPlan = async () => {
    await clearPlan({ date: today });
  };

  const handleSeedDemo = async () => {
    await seedDemo({ date: today });
  };

  // Build resolved meals for summary (using available menu items data)
  const allMenuItems = useQuery(api.menuItems.list, { date: today }) as MenuItem[] | undefined;
  const menuItemMap = new Map(
    (allMenuItems ?? []).map((item: MenuItem) => [item._id.toString(), item])
  );

  type MealSummaryItem = { _id: string; name: string; calories: number; protein: number; mealType: string };

  const resolveMealIds = (ids: string[]): MealSummaryItem[] =>
    ids
      .map((id: string) => menuItemMap.get(id.toString()))
      .filter(Boolean) as MealSummaryItem[];

  const resolvedMeals = {
    breakfast: resolveMealIds(mealPlan?.meals?.breakfast ?? []),
    lunch: resolveMealIds(mealPlan?.meals?.lunch ?? []),
    dinner: resolveMealIds(mealPlan?.meals?.dinner ?? []),
  };

  const totalCalories = [...resolvedMeals.breakfast, ...resolvedMeals.lunch, ...resolvedMeals.dinner]
    .reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = [...resolvedMeals.breakfast, ...resolvedMeals.lunch, ...resolvedMeals.dinner]
    .reduce((sum, m) => sum + m.protein, 0);
  const proteinGoal = preferences?.dailyProteinGoal;

  const suggestedItems = useMemo(() => {
    if (!showSuggestions || !allMenuItems) return [];

    const remainingCal = calorieGoal - totalCalories;
    if (remainingCal <= 0) return [];

    const remainingProtein = proteinGoal ? proteinGoal - totalProtein : null;

    // Get all selected IDs across all meal types
    const allSelectedIds = new Set([
      ...(mealPlan?.meals?.breakfast ?? []).map((id: string) => id.toString()),
      ...(mealPlan?.meals?.lunch ?? []).map((id: string) => id.toString()),
      ...(mealPlan?.meals?.dinner ?? []).map((id: string) => id.toString()),
    ]);

    const candidates = (allMenuItems as MenuItem[])
      .filter((item) => !allSelectedIds.has(item._id.toString()))
      .filter((item) => item.mealType === activeMeal)
      .filter((item) => item.calories <= remainingCal && item.calories > 0);

    const scored = candidates.map((item) => {
      // Protein density score (0-1)
      const proteinDensity = item.calories > 0 ? item.protein / item.calories : 0;
      // How well this item uses remaining calories (prefer items that fill ~30-60% of remaining)
      const calRatio = item.calories / remainingCal;
      const calFit = 1 - Math.abs(0.45 - calRatio);

      let score = calFit * 0.4 + proteinDensity * 3;
      // Boost protein-dense items if user has a protein goal and is behind
      if (remainingProtein && remainingProtein > 0) {
        score += (item.protein / remainingProtein) * 2;
      }
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((s) => s.item);
  }, [showSuggestions, allMenuItems, calorieGoal, totalCalories, totalProtein, proteinGoal, mealPlan, activeMeal]);

  const handleSuggest = () => {
    setShowSuggestions(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Meal Planner</h1>
        <p className="text-muted-foreground mt-1">
          Browse today&apos;s menu and build your meal plan
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Menu Items - 2/3 width on desktop */}
        <div className="space-y-4 lg:col-span-2">
          {/* Meal Type Tabs */}
          <Tabs
            value={activeMeal}
            onValueChange={(v) => setActiveMeal(v as MealType)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="breakfast" className="flex-1 gap-1.5">
                <Coffee className="h-4 w-4" />
                Breakfast
              </TabsTrigger>
              <TabsTrigger value="lunch" className="flex-1 gap-1.5">
                <Sun className="h-4 w-4" />
                Lunch
              </TabsTrigger>
              <TabsTrigger value="dinner" className="flex-1 gap-1.5">
                <Moon className="h-4 w-4" />
                Dinner
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="pl-9 bg-card"
              />
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestedItems.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" />
                    Suggested for you
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <X className="h-3 w-3" />
                    Dismiss
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestedItems.map((item) => (
                    <MealItemCard
                      key={item._id}
                      name={item.name}
                      calories={item.calories}
                      protein={item.protein}
                      location={item.location}
                      carbs={item.carbs}
                      fat={item.fat}
                      imageUrl={item.imageUrl}
                      isSelected={selectedIds.has(item._id.toString())}
                      onAdd={() => handleAddMeal(item._id)}
                      onRemove={() => handleRemoveMeal(activeMeal, item._id)}
                      className="ring-1 ring-primary/20"
                    />
                  ))}
                </div>
              </div>
            )}

            {showSuggestions && suggestedItems.length === 0 && (
              <div className="mt-4 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No suggestions available — try switching to a different meal type or clear some items.
              </div>
            )}

            {/* Menu Items Grid */}
            {(["breakfast", "lunch", "dinner"] as const).map((mealType) => (
              <TabsContent key={mealType} value={mealType}>
                {menuItems === undefined ? (
                  <div role="status" className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="sr-only">Loading menu items</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-12">
                      <CardDescription>
                        {searchTerm
                          ? `No items matching "${searchTerm}"`
                          : `No ${mealType} items available for today`}
                      </CardDescription>
                      {!searchTerm && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={handleSeedDemo}
                        >
                          <Database className="h-4 w-4" />
                          Load Demo Data
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredItems.map((item) => (
                      <MealItemCard
                        key={item._id}
                        name={item.name}
                        calories={item.calories}
                        protein={item.protein}
                        location={item.location}
                        carbs={item.carbs}
                        fat={item.fat}
                        imageUrl={item.imageUrl}
                        isSelected={selectedIds.has(item._id.toString())}
                        onAdd={() => handleAddMeal(item._id)}
                        onRemove={() =>
                          handleRemoveMeal(mealType, item._id)
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Meal Plan Summary - 1/3 width on desktop */}
        <div className="lg:sticky lg:top-20">
          <MealPlanSummary
            date={today}
            calorieGoal={calorieGoal}
            meals={resolvedMeals}
            onRemoveMeal={handleRemoveMeal}
            onClearPlan={handleClearPlan}
            onSuggest={handleSuggest}
          />
        </div>
      </div>
    </div>
  );
}
