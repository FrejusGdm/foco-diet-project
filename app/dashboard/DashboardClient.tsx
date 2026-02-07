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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/meal-planner">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Plan Meals
            </Button>
          </Link>
          {!preferences && (
            <Link href="/preferences">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Set Goals
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Calorie Goal Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            <CardTitle>Daily Calorie Goal</CardTitle>
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
            <Card key={meal.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{meal.label}</CardTitle>
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
                  <Link href="/meal-planner">
                    <Button variant="ghost" size="sm" className="gap-1 px-0">
                      <Plus className="h-3 w-3" />
                      Add {meal.label.toLowerCase()}
                    </Button>
                  </Link>
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
            <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
            <CardTitle>Today&apos;s Menu</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {todayMenuItems === undefined ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading menu data...
            </div>
          ) : totalMenuItems > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalMenuItems} menu items available today
              </p>
              <Link href="/meal-planner">
                <Button variant="outline" size="sm">
                  Browse Menu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No menu data available for today. The scraper runs at midnight,
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
