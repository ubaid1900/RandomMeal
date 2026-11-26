const categories = MealStore.categories;
const mealList = document.querySelector("#meal-list");
const mealCount = document.querySelector("#meal-count");
const storageMessage = document.querySelector("#storage-message");
const mealSuggestions = document.querySelector("#saved-meal-suggestions");
const addMealForm = document.querySelector("#add-meal-form");
const newMealInput = document.querySelector("#new-meal");
const newMealCategoryInputs = [...document.querySelectorAll('input[name="new-meal-category"]')];
const resetButton = document.querySelector("#reset-meals");
const aiPrompt = document.querySelector("#ai-prompt");
const copyPromptButton = document.querySelector("#copy-prompt");
const aiMealsJson = document.querySelector("#ai-meals-json");
const pasteAiResponseButton = document.querySelector("#paste-ai-response");
const importAiMealsButton = document.querySelector("#import-ai-meals");
const aiImportMessage = document.querySelector("#ai-import-message");

let meals = MealStore.readMeals(storageMessage);

function parseImportedMeals(response) {
  const trimmedResponse = response.trim();
  const fencedResponse = trimmedResponse.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const parsed = JSON.parse(fencedResponse ? fencedResponse[1] : trimmedResponse);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The response must be a JSON object with meal category arrays.");
  }

  const mealByName = new Map();
  const validCategories = categories.filter((category) => Array.isArray(parsed[category]));
  if (validCategories.length === 0) {
    throw new Error('Include at least one category array: "breakfast", "lunch", or "dinner".');
  }

  validCategories.forEach((category) => {
    parsed[category].forEach((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item) ||
        typeof item.name !== "string" || !item.name.trim()) {
        return;
      }

      const name = item.name.trim();
      const key = name.toLocaleLowerCase();
      const importedMeal = mealByName.get(key) || { name, categories: [] };
      if (!importedMeal.categories.includes(category)) {
        importedMeal.categories.push(category);
      }
      if (typeof item.prepTime === "number" && Number.isFinite(item.prepTime) && item.prepTime >= 0) {
        importedMeal.prepTime = item.prepTime;
      }
      if (Array.isArray(item.tags)) {
        importedMeal.tags = [...new Set([
          ...(importedMeal.tags || []),
          ...item.tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim()),
        ])];
      }
      if (typeof item.quickNote === "string" && item.quickNote.trim()) {
        importedMeal.quickNote = item.quickNote.trim();
      }
      if (Array.isArray(item.keyIngredients)) {
        importedMeal.keyIngredients = [...new Set([
          ...(importedMeal.keyIngredients || []),
          ...item.keyIngredients
            .filter((ingredient) => typeof ingredient === "string" && ingredient.trim())
            .map((ingredient) => ingredient.trim()),
        ])];
      }
      mealByName.set(key, importedMeal);
    });
  });

  const importedMeals = [...mealByName.values()];
  if (importedMeals.length === 0) {
    throw new Error("No valid meals were found. Each meal needs a non-empty name.");
  }
  return importedMeals;
}

function mergeMeals(existingMeals, importedMeals) {
  const mergedMeals = [];
  const mealByName = new Map();
  [...existingMeals, ...importedMeals].forEach((meal) => {
    const key = meal.name.trim().toLocaleLowerCase();
    const existingMeal = mealByName.get(key);
    if (!existingMeal) {
      const copiedMeal = { ...meal, categories: [...meal.categories] };
      mealByName.set(key, copiedMeal);
      mergedMeals.push(copiedMeal);
      return;
    }

    existingMeal.categories = [...new Set([...existingMeal.categories, ...meal.categories])];
    ["tags", "keyIngredients"].forEach((property) => {
      if (Array.isArray(meal[property])) {
        existingMeal[property] = [...new Set([
          ...(Array.isArray(existingMeal[property]) ? existingMeal[property] : []),
          ...meal[property],
        ])];
      }
    });
    ["prepTime", "quickNote"].forEach((property) => {
      if (existingMeal[property] === undefined && meal[property] !== undefined) {
        existingMeal[property] = meal[property];
      }
    });
  });
  return mergedMeals;
}

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

copyPromptButton.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard access is unavailable.");
    }
    await navigator.clipboard.writeText(aiPrompt.value);
    aiImportMessage.textContent = "Prompt copied. Paste it into your AI assistant.";
  } catch (error) {
    aiPrompt.focus();
    aiPrompt.select();
    aiImportMessage.textContent = "Could not access the clipboard. The prompt is selected; copy it manually.";
    console.error("Unable to copy the AI meal prompt.", error);
  }
});

pasteAiResponseButton.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error("Clipboard access is unavailable.");
    }
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) {
      aiImportMessage.textContent = "The clipboard is empty. Copy the AI response, then try again.";
      return;
    }
    aiMealsJson.value = clipboardText;
    aiImportMessage.textContent = "AI response pasted from the clipboard.";
    aiMealsJson.focus();
  } catch (error) {
    aiMealsJson.focus();
    aiImportMessage.textContent = "Clipboard access was denied or unavailable. Paste the AI response here manually.";
    console.error("Unable to read the AI response from the clipboard.", error);
  }
});

importAiMealsButton.addEventListener("click", () => {
  aiImportMessage.textContent = "";
  let importedMeals;
  try {
    importedMeals = parseImportedMeals(aiMealsJson.value);
  } catch (error) {
    aiImportMessage.textContent = error instanceof SyntaxError
      ? "Invalid JSON. Check the AI response and try again."
      : error.message;
    return;
  }

  const importMode = document.querySelector('input[name="ai-import-mode"]:checked').value;
  const updatedMeals = importMode === "replace"
    ? importedMeals
    : mergeMeals(meals, importedMeals);
  if (!MealStore.saveMeals(updatedMeals, storageMessage)) {
    aiImportMessage.textContent = "Meals could not be saved. Check your browser storage settings and try again.";
    return;
  }

  meals = updatedMeals;
  renderMeals();
  aiImportMessage.textContent = `${importedMeals.length} ${importedMeals.length === 1 ? "meal" : "meals"} imported successfully.`;
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
