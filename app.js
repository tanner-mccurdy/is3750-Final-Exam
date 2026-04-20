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
  if (appState.viewingRecipeId !== null) {
    renderRecipeDetail();
    return;
  }

  renderIngredientsViewImpl();
}

// Implementation of ingredients view
function renderIngredientsViewImpl() {
  const container = getCleanContainer();

  const heading = createPageHeading('Ingredients');
  container.appendChild(heading);

  // Add button for adding ingredient
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary';
  addBtn.textContent = '+ Add Ingredient';
  addBtn.addEventListener('click', () => {
    appState.view = 'ingredient-form';
    appState.editingIngredientId = null;
    renderIngredientsViewImpl();
  });
  container.appendChild(addBtn);

  // Check if we're showing the form
  if (appState.view === 'ingredient-form' || appState.view === 'ingredient-edit') {
    renderIngredientForm(container);
    return;
  }

  // Create filter input
  const filterDiv = document.createElement('div');
  filterDiv.style.marginTop = '1.5rem';
  filterDiv.style.marginBottom = '1rem';

  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.className = 'form-input';
  filterInput.placeholder = 'Search ingredients...';
  appState.ingredientFilter = appState.ingredientFilter || '';

  filterInput.addEventListener('input', (e) => {
    appState.ingredientFilter = safeText(e.target.value).toLowerCase();
    renderIngredientsViewImpl();
  });

  filterInput.value = appState.ingredientFilter;
  filterDiv.appendChild(filterInput);
  container.appendChild(filterDiv);

  // Load and filter ingredients
  const ingredients = getIngredients();
  const filtered = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(appState.ingredientFilter)
  );

  // Sort by quantity (ascending - low stock first)
  filtered.sort((a, b) => a.canonicalQuantity - b.canonicalQuantity);

  // Show empty state
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = appState.ingredientFilter
      ? 'No ingredients match your search'
      : 'No ingredients added yet. Start by adding one!';
    empty.style.color = 'var(--text-secondary)';
    empty.style.marginTop = '2rem';
    container.appendChild(empty);
    return;
  }

  // Render ingredient list
  const list = document.createElement('div');
  list.style.marginTop = '1rem';

  filtered.forEach(ing => {
    const card = document.createElement('div');
    card.className = 'card';

    // Determine if low stock
    const isLowStock = (ing.type === INGREDIENT_TYPES.DISCRETE && ing.canonicalQuantity < 3) ||
                       (ing.type === INGREDIENT_TYPES.MEASURED && ing.canonicalQuantity < 1);

    if (isLowStock) {
      card.style.borderLeftWidth = '4px';
      card.style.borderLeftColor = 'var(--accent-primary)';
    }

    // Ingredient info
    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.justifyContent = 'space-between';
    info.style.alignItems = 'center';

    const details = document.createElement('div');
    const nameEl = document.createElement('h3');
    nameEl.textContent = ing.name;
    nameEl.style.fontSize = '1.1rem';
    nameEl.style.marginBottom = '0.25rem';
    if (isLowStock) nameEl.style.color = 'var(--accent-primary)';
    details.appendChild(nameEl);

    const quantityEl = document.createElement('p');
    const qty = formatQuantity(ing.canonicalQuantity);
    quantityEl.textContent = `${qty} ${ing.canonicalUnit}`;
    quantityEl.style.fontSize = '0.95rem';
    quantityEl.style.color = 'var(--text-secondary)';
    if (isLowStock) quantityEl.style.color = 'var(--accent-primary)';
    details.appendChild(quantityEl);

    info.appendChild(details);

    // Action buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '0.5rem';

    const topUpBtn = document.createElement('button');
    topUpBtn.className = 'btn btn--small';
    topUpBtn.textContent = 'Top Up';
    topUpBtn.addEventListener('click', () => {
      appState.view = 'ingredient-form';
      appState.editingIngredientId = ing.id;
      renderIngredientsViewImpl();
    });
    actions.appendChild(topUpBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      appState.view = 'ingredient-edit';
      appState.editingIngredientId = ing.id;
      renderIngredientsViewImpl();
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--small btn--danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete "${ing.name}"?`)) {
        deleteIngredient(ing.id);
      }
    });
    actions.appendChild(delBtn);

    info.appendChild(actions);
    card.appendChild(info);
    list.appendChild(card);
  });

  container.appendChild(list);
}

/* ===================================================
   RENDERING: renderRecipesView()
   Shows the recipes page
   Displays recipe list with search and add button
   (Full implementation comes in Phase 8)
   =================================================== */

// Display the recipes page
function renderRecipesView() {
  if (appState.viewingRecipeId !== null) {
    renderRecipeDetail();
    return;
  }

  renderRecipesViewImpl();
}

// Implementation of recipes view
function renderRecipesViewImpl() {
  const container = getCleanContainer();

  const heading = createPageHeading('Recipes');
  container.appendChild(heading);

  // Add button for new recipe
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary';
  addBtn.textContent = '+ Add Recipe';
  addBtn.addEventListener('click', () => {
    appState.view = 'recipe-form';
    appState.editingRecipeId = null;
    renderRecipesViewImpl();
  });
  container.appendChild(addBtn);

  // Show form if needed
  if (appState.view === 'recipe-form') {
    renderRecipeForm(container);
    return;
  }

  // Get recipes
  const recipes = getRecipes();

  // Show empty state
  if (recipes.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No recipes added yet. Create one to get started!';
    empty.style.color = 'var(--text-secondary)';
    empty.style.marginTop = '2rem';
    container.appendChild(empty);
    return;
  }

  // Render recipe cards
  const list = document.createElement('div');
  list.style.marginTop = '1rem';
  list.style.display = 'grid';
  list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  list.style.gap = '1.5rem';

  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';

    // Recipe image (if valid)
    if (recipe.imageUrl && isValidUrl(recipe.imageUrl)) {
      const img = document.createElement('img');
      img.src = recipe.imageUrl;
      img.alt = recipe.name;
      img.style.width = '100%';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.marginBottom = '1rem';
      img.onerror = () => img.remove(); // Remove if image fails to load
      card.appendChild(img);
    }

    // Recipe name
    const name = document.createElement('h3');
    name.textContent = recipe.name;
    name.style.fontSize = '1.25rem';
    name.style.marginBottom = '0.5rem';
    card.appendChild(name);

    // Ingredients count
    const ingCount = document.createElement('p');
    ingCount.textContent = `${recipe.ingredients.length} ingredient${recipe.ingredients.length !== 1 ? 's' : ''}`;
    ingCount.style.fontSize = '0.9rem';
    ingCount.style.color = 'var(--text-secondary)';
    ingCount.style.marginBottom = '1rem';
    card.appendChild(ingCount);

    // Action buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '0.5rem';
    actions.style.marginTop = 'auto';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn--small btn--primary';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
      appState.viewingRecipeId = recipe.id;
      appState.recipeScale = 1;
      renderRecipeDetail();
    });
    actions.appendChild(viewBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      appState.view = 'recipe-form';
      appState.editingRecipeId = recipe.id;
      renderRecipesViewImpl();
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--small btn--danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete "${recipe.name}"?`)) {
        deleteRecipe(recipe.id);
      }
    });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    list.appendChild(card);
  });

  container.appendChild(list);
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
   FLASH MESSAGE SYSTEM (Phase 12)
   Display temporary success/error messages to users
   =================================================== */

// Show a flash message at the top-right of screen
// Type can be 'success' or 'error'
// The message auto-dismisses after 4 seconds
function showFlash(message, type = 'success') {
  const container = document.getElementById('flashContainer');
  if (!container) return;

  // Create the flash message element
  const flash = document.createElement('div');
  flash.className = `flash-message flash-message--${type}`;
  flash.textContent = safeText(message);

  // Add to container
  container.appendChild(flash);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    flash.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => flash.remove(), 300);
  }, 4000);
}

/* ===================================================
   FORMATTING HELPERS (Phase 4)
   Convert numbers to readable formats
   =================================================== */

// Convert a decimal quantity to a fraction string for display
// E.g., 1.5 -> "1 1/2", 0.25 -> "1/4", 3 -> "3"
function formatQuantity(quantity) {
  quantity = safeNumber(quantity);
  if (quantity === 0) return '0';

  // Common fractions that are easy to read
  const fractionMap = {
    0.125: '1/8',
    0.25: '1/4',
    0.333: '1/3',
    0.5: '1/2',
    0.667: '2/3',
    0.75: '3/4',
  };

  // Break into whole and decimal parts
  const whole = Math.floor(quantity);
  const decimal = Math.round((quantity - whole) * 1000) / 1000;

  // Check if decimal part matches a common fraction
  let fractionPart = '';
  if (decimal > 0.01) {
    for (const [key, fraction] of Object.entries(fractionMap)) {
      if (Math.abs(parseFloat(key) - decimal) < 0.01) {
        fractionPart = fraction;
        break;
      }
    }
  }

  // Return formatted string
  if (whole > 0 && fractionPart) {
    return `${whole} ${fractionPart}`;
  } else if (fractionPart) {
    return fractionPart;
  } else if (decimal > 0) {
    return quantity.toFixed(2).replace(/\.?0+$/, '');
  }
  return String(whole);
}

/* ===================================================
   UNIT CONVERSION SYSTEM (Phase 7)
   Convert between volume/weight units
   =================================================== */

// Get the category of a unit (volume, weight, or discrete)
// Units in same category can be converted
function getUnitCategory(unit) {
  const volumeUnits = [MEASURED_UNITS.TSP, MEASURED_UNITS.TBSP, MEASURED_UNITS.CUP, MEASURED_UNITS.ML];
  const weightUnits = [MEASURED_UNITS.G, MEASURED_UNITS.OZ];

  if (volumeUnits.includes(unit)) return 'volume';
  if (weightUnits.includes(unit)) return 'weight';
  if (unit === DISCRETE_UNIT) return 'discrete';
  return null;
}

// Convert a quantity from one unit to another
// Returns the converted quantity, or null if conversion is impossible
function convertUnit(value, fromUnit, toUnit) {
  value = safeNumber(value);
  if (value <= 0) return null;
  if (fromUnit === toUnit) return value;

  // Get categories - if different, can't convert
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);
  if (fromCategory !== toCategory || !fromCategory) return null;

  // Conversion factors to base unit (ml for volume, g for weight)
  const volumeConversions = {
    [MEASURED_UNITS.TSP]: 4.93,
    [MEASURED_UNITS.TBSP]: 14.79,
    [MEASURED_UNITS.CUP]: 236.59,
    [MEASURED_UNITS.ML]: 1,
  };

  const weightConversions = {
    [MEASURED_UNITS.G]: 1,
    [MEASURED_UNITS.OZ]: 28.35,
  };

  let conversions = fromCategory === 'volume' ? volumeConversions : weightConversions;

  // Convert to base unit, then to target unit
  const baseValue = value * conversions[fromUnit];
  const result = baseValue / conversions[toUnit];

  return Math.round(result * 100) / 100;
}

/* ===================================================
   INGREDIENT MANAGEMENT (Phase 4-6)
   Create, display, edit, delete ingredients
   =================================================== */

// Get all ingredients from storage
function getIngredients() {
  return loadIngredients();
}

// Get a single ingredient by ID
function getIngredientById(id) {
  const ingredients = getIngredients();
  return ingredients.find(ing => ing.id === id);
}

// Create a new ingredient and save
function createIngredient(name, type, canonicalQuantity, canonicalUnit) {
  // Validate inputs
  if (!isNonEmptyString(name) || !isValidIngredientType(type)) {
    showFlash('Invalid ingredient data', 'error');
    return null;
  }

  canonicalQuantity = safeNumber(canonicalQuantity);
  if (canonicalQuantity <= 0) {
    showFlash('Quantity must be greater than 0', 'error');
    return null;
  }

  // Check unit is valid for type
  if (type === INGREDIENT_TYPES.DISCRETE && canonicalUnit !== DISCRETE_UNIT) {
    showFlash('Discrete items must use "unit"', 'error');
    return null;
  }
  if (type === INGREDIENT_TYPES.MEASURED && !isValidMeasuredUnit(canonicalUnit)) {
    showFlash('Invalid unit for measured ingredient', 'error');
    return null;
  }

  // Create ingredient object
  const ingredient = {
    id: crypto.randomUUID(),
    name: safeText(name),
    type,
    canonicalQuantity,
    canonicalUnit,
  };

  // Save
  const ingredients = getIngredients();
  ingredients.push(ingredient);
  if (saveIngredients(ingredients)) {
    showFlash(`Added ${ingredient.name}!`, 'success');
    return ingredient;
  } else {
    showFlash('Failed to save ingredient', 'error');
    return null;
  }
}

// Top up (add to) an existing ingredient
function topUpIngredient(id, addQuantity, addUnit) {
  addQuantity = safeNumber(addQuantity);
  if (addQuantity <= 0) {
    showFlash('Top-up quantity must be greater than 0', 'error');
    return false;
  }

  const ingredient = getIngredientById(id);
  if (!ingredient) {
    showFlash('Ingredient not found', 'error');
    return false;
  }

  // Convert added quantity to canonical unit
  let convertedQuantity = addQuantity;
  if (addUnit !== ingredient.canonicalUnit) {
    convertedQuantity = convertUnit(addQuantity, addUnit, ingredient.canonicalUnit);
    if (convertedQuantity === null) {
      showFlash('Cannot convert between these units', 'error');
      return false;
    }
  }

  // Add to canonical quantity
  ingredient.canonicalQuantity += convertedQuantity;

  // Save and refresh
  const ingredients = getIngredients();
  const index = ingredients.findIndex(ing => ing.id === id);
  if (index >= 0) {
    ingredients[index] = ingredient;
    if (saveIngredients(ingredients)) {
      showFlash(`Topped up ${ingredient.name}!`, 'success');
      renderIngredientsView();
      return true;
    }
  }

  showFlash('Failed to save ingredient', 'error');
  return false;
}

// Update an existing ingredient
function updateIngredient(id, name, type, canonicalQuantity, canonicalUnit) {
  // Validate inputs
  if (!isNonEmptyString(name) || !isValidIngredientType(type)) {
    showFlash('Invalid ingredient data', 'error');
    return false;
  }

  canonicalQuantity = safeNumber(canonicalQuantity);
  if (canonicalQuantity <= 0) {
    showFlash('Quantity must be greater than 0', 'error');
    return false;
  }

  const ingredient = getIngredientById(id);
  if (!ingredient) {
    showFlash('Ingredient not found', 'error');
    return false;
  }

  // Update fields
  ingredient.name = safeText(name);
  ingredient.type = type;
  ingredient.canonicalQuantity = canonicalQuantity;
  ingredient.canonicalUnit = canonicalUnit;

  // Save and refresh
  const ingredients = getIngredients();
  const index = ingredients.findIndex(ing => ing.id === id);
  if (index >= 0) {
    ingredients[index] = ingredient;
    if (saveIngredients(ingredients)) {
      showFlash('Ingredient updated!', 'success');
      renderIngredientsView();
      return true;
    }
  }

  showFlash('Failed to save ingredient', 'error');
  return false;
}

// Delete an ingredient
function deleteIngredient(id) {
  const ingredient = getIngredientById(id);
  if (!ingredient) {
    showFlash('Ingredient not found', 'error');
    return false;
  }

  // Check if ingredient is used in any recipes
  const recipes = loadRecipes();
  const inUse = recipes.some(recipe =>
    recipe.ingredients.some(ing => ing.ingredientId === id)
  );

  if (inUse) {
    showFlash(`Cannot delete "${ingredient.name}" - it's used in recipes`, 'error');
    return false;
  }

  // Delete
  const ingredients = getIngredients().filter(ing => ing.id !== id);
  if (saveIngredients(ingredients)) {
    showFlash('Ingredient deleted!', 'success');
    renderIngredientsView();
    return true;
  }

  showFlash('Failed to delete ingredient', 'error');
  return false;
}

/* ===================================================
   RENDERING: Ingredients View (Phase 4-6)
   Display ingredient list, filter, and forms
   =================================================== */

// Render the full ingredients page
function renderIngredientsView() {
  const container = getCleanContainer();

  // Add page heading
  const heading = createPageHeading('Ingredients');
  container.appendChild(heading);

  // Add button for adding ingredient
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary';
  addBtn.textContent = '+ Add Ingredient';
  addBtn.addEventListener('click', () => {
    appState.view = 'ingredient-form';
    appState.editingIngredientId = null;
    renderIngredientsView();
  });
  container.appendChild(addBtn);

  // Check if we're showing the form
  if (appState.view === 'ingredient-form') {
    renderIngredientForm(container);
    return;
  }

  // Create filter input
  const filterDiv = document.createElement('div');
  filterDiv.style.marginTop = '1.5rem';
  filterDiv.style.marginBottom = '1rem';

  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.className = 'form-input';
  filterInput.placeholder = 'Search ingredients...';
  appState.ingredientFilter = appState.ingredientFilter || '';

  filterInput.addEventListener('input', (e) => {
    appState.ingredientFilter = safeText(e.target.value).toLowerCase();
    renderIngredientsView();
  });

  filterInput.value = appState.ingredientFilter;
  filterDiv.appendChild(filterInput);
  container.appendChild(filterDiv);

  // Load and filter ingredients
  const ingredients = getIngredients();
  const filtered = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(appState.ingredientFilter)
  );

  // Sort by quantity (ascending - low stock first)
  filtered.sort((a, b) => a.canonicalQuantity - b.canonicalQuantity);

  // Show empty state
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = appState.ingredientFilter
      ? 'No ingredients match your search'
      : 'No ingredients added yet. Start by adding one!';
    empty.style.color = 'var(--text-secondary)';
    empty.style.marginTop = '2rem';
    container.appendChild(empty);
    return;
  }

  // Render ingredient list
  const list = document.createElement('div');
  list.style.marginTop = '1rem';

  filtered.forEach(ing => {
    const card = document.createElement('div');
    card.className = 'card';

    // Determine if low stock
    const isLowStock = (ing.type === INGREDIENT_TYPES.DISCRETE && ing.canonicalQuantity < 3) ||
                       (ing.type === INGREDIENT_TYPES.MEASURED && ing.canonicalQuantity < 1);

    if (isLowStock) {
      card.style.borderLeftWidth = '4px';
      card.style.borderLeftColor = 'var(--accent-primary)';
    }

    // Ingredient info
    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.justifyContent = 'space-between';
    info.style.alignItems = 'center';

    const details = document.createElement('div');
    const nameEl = document.createElement('h3');
    nameEl.textContent = ing.name;
    nameEl.style.fontSize = '1.1rem';
    nameEl.style.marginBottom = '0.25rem';
    if (isLowStock) nameEl.style.color = 'var(--accent-primary)';
    details.appendChild(nameEl);

    const quantityEl = document.createElement('p');
    const qty = formatQuantity(ing.canonicalQuantity);
    quantityEl.textContent = `${qty} ${ing.canonicalUnit}`;
    quantityEl.style.fontSize = '0.95rem';
    quantityEl.style.color = 'var(--text-secondary)';
    if (isLowStock) quantityEl.style.color = 'var(--accent-primary)';
    details.appendChild(quantityEl);

    info.appendChild(details);

    // Action buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '0.5rem';

    const topUpBtn = document.createElement('button');
    topUpBtn.className = 'btn btn--small';
    topUpBtn.textContent = 'Top Up';
    topUpBtn.addEventListener('click', () => {
      appState.view = 'ingredient-form';
      appState.editingIngredientId = ing.id;
      renderIngredientsView();
    });
    actions.appendChild(topUpBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      appState.view = 'ingredient-edit';
      appState.editingIngredientId = ing.id;
      renderIngredientsView();
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--small btn--danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete "${ing.name}"?`)) {
        deleteIngredient(ing.id);
      }
    });
    actions.appendChild(delBtn);

    info.appendChild(actions);
    card.appendChild(info);
    list.appendChild(card);
  });

  container.appendChild(list);
}

// Render the ingredient form for adding/editing/topping up
function renderIngredientForm(container) {
  const isEditing = appState.editingIngredientId !== null;
  const ingredient = isEditing ? getIngredientById(appState.editingIngredientId) : null;
  const isTopUp = appState.view === 'ingredient-form' && isEditing;

  // Form title
  const title = document.createElement('h3');
  if (isTopUp) {
    title.textContent = `Top Up: ${ingredient.name}`;
  } else if (isEditing) {
    title.textContent = 'Edit Ingredient';
  } else {
    title.textContent = 'Add New Ingredient';
  }
  title.style.fontSize = '1.25rem';
  title.style.marginTop = '1.5rem';
  title.style.marginBottom = '1rem';
  container.appendChild(title);

  // Create form container
  const form = document.createElement('form');
  form.style.maxWidth = '500px';
  form.addEventListener('submit', (e) => e.preventDefault());

  // Name field (hidden for top-up)
  if (!isTopUp) {
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'form-label';
    nameLabel.textContent = 'Ingredient Name';
    nameGroup.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'form-input';
    nameInput.placeholder = 'e.g., Flour, Eggs, Milk';
    nameInput.value = ingredient ? ingredient.name : '';
    nameInput.id = 'ingredientName';
    nameGroup.appendChild(nameInput);
    form.appendChild(nameGroup);
  }

  // Type field (radio buttons, hidden for top-up)
  if (!isTopUp) {
    const typeGroup = document.createElement('div');
    typeGroup.className = 'form-group';

    const typeLabel = document.createElement('label');
    typeLabel.className = 'form-label';
    typeLabel.textContent = 'Type';
    typeGroup.appendChild(typeLabel);

    const discreteLabel = document.createElement('label');
    discreteLabel.style.display = 'flex';
    discreteLabel.style.alignItems = 'center';
    discreteLabel.style.marginBottom = '0.5rem';
    discreteLabel.style.cursor = 'pointer';

    const discreteRadio = document.createElement('input');
    discreteRadio.type = 'radio';
    discreteRadio.name = 'type';
    discreteRadio.value = INGREDIENT_TYPES.DISCRETE;
    discreteRadio.id = 'typediscrete';
    if (!ingredient || ingredient.type === INGREDIENT_TYPES.DISCRETE) {
      discreteRadio.checked = true;
    }
    discreteLabel.appendChild(discreteRadio);

    const discreteText = document.createElement('span');
    discreteText.textContent = 'Discrete (count items like eggs, apples)';
    discreteText.style.marginLeft = '0.5rem';
    discreteLabel.appendChild(discreteText);
    typeGroup.appendChild(discreteLabel);

    const measuredLabel = document.createElement('label');
    measuredLabel.style.display = 'flex';
    measuredLabel.style.alignItems = 'center';
    measuredLabel.style.cursor = 'pointer';

    const measuredRadio = document.createElement('input');
    measuredRadio.type = 'radio';
    measuredRadio.name = 'type';
    measuredRadio.value = INGREDIENT_TYPES.MEASURED;
    measuredRadio.id = 'typemeasured';
    if (ingredient && ingredient.type === INGREDIENT_TYPES.MEASURED) {
      measuredRadio.checked = true;
    }
    measuredLabel.appendChild(measuredRadio);

    const measuredText = document.createElement('span');
    measuredText.textContent = 'Measured (volume/weight like cups, grams)';
    measuredText.style.marginLeft = '0.5rem';
    measuredLabel.appendChild(measuredText);
    typeGroup.appendChild(measuredLabel);

    form.appendChild(typeGroup);
  }

  // Quantity field
  const quantityGroup = document.createElement('div');
  quantityGroup.className = 'form-group';

  const quantityLabel = document.createElement('label');
  quantityLabel.className = 'form-label';
  quantityLabel.textContent = isTopUp ? 'Top-Up Quantity' : 'Quantity';
  quantityGroup.appendChild(quantityLabel);

  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.className = 'form-input';
  quantityInput.placeholder = '1.5';
  quantityInput.step = '0.01';
  quantityInput.min = '0.01';
  quantityInput.id = 'ingredientQuantity';
  if (isTopUp) {
    quantityInput.value = '1';
  } else if (ingredient) {
    quantityInput.value = ingredient.canonicalQuantity;
  }
  quantityGroup.appendChild(quantityInput);
  form.appendChild(quantityGroup);

  // Unit field
  const unitGroup = document.createElement('div');
  unitGroup.className = 'form-group';

  const unitLabel = document.createElement('label');
  unitLabel.className = 'form-label';
  unitLabel.textContent = 'Unit';
  unitGroup.appendChild(unitLabel);

  const unitSelect = document.createElement('select');
  unitSelect.className = 'form-select';
  unitSelect.id = 'ingredientUnit';

  if (isTopUp) {
    // For top-up, show only units compatible with ingredient type
    if (ingredient.type === INGREDIENT_TYPES.DISCRETE) {
      const opt = document.createElement('option');
      opt.value = DISCRETE_UNIT;
      opt.textContent = 'unit';
      unitSelect.appendChild(opt);
      unitSelect.value = DISCRETE_UNIT;
      unitSelect.disabled = true;
    } else {
      Object.values(MEASURED_UNITS).forEach(unit => {
        const opt = document.createElement('option');
        opt.value = unit;
        opt.textContent = unit;
        unitSelect.appendChild(opt);
      });
      unitSelect.value = ingredient.canonicalUnit;
    }
  } else if (!ingredient || ingredient.type === INGREDIENT_TYPES.DISCRETE) {
    // For new discrete or creating discrete
    const opt = document.createElement('option');
    opt.value = DISCRETE_UNIT;
    opt.textContent = 'unit';
    unitSelect.appendChild(opt);
    unitSelect.value = DISCRETE_UNIT;
    unitSelect.disabled = true;
  } else {
    // For new measured or editing measured
    Object.values(MEASURED_UNITS).forEach(unit => {
      const opt = document.createElement('option');
      opt.value = unit;
      opt.textContent = unit;
      unitSelect.appendChild(opt);
    });
    if (ingredient) {
      unitSelect.value = ingredient.canonicalUnit;
    }
  }

  unitGroup.appendChild(unitSelect);
  form.appendChild(unitGroup);

  // Type change handler
  const typeRadios = form.querySelectorAll('input[name="type"]');
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === INGREDIENT_TYPES.DISCRETE) {
        unitSelect.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = DISCRETE_UNIT;
        opt.textContent = 'unit';
        unitSelect.appendChild(opt);
        unitSelect.value = DISCRETE_UNIT;
        unitSelect.disabled = true;
      } else {
        unitSelect.innerHTML = '';
        Object.values(MEASURED_UNITS).forEach(unit => {
          const opt = document.createElement('option');
          opt.value = unit;
          opt.textContent = unit;
          unitSelect.appendChild(opt);
        });
        unitSelect.disabled = false;
      }
    });
  });

  // Action buttons
  const actionDiv = document.createElement('div');
  actionDiv.style.display = 'flex';
  actionDiv.style.gap = '1rem';
  actionDiv.style.marginTop = '1.5rem';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = isTopUp ? 'Top Up' : (isEditing ? 'Update' : 'Add');
  submitBtn.addEventListener('click', () => {
    const name = document.getElementById('ingredientName')?.value || ingredient?.name;
    const type = document.querySelector('input[name="type"]:checked')?.value || ingredient?.type;
    const quantity = safeNumber(document.getElementById('ingredientQuantity').value);
    const unit = document.getElementById('ingredientUnit').value;

    if (isTopUp) {
      topUpIngredient(ingredient.id, quantity, unit);
      appState.view = 'ingredient-list';
      renderIngredientsView();
    } else if (isEditing) {
      updateIngredient(ingredient.id, name, type, quantity, unit);
      appState.view = 'ingredient-list';
      renderIngredientsView();
    } else {
      createIngredient(name, type, quantity, unit);
      appState.view = 'ingredient-list';
      renderIngredientsView();
    }
  });
  actionDiv.appendChild(submitBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    appState.view = 'ingredient-list';
    renderIngredientsView();
  });
  actionDiv.appendChild(cancelBtn);

  form.appendChild(actionDiv);
  container.appendChild(form);
}

/* ===================================================
   RECIPE MANAGEMENT (Phase 8-11)
   Create, display, cook recipes
   =================================================== */

// Get all recipes from storage
function getRecipes() {
  return loadRecipes();
}

// Get a single recipe by ID
function getRecipeById(id) {
  const recipes = getRecipes();
  return recipes.find(r => r.id === id);
}

// Create a new recipe
function createRecipe(name, instructions, imageUrl, ingredients) {
  // Validate inputs
  if (!isNonEmptyString(name) || !isNonEmptyString(instructions)) {
    showFlash('Recipe name and instructions are required', 'error');
    return null;
  }

  // Validate image URL if provided
  if (imageUrl && !isValidUrl(imageUrl)) {
    showFlash('Invalid image URL', 'error');
    return null;
  }

  // Validate ingredients array
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    showFlash('Recipe must have at least one ingredient', 'error');
    return null;
  }

  // Validate each ingredient
  for (const ing of ingredients) {
    if (!getIngredientById(ing.ingredientId)) {
      showFlash('Invalid ingredient', 'error');
      return null;
    }
    if (ing.quantity <= 0 || !isValidRecipeUnit(ing.unit)) {
      showFlash('Invalid ingredient quantity or unit', 'error');
      return null;
    }
  }

  // Create recipe object
  const recipe = {
    id: crypto.randomUUID(),
    name: safeText(name),
    instructions: safeText(instructions),
    imageUrl: imageUrl ? safeText(imageUrl) : '',
    ingredients: ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      quantity: safeNumber(ing.quantity),
      unit: ing.unit,
    })),
  };

  // Save
  const recipes = getRecipes();
  recipes.push(recipe);
  if (saveRecipes(recipes)) {
    showFlash(`Recipe "${recipe.name}" created!`, 'success');
    return recipe;
  } else {
    showFlash('Failed to save recipe', 'error');
    return null;
  }
}

// Update an existing recipe
function updateRecipe(id, name, instructions, imageUrl, ingredients) {
  // Validate inputs
  if (!isNonEmptyString(name) || !isNonEmptyString(instructions)) {
    showFlash('Recipe name and instructions are required', 'error');
    return false;
  }

  const recipe = getRecipeById(id);
  if (!recipe) {
    showFlash('Recipe not found', 'error');
    return false;
  }

  // Validate image URL if provided
  if (imageUrl && !isValidUrl(imageUrl)) {
    showFlash('Invalid image URL', 'error');
    return false;
  }

  // Validate ingredients
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    showFlash('Recipe must have at least one ingredient', 'error');
    return false;
  }

  // Update fields
  recipe.name = safeText(name);
  recipe.instructions = safeText(instructions);
  recipe.imageUrl = imageUrl ? safeText(imageUrl) : '';
  recipe.ingredients = ingredients.map(ing => ({
    ingredientId: ing.ingredientId,
    quantity: safeNumber(ing.quantity),
    unit: ing.unit,
  }));

  // Save and refresh
  const recipes = getRecipes();
  const index = recipes.findIndex(r => r.id === id);
  if (index >= 0) {
    recipes[index] = recipe;
    if (saveRecipes(recipes)) {
      showFlash('Recipe updated!', 'success');
      renderRecipesView();
      return true;
    }
  }

  showFlash('Failed to save recipe', 'error');
  return false;
}

// Delete a recipe
function deleteRecipe(id) {
  const recipe = getRecipeById(id);
  if (!recipe) {
    showFlash('Recipe not found', 'error');
    return false;
  }

  const recipes = getRecipes().filter(r => r.id !== id);
  if (saveRecipes(recipes)) {
    showFlash('Recipe deleted!', 'success');
    renderRecipesView();
    return true;
  }

  showFlash('Failed to delete recipe', 'error');
  return false;
}

// Cook a recipe - deduct ingredients from pantry
// Takes recipe ID and current scale multiplier
function cookRecipe(recipeId, scale = 1) {
  scale = safeNumber(scale);
  if (scale <= 0) {
    showFlash('Scale must be greater than 0', 'error');
    return false;
  }

  const recipe = getRecipeById(recipeId);
  if (!recipe) {
    showFlash('Recipe not found', 'error');
    return false;
  }

  // Check all ingredients exist and have enough quantity
  const ingredients = getIngredients();
  for (const recipeIng of recipe.ingredients) {
    const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId);
    if (!ingredient) {
      showFlash(`Ingredient missing from pantry`, 'error');
      return false;
    }

    // Convert recipe ingredient to pantry unit
    let neededQuantity = recipeIng.quantity * scale;
    if (recipeIng.unit !== ingredient.canonicalUnit) {
      neededQuantity = convertUnit(neededQuantity, recipeIng.unit, ingredient.canonicalUnit);
      if (neededQuantity === null) {
        showFlash(`Cannot cook - unit mismatch for ${ingredient.name}`, 'error');
        return false;
      }
    }

    if (ingredient.canonicalQuantity < neededQuantity) {
      showFlash(`Not enough ${ingredient.name} (need ${formatQuantity(neededQuantity)})`, 'error');
      return false;
    }
  }

  // All checks passed - now deduct from pantry
  for (const recipeIng of recipe.ingredients) {
    const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId);

    let deductQuantity = recipeIng.quantity * scale;
    if (recipeIng.unit !== ingredient.canonicalUnit) {
      deductQuantity = convertUnit(deductQuantity, recipeIng.unit, ingredient.canonicalUnit);
    }

    ingredient.canonicalQuantity = Math.max(0, ingredient.canonicalQuantity - deductQuantity);
  }

  // Save updated ingredients
  if (saveIngredients(ingredients)) {
    showFlash(`Meal cooked — pantry updated!`, 'success');
    appState.viewingRecipeId = recipeId;
    appState.recipeScale = 1; // Reset scale
    renderRecipeDetail();
    return true;
  }

  showFlash('Failed to update pantry', 'error');
  return false;
}

/* ===================================================
   RENDERING: Recipes View (Phase 8-11)
   Display recipe list, detail, and forms
   =================================================== */

// Render the recipes list view
function renderRecipesView() {
  const container = getCleanContainer();

  const heading = createPageHeading('Recipes');
  container.appendChild(heading);

  // Add button for new recipe
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary';
  addBtn.textContent = '+ Add Recipe';
  addBtn.addEventListener('click', () => {
    appState.view = 'recipe-form';
    appState.editingRecipeId = null;
    renderRecipesView();
  });
  container.appendChild(addBtn);

  // Show form if needed
  if (appState.view === 'recipe-form') {
    renderRecipeForm(container);
    return;
  }

  // Get recipes
  const recipes = getRecipes();

  // Show empty state
  if (recipes.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No recipes added yet. Create one to get started!';
    empty.style.color = 'var(--text-secondary)';
    empty.style.marginTop = '2rem';
    container.appendChild(empty);
    return;
  }

  // Render recipe cards
  const list = document.createElement('div');
  list.style.marginTop = '1rem';
  list.style.display = 'grid';
  list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  list.style.gap = '1.5rem';

  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';

    // Recipe image (if valid)
    if (recipe.imageUrl && isValidUrl(recipe.imageUrl)) {
      const img = document.createElement('img');
      img.src = recipe.imageUrl;
      img.alt = recipe.name;
      img.style.width = '100%';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.marginBottom = '1rem';
      img.onerror = () => img.remove(); // Remove if image fails to load
      card.appendChild(img);
    }

    // Recipe name
    const name = document.createElement('h3');
    name.textContent = recipe.name;
    name.style.fontSize = '1.25rem';
    name.style.marginBottom = '0.5rem';
    card.appendChild(name);

    // Ingredients count
    const ingCount = document.createElement('p');
    ingCount.textContent = `${recipe.ingredients.length} ingredient${recipe.ingredients.length !== 1 ? 's' : ''}`;
    ingCount.style.fontSize = '0.9rem';
    ingCount.style.color = 'var(--text-secondary)';
    ingCount.style.marginBottom = '1rem';
    card.appendChild(ingCount);

    // Action buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '0.5rem';
    actions.style.marginTop = 'auto';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn--small btn--primary';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
      appState.viewingRecipeId = recipe.id;
      appState.recipeScale = 1;
      renderRecipeDetail();
    });
    actions.appendChild(viewBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      appState.view = 'recipe-form';
      appState.editingRecipeId = recipe.id;
      renderRecipesView();
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--small btn--danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete "${recipe.name}"?`)) {
        deleteRecipe(recipe.id);
      }
    });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    list.appendChild(card);
  });

  container.appendChild(list);
}

// Render the recipe form for creating/editing
function renderRecipeForm(container) {
  const isEditing = appState.editingRecipeId !== null;
  const recipe = isEditing ? getRecipeById(appState.editingRecipeId) : null;

  // Form title
  const title = document.createElement('h3');
  title.textContent = isEditing ? 'Edit Recipe' : 'New Recipe';
  title.style.fontSize = '1.25rem';
  title.style.marginTop = '1.5rem';
  title.style.marginBottom = '1rem';
  container.appendChild(title);

  // Create form
  const form = document.createElement('form');
  form.style.maxWidth = '600px';
  form.addEventListener('submit', (e) => e.preventDefault());

  // Name field
  const nameGroup = document.createElement('div');
  nameGroup.className = 'form-group';

  const nameLabel = document.createElement('label');
  nameLabel.className = 'form-label';
  nameLabel.textContent = 'Recipe Name';
  nameGroup.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-input';
  nameInput.placeholder = 'e.g., Chocolate Chip Cookies';
  nameInput.id = 'recipeName';
  nameInput.value = recipe ? recipe.name : '';
  nameGroup.appendChild(nameInput);
  form.appendChild(nameGroup);

  // Instructions field
  const instrGroup = document.createElement('div');
  instrGroup.className = 'form-group';

  const instrLabel = document.createElement('label');
  instrLabel.className = 'form-label';
  instrLabel.textContent = 'Instructions';
  instrGroup.appendChild(instrLabel);

  const instrTextarea = document.createElement('textarea');
  instrTextarea.className = 'form-textarea';
  instrTextarea.placeholder = 'Step by step instructions...';
  instrTextarea.id = 'recipeInstructions';
  instrTextarea.value = recipe ? recipe.instructions : '';
  instrGroup.appendChild(instrTextarea);
  form.appendChild(instrGroup);

  // Image URL field
  const imgGroup = document.createElement('div');
  imgGroup.className = 'form-group';

  const imgLabel = document.createElement('label');
  imgLabel.className = 'form-label';
  imgLabel.textContent = 'Image URL (optional)';
  imgGroup.appendChild(imgLabel);

  const imgInput = document.createElement('input');
  imgInput.type = 'url';
  imgInput.className = 'form-input';
  imgInput.placeholder = 'https://...';
  imgInput.id = 'recipeImage';
  imgInput.value = recipe ? recipe.imageUrl : '';
  imgGroup.appendChild(imgInput);

  const imgHint = document.createElement('p');
  imgHint.className = 'form-hint';
  imgHint.textContent = 'Must be a valid http(s) URL';
  imgGroup.appendChild(imgHint);
  form.appendChild(imgGroup);

  // Ingredients section
  const ingLabel = document.createElement('label');
  ingLabel.className = 'form-label';
  ingLabel.style.marginTop = '1.5rem';
  ingLabel.style.display = 'block';
  ingLabel.textContent = 'Ingredients';
  form.appendChild(ingLabel);

  const ingContainer = document.createElement('div');
  ingContainer.id = 'ingredientRows';
  ingContainer.style.marginBottom = '1rem';

  // Render existing ingredient rows
  if (recipe) {
    recipe.ingredients.forEach((ing, index) => {
      const ingredient = getIngredientById(ing.ingredientId);
      if (ingredient) {
        renderRecipeIngredientRow(ingContainer, ingredient, ing.quantity, ing.unit, index);
      }
    });
  } else {
    // Start with one empty row
    renderRecipeIngredientRow(ingContainer, null, 1, MEASURED_UNITS.CUP, 0);
  }

  form.appendChild(ingContainer);

  // Add ingredient row button
  const addIngBtn = document.createElement('button');
  addIngBtn.type = 'button';
  addIngBtn.className = 'btn btn--small';
  addIngBtn.textContent = '+ Add Ingredient Row';
  addIngBtn.style.marginBottom = '1.5rem';
  addIngBtn.addEventListener('click', () => {
    const container = document.getElementById('ingredientRows');
    const nextIndex = container.children.length;
    renderRecipeIngredientRow(container, null, 1, MEASURED_UNITS.CUP, nextIndex);
  });
  form.appendChild(addIngBtn);

  // Action buttons
  const actionDiv = document.createElement('div');
  actionDiv.style.display = 'flex';
  actionDiv.style.gap = '1rem';
  actionDiv.style.marginTop = '1.5rem';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = isEditing ? 'Update Recipe' : 'Create Recipe';
  submitBtn.addEventListener('click', () => {
    const name = document.getElementById('recipeName').value;
    const instructions = document.getElementById('recipeInstructions').value;
    const image = document.getElementById('recipeImage').value;

    // Collect ingredients from rows
    const ingredients = [];
    const rows = document.getElementById('ingredientRows').children;
    let isValid = true;

    // eslint-disable-next-line no-unused-vars
    for (const row of rows) {
      const selects = row.querySelectorAll('select');
      const inputs = row.querySelectorAll('input[type="number"]');

      if (selects.length >= 2 && inputs.length >= 1) {
        const ingredientId = selects[0].value;
        const quantity = safeNumber(inputs[0].value);
        const unit = selects[1].value;

        if (ingredientId && quantity > 0 && unit) {
          ingredients.push({ ingredientId, quantity, unit });
        } else if (ingredientId || quantity > 0 || unit) {
          // Partially filled - mark invalid
          isValid = false;
          showFlash('Please complete all ingredient rows', 'error');
          break;
        }
      }
    }

    if (!isValid || ingredients.length === 0) {
      showFlash('Please add at least one ingredient', 'error');
      return;
    }

    if (isEditing) {
      if (updateRecipe(recipe.id, name, instructions, image, ingredients)) {
        appState.view = 'recipe-list';
        renderRecipesView();
      }
    } else {
      if (createRecipe(name, instructions, image, ingredients)) {
        appState.view = 'recipe-list';
        renderRecipesView();
      }
    }
  });
  actionDiv.appendChild(submitBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    appState.view = 'recipe-list';
    renderRecipesView();
  });
  actionDiv.appendChild(cancelBtn);

  form.appendChild(actionDiv);
  container.appendChild(form);
}

// Helper: Render a single ingredient row in recipe form
function renderRecipeIngredientRow(container, selectedIngredient, quantity, unit, index) {
  const row = document.createElement('div');
  row.className = 'recipe-ingredient-row';
  row.style.display = 'flex';
  row.style.gap = '0.5rem';
  row.style.marginBottom = '0.75rem';
  row.style.alignItems = 'flex-end';

  // Ingredient select
  const ingredientSelect = document.createElement('select');
  ingredientSelect.className = 'form-select';
  ingredientSelect.style.flex = '1';

  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = '--- Select Ingredient ---';
  ingredientSelect.appendChild(emptyOpt);

  getIngredients().forEach(ing => {
    const opt = document.createElement('option');
    opt.value = ing.id;
    opt.textContent = ing.name;
    if (selectedIngredient && selectedIngredient.id === ing.id) {
      opt.selected = true;
    }
    ingredientSelect.appendChild(opt);
  });

  row.appendChild(ingredientSelect);

  // Quantity input
  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.className = 'form-input';
  quantityInput.style.flex = '0.5';
  quantityInput.placeholder = 'Qty';
  quantityInput.step = '0.01';
  quantityInput.min = '0.01';
  quantityInput.value = quantity;

  row.appendChild(quantityInput);

  // Unit select
  const unitSelect = document.createElement('select');
  unitSelect.className = 'form-select';
  unitSelect.style.flex = '0.5';

  Object.values(MEASURED_UNITS).forEach(u => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    unitSelect.appendChild(opt);
  });

  const unitOpt = document.createElement('option');
  unitOpt.value = DISCRETE_UNIT;
  unitOpt.textContent = 'unit';
  unitSelect.appendChild(unitOpt);

  unitSelect.value = unit;
  row.appendChild(unitSelect);

  // Handle ingredient type changes
  ingredientSelect.addEventListener('change', (e) => {
    const ingredient = getIngredientById(e.target.value);
    if (ingredient && ingredient.type === INGREDIENT_TYPES.DISCRETE) {
      unitSelect.value = DISCRETE_UNIT;
      unitSelect.disabled = true;
    } else {
      unitSelect.disabled = false;
    }
  });

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn--small btn--danger';
  removeBtn.textContent = '✕';
  removeBtn.style.padding = '0.5rem 0.75rem';
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
  row.appendChild(removeBtn);

  container.appendChild(row);
}

// Render recipe detail view with scaling and cook button
function renderRecipeDetail() {
  const container = getCleanContainer();

  const recipe = getRecipeById(appState.viewingRecipeId);
  if (!recipe) {
    showFlash('Recipe not found', 'error');
    renderRecipesView();
    return;
  }

  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--small';
  backBtn.textContent = '← Back to Recipes';
  backBtn.addEventListener('click', () => {
    appState.viewingRecipeId = null;
    appState.recipeScale = 1;
    appState.currentView = VIEWS.RECIPES;
    renderApp();
  });
  container.appendChild(backBtn);

  // Recipe image
  if (recipe.imageUrl && isValidUrl(recipe.imageUrl)) {
    const img = document.createElement('img');
    img.src = recipe.imageUrl;
    img.alt = recipe.name;
    img.style.width = '100%';
    img.style.maxWidth = '400px';
    img.style.height = 'auto';
    img.style.borderRadius = '10px';
    img.style.marginTop = '1rem';
    img.style.marginBottom = '1rem';
    img.onerror = () => img.remove();
    container.appendChild(img);
  }

  // Recipe name
  const name = document.createElement('h2');
  name.textContent = recipe.name;
  name.style.fontSize = '2rem';
  name.style.marginTop = '1rem';
  name.style.marginBottom = '1rem';
  container.appendChild(name);

  // Scale controls
  const scaleDiv = document.createElement('div');
  scaleDiv.style.display = 'flex';
  scaleDiv.style.gap = '1rem';
  scaleDiv.style.marginBottom = '1.5rem';
  scaleDiv.style.alignItems = 'center';

  const scaleLabel = document.createElement('label');
  scaleLabel.textContent = 'Scale:';
  scaleLabel.style.fontWeight = 'bold';
  scaleDiv.appendChild(scaleLabel);

  const scales = [0.5, 1, 2];
  scales.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--small';
    if (s === appState.recipeScale) {
      btn.className += ' btn--primary';
    }
    btn.textContent = `${s}x`;
    btn.addEventListener('click', () => {
      appState.recipeScale = s;
      renderRecipeDetail();
    });
    scaleDiv.appendChild(btn);
  });

  container.appendChild(scaleDiv);

  // Ingredients section
  const ingHeading = document.createElement('h3');
  ingHeading.textContent = 'Ingredients';
  ingHeading.style.fontSize = '1.25rem';
  ingHeading.style.marginTop = '1.5rem';
  ingHeading.style.marginBottom = '1rem';
  container.appendChild(ingHeading);

  const ingredients = getIngredients();
  const ingList = document.createElement('ul');
  ingList.style.listStyle = 'none';

  let canCook = true;
  recipe.ingredients.forEach(recipeIng => {
    const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId);
    if (!ingredient) return;

    // Calculate needed quantity
    let neededQty = recipeIng.quantity * appState.recipeScale;
    let have = ingredient.canonicalQuantity;

    // Try to convert for display
    if (recipeIng.unit !== ingredient.canonicalUnit) {
      const converted = convertUnit(neededQty, recipeIng.unit, ingredient.canonicalUnit);
      if (converted !== null) {
        neededQty = converted;
      }
    }

    const isInsufficient = have < neededQty;
    if (isInsufficient) canCook = false;

    const item = document.createElement('li');
    item.style.marginBottom = '0.75rem';
    item.style.padding = '0.75rem';
    item.style.borderRadius = '6px';
    item.style.backgroundColor = isInsufficient ? '#FFEBEE' : '#f5f5f5';

    const text = document.createElement('div');
    const qty = formatQuantity(recipeIng.quantity * appState.recipeScale);

    let content = `${qty} ${recipeIng.unit} ${ingredient.name}`;
    if (appState.recipeScale !== 1) {
      content += ` (have: ${formatQuantity(have)} ${ingredient.canonicalUnit})`;
    }

    text.textContent = content;
    if (isInsufficient) {
      text.style.fontWeight = 'bold';
      text.style.color = '#C62828';
    }
    item.appendChild(text);
    ingList.appendChild(item);
  });

  container.appendChild(ingList);

  // Instructions section
  const instrHeading = document.createElement('h3');
  instrHeading.textContent = 'Instructions';
  instrHeading.style.fontSize = '1.25rem';
  instrHeading.style.marginTop = '1.5rem';
  instrHeading.style.marginBottom = '1rem';
  container.appendChild(instrHeading);

  const instrText = document.createElement('p');
  instrText.textContent = recipe.instructions;
  instrText.style.lineHeight = '1.8';
  instrText.style.whiteSpace = 'pre-wrap';
  container.appendChild(instrText);

  // Action buttons
  const actionDiv = document.createElement('div');
  actionDiv.style.display = 'flex';
  actionDiv.style.gap = '1rem';
  actionDiv.style.marginTop = '2rem';

  const cookBtn = document.createElement('button');
  cookBtn.className = 'btn btn--primary';
  cookBtn.textContent = 'Cook Recipe';
  cookBtn.disabled = !canCook;
  if (!canCook) {
    cookBtn.style.opacity = '0.6';
    cookBtn.style.cursor = 'not-allowed';
  }
  cookBtn.addEventListener('click', () => {
    if (confirm(`Cook ${appState.recipeScale}x "${recipe.name}"?`)) {
      cookRecipe(recipe.id, appState.recipeScale);
    }
  });
  actionDiv.appendChild(cookBtn);

  const editBtn = document.createElement('button');
  editBtn.className = 'btn';
  editBtn.textContent = 'Edit Recipe';
  editBtn.addEventListener('click', () => {
    appState.currentView = VIEWS.RECIPES;
    appState.view = 'recipe-form';
    appState.editingRecipeId = recipe.id;
    renderRecipesView();
  });
  actionDiv.appendChild(editBtn);

  container.appendChild(actionDiv);
}

/* ===================================================
   INIT: Initialize the app with full app state
   =================================================== */

// Main initialization function - called when DOM is ready
function init() {
  console.log('Pantry Recipe App initialized');

  // Initialize app state
  appState.currentView = VIEWS.HOME;
  appState.view = 'default';
  appState.ingredientFilter = '';
  appState.editingIngredientId = null;
  appState.editingRecipeId = null;
  appState.viewingRecipeId = null;
  appState.recipeScale = 1;

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
