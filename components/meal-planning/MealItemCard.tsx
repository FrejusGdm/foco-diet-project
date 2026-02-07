"use client";

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NutritionBadge from "./NutritionBadge";
import { Plus, Minus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface MealItemCardProps {
  name: string;
  calories: number;
  protein: number;
  location: string;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  isSelected?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * Card displaying a single menu item with nutritional information
 * and an add/remove button for meal planning.
 */
export default function MealItemCard({
  name,
  calories,
  protein,
  location,
  carbs,
  fat,
  imageUrl,
  isSelected = false,
  onAdd,
  onRemove,
  className,
}: MealItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;

  return (
    <Card
      className={cn(
        "border-l-[3px] border-l-transparent transition-all hover:shadow-md overflow-hidden",
        isSelected && "ring-2 ring-primary/50 border-l-primary bg-primary/5",
        !isSelected && "hover:border-l-border",
        className
      )}
    >
      {showImage && (
        <div className="relative h-32 w-full bg-muted">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium leading-tight">{name}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {location}
            </div>
          </div>
          <div className="text-right">
            <span className="tabular-nums text-lg font-bold" style={{ color: "var(--color-calories)" }}>
              {calories}
            </span>
            <span className="text-xs text-muted-foreground"> kcal</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <NutritionBadge label="P" value={protein} variant="protein" />
          {carbs !== undefined && carbs > 0 && (
            <NutritionBadge label="C" value={carbs} variant="carbs" />
          )}
          {fat !== undefined && fat > 0 && (
            <NutritionBadge label="F" value={fat} variant="fat" />
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4">
        {isSelected ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
            onClick={onRemove}
          >
            <Minus className="h-3 w-3" />
            Remove from plan
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-primary hover:bg-primary/5 hover:text-primary"
            onClick={onAdd}
          >
            <Plus className="h-3 w-3" />
            Add to plan
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
