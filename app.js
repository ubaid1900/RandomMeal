const categoryPickButtons = [...document.querySelectorAll("#category-pickers [data-category]")];
const mealResult = document.querySelector("#meal-result");
const mealDetails = document.querySelector("#meal-details");
const youtubeSearch = document.querySelector("#youtube-search");
const storageMessage = document.querySelector("#storage-message");
const lastPickedMealByCategory = {};

let meals = MealStore.readMeals(storageMessage);

function addBadge(label, className = "text-bg-secondary") {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = label;
  mealDetails.append(badge);
}

function renderMealDetails(meal, category) {
  mealDetails.replaceChildren();
  addBadge(category.charAt(0).toUpperCase() + category.slice(1), "text-bg-success");

  const hasMetadata = Boolean(
    meal.prepTime ||
    (Array.isArray(meal.tags) && meal.tags.length) ||
    meal.quickNote ||
    (Array.isArray(meal.keyIngredients) && meal.keyIngredients.length),
  );
  if (!hasMetadata) {
    addBadge("Your Custom Meal");
    return;
  }

  if (meal.prepTime) {
    addBadge(`${meal.prepTime} min`);
  }
  if (Array.isArray(meal.tags)) {
    meal.tags.forEach((tag) => addBadge(tag));
  }
  if (meal.quickNote) {
    const note = document.createElement("p");
    note.className = "text-body-secondary mb-0 mt-3";
    note.textContent = meal.quickNote;
    mealDetails.append(note);
  }
  if (Array.isArray(meal.keyIngredients) && meal.keyIngredients.length) {
    const ingredients = document.createElement("p");
    ingredients.className = "small mb-0 mt-2";
    ingredients.textContent = `Key ingredients: ${meal.keyIngredients.join(", ")}`;
    mealDetails.append(ingredients);
  }
}

function renderPickerButtons() {
  categoryPickButtons.forEach((button) => {
    button.disabled = !meals.some((meal) => meal.categories.includes(button.dataset.category));
  });
}

function pickMeal(category) {
  const categoryMeals = meals.filter((meal) => meal.categories.includes(category));
  if (categoryMeals.length === 0) {
    mealResult.textContent = `No ${category} meals yet. Add a meal with that category.`;
    mealDetails.replaceChildren();
    youtubeSearch.hidden = true;
    return;
  }

  const previousMeal = lastPickedMealByCategory[category];
  const choices = categoryMeals.length > 1
    ? categoryMeals.filter((meal) => meal.name !== previousMeal)
    : categoryMeals;
  const pickedMeal = choices[Math.floor(Math.random() * choices.length)];
  lastPickedMealByCategory[category] = pickedMeal.name;
  mealResult.textContent = pickedMeal.name;
  renderMealDetails(pickedMeal, category);
  const searchQuery = encodeURIComponent(`${pickedMeal.name} recipe`);
  youtubeSearch.href = `https://www.youtube.com/results?search_query=${searchQuery}`;
  youtubeSearch.hidden = false;
}

categoryPickButtons.forEach((button) => {
  button.addEventListener("click", () => pickMeal(button.dataset.category));
});

window.addEventListener("storage", (event) => {
  if (event.key === MealStore.storageKey) {
    meals = MealStore.readMeals(storageMessage);
    renderPickerButtons();
  }
});

renderPickerButtons();

const currentHour = new Date().getHours();
const currentCategory = currentHour < 11
  ? "breakfast"
  : currentHour < 16 ? "lunch" : "dinner";
pickMeal(currentCategory);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.error("Unable to register the service worker.", error);
    });
  });
}
