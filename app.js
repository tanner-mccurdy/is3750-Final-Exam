'use strict';

/* ===================================================
   PANTRY RECIPE APP - JAVASCRIPT
   Beginner-friendly implementation with detailed comments
   =================================================== */

/* ===================================================
   CONSTANTS
   =================================================== */

// View names for navigation
const VIEWS = {
  HOME: 'home',
  INGREDIENTS: 'ingredients',
  RECIPES: 'recipes',
};

// localStorage key constants
const STORAGE_KEYS = {
  INGREDIENTS: 'pantry_ingredients',
  RECIPES: 'pantry_recipes',
};

// Common ingredient types
const INGREDIENT_TYPES = {
  DISCRETE: 'discrete',      // counted items (e.g., "2 apples")
  MEASURED: 'measured',      // volume/weight (e.g., "1.5 cups")
};

// Common units for measured ingredients
const MEASURED_UNITS = {
  TSP: 'tsp',       // teaspoon
  TBSP: 'tbsp',     // tablespoon
  CUP: 'cup',
  ML: 'ml',
  G: 'g',           // grams
  OZ: 'oz',         // ounces
};

// Discrete unit (fixed unit for discrete items)
const DISCRETE_UNIT = 'unit';

/* ===================================================
   APP STATE
   Stores the current view and other app-level data
   =================================================== */

const appState = {
  // Which view is currently shown
  currentView: VIEWS.HOME,
};

/* ===================================================
   HELPER: Safe text sanitization
   Prevents XSS by never using innerHTML directly
   =================================================== */

// Take any value and safely convert it to plain text
function safeText(value) {
  return String(value || '').trim();
}

// Take any value and safely convert it to a number
function safeNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Check if a value is a non-empty string
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/* ===================================================
   VALIDATION: Ingredient-specific validators
   These ensure data integrity before it's saved or used
   =================================================== */

// Check if a URL is valid (for recipe images)
// Returns true only for valid http(s) URLs
function isValidUrl(url) {
  if (!isNonEmptyString(url)) return false;
  try {
    // Try to parse as URL - will throw if invalid
    const parsed = new URL(url);
    // Only allow http and https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Check if a value is a valid ingredient type
// Valid types are 'discrete' or 'measured'
function isValidIngredientType(value) {
  return value === INGREDIENT_TYPES.DISCRETE || value === INGREDIENT_TYPES.MEASURED;
}

// Check if a value is a valid measured unit
// Valid units: tsp, tbsp, cup, ml, g, oz
function isValidMeasuredUnit(value) {
  const validUnits = Object.values(MEASURED_UNITS);
  return validUnits.includes(value);
}

// Check if a value is a valid recipe unit
// Recipe units include all measured units plus 'unit' for discrete items
function isValidRecipeUnit(value) {
  return isValidMeasuredUnit(value) || value === DISCRETE_UNIT;
}

/* ===================================================
   STORAGE: Load and save ingredients to localStorage
   
   Storage Format (in localStorage):
   Key: 'pantry_ingredients'
   Value: JSON string of array of ingredient objects
   
   Each ingredient object shape:
   {
     id: string (UUID),
     name: string,
     type: 'discrete' or 'measured',
     canonicalQuantity: number,
     canonicalUnit: 'unit' or one of MEASURED_UNITS
   }
   
   Defensive approach:
   - Validate everything loaded from localStorage
   - Ignore broken entries
   - Fall back to empty array if parsing fails
   =================================================== */

// Load ingredients from localStorage
// If nothing is stored or data is broken, return empty array
function loadIngredients() {
  try {
    // Get the JSON string from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);

    // If nothing was stored, return empty array
    if (!stored) return [];

    // Parse the JSON
    const parsed = JSON.parse(stored);

    // Make sure it's an array
    if (!Array.isArray(parsed)) return [];

    // Validate each ingredient and filter out broken ones
    const validated = parsed.filter(ingredient => {
      // Check that all required fields exist
      if (!ingredient || typeof ingredient !== 'object') return false;
      if (!isNonEmptyString(ingredient.id)) return false;
      if (!isNonEmptyString(ingredient.name)) return false;
      if (!isValidIngredientType(ingredient.type)) return false;
      if (typeof ingredient.canonicalQuantity !== 'number' || ingredient.canonicalQuantity <= 0) return false;

      // Check unit based on type
      if (ingredient.type === INGREDIENT_TYPES.DISCRETE) {
        if (ingredient.canonicalUnit !== DISCRETE_UNIT) return false;
      } else {
        if (!isValidMeasuredUnit(ingredient.canonicalUnit)) return false;
      }

      return true;
    });

    return validated;
  } catch (error) {
    // If anything goes wrong, log it and return empty array
    console.error('Error loading ingredients from localStorage:', error);
    return [];
  }
}

// Save ingredients to localStorage
// Takes an array of ingredient objects and stores as JSON
function saveIngredients(ingredients) {
  try {
    // Validate that we're saving an array
    if (!Array.isArray(ingredients)) {
      console.error('saveIngredients: Expected array but got', typeof ingredients);
      return false;
    }

    // Convert to JSON and store
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    return true;
  } catch (error) {
    console.error('Error saving ingredients to localStorage:', error);
    return false;
  }
}

/* ===================================================
   STORAGE: Load and save recipes to localStorage
   
   Storage Format (in localStorage):
   Key: 'pantry_recipes'
   Value: JSON string of array of recipe objects
   
   Each recipe object shape:
   {
     id: string (UUID),
     name: string,
     instructions: string,
     imageUrl: string (can be empty),
     ingredients: [
       {
         ingredientId: string (reference to ingredient),
         quantity: number,
         unit: string (one of MEASURED_UNITS or DISCRETE_UNIT)
       }
     ]
   }
   
   Defensive approach:
   - Validate everything loaded from localStorage
   - Ignore broken entries
   - Fall back to empty array if parsing fails
   =================================================== */

// Load recipes from localStorage
// If nothing is stored or data is broken, return empty array
function loadRecipes() {
  try {
    // Get the JSON string from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPES);

    // If nothing was stored, return empty array
    if (!stored) return [];

    // Parse the JSON
    const parsed = JSON.parse(stored);

    // Make sure it's an array
    if (!Array.isArray(parsed)) return [];

    // Validate each recipe and filter out broken ones
    const validated = parsed.filter(recipe => {
      // Check that all required fields exist
      if (!recipe || typeof recipe !== 'object') return false;
      if (!isNonEmptyString(recipe.id)) return false;
      if (!isNonEmptyString(recipe.name)) return false;
      if (!isNonEmptyString(recipe.instructions)) return false;

      // imageUrl can be empty, but if present must be valid
      if (recipe.imageUrl && !isValidUrl(recipe.imageUrl)) return false;

      // ingredients must be an array
      if (!Array.isArray(recipe.ingredients)) return false;

      // Validate each ingredient entry in the recipe
      const validIngredients = recipe.ingredients.every(ing => {
        if (!ing || typeof ing !== 'object') return false;
        if (!isNonEmptyString(ing.ingredientId)) return false;
        if (typeof ing.quantity !== 'number' || ing.quantity <= 0) return false;
        if (!isValidRecipeUnit(ing.unit)) return false;
        return true;
      });

      return validIngredients;
    });

    return validated;
  } catch (error) {
    // If anything goes wrong, log it and return empty array
    console.error('Error loading recipes from localStorage:', error);
    return [];
  }
}

// Save recipes to localStorage
// Takes an array of recipe objects and stores as JSON
function saveRecipes(recipes) {
  try {
    // Validate that we're saving an array
    if (!Array.isArray(recipes)) {
      console.error('saveRecipes: Expected array but got', typeof recipes);
      return false;
    }

    // Convert to JSON and store
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    return true;
  } catch (error) {
    console.error('Error saving recipes to localStorage:', error);
    return false;
  }
}

/* ===================================================
   HELPER: Clear the main container and return ref
   Used by every render function to start fresh
   =================================================== */

// Get the main app container and clear all old content
// This ensures each view renders cleanly without old elements
function getCleanContainer() {
  const appContainer = document.getElementById('appContainer');
  appContainer.innerHTML = '';
  return appContainer;
}

/* ===================================================
   HELPER: Create a page heading
   Simple helper for consistent heading styling
   =================================================== */

// Create and return a styled h2 heading element
function createPageHeading(text) {
  const heading = document.createElement('h2');
  heading.textContent = text;
  heading.className = 'page-heading';
  return heading;
}

/* ===================================================
   RENDERING: renderHome()
   Shows the home page with welcome message
   This is the landing view for the SPA
   =================================================== */

// Display the home page with welcome content
function renderHome() {
  const container = getCleanContainer();

  // Add page heading
  const heading = createPageHeading('Welcome to Pantry Recipe App');
  container.appendChild(heading);

  // Create welcome message
  const message = document.createElement('p');
  message.textContent = 'Manage your pantry ingredients and cook recipes with what you have.';
  message.style.fontSize = '1.125rem';
  message.style.color = 'var(--text-secondary)';
  message.style.marginBottom = '2rem';
  container.appendChild(message);

  // Create features list
  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.fontSize = '1rem';
  list.style.lineHeight = '1.8';

  const features = [
    '📦 Track ingredients in your pantry',
    '🍖 Add and cook recipes',
    '🔄 Convert between units',
    '💾 All data saved locally',
  ];

  // Build each feature item safely
  features.forEach(feature => {
    const item = document.createElement('li');
    item.textContent = feature;
    item.style.marginBottom = '0.5rem';
    list.appendChild(item);
  });

  container.appendChild(list);
}

/* ===================================================
   RENDERING: renderIngredientsView()
   Shows the ingredients page
   Displays ingredient list, filter, and add button
   (Full implementation comes in Phase 4)
   =================================================== */

// Display the ingredients page
function renderIngredientsView() {
  const container = getCleanContainer();

  // Add page heading
  const heading = createPageHeading('Ingredients');
  container.appendChild(heading);

  // Placeholder message
  const message = document.createElement('p');
  message.textContent = 'Ingredients view coming in Phase 4...';
  message.style.color = 'var(--text-secondary)';
  container.appendChild(message);

  // Show a note about what will be in this view
  const note = document.createElement('p');
  note.textContent = 'Soon you\'ll be able to add ingredients, track quantities, and manage your pantry.';
  note.style.fontSize = '0.95rem';
  note.style.color = 'var(--text-secondary)';
  note.style.marginTop = '1rem';
  container.appendChild(note);
}

/* ===================================================
   RENDERING: renderRecipesView()
   Shows the recipes page
   Displays recipe list with search and add button
   (Full implementation comes in Phase 8)
   =================================================== */

// Display the recipes page
function renderRecipesView() {
  const container = getCleanContainer();

  // Add page heading
  const heading = createPageHeading('Recipes');
  container.appendChild(heading);

  // Placeholder message
  const message = document.createElement('p');
  message.textContent = 'Recipes view coming in Phase 8...';
  message.style.color = 'var(--text-secondary)';
  container.appendChild(message);

  // Show a note about what will be in this view
  const note = document.createElement('p');
  note.textContent = 'Soon you\'ll be able to create recipes, check ingredient availability, and cook meals.';
  note.style.fontSize = '0.95rem';
  note.style.color = 'var(--text-secondary)';
  note.style.marginTop = '1rem';
  container.appendChild(note);
}

/* ===================================================
   RENDERING: renderApp()
   
   MAIN RENDER FUNCTION - The heart of the SPA
   
   This function:
   1. Routes to the correct render function based on appState.currentView
   2. Updates the DOM with the new view content
   3. Updates the navigation buttons to show which view is active
   
   This is called whenever we need to refresh the UI.
   Each view render function should use getCleanContainer() to clear
   the old content before building the new view.
   =================================================== */

// Display the correct view based on appState.currentView
// This is the main routing logic for the single-page app
function renderApp() {
  // Route to the correct view renderer
  // The views are self-contained functions that build their own DOM
  if (appState.currentView === VIEWS.HOME) {
    renderHome();
  } else if (appState.currentView === VIEWS.INGREDIENTS) {
    renderIngredientsView();
  } else if (appState.currentView === VIEWS.RECIPES) {
    renderRecipesView();
  } else {
    // Fallback to home if view is invalid
    appState.currentView = VIEWS.HOME;
    renderHome();
  }

  // Update nav button styling to show which view is active
  updateActiveNavButton();
}

/* ===================================================
   HELPER: updateActiveNavButton()
   Updates nav button styling to indicate active view
   =================================================== */

// Remove active styling from all nav buttons, then add it to the current one
function updateActiveNavButton() {
  // Get all nav buttons
  const navButtons = document.querySelectorAll('.nav-btn');

  // Remove active class from all buttons
  navButtons.forEach(btn => btn.classList.remove('nav-btn--active'));

  // Add active class to the button matching current view
  const activeButton = document.querySelector(`[data-view="${appState.currentView}"]`);
  if (activeButton) {
    activeButton.classList.add('nav-btn--active');
  }
}

/* ===================================================
   EVENT HANDLERS: Navigation
   
   SPA Navigation Flow:
   1. User clicks a nav button
   2. We extract the view name from the button's data attribute
   3. We update appState.currentView
   4. We call renderApp() which:
      - Routes to the correct render function
      - Clears the container and builds new DOM
      - Updates the active nav button styling
   
   This pattern allows smooth view switching without page reloads.
   =================================================== */

// Set up navigation listeners - runs once on page load
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the view name from the button's data attribute
      // e.g., 'home', 'ingredients', 'recipes'
      const viewName = button.getAttribute('data-view');

      // Update app state to remember which view is current
      // This persists during the app's lifetime (doesn't survive page refresh)
      appState.currentView = viewName;

      // Call renderApp() to re-render the page with the new view
      // This is the single place where the DOM is updated for view changes
      renderApp();
    });
  });
}

/* ===================================================
   INIT: Initialize the app
   Runs once when the page loads
   =================================================== */

// Main initialization function - called when DOM is ready
function init() {
  console.log('Pantry Recipe App initialized');

  // Set up all event listeners
  setupNavigation();

  // Render the initial home view
  renderApp();
}

/* ===================================================
   START: When DOM is ready, initialize the app
   =================================================== */

// Wait for the DOM to fully load, then start the app
if (document.readyState === 'loading') {
  // If document is still loading
  document.addEventListener('DOMContentLoaded', init);
} else {
  // If document is already loaded (rare but safe)
  init();
}
