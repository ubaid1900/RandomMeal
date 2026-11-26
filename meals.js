const MealStore = (() => {
  const storageKey = "random-meal-picker-meals";
  const starterVersionKey = "random-meal-picker-starter-version";
  const starterVersion = "3";
  const categories = ["breakfast", "lunch", "dinner"];
  const starterMeals = [
    {
      name: "Vegetable stir-fry",
      categories: ["dinner"],
      prepTime: 25,
      tags: ["Vegetarian", "Weeknight"],
      quickNote: "Cook vegetables over high heat so they stay crisp.",
      keyIngredients: ["Mixed vegetables", "Soy sauce", "Rice"],
    },
    {
      name: "Spaghetti with tomato sauce",
      categories: ["dinner"],
      prepTime: 30,
      tags: ["Vegetarian", "Family favorite"],
      quickNote: "Simmer the sauce while the pasta cooks.",
      keyIngredients: ["Spaghetti", "Tomatoes", "Garlic"],
    },
    {
      name: "Chicken tacos",
      categories: ["dinner"],
      prepTime: 30,
      tags: ["Quick", "Family favorite"],
      quickNote: "Set out toppings so everyone can build their own.",
      keyIngredients: ["Chicken", "Tortillas", "Salsa"],
    },
    {
      name: "Lentil soup",
      categories: ["lunch"],
      prepTime: 40,
      tags: ["Vegetarian", "Make ahead"],
      quickNote: "Make extra portions to enjoy later in the week.",
      keyIngredients: ["Lentils", "Onion", "Vegetable stock"],
    },
    {
      name: "Baked salmon and vegetables",
      categories: ["dinner"],
      prepTime: 30,
      tags: ["Balanced", "One-pan"],
      quickNote: "Roast the vegetables alongside the salmon.",
      keyIngredients: ["Salmon", "Seasonal vegetables", "Lemon"],
    },
    {
      name: "Mushroom risotto",
      categories: ["dinner"],
      prepTime: 45,
      tags: ["Vegetarian", "Comfort food"],
      quickNote: "Add warm stock gradually and stir until creamy.",
      keyIngredients: ["Arborio rice", "Mushrooms", "Stock"],
    },
    {
      name: "kichdi-khatta-kheema",
      categories: ["breakfast"],
      prepTime: 45,
      tags: ["South Asian", "Hearty"],
      quickNote: "A comforting rice-and-lentil meal with a tangy side.",
      keyIngredients: ["Rice", "Lentils", "Yogurt"],
    },
    {
      name: "roti-bhindi",
      categories: ["breakfast"],
      prepTime: 35,
      tags: ["South Asian", "Vegetarian"],
      quickNote: "Keep the okra dry before cooking to help it brown.",
      keyIngredients: ["Okra", "Roti", "Spices"],
    },
    {
      name: "seviyan",
      categories: ["breakfast"],
      prepTime: 20,
      tags: ["South Asian", "Quick"],
      quickNote: "Toast the vermicelli lightly before simmering.",
      keyIngredients: ["Vermicelli", "Milk", "Cardamom"],
    },
    {
      name: "aloo-paratha",
      categories: ["breakfast"],
      prepTime: 40,
      tags: ["South Asian", "Vegetarian"],
      quickNote: "Serve warm with yogurt or chutney.",
      keyIngredients: ["Potatoes", "Whole-wheat flour", "Spices"],
    },
    {
      name: "rice-tomato-salan",
      categories: ["lunch", "dinner"],
      prepTime: 40,
      tags: ["South Asian", "Vegetarian"],
      quickNote: "Adjust the chili to suit your preferred heat level.",
      keyIngredients: ["Rice", "Tomatoes", "Peanuts"],
    },
    {
      name: "biryani",
      categories: ["lunch", "dinner"],
      prepTime: 60,
      tags: ["South Asian", "Make ahead"],
      quickNote: "Let the layered rice rest briefly before serving.",
      keyIngredients: ["Basmati rice", "Spices", "Vegetables or protein"],
    },
    {
      name: "mandi",
      categories: ["lunch", "dinner"],
      prepTime: 75,
      tags: ["South Asian", "Sharing"],
      quickNote: "Serve the fragrant rice and roasted protein family-style.",
      keyIngredients: ["Rice", "Spices", "Chicken or vegetables"],
    },
    {
      name: "tahari",
      categories: ["lunch", "dinner"],
      prepTime: 45,
      tags: ["South Asian", "One-pot"],
      quickNote: "Cook the rice with the spiced vegetables for an easy one-pot meal.",
      keyIngredients: ["Rice", "Potatoes", "Whole spices"],
    },
  ];

  function copyStarterMeals() {
    return starterMeals.map((meal) => ({ ...meal, categories: [...meal.categories] }));
  }

  function readMeals(statusElement) {
    try {
      const savedMeals = localStorage.getItem(storageKey);
      if (savedMeals === null) {
        const initialMeals = copyStarterMeals();
        localStorage.setItem(storageKey, JSON.stringify(initialMeals));
        localStorage.setItem(starterVersionKey, starterVersion);
        return initialMeals;
      }

      const parsedMeals = JSON.parse(savedMeals);
      const validMeals = Array.isArray(parsedMeals) && parsedMeals.every((meal) => {
        if (typeof meal === "string") {
          return true;
        }

        return meal !== null &&
          typeof meal === "object" &&
          typeof meal.name === "string" &&
          (categories.includes(meal.category) ||
            (Array.isArray(meal.categories) &&
              meal.categories.length > 0 &&
              meal.categories.every((category) => categories.includes(category))));
      });
      if (!validMeals) {
        throw new Error("Saved meal list has an invalid format.");
      }

      const normalizedMeals = parsedMeals.map((meal) =>
        typeof meal === "string"
          ? { name: meal, categories: [meal === "Lentil soup" ? "lunch" : "dinner"] }
          : {
              ...meal,
              name: meal.name,
              categories: Array.isArray(meal.categories)
                ? [...new Set(meal.categories)]
                : [meal.category],
            },
      );
      const needsMealMigration = parsedMeals.some((meal) =>
        typeof meal === "string" ||
        (meal !== null && typeof meal === "object" && !Array.isArray(meal.categories))
      );

      if (localStorage.getItem(starterVersionKey) !== starterVersion) {
        starterMeals.slice(6).forEach((starterMeal) => {
          const existingMeal = normalizedMeals.find((meal) => meal.name === starterMeal.name);
          if (existingMeal) {
            existingMeal.categories = [
              ...new Set([...existingMeal.categories, ...starterMeal.categories]),
            ];
          } else {
            normalizedMeals.push({
              ...starterMeal,
              categories: [...starterMeal.categories],
            });
          }
        });
        starterMeals.forEach((starterMeal) => {
          const existingMeal = normalizedMeals.find((meal) => meal.name === starterMeal.name);
          if (existingMeal) {
            Object.keys(starterMeal).forEach((key) => {
              if (key !== "name" && key !== "categories" && existingMeal[key] === undefined) {
                existingMeal[key] = Array.isArray(starterMeal[key])
                  ? [...starterMeal[key]]
                  : starterMeal[key];
              }
            });
          }
        });
        localStorage.setItem(starterVersionKey, starterVersion);
      }

      if (
        needsMealMigration ||
        localStorage.getItem(storageKey) !== JSON.stringify(normalizedMeals)
      ) {
        localStorage.setItem(storageKey, JSON.stringify(normalizedMeals));
      }
      return normalizedMeals;
    } catch (error) {
      statusElement.textContent = "Meals could not be loaded from this browser's storage.";
      console.error("Unable to load saved meals.", error);
      return copyStarterMeals();
    }
  }

  function saveMeals(meals, statusElement) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(meals));
      statusElement.textContent = "Your meals are saved on this device.";
      return true;
    } catch (error) {
      statusElement.textContent = "Changes could not be saved. Check your browser storage settings.";
      console.error("Unable to save meals.", error);
      return false;
    }
  }

  return {
    categories,
    copyStarterMeals,
    readMeals,
    saveMeals,
    starterMeals,
    storageKey,
  };
})();
