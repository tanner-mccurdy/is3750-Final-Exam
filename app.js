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
