import { InventoryRepository } from "./models/Repository.js";
import { ItemsView } from "./views/ItemsView.js";
import { ItemFormView } from "./views/ItemFormView.js";
import { RecipesView } from "./views/RecipesView.js";
import { RecipeFormView } from "./views/RecipeFormView.js";

class InventoryController {
  constructor() {
    this.repo = new InventoryRepository();
    this.appContainer = document.getElementById("appMainContent");

    // Instanciar vistas pasando callbacks de navegación
    this.itemsView = new ItemsView(this.appContainer, () => this.navigate("item-form"));
    this.itemFormView = new ItemFormView(
      this.appContainer,
      (itemData) => this.handleSaveItem(itemData),
      () => this.navigate("items")
    );

    this.recipesView = new RecipesView(this.appContainer, () => this.navigate("recipe-form"));
    this.recipeFormView = new RecipeFormView(
      this.appContainer,
      (recipeData, ingredients) => this.handleSaveRecipe(recipeData, ingredients),
      () => this.navigate("recipes")
    );

    this.initNavigation();
    this.navigate("items");
  }

  initNavigation() {
    this.tabItems = document.getElementById("tabNavItems");
    this.tabRecipes = document.getElementById("tabNavRecipes");

    this.tabItems.addEventListener("click", () => this.navigate("items"));
    this.tabRecipes.addEventListener("click", () => this.navigate("recipes"));

    // Menú hamburguesa lateral (Drawer)
    const btnOpen = document.getElementById("btnOpenDrawer");
    const btnClose = document.getElementById("btnCloseDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const drawer = document.getElementById("sideDrawer");

    const toggle = (open) => {
      drawer.classList.toggle("open", open);
      backdrop.classList.toggle("active", open);
    };

    btnOpen.addEventListener("click", () => toggle(true));
    btnClose.addEventListener("click", () => toggle(false));
    backdrop.addEventListener("click", () => toggle(false));

    document.querySelectorAll(".drawer-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.view;
        toggle(false);
        this.navigate(target);
      });
    });
  }

  navigate(viewName) {
    this.tabItems.classList.toggle("active", viewName === "items" || viewName === "item-form");
    this.tabRecipes.classList.toggle("active", viewName === "recipes" || viewName === "recipe-form");

    switch (viewName) {
      case "items":
        this.itemsView.render(this.repo.getAllItems());
        break;
      case "item-form":
        this.itemFormView.render();
        break;
      case "recipes":
        this.recipesView.render(this.repo.getAllRecipes(), this.repo.getAllItems());
        break;
      case "recipe-form":
        this.recipeFormView.render(this.repo.getAllItems());
        break;
    }
  }

  handleSaveItem(itemData) {
    this.repo.insertItem(itemData);
    this.navigate("items");
  }

  handleSaveRecipe(recipeData, ingredients) {
    try {
      this.repo.saveRecipeTransaction(recipeData, ingredients);
      this.navigate("recipes");
    } catch (e) {
      alert("Error al guardar la transacción de la receta: " + e.message);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new InventoryController();
});
