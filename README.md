# is3750-Final-Exam

**Features**

**Recipes**
Create, read, update, and delete recipes
Add 0 to many ingredients per recipe
Each ingredient includes:
Quantity (supports decimals)
Unit (tsp, tbsp, cup, ml, g, oz, unit)
View full recipe details:
Title, instructions, and optional image
Ingredient list with:
Required amounts
Pantry availability (“have X”)
Highlighted shortages
Scaling support:
½×, 1×, 2× recipe scaling
Dynamically updates quantities and availability
Cook Recipe functionality
Deducts ingredients from pantry
Validates availability and unit compatibility
Displays success or error messages

**Pantry Ingredients**
Full CRUD functionality for ingredients
Supports two ingredient types:
Measured (e.g., flour, milk)
Discrete (e.g., eggs)
Tracks canonical quantities:
Measured → stored in a selected unit (cup, g, ml, etc.)
Discrete → stored as whole units
“Top Up” functionality:
Add new stock via:
Package quantities
Serving-based calculations
Automatic unit conversion between compatible units
Smart formatting:
Displays fractions (½, ¼, etc.) when applicable
**Ingredient List Enhancements**
Real-time search/filter
Sorted by quantity (low → high)
Visual alerts:
Low stock highlighted
Bold quantities for attention
⚙️ App Behavior
Built as a Single Page Application (SPA)
Navigation includes:
Home
Recipes
Ingredients
Uses localStorage:
"ingredients"
"recipes"
Unique IDs generated via crypto.randomUUID()
Flash messages for user feedback (success/error)

**Core Logic Highlights**
Unit conversion system:
Supports volume (tsp, tbsp, cup, ml)
Supports weight (g, oz)
Handles discrete units separately
Prevents incompatible conversions
Inventory validation before cooking
Dynamic UI rendering based on selected view
Graceful handling of missing data (e.g., no image)

**Tech Stack**
HTML, CSS, JavaScript
Local Storage for persistence
SPA architecture (no backend)

**Purpose**

This project demonstrates:

Frontend state management without a framework
Data modeling for relational structures (recipes ↔ ingredients)
Real-world logic like unit conversions and inventory tracking
Clean UX design with dynamic updates

**Future Improvements (Optional Ideas)**
Backend integration (Django / API)
User authentication
Cloud database (AWS RDS / Firebase)
Meal planning calendar
Shopping list generation
