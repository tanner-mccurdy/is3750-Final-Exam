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
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Check if a value is a valid ingredient type
function isValidIngredientType(value) {
  return value === INGREDIENT_TYPES.DISCRETE || value === INGREDIENT_TYPES.MEASURED;
}

// Check if a value is a valid measured unit
function isValidMeasuredUnit(value) {
  const validUnits = Object.values(MEASURED_UNITS);
  return validUnits.includes(value);
}

// Check if a value is a valid recipe unit
function isValidRecipeUnit(value) {
  return isValidMeasuredUnit(value) || value === DISCRETE_UNIT;
}

/* ===================================================
STORAGE: Load and save ingredients to localStorage
=================================================== */

function loadIngredients() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const validated = parsed.filter(ingredient => {
      if (!ingredient || typeof ingredient !== 'object') return false;
      if (!isNonEmptyString(ingredient.id)) return false;
      if (!isNonEmptyString(ingredient.name)) return false;
      if (!isValidIngredientType(ingredient.type)) return false;
      if (typeof ingredient.canonicalQuantity !== 'number' || ingredient.canonicalQuantity <= 0) return false;

      if (ingredient.type === INGREDIENT_TYPES.DISCRETE) {
        if (ingredient.canonicalUnit !== DISCRETE_UNIT) return false;
      } else {
        if (!isValidMeasuredUnit(ingredient.canonicalUnit)) return false;
      }

      return true;
    });

    return validated;
  } catch (error) {
    console.error('Error loading ingredients from localStorage:', error);
    return [];
  }
}

function saveIngredients(ingredients) {
  try {
    if (!Array.isArray(ingredients)) {
      console.error('saveIngredients: Expected array but got', typeof ingredients);
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    return true;
  } catch (error) {
    console.error('Error saving ingredients to localStorage:', error);
    return false;
  }
}

/* ===================================================
STORAGE: Load and save recipes to localStorage
=================================================== */

function loadRecipes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const validated = parsed.filter(recipe => {
      if (!recipe || typeof recipe !== 'object') return false;
      if (!isNonEmptyString(recipe.id)) return false;
      if (!isNonEmptyString(recipe.name)) return false;
      if (!isNonEmptyString(recipe.instructions)) return false;

      if (recipe.imageUrl && !isValidUrl(recipe.imageUrl)) return false;
      if (!Array.isArray(recipe.ingredients)) return false;

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
    console.error('Error loading recipes from localStorage:', error);
    return [];
  }
}

function saveRecipes(recipes) {
  try {
    if (!Array.isArray(recipes)) {
      console.error('saveRecipes: Expected array but got', typeof recipes);
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    return true;
  } catch (error) {
    console.error('Error saving recipes to localStorage:', error);
    return false;
  }
}

/* ===================================================
HELPER: Clear the main container and return ref
=================================================== */

function getCleanContainer() {
  const appContainer = document.getElementById('appContainer');
  appContainer.innerHTML = '';
  return appContainer;
}

/* ===================================================
HELPER: Create a page heading
=================================================== */

function createPageHeading(text) {
  const heading = document.createElement('h2');
  heading.textContent = text;
  heading.className = 'page-heading';
  return heading;
}

/* ===================================================
RENDERING: renderHome()
=================================================== */

function renderHome() {
  const container = getCleanContainer();

  const heading = createPageHeading('Welcome to Pantry Recipe App');
  container.appendChild(heading);

  const message = document.createElement('p');
  message.textContent = 'Manage your pantry ingredients and cook recipes with what you have.';
  message.style.fontSize = '1.125rem';
  message.style.color = 'var(--text-secondary)';
  message.style.marginBottom = '2rem';
  container.appendChild(message);

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

  container.appendChild(list);
}

/* ===================================================
RENDERING: renderIngredientsView()
=================================================== */

function renderIngredientsView() {
  if (appState.viewingRecipeId !== null) {
    renderRecipeDetail();
    return;
  }

  renderIngredientsViewImpl();
}

function renderIngredientsViewImpl() {
  const container = getCleanContainer();

  const heading = createPageHeading('Ingredients');
  container.appendChild(heading);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary';
  addBtn.textContent = '+ Add Ingredient';
  addBtn.addEventListener('click', () => {
    appState.view = 'ingredient-form';
    appState.editingIngredientId = null;
    renderIngredientsViewImpl();
  });
  container.appendChild(addBtn);

  if (appState.view === 'ingredient-form' || appState.view === 'ingredient-edit') {
    renderIngredientForm(container);
    return;
  }

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

  const ingredients = getIngredients();
  const filtered = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(appState.ingredientFilter)
  );

  filtered.sort((a, b) => a.canonicalQuantity - b.canonicalQuantity);

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

  const list = document.createElement('div');
  list.style.marginTop = '1rem';

  filtered.forEach(ing => {
    const card = document.createElement('div');
    card.className = 'card';

    const isLowStock = (ing.type === INGREDIENT_TYPES.DISCRETE && ing.canonicalQuantity < 3) ||
      (ing.type === INGREDIENT_TYPES.MEASURED && ing.canonicalQuantity < 1);

    if (isLowStock) {
      card.style.borderLeftWidth = '4px';
      card.style.borderLeftColor = 'var(--accent-primary)';
    }

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
    quantityEl.textContent = `${qty} ${ing.canonicalUnit === DISCRETE_UNIT ? 'item(s)' : ing.canonicalUnit}`;
    quantityEl.style.fontSize = '0.95rem';
    quantityEl.style.color = 'var(--text-secondary)';
    if (isLowStock) quantityEl.style.color = 'var(--accent-primary)';
    details.appendChild(quantityEl);

    info.appendChild(details);

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

function renderIngredientForm(container) {
  const isEdit = appState.editingIngredientId !== null;
  const heading = document.createElement('h2');
  heading.textContent = isEdit ? 'Edit Ingredient' : 'Add Ingredient';
  heading.style.marginBottom = '1.5rem';
  container.appendChild(heading);

  let ingredient = null;
  if (isEdit) {
    ingredient = getIngredientById(appState.editingIngredientId);
    if (!ingredient) {
      showFlash('Ingredient not found', 'error');
      appState.view = 'default';
      renderIngredientsView();
      return;
    }
  }

  const form = document.createElement('form');
  form.style.maxWidth = '400px';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Ingredient Name *';
  nameLabel.style.display = 'block';
  nameLabel.style.marginBottom = '0.5rem';
  form.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-input';
  nameInput.placeholder = 'e.g., Carrots, Milk, Olive Oil';
  nameInput.value = ingredient?.name || '';
  nameInput.required = true;
  form.appendChild(nameInput);

  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Type *';
  typeLabel.style.display = 'block';
  typeLabel.style.marginTop = '1rem';
  typeLabel.style.marginBottom = '0.5rem';
  form.appendChild(typeLabel);

  const typeSelect = document.createElement('select');
  typeSelect.className = 'form-input';

  const typeOptions = [
    { value: INGREDIENT_TYPES.DISCRETE, label: 'Counted Items (e.g., 5 apples)' },
    { value: INGREDIENT_TYPES.MEASURED, label: 'Measured (e.g., 2 cups flour)' }
  ];

  typeOptions.forEach(typeOption => {
    const option = document.createElement('option');
    option.value = typeOption.value;
    option.textContent = typeOption.label;
    if (ingredient?.type === typeOption.value) option.selected = true;
    typeSelect.appendChild(option);
  });

  form.appendChild(typeSelect);

  const quantityLabel = document.createElement('label');
  quantityLabel.textContent = 'Quantity *';
  quantityLabel.style.display = 'block';
  quantityLabel.style.marginTop = '1rem';
  quantityLabel.style.marginBottom = '0.5rem';
  form.appendChild(quantityLabel);

  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.className = 'form-input';
  quantityInput.placeholder = 'e.g., 1, 2.5, 500';
  quantityInput.step = '0.1';
  quantityInput.value = ingredient?.canonicalQuantity || '';
  quantityInput.required = true;
  form.appendChild(quantityInput);

  const unitLabel = document.createElement('label');
  unitLabel.textContent = 'Unit *';
  unitLabel.style.display = 'block';
  unitLabel.style.marginTop = '1rem';
  unitLabel.style.marginBottom = '0.5rem';
  form.appendChild(unitLabel);

  const unitSelect = document.createElement('select');
  unitSelect.className = 'form-input';

  const updateUnitOptions = () => {
    unitSelect.innerHTML = '';

    if (typeSelect.value === INGREDIENT_TYPES.DISCRETE) {
      const opt = document.createElement('option');
      opt.value = DISCRETE_UNIT;
      opt.textContent = 'item(s)';
      unitSelect.appendChild(opt);
    } else {
      Object.values(MEASURED_UNITS).forEach(unit => {
        const opt = document.createElement('option');
        opt.value = unit;
        opt.textContent = unit;
        unitSelect.appendChild(opt);
      });
    }

    if (ingredient) {
      unitSelect.value = ingredient.canonicalUnit;
    }
  };

  typeSelect.addEventListener('change', updateUnitOptions);
  updateUnitOptions();
  form.appendChild(unitSelect);

  const buttonDiv = document.createElement('div');
  buttonDiv.style.display = 'flex';
  buttonDiv.style.gap = '1rem';
  buttonDiv.style.marginTop = '1.5rem';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = isEdit ? 'Update Ingredient' : 'Add Ingredient';
  buttonDiv.appendChild(submitBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    appState.view = 'default';
    appState.editingIngredientId = null;
    renderIngredientsView();
  });
  buttonDiv.appendChild(cancelBtn);

  form.appendChild(buttonDiv);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = safeText(nameInput.value);
    const type = typeSelect.value;
    const quantity = parseFloat(quantityInput.value);
    const unit = unitSelect.value;

    if (isEdit) {
      updateIngredient(appState.editingIngredientId, name, type, quantity, unit);
    } else {
      if (createIngredient(name, type, quantity, unit)) {
        appState.view = 'default';
        appState.editingIngredientId = null;
        renderIngredientsView();
      }
    }
  });

  container.appendChild(form);
}

/* ===================================================
RENDERING: renderRecipesView()
=================================================== */

function renderRecipesView() {
  if (appState.viewingRecipeId !== null) {
    renderRecipeDetail();
    return;
  }

  renderRecipesViewImpl();
}

function renderRecipesViewImpl() {
  const container = getCleanContainer();

  const heading = createPageHeading('Recipes');
  container.appendChild(heading);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary';
  addBtn.textContent = '+ Add Recipe';
  addBtn.addEventListener('click', () => {
    appState.view = 'recipe-form';
    appState.editingRecipeId = null;
    renderRecipesViewImpl();
  });
  container.appendChild(addBtn);

  if (appState.view === 'recipe-form') {
    renderRecipeForm(container);
    return;
  }

  const recipes = getRecipes();

  if (recipes.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No recipes added yet. Create one to get started!';
    empty.style.color = 'var(--text-secondary)';
    empty.style.marginTop = '2rem';
    container.appendChild(empty);
    return;
  }

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

    if (recipe.imageUrl && isValidUrl(recipe.imageUrl)) {
      const img = document.createElement('img');
      img.src = recipe.imageUrl;
      img.alt = recipe.name;
      img.style.width = '100%';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.marginBottom = '1rem';
      img.onerror = () => img.remove();
      card.appendChild(img);
    }

    const name = document.createElement('h3');
    name.textContent = recipe.name;
    name.style.fontSize = '1.25rem';
    name.style.marginBottom = '0.5rem';
    card.appendChild(name);

    const ingCount = document.createElement('p');
    ingCount.textContent = `${recipe.ingredients.length} ingredient${recipe.ingredients.length !== 1 ? 's' : ''}`;
    ingCount.style.fontSize = '0.9rem';
    ingCount.style.color = 'var(--text-secondary)';
    ingCount.style.marginBottom = '1rem';
    card.appendChild(ingCount);

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

function renderRecipeForm(container) {
  const isEdit = appState.editingRecipeId !== null;
  const heading = document.createElement('h2');
  heading.textContent = isEdit ? 'Edit Recipe' : 'Add Recipe';
  heading.style.marginBottom = '1.5rem';
  container.appendChild(heading);

  let recipe = null;
  if (isEdit) {
    recipe = getRecipeById(appState.editingRecipeId);
    if (!recipe) {
      showFlash('Recipe not found', 'error');
      appState.view = 'default';
      renderRecipesView();
      return;
    }
  }

  const form = document.createElement('form');
  form.style.maxWidth = '500px';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Recipe Name *';
  nameLabel.style.display = 'block';
  nameLabel.style.marginBottom = '0.5rem';
  form.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-input';
  nameInput.placeholder = 'e.g., Vegetable Stir Fry';
  nameInput.value = recipe?.name || '';
  nameInput.required = true;
  form.appendChild(nameInput);

  const imageLabel = document.createElement('label');
  imageLabel.textContent = 'Image URL (optional)';
  imageLabel.style.display = 'block';
  imageLabel.style.marginTop = '1rem';
  imageLabel.style.marginBottom = '0.5rem';
  form.appendChild(imageLabel);

  const imageInput = document.createElement('input');
  imageInput.type = 'url';
  imageInput.className = 'form-input';
  imageInput.placeholder = 'https://example.com/image.jpg';
  imageInput.value = recipe?.imageUrl || '';
  form.appendChild(imageInput);

  const instrLabel = document.createElement('label');
  instrLabel.textContent = 'Instructions *';
  instrLabel.style.display = 'block';
  instrLabel.style.marginTop = '1rem';
  instrLabel.style.marginBottom = '0.5rem';
  form.appendChild(instrLabel);

  const instrInput = document.createElement('textarea');
  instrInput.className = 'form-input';
  instrInput.placeholder = 'Write step-by-step instructions...';
  instrInput.value = recipe?.instructions || '';
  instrInput.style.minHeight = '120px';
  instrInput.style.fontFamily = 'monospace';
  instrInput.required = true;
  form.appendChild(instrInput);

  const ingHeading = document.createElement('h3');
  ingHeading.textContent = 'Ingredients *';
  ingHeading.style.marginTop = '1.5rem';
  ingHeading.style.marginBottom = '1rem';
  form.appendChild(ingHeading);

  const ingredients = getIngredients();
  if (ingredients.length === 0) {
    const noIng = document.createElement('p');
    noIng.textContent = 'Add ingredients to your pantry first!';
    noIng.style.color = 'var(--text-secondary)';
    form.appendChild(noIng);
  } else {
    const ingContainer = document.createElement('div');
    ingContainer.style.marginBottom = '1rem';

    const selectedIngredients = recipe?.ingredients || [];

    ingredients.forEach(ingredient => {
      const ingDiv = document.createElement('div');
      ingDiv.style.marginBottom = '0.75rem';
      ingDiv.style.display = 'flex';
      ingDiv.style.gap = '0.5rem';
      ingDiv.style.alignItems = 'flex-start';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = ingredient.id;
      checkbox.style.marginTop = '0.5rem';
      const isSelected = selectedIngredients.some(ing => ing.ingredientId === ingredient.id);
      checkbox.checked = isSelected;
      ingDiv.appendChild(checkbox);

      const details = document.createElement('div');
      details.style.flex = '1';

      const label = document.createElement('label');
      label.textContent = ingredient.name;
      label.style.display = 'block';
      label.style.marginBottom = '0.25rem';
      details.appendChild(label);

      const qtyDiv = document.createElement('div');
      qtyDiv.style.display = 'flex';
      qtyDiv.style.gap = '0.5rem';

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.step = '0.1';
      qtyInput.placeholder = 'Quantity';
      qtyInput.style.width = '80px';
      qtyInput.disabled = !checkbox.checked;
      const selectedIng = selectedIngredients.find(ing => ing.ingredientId === ingredient.id);
      qtyInput.value = selectedIng?.quantity || '';
      qtyDiv.appendChild(qtyInput);

      const unitInput = document.createElement('select');
      unitInput.disabled = !checkbox.checked;

      const allowedUnits = ingredient.type === INGREDIENT_TYPES.DISCRETE
        ? [DISCRETE_UNIT]
        : Object.values(MEASURED_UNITS);

      const defaultUnit = ingredient.type === INGREDIENT_TYPES.DISCRETE
        ? DISCRETE_UNIT
        : ingredient.canonicalUnit;

      allowedUnits.forEach(unit => {
        const opt = document.createElement('option');
        opt.value = unit;
        opt.textContent = unit === DISCRETE_UNIT ? 'item(s)' : unit;

        if ((selectedIng?.unit || defaultUnit) === unit) {
          opt.selected = true;
        }

        unitInput.appendChild(opt);
      });

      qtyDiv.appendChild(unitInput);

      details.appendChild(qtyDiv);
      ingDiv.appendChild(details);

      checkbox.addEventListener('change', () => {
        qtyInput.disabled = !checkbox.checked;
        unitInput.disabled = !checkbox.checked;
      });

      ingContainer.appendChild(ingDiv);
    });

    form.appendChild(ingContainer);
  }

  const buttonDiv = document.createElement('div');
  buttonDiv.style.display = 'flex';
  buttonDiv.style.gap = '1rem';
  buttonDiv.style.marginTop = '1.5rem';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = isEdit ? 'Update Recipe' : 'Create Recipe';
  buttonDiv.appendChild(submitBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    appState.view = 'default';
    appState.editingRecipeId = null;
    renderRecipesView();
  });
  buttonDiv.appendChild(cancelBtn);

  form.appendChild(buttonDiv);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = safeText(nameInput.value);
    const instructions = safeText(instrInput.value);
    const imageUrl = safeText(imageInput.value);

    const formIngredients = [];
    let hasError = false;
    
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      if (checkbox.checked) {
        const parent = checkbox.parentElement;
        const qtyInput = parent.querySelector('input[type="number"]');
        const unitInput = parent.querySelector('select');
        
        // Validate that quantity is filled in
        const quantity = parseFloat(qtyInput.value);
        if (isNaN(quantity) || quantity <= 0) {
          showFlash(`Please enter a valid quantity for each ingredient`, 'error');
          hasError = true;
          return;
        }
        
        formIngredients.push({
          ingredientId: checkbox.value,
          quantity: quantity,
          unit: unitInput.value,
        });
      }
    });
    
    if (hasError) return;

    if (isEdit) {
      if (updateRecipe(appState.editingRecipeId, name, instructions, imageUrl, formIngredients)) {
        appState.view = 'default';
        appState.editingRecipeId = null;
        renderRecipesView();
      }
    } else {
      if (createRecipe(name, instructions, imageUrl, formIngredients)) {
        appState.view = 'default';
        appState.editingRecipeId = null;
        renderRecipesView();
      }
    }
  });

  container.appendChild(form);
}

/* ===================================================
RENDERING: renderApp()
=================================================== */

function renderApp() {
  if (appState.currentView === VIEWS.HOME) {
    renderHome();
  } else if (appState.currentView === VIEWS.INGREDIENTS) {
    renderIngredientsView();
  } else if (appState.currentView === VIEWS.RECIPES) {
    renderRecipesView();
  } else {
    appState.currentView = VIEWS.HOME;
    renderHome();
  }

  updateActiveNavButton();
}

/* ===================================================
HELPER: updateActiveNavButton()
=================================================== */

function updateActiveNavButton() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => btn.classList.remove('nav-btn--active'));

  const activeButton = document.querySelector(`[data-view="${appState.currentView}"]`);
  if (activeButton) {
    activeButton.classList.add('nav-btn--active');
  }
}

/* ===================================================
EVENT HANDLERS: Navigation
=================================================== */

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const viewName = button.getAttribute('data-view');
      appState.currentView = viewName;
      appState.view = 'default';
      appState.editingIngredientId = null;
      appState.editingRecipeId = null;
      appState.viewingRecipeId = null;
      renderApp();
    });
  });
}

/* ===================================================
FLASH MESSAGE SYSTEM
=================================================== */

function showFlash(message, type = 'success') {
  const container = document.getElementById('flashContainer');
  if (!container) return;

  const flash = document.createElement('div');
  flash.className = `flash-message flash-message--${type}`;
  flash.textContent = safeText(message);

  container.appendChild(flash);

  setTimeout(() => {
    flash.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => flash.remove(), 300);
  }, 4000);
}

/* ===================================================
FORMATTING HELPERS
=================================================== */

function formatQuantity(quantity) {
  quantity = safeNumber(quantity);
  if (quantity === 0) return '0';

  const fractionMap = {
    0.125: '1/8',
    0.25: '1/4',
    0.333: '1/3',
    0.5: '1/2',
    0.667: '2/3',
    0.75: '3/4',
  };

  const whole = Math.floor(quantity);
  const decimal = Math.round((quantity - whole) * 1000) / 1000;

  let fractionPart = '';
  if (decimal > 0.01) {
    for (const [key, fraction] of Object.entries(fractionMap)) {
      if (Math.abs(parseFloat(key) - decimal) < 0.01) {
        fractionPart = fraction;
        break;
      }
    }
  }

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
UNIT CONVERSION SYSTEM
=================================================== */

function getUnitCategory(unit) {
  const volumeUnits = [MEASURED_UNITS.TSP, MEASURED_UNITS.TBSP, MEASURED_UNITS.CUP, MEASURED_UNITS.ML];
  const weightUnits = [MEASURED_UNITS.G, MEASURED_UNITS.OZ];

  if (volumeUnits.includes(unit)) return 'volume';
  if (weightUnits.includes(unit)) return 'weight';
  if (unit === DISCRETE_UNIT) return 'discrete';
  return null;
}

function convertUnit(value, fromUnit, toUnit) {
  value = safeNumber(value);
  if (value <= 0) return null;
  if (fromUnit === toUnit) return value;

  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);
  if (fromCategory !== toCategory || !fromCategory) return null;

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

  const conversions = fromCategory === 'volume' ? volumeConversions : weightConversions;
  const baseValue = value * conversions[fromUnit];
  const result = baseValue / conversions[toUnit];

  return Math.round(result * 100) / 100;
}

/* ===================================================
INGREDIENT MANAGEMENT
=================================================== */

function getIngredients() {
  return loadIngredients();
}

function getIngredientById(id) {
  const ingredients = getIngredients();
  return ingredients.find(ing => ing.id === id);
}

function createIngredient(name, type, canonicalQuantity, canonicalUnit) {
  if (!isNonEmptyString(name) || !isValidIngredientType(type)) {
    showFlash('Invalid ingredient data', 'error');
    return null;
  }

  canonicalQuantity = safeNumber(canonicalQuantity);
  if (canonicalQuantity <= 0) {
    showFlash('Quantity must be greater than 0', 'error');
    return null;
  }

  if (type === INGREDIENT_TYPES.DISCRETE && canonicalUnit !== DISCRETE_UNIT) {
    showFlash('Discrete items must use "unit"', 'error');
    return null;
  }

  if (type === INGREDIENT_TYPES.MEASURED && !isValidMeasuredUnit(canonicalUnit)) {
    showFlash('Invalid unit for measured ingredient', 'error');
    return null;
  }

  const ingredient = {
    id: crypto.randomUUID(),
    name: safeText(name),
    type,
    canonicalQuantity,
    canonicalUnit,
  };

  const ingredients = getIngredients();
  ingredients.push(ingredient);

  if (saveIngredients(ingredients)) {
    showFlash(`Added ${ingredient.name}!`, 'success');
    appState.view = 'default';
    appState.editingIngredientId = null;
    renderIngredientsView();
    return ingredient;
  }

  showFlash('Failed to save ingredient', 'error');
  return null;
}

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

  let convertedQuantity = addQuantity;
  if (addUnit !== ingredient.canonicalUnit) {
    convertedQuantity = convertUnit(addQuantity, addUnit, ingredient.canonicalUnit);
    if (convertedQuantity === null) {
      showFlash('Cannot convert between these units', 'error');
      return false;
    }
  }

  ingredient.canonicalQuantity += convertedQuantity;

  const ingredients = getIngredients();
  const index = ingredients.findIndex(ing => ing.id === id);
  if (index >= 0) {
    ingredients[index] = ingredient;
    if (saveIngredients(ingredients)) {
      showFlash(`Topped up ${ingredient.name}!`, 'success');
      appState.view = 'default';
      appState.editingIngredientId = null;
      renderIngredientsView();
      return true;
    }
  }

  showFlash('Failed to save ingredient', 'error');
  return false;
}

function updateIngredient(id, name, type, canonicalQuantity, canonicalUnit) {
  if (!isNonEmptyString(name) || !isValidIngredientType(type)) {
    showFlash('Invalid ingredient data', 'error');
    return false;
  }

  canonicalQuantity = safeNumber(canonicalQuantity);
  if (canonicalQuantity <= 0) {
    showFlash('Quantity must be greater than 0', 'error');
    return false;
  }

  if (type === INGREDIENT_TYPES.DISCRETE && canonicalUnit !== DISCRETE_UNIT) {
    showFlash('Discrete items must use "unit"', 'error');
    return false;
  }

  if (type === INGREDIENT_TYPES.MEASURED && !isValidMeasuredUnit(canonicalUnit)) {
    showFlash('Invalid unit for measured ingredient', 'error');
    return false;
  }

  const ingredient = getIngredientById(id);
  if (!ingredient) {
    showFlash('Ingredient not found', 'error');
    return false;
  }

  ingredient.name = safeText(name);
  ingredient.type = type;
  ingredient.canonicalQuantity = canonicalQuantity;
  ingredient.canonicalUnit = canonicalUnit;

  const ingredients = getIngredients();
  const index = ingredients.findIndex(ing => ing.id === id);
  if (index >= 0) {
    ingredients[index] = ingredient;
    if (saveIngredients(ingredients)) {
      showFlash('Ingredient updated!', 'success');
      appState.view = 'default';
      appState.editingIngredientId = null;
      renderIngredientsView();
      return true;
    }
  }

  showFlash('Failed to save ingredient', 'error');
  return false;
}

function deleteIngredient(id) {
  const ingredient = getIngredientById(id);
  if (!ingredient) {
    showFlash('Ingredient not found', 'error');
    return false;
  }

  const recipes = loadRecipes();
  const inUse = recipes.some(recipe =>
    recipe.ingredients.some(ing => ing.ingredientId === id)
  );

  if (inUse) {
    showFlash(`Cannot delete "${ingredient.name}" - it's used in recipes`, 'error');
    return false;
  }

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
RECIPE MANAGEMENT
=================================================== */

function getRecipes() {
  return loadRecipes();
}

function getRecipeById(id) {
  const recipes = getRecipes();
  return recipes.find(r => r.id === id);
}

function createRecipe(name, instructions, imageUrl, ingredients) {
  if (!isNonEmptyString(name) || !isNonEmptyString(instructions)) {
    showFlash('Recipe name and instructions are required', 'error');
    return null;
  }

  if (imageUrl && !isValidUrl(imageUrl)) {
    showFlash('Invalid image URL', 'error');
    return null;
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    showFlash('Recipe must have at least one ingredient', 'error');
    return null;
  }

  for (const ing of ingredients) {
    const pantryIngredient = getIngredientById(ing.ingredientId);
    if (!pantryIngredient) {
      showFlash('Invalid ingredient', 'error');
      return null;
    }

    if (ing.quantity <= 0 || !isValidRecipeUnit(ing.unit)) {
      showFlash('Invalid ingredient quantity or unit', 'error');
      return null;
    }

    if (pantryIngredient.type === INGREDIENT_TYPES.DISCRETE && ing.unit !== DISCRETE_UNIT) {
      showFlash(`"${pantryIngredient.name}" must use item(s)`, 'error');
      return null;
    }

    if (pantryIngredient.type === INGREDIENT_TYPES.MEASURED && !isValidMeasuredUnit(ing.unit)) {
      showFlash(`"${pantryIngredient.name}" must use a measured unit`, 'error');
      return null;
    }
  }

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

  const recipes = getRecipes();
  recipes.push(recipe);

  if (saveRecipes(recipes)) {
    showFlash(`Recipe "${recipe.name}" created!`, 'success');
    appState.view = 'default';
    appState.editingRecipeId = null;
    renderRecipesView();
    return recipe;
  }

  showFlash('Failed to save recipe', 'error');
  return null;
}

function updateRecipe(id, name, instructions, imageUrl, ingredients) {
  if (!isNonEmptyString(name) || !isNonEmptyString(instructions)) {
    showFlash('Recipe name and instructions are required', 'error');
    return false;
  }

  const recipe = getRecipeById(id);
  if (!recipe) {
    showFlash('Recipe not found', 'error');
    return false;
  }

  if (imageUrl && !isValidUrl(imageUrl)) {
    showFlash('Invalid image URL', 'error');
    return false;
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    showFlash('Recipe must have at least one ingredient', 'error');
    return false;
  }

  for (const ing of ingredients) {
    const pantryIngredient = getIngredientById(ing.ingredientId);
    if (!pantryIngredient) {
      showFlash('Invalid ingredient', 'error');
      return false;
    }

    if (ing.quantity <= 0 || !isValidRecipeUnit(ing.unit)) {
      showFlash('Invalid ingredient quantity or unit', 'error');
      return false;
    }

    if (pantryIngredient.type === INGREDIENT_TYPES.DISCRETE && ing.unit !== DISCRETE_UNIT) {
      showFlash(`"${pantryIngredient.name}" must use item(s)`, 'error');
      return false;
    }

    if (pantryIngredient.type === INGREDIENT_TYPES.MEASURED && !isValidMeasuredUnit(ing.unit)) {
      showFlash(`"${pantryIngredient.name}" must use a measured unit`, 'error');
      return false;
    }
  }

  recipe.name = safeText(name);
  recipe.instructions = safeText(instructions);
  recipe.imageUrl = imageUrl ? safeText(imageUrl) : '';
  recipe.ingredients = ingredients.map(ing => ({
    ingredientId: ing.ingredientId,
    quantity: safeNumber(ing.quantity),
    unit: ing.unit,
  }));

  const recipes = getRecipes();
  const index = recipes.findIndex(r => r.id === id);
  if (index >= 0) {
    recipes[index] = recipe;
    if (saveRecipes(recipes)) {
      showFlash('Recipe updated!', 'success');
      appState.view = 'default';
      appState.editingRecipeId = null;
      renderRecipesView();
      return true;
    }
  }

  showFlash('Failed to save recipe', 'error');
  return false;
}

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

  const ingredients = getIngredients();

  for (const recipeIng of recipe.ingredients) {
    const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId);
    if (!ingredient) {
      showFlash('Ingredient missing from pantry', 'error');
      return false;
    }

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

  for (const recipeIng of recipe.ingredients) {
    const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId);

    let deductQuantity = recipeIng.quantity * scale;
    if (recipeIng.unit !== ingredient.canonicalUnit) {
      deductQuantity = convertUnit(deductQuantity, recipeIng.unit, ingredient.canonicalUnit);
    }

    ingredient.canonicalQuantity = Math.max(0, ingredient.canonicalQuantity - deductQuantity);
  }

  if (saveIngredients(ingredients)) {
    showFlash('Meal cooked — pantry updated!', 'success');
    appState.viewingRecipeId = recipeId;
    appState.recipeScale = 1;
    renderRecipeDetail();
    return true;
  }

  showFlash('Failed to update pantry', 'error');
  return false;
}

/* ===================================================
RECIPE DETAIL VIEW
=================================================== */

function renderRecipeDetail() {
  const container = getCleanContainer();

  const recipe = getRecipeById(appState.viewingRecipeId);
  if (!recipe) {
    showFlash('Recipe not found', 'error');
    appState.viewingRecipeId = null;
    renderRecipesView();
    return;
  }

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--small';
  backBtn.textContent = '← Back to Recipes';
  backBtn.addEventListener('click', () => {
    appState.viewingRecipeId = null;
    appState.recipeScale = 1;
    appState.currentView = VIEWS.RECIPES;
    appState.view = 'default';
    renderApp();
  });
  container.appendChild(backBtn);

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

  const name = document.createElement('h2');
  name.textContent = recipe.name;
  name.style.fontSize = '2rem';
  name.style.marginTop = '1rem';
  name.style.marginBottom = '1rem';
  container.appendChild(name);

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

    let neededQty = recipeIng.quantity * appState.recipeScale;
    const have = ingredient.canonicalQuantity;

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

    const displayRecipeUnit = recipeIng.unit === DISCRETE_UNIT ? 'item(s)' : recipeIng.unit;
    const displayPantryUnit = ingredient.canonicalUnit === DISCRETE_UNIT ? 'item(s)' : ingredient.canonicalUnit;

    let content = `${qty} ${displayRecipeUnit} ${ingredient.name}`;
    if (appState.recipeScale !== 1) {
      content += ` (have: ${formatQuantity(have)} ${displayPantryUnit})`;
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
INIT
=================================================== */

function init() {
  console.log('Pantry Recipe App initialized');

  appState.currentView = VIEWS.HOME;
  appState.view = 'default';
  appState.ingredientFilter = '';
  appState.editingIngredientId = null;
  appState.editingRecipeId = null;
  appState.viewingRecipeId = null;
  appState.recipeScale = 1;

  setupNavigation();
  renderApp();
}

/* ===================================================
START
=================================================== */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}