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
   RENDERING: renderHome()
   Shows the home page content
   =================================================== */

// Display the home page with welcome content
function renderHome() {
  const appContainer = document.getElementById('appContainer');
  appContainer.innerHTML = '';

  // Create main heading
  const heading = document.createElement('h2');
  heading.textContent = 'Welcome to Pantry Recipe App';
  heading.style.fontSize = '1.75rem';
  heading.style.marginBottom = '1rem';

  // Create welcome message
  const message = document.createElement('p');
  message.textContent = 'Manage your pantry ingredients and cook recipes with what you have.';
  message.style.fontSize = '1.125rem';
  message.style.color = 'var(--text-secondary)';
  message.style.marginBottom = '2rem';

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

  features.forEach(feature => {
    const item = document.createElement('li');
    item.textContent = feature;
    item.style.marginBottom = '0.5rem';
    list.appendChild(item);
  });

  // Append elements to container
  appContainer.appendChild(heading);
  appContainer.appendChild(message);
  appContainer.appendChild(list);
}

/* ===================================================
   RENDERING: renderIngredients()
   Shows the ingredients page (placeholder for now)
   =================================================== */

// Display the ingredients page
function renderIngredientsView() {
  const appContainer = document.getElementById('appContainer');
  appContainer.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'Ingredients';
  heading.style.fontSize = '1.75rem';
  heading.style.marginBottom = '1rem';

  const message = document.createElement('p');
  message.textContent = 'Ingredients view coming in Phase 4...';
  message.style.color = 'var(--text-secondary)';

  appContainer.appendChild(heading);
  appContainer.appendChild(message);
}

/* ===================================================
   RENDERING: renderRecipes()
   Shows the recipes page (placeholder for now)
   =================================================== */

// Display the recipes page
function renderRecipesView() {
  const appContainer = document.getElementById('appContainer');
  appContainer.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'Recipes';
  heading.style.fontSize = '1.75rem';
  heading.style.marginBottom = '1rem';

  const message = document.createElement('p');
  message.textContent = 'Recipes view coming in Phase 8...';
  message.style.color = 'var(--text-secondary)';

  appContainer.appendChild(heading);
  appContainer.appendChild(message);
}

/* ===================================================
   RENDERING: renderApp()
   Main render function that shows the correct view
   based on current app state
   =================================================== */

// Display the correct view based on appState.currentView
function renderApp() {
  // Determine which view function to call
  if (appState.currentView === VIEWS.HOME) {
    renderHome();
  } else if (appState.currentView === VIEWS.INGREDIENTS) {
    renderIngredientsView();
  } else if (appState.currentView === VIEWS.RECIPES) {
    renderRecipesView();
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
   Handle nav button clicks to switch views
   =================================================== */

// Set up navigation listeners - runs once on page load
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the view name from the button's data attribute
      const viewName = button.getAttribute('data-view');

      // Update app state to the new view
      appState.currentView = viewName;

      // Render the new view
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
