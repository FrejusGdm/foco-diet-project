# Dartmouth Dining Menu API

Documentation of the public REST API at `menu.dartmouth.edu` used by the Foco Diet Planner scraper.

## Architecture

- **CMS**: Drupal 10 ("stark" theme)
- **Frontend**: React 17 SPA
- **Data source**: Computrition Hospitality Suite via Epicure Digital's ION system
- **Data flow**: Computrition XChange Gateway (XML) -> Drupal custom entities -> REST API (`/menuapi/`) -> React frontend

## Primary Endpoint

```
GET https://menu.dartmouth.edu/menuapi/mealitems?dates=YYYYMMDD
```

- **No authentication required**
- Date format: `YYYYMMDD` (no dashes)
- Multiple dates: comma-separated (e.g., `dates=20260206,20260207`)
- Returns all items across all dining locations

### Response Structure

```json
{
  "status": 200,
  "dates": ["2026-02-06"],
  "mealItems": [
    {
      "id": "34191",
      "itemName": "Clam Chowder",
      "mainLocationLabel": "53 Commons",
      "recipeCategory": ["Soup", "Scratch"],
      "menuCategory": "Soup/Chili/Chowder",
      "imagePath": "https://menu.dartmouth.edu/sites/menu/files/styles/recipe/public/...",
      "isAnalyzed": true,
      "datesAvailable": [
        {
          "date": "20260206",
          "menus": [
            { "mealPeriod": "Lunch", "subLocation": "Specials" },
            { "mealPeriod": "Dinner", "subLocation": "Specials" }
          ]
        }
      ],
      "ingredients": "Potatoes, Yukon, Gold, ...",
      "containsAllergens": [
        { "id": "d", "label": "Dairy" },
        { "id": "sf", "label": "Shellfish" }
      ],
      "meetsPreferences": [
        { "id": "GF", "label": "Gluten-free" }
      ],
      "nutrients": [
        { "id": "calories", "label": "Calories", "value": 305, "unit": "kcal", "percentDailyValue": 15 },
        { "id": "protein", "label": "Protein", "value": 12, "unit": "gm", "percentDailyValue": 24 },
        { "id": "totalFat", "label": "Total Fat", "value": 18.5, "unit": "gm", "percentDailyValue": 24 },
        { "id": "totalCarbohydrates", "label": "Total Carbohydrates", "value": 22.4, "unit": "gm", "percentDailyValue": 8 },
        { "id": "dietaryFiber", "label": "Dietary Fiber", "value": 1.6, "unit": "gm", "percentDailyValue": 6 },
        { "id": "saturatedFat", "value": 9.82, "unit": "gm" },
        { "id": "cholesterol", "value": 68, "unit": "mg" },
        { "id": "sodium", "value": 988, "unit": "mg" },
        { "id": "totalSugars", "value": 1.5, "unit": "gm" },
        { "id": "addedSugars", "value": 0, "unit": "gm" },
        { "id": "transFat", "value": 0.32, "unit": "gm" },
        { "id": "vitaminD", "value": 0.2, "unit": "mcg" },
        { "id": "calcium", "value": 138, "unit": "mg" },
        { "id": "iron", "value": 7.69, "unit": "mg" },
        { "id": "potassium", "value": 563, "unit": "mg" }
      ],
      "portionSize": "8 ounces fl"
    }
  ]
}
```

## Other Endpoints

| Endpoint | Description |
|---|---|
| `GET /menuapi/mealitems?id=473636` | Single item by ID with full details |
| `GET /menuapi/menuboards` | All 17 food stations with hours and current items |
| `GET /menuapi/menuboards?id=1&date=YYYYMMDD` | Specific station for a date |
| `GET /menuapi/diningboards` | All dining venues with IDs and types |
| `GET /menuapi/greeterboards` | Greeter board configuration |

## Dining Locations

| Location | Notes |
|---|---|
| **53 Commons** | Foco (main dining hall) - ~397 items/day |
| Collis Cafe | ~106 items/day |
| Courtyard Cafe | ~40 items/day |

## Foco Stations (Menu Boards)

| ID | Station Name |
|----|---|
| 1 | Ma Thayer's |
| 6 | Bakery |
| 11 | Farmstand South |
| 16 | Farmstand East |
| 21 | Farmstand North |
| 26 | Farmstand West |
| 31 | Soup |
| 36 | Hearth |
| 41 | Herbivore |
| 46 | Saute Fresh |
| 51 | Grill |
| 56 | Pavilion |
| 66 | Gluten Free/Halal |

## Meal Periods

Values returned in `datesAvailable[].menus[].mealPeriod`:
- `Breakfast`
- `Lunch`
- `Dinner`
- `Late Night`
- `Specials`
- `Collis Bakery`

Our scraper only maps Breakfast, Lunch, and Dinner.

## Allergen Codes

| Code | Label |
|---|---|
| d | Dairy |
| e | Egg |
| w | Wheat |
| s | Soy |
| tn | Tree Nuts |
| p | Peanut |
| sf | Shellfish |
| f | Fish |
| ss | Sesame |
| g | Gluten |
| v | Vegan |
| vg | Vegetarian |

## Dietary Preference Tags

Available in `meetsPreferences[]`:
- Vegan, Vegetarian, Gluten-free, Halal, Kosher, etc.

## Data Volume

A typical day returns ~543 total items across all locations, with ~362 analyzed items at 53 Commons having full nutritional data.

## Usage in Our Scraper

The `convex/scrapingActions.ts` action calls this API daily at 5:00 AM UTC via the cron in `convex/crons.ts`. It:
1. Fetches items for the current date
2. Filters to 53 Commons + analyzed items only
3. Maps each item to our `menuItems` schema
4. Handles items appearing in multiple meal periods (creates separate DB entries)
5. Deduplicates via `uniqueKey` pattern: `{name}-{location}-{mealType}-{date}`
