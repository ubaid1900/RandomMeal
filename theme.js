(() => {
  const preferenceKey = "random-meal-picker-theme";
  const preferences = ["system", "light", "dark"];
  const colorScheme = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  let preference = "system";
  let storageError = false;

  try {
    const savedPreference = localStorage.getItem(preferenceKey);
    if (preferences.includes(savedPreference)) {
      preference = savedPreference;
    }
  } catch (error) {
    storageError = true;
    console.error("Unable to load the saved theme preference.", error);
  }

  function applyTheme() {
    const theme = preference === "system"
      ? colorScheme && colorScheme.matches ? "dark" : "light"
      : preference;
    document.documentElement.dataset.bsTheme = theme;
    document.documentElement.style.colorScheme = theme;
  }

  function showStorageMessage(message) {
    const storageMessage = document.querySelector("#storage-message");
    if (storageMessage) {
      storageMessage.textContent = message;
    }
  }

  applyTheme();

  document.addEventListener("DOMContentLoaded", () => {
    const selector = document.querySelector("#theme-selector");
    if (selector) {
      selector.value = preference;
      selector.addEventListener("change", () => {
        preference = selector.value;
        applyTheme();
        try {
          localStorage.setItem(preferenceKey, preference);
        } catch (error) {
          console.error("Unable to save the theme preference.", error);
          showStorageMessage("Your theme changed, but the preference could not be saved in this browser.");
        }
      });
    }

    if (colorScheme) {
      if (colorScheme.addEventListener) {
        colorScheme.addEventListener("change", () => {
          if (preference === "system") {
            applyTheme();
          }
        });
      } else if (colorScheme.addListener) {
        colorScheme.addListener(() => {
          if (preference === "system") {
            applyTheme();
          }
        });
      }
    }

    if (storageError) {
      showStorageMessage("The saved theme preference could not be loaded. System theme is being used.");
    }
  });
})();
