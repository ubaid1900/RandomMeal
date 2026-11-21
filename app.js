const categoryPickButtons = [...document.querySelectorAll("#category-pickers [data-category]")];
const mealResult = document.querySelector("#meal-result");
const storageMessage = document.querySelector("#storage-message");
const lastPickedMealByCategory = {};

let meals = MealStore.readMeals(storageMessage);

function renderPickerButtons() {
  categoryPickButtons.forEach((button) => {
    button.disabled = !meals.some((meal) => meal.categories.includes(button.dataset.category));
  });
}

function pickMeal(category) {
  const categoryMeals = meals.filter((meal) => meal.categories.includes(category));
  if (categoryMeals.length === 0) {
    mealResult.textContent = `No ${category} meals yet. Add a meal with that category.`;
    return;
  }

  const previousMeal = lastPickedMealByCategory[category];
  const choices = categoryMeals.length > 1
    ? categoryMeals.filter((meal) => meal.name !== previousMeal)
    : categoryMeals;
  const pickedMeal = choices[Math.floor(Math.random() * choices.length)];
  lastPickedMealByCategory[category] = pickedMeal.name;
  mealResult.textContent = `${pickedMeal.name} (${category})`;
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

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.error("Unable to register the service worker.", error);
    });
  });
}
