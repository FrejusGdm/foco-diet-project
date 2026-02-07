"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { MenuItem, MealPlan, UserPreferences } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CalorieProgress from "@/components/meal-planning/CalorieProgress";
import NutritionBadge from "@/components/meal-planning/NutritionBadge";
import {
  UtensilsCrossed,
  Target,
  Settings,
  Plus,
  Coffee,
  Sun,
  Moon,
  Loader2,
  Database,
} from "lucide-react";

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

const mealBorderColors = {
  breakfast: "border-l-amber-500",
  lunch: "border-l-emerald-600 dark:border-l-emerald-500",
  dinner: "border-l-indigo-500",
} as const;

/**
 * Dashboard page - main hub for authenticated users.
 * Shows calorie goal progress, today's meal plan summary,
 * and quick navigation to key features.
 */
export default function DashboardPage() {
  const { user } = useUser();
  const today = getTodayISO();

  const preferences = useQuery(api.userPreferences.get) as UserPreferences | null | undefined;
  const mealPlan = useQuery(api.mealPlans.getByDate, { date: today }) as MealPlan | null | undefined;
  const todayMenuItems = useQuery(api.menuItems.list, { date: today }) as MenuItem[] | undefined;
  const seedDemo = useMutation(api.menuItems.seedDemoData);

  const calorieGoal = preferences?.dailyCalorieGoal ?? 2000;
  const totalCalories = mealPlan?.totalCalories ?? 0;
  const totalProtein = mealPlan?.totalProtein ?? 0;

  const mealCounts = {
    breakfast: mealPlan?.meals?.breakfast?.length ?? 0,
    lunch: mealPlan?.meals?.lunch?.length ?? 0,
    dinner: mealPlan?.meals?.dinner?.length ?? 0,
  };

  const totalMenuItems = todayMenuItems?.length ?? 0;

  const handleSeedDemo = async () => {
    await seedDemo({ date: today });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="gap-2">
            <Link href="/meal-planner">
              <Plus className="h-4 w-4" />
              Plan Meals
            </Link>
          </Button>
          {!preferences && (
            <Button asChild variant="outline" className="gap-2">
              <Link href="/preferences">
                <Settings className="h-4 w-4" />
                Set Goals
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Calorie Goal Card */}
      <Card className="border-t-[3px] border-t-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-xl">Daily Calorie Goal</CardTitle>
          </div>
          <CardDescription>
            {preferences
              ? `Your goal: ${calorieGoal.toLocaleString()} kcal/day`
              : "Set your calorie goal in Preferences to start tracking"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalorieProgress current={totalCalories} goal={calorieGoal} />
          <div className="mt-3 flex gap-2">
            <NutritionBadge
              label="Consumed"
              value={totalCalories}
              variant="calories"
            />
            <NutritionBadge
              label="Protein"
              value={totalProtein}
              variant="protein"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meal Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            key: "breakfast" as const,
            label: "Breakfast",
            icon: Coffee,
            time: "7:00 - 10:00 AM",
          },
          {
            key: "lunch" as const,
            label: "Lunch",
            icon: Sun,
            time: "11:00 AM - 2:00 PM",
          },
          {
            key: "dinner" as const,
            label: "Dinner",
            icon: Moon,
            time: "5:00 - 8:00 PM",
          },
        ].map((meal) => {
          const Icon = meal.icon;
          const count = mealCounts[meal.key];
          return (
            <Card key={meal.key} className={`border-l-[3px] ${mealBorderColors[meal.key]}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="font-display text-lg">{meal.label}</CardTitle>
                  </div>
                  {count > 0 && (
                    <Badge variant="success">{count} items</Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {meal.time}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {count > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {count} item{count !== 1 ? "s" : ""} selected
                  </p>
                ) : (
                  <Button asChild variant="ghost" size="sm" className="gap-1 px-0">
                    <Link href="/meal-planner">
                      <Plus className="h-3 w-3" />
                      Add {meal.label.toLowerCase()}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Menu Availability & Demo Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-xl">Today&apos;s Menu</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {todayMenuItems === undefined ? (
            <div role="status" className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading menu data...
            </div>
          ) : totalMenuItems > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalMenuItems} menu items available today
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/meal-planner">
                  Browse Menu
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No menu data available for today. The menu updates daily,
                or you can load demo data to test the app.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleSeedDemo}
              >
                <Database className="h-4 w-4" />
                Load Demo Menu Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
