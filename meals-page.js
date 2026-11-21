const categories = MealStore.categories;
const mealList = document.querySelector("#meal-list");
const mealCount = document.querySelector("#meal-count");
const storageMessage = document.querySelector("#storage-message");
const mealSuggestions = document.querySelector("#saved-meal-suggestions");
const addMealForm = document.querySelector("#add-meal-form");
const newMealInput = document.querySelector("#new-meal");
const newMealCategoryInputs = [...document.querySelectorAll('input[name="new-meal-category"]')];
const resetButton = document.querySelector("#reset-meals");

let meals = MealStore.readMeals(storageMessage);

function renderMeals() {
  mealList.replaceChildren();
  mealSuggestions.replaceChildren();
  mealCount.textContent = `${meals.length} ${meals.length === 1 ? "meal" : "meals"} saved`;

  meals.forEach((meal, index) => {
    const suggestion = document.createElement("option");
    suggestion.value = meal.name;
    mealSuggestions.append(suggestion);

    const item = document.createElement("li");
    item.className = "list-group-item d-flex flex-column align-items-stretch gap-2";

    const name = document.createElement("span");
    name.className = "text-break";
    name.textContent = meal.name;

    const categoryGroup = document.createElement("fieldset");
    categoryGroup.className = "d-flex flex-wrap gap-2 border-0 p-0 m-0";
    categoryGroup.setAttribute("aria-label", `Categories for ${meal.name}`);
    categories.forEach((category) => {
      const id = `meal-${index}-${category}`;
      const wrapper = document.createElement("div");
      wrapper.className = "form-check form-check-inline m-0";

      const checkbox = document.createElement("input");
      checkbox.className = "form-check-input";
      checkbox.type = "checkbox";
      checkbox.id = id;
      checkbox.value = category;
      checkbox.checked = meal.categories.includes(category);

      const label = document.createElement("label");
      label.className = "form-check-label small";
      label.htmlFor = id;
      label.textContent = category.charAt(0).toUpperCase() + category.slice(1);

      checkbox.addEventListener("change", () => {
        const updatedCategories = categories.filter((mealCategory) =>
          categoryGroup.querySelector(`#meal-${index}-${mealCategory}`).checked
        );
        if (updatedCategories.length === 0) {
          checkbox.checked = true;
          storageMessage.textContent = "Each meal must have at least one category.";
          return;
        }

        meals[index].categories = updatedCategories;
        MealStore.saveMeals(meals, storageMessage);
      });

      wrapper.append(checkbox, label);
      categoryGroup.append(wrapper);
    });

    const mealActions = document.createElement("div");
    mealActions.className = "d-flex flex-wrap align-items-center justify-content-between gap-2";

    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-outline-secondary btn-sm flex-shrink-0";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${meal.name}`);
    removeButton.addEventListener("click", () => {
      meals.splice(index, 1);
      MealStore.saveMeals(meals, storageMessage);
      renderMeals();
    });

    mealActions.append(categoryGroup, removeButton);
    item.append(name, mealActions);
    mealList.append(item);
  });

  resetButton.disabled = meals.length === MealStore.starterMeals.length &&
    MealStore.starterMeals.every((starterMeal) => {
      const meal = meals.find((savedMeal) => savedMeal.name === starterMeal.name);
      return meal &&
        starterMeal.categories.length === meal.categories.length &&
        starterMeal.categories.every((category) => meal.categories.includes(category));
    });
}

addMealForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newMealInput.value.trim();
  const selectedCategories = newMealCategoryInputs
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  if (!name) {
    newMealInput.focus();
    return;
  }

  if (selectedCategories.length === 0) {
    storageMessage.textContent = "Choose at least one category for your meal.";
    newMealCategoryInputs[0].focus();
    return;
  }

  if (meals.some((meal) => meal.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    storageMessage.textContent = `"${name}" is already on your list. Choose a suggestion or enter a different meal.`;
    newMealInput.focus();
    return;
  }

  meals.push({ name, categories: selectedCategories });
  MealStore.saveMeals(meals, storageMessage);
  renderMeals();
  newMealInput.value = "";
  newMealCategoryInputs.forEach((checkbox) => {
    checkbox.checked = checkbox.value === "dinner";
  });
  newMealInput.focus();
});

resetButton.addEventListener("click", () => {
  meals = MealStore.copyStarterMeals();
  MealStore.saveMeals(meals, storageMessage);
  renderMeals();
});

window.addEventListener("storage", (event) => {
  if (event.key === MealStore.storageKey) {
    meals = MealStore.readMeals(storageMessage);
    renderMeals();
  }
});

renderMeals();

if (!storageMessage.textContent) {
  storageMessage.textContent = "Your meals are saved on this device.";
}
