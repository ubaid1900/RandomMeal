const MealStore = (() => {
  const storageKey = "random-meal-picker-meals";
  const starterVersionKey = "random-meal-picker-starter-version";
  const starterVersion = "2";
  const categories = ["breakfast", "lunch", "dinner"];
  const starterMeals = [
    { name: "Vegetable stir-fry", categories: ["dinner"] },
    { name: "Spaghetti with tomato sauce", categories: ["dinner"] },
    { name: "Chicken tacos", categories: ["dinner"] },
    { name: "Lentil soup", categories: ["lunch"] },
    { name: "Baked salmon and vegetables", categories: ["dinner"] },
    { name: "Mushroom risotto", categories: ["dinner"] },
    { name: "kichdi-khatta-kheema", categories: ["breakfast"] },
    { name: "roti-bhindi", categories: ["breakfast"] },
    { name: "seviyan", categories: ["breakfast"] },
    { name: "aloo-paratha", categories: ["breakfast"] },
    { name: "rice-tomato-salan", categories: ["lunch", "dinner"] },
    { name: "biryani", categories: ["lunch", "dinner"] },
    { name: "mandi", categories: ["lunch", "dinner"] },
    { name: "tahari", categories: ["lunch", "dinner"] },
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
