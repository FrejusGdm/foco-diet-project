"use client";

import { useState } from "react";
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
          />
        </div>
      </div>
    </div>
  );
}
