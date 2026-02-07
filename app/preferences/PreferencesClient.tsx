"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Check, Loader2 } from "lucide-react";
import { MEAL_TYPES, DIETARY_RESTRICTIONS, DEFAULT_CALORIE_GOAL } from "@/lib/constants";
import type { MealType } from "@/lib/constants";

/**
 * Preferences page - allows users to configure their diet goals.
 * Settings include calorie goal, protein goal, preferred meal types,
 * and dietary restrictions.
 */
export default function PreferencesPage() {
  const preferences = useQuery(api.userPreferences.get) as import("@/lib/types").UserPreferences | null | undefined;
  const updatePreferences = useMutation(api.userPreferences.update);

  const [calorieGoal, setCalorieGoal] = useState(DEFAULT_CALORIE_GOAL);
  const [proteinGoal, setProteinGoal] = useState(100);
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>([
    ...MEAL_TYPES,
  ]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize form with existing preferences
  useEffect(() => {
    if (preferences) {
      setCalorieGoal(preferences.dailyCalorieGoal);
      setProteinGoal(preferences.dailyProteinGoal ?? 100);
      setSelectedMeals(preferences.preferredMealTypes as MealType[]);
      setSelectedRestrictions(preferences.dietaryRestrictions ?? []);
    }
  }, [preferences]);

  const toggleMealType = (mealType: MealType) => {
    setSelectedMeals((prev) =>
      prev.includes(mealType)
        ? prev.filter((m) => m !== mealType)
        : [...prev, mealType]
    );
  };

  const toggleRestriction = (restriction: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updatePreferences({
        dailyCalorieGoal: calorieGoal,
        dailyProteinGoal: proteinGoal,
        preferredMealTypes: selectedMeals,
        dietaryRestrictions:
          selectedRestrictions.length > 0 ? selectedRestrictions : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl tracking-tight">
          <Settings className="h-7 w-7 text-primary" />
          Preferences
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your diet goals and meal preferences
        </p>
      </div>

      {/* Calorie & Protein Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Daily Goals</CardTitle>
          <CardDescription>
            Set your daily calorie and protein targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calorie-goal">Daily Calorie Goal (kcal)</Label>
            <Input
              id="calorie-goal"
              type="number"
              min={500}
              max={10000}
              step={50}
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number(e.target.value))}
              className="bg-card"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1500-2500 kcal for most adults
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protein-goal">Daily Protein Goal (g)</Label>
            <Input
              id="protein-goal"
              type="number"
              min={0}
              max={500}
              step={5}
              value={proteinGoal}
              onChange={(e) => setProteinGoal(Number(e.target.value))}
              className="bg-card"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 0.8-1.2g per kg of body weight
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meal Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Preferred Meal Types</CardTitle>
          <CardDescription>
            Select which meals you want to plan for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred meal types">
            {MEAL_TYPES.map((mealType) => {
              const isSelected = selectedMeals.includes(mealType);
              return (
                <Badge
                  key={mealType}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer select-none rounded-full px-4 py-2 text-sm capitalize transition-all hover:shadow-sm"
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => toggleMealType(mealType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleMealType(mealType);
                    }
                  }}
                >
                  {isSelected && <Check className="mr-1 h-3 w-3" />}
                  {mealType}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dietary Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Dietary Restrictions</CardTitle>
          <CardDescription>
            Select any dietary restrictions or preferences (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Dietary restrictions">
            {DIETARY_RESTRICTIONS.map((restriction) => {
              const isSelected = selectedRestrictions.includes(restriction);
              return (
                <Badge
                  key={restriction}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer select-none rounded-full px-3 py-1.5 text-sm capitalize transition-all hover:shadow-sm"
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => toggleRestriction(restriction)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleRestriction(restriction);
                    }
                  }}
                >
                  {isSelected && <Check className="mr-1 h-3 w-3" />}
                  {restriction}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || selectedMeals.length === 0}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
