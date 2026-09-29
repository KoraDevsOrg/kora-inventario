import { InventoryModel } from "./store.js";

class InventoryController {
  constructor() {
    this.model = new InventoryModel();
    this.contentEl = document.getElementById("appContent");
    this.currentView = "items-view";
    
    this.initDrawer();
    this.initNavigation();
    this.renderView("items-view");
  }

  initDrawer() {
    const drawer = document.getElementById("sideDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const toggle = (open) => {
      drawer.classList.toggle("open", open);
      backdrop.classList.toggle("active", open);
    };

    document.getElementById("btnOpenDrawer").addEventListener("click", () => toggle(true));
    document.getElementById("btnCloseDrawer").addEventListener("click", () => toggle(false));
    backdrop.addEventListener("click", () => toggle(false));

    document.querySelectorAll(".drawer-item").forEach(btn => {
      btn.addEventListener("click", () => {
        toggle(false);
        if (btn.dataset.view) this.renderView(btn.dataset.view);
        if (btn.dataset.action === "new-item") this.renderItemForm(null);
        if (btn.dataset.action === "new-recipe") this.renderRecipeForm();
      });
    });
  }

  initNavigation() {
    document.querySelectorAll(".tab-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderView(btn.dataset.view);
      });
    });
  }

  renderView(viewName) {
    this.currentView = viewName;
    this.contentEl.innerHTML = "";
    const tmpl = document.getElementById(`tmpl-${viewName}`);
    if (!tmpl) return;

    this.contentEl.appendChild(tmpl.content.cloneNode(true));

    if (viewName === "items-view") this.bindItemsView();
    if (viewName === "recipes-view") this.bindRecipesView();
  }

  // --- VISTA ITEMS ---
  bindItemsView() {
    const tbody = document.getElementById("itemsTbody");
    const items = this.model.getItems();

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-sub); padding: 24px;">No hay materiales registrados.</td></tr>`;
    } else {
      tbody.innerHTML = items.map(i => `
        <tr>
          <td><strong>${i.nombre}</strong><br><small style="color:var(--text-sub);">${i.proveedor || "Sin proveedor"} (${i.reposicion_dias || 1}d)</small></td>
          <td><span class="badge ${i.tipo === 'MATERIA_PRIMA' ? 'badge-raw' : 'badge-finished'}">${i.tipo === 'MATERIA_PRIMA' ? 'MATERIA PRIMA' : 'TERMINADO'}</span></td>
          <td><strong>${i.stock_actual} ${i.unidad_medida}</strong>${Number(i.stock_actual) <= Number(i.stock_minimo) ? '<br><span class="badge badge-low-stock">BAJO</span>' : ''}</td>
          <td>Costo: $${Math.round(i.costo_unitario).toLocaleString()}<br>${i.tipo !== 'MATERIA_PRIMA' ? `<strong style="color:var(--accent-green);">$${Math.round(i.precio_venta).toLocaleString()}</strong>` : ''}</td>
          <td><button class="btn-edit" data-id="${i.id}">✏️</button></td>
        </tr>
      `).join("");
    }

    document.getElementById("btnGoNewItem").addEventListener("click", () => this.renderItemForm(null));
    tbody.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => this.renderItemForm(btn.dataset.id));
    });
  }

  // --- FORMULARIO ITEM ---
  renderItemForm(itemId) {
    this.contentEl.innerHTML = "";
    const tmpl = document.getElementById("tmpl-item-form-view");
    this.contentEl.appendChild(tmpl.content.cloneNode(true));

    const item = itemId ? this.model.getItemById(itemId) : null;
    const form = document.getElementById("itemForm");
    const grpPrecio = document.getElementById("grpPrecioVenta");
    const selTipo = document.getElementById("itemTipo");

    if (item) {
      document.getElementById("itemFormTitle").textContent = "✏️ Editar Material / Producto";
      document.getElementById("itemId").value = item.id;
      document.getElementById("itemNombre").value = item.nombre;
      selTipo.value = item.tipo;
      document.getElementById("itemUnidad").value = item.unidad_medida;
      document.getElementById("itemStock").value = item.stock_actual;
      document.getElementById("itemStockMin").value = item.stock_minimo;
      document.getElementById("itemCosto").value = item.costo_unitario;
      document.getElementById("itemPrecio").value = item.precio_venta;
      document.getElementById("itemProveedor").value = item.proveedor;
      document.getElementById("itemDias").value = item.reposicion_dias;
    }

    grpPrecio.style.display = selTipo.value === "PRODUCTO_TERMINADO" ? "flex" : "none";
    selTipo.addEventListener("change", () => {
      grpPrecio.style.display = selTipo.value === "PRODUCTO_TERMINADO" ? "flex" : "none";
    });

    document.getElementById("btnCancelItemForm").addEventListener("click", () => this.renderView("items-view"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.model.saveItem({
        id: document.getElementById("itemId").value || null,
        nombre: document.getElementById("itemNombre").value.trim(),
        tipo: selTipo.value,
        unidad_medida: document.getElementById("itemUnidad").value,
        stock_actual: parseFloat(document.getElementById("itemStock").value) || 0,
        stock_minimo: parseFloat(document.getElementById("itemStockMin").value) || 0,
        costo_unitario: parseFloat(document.getElementById("itemCosto").value) || 0,
        precio_venta: parseFloat(document.getElementById("itemPrecio").value) || 0,
        proveedor: document.getElementById("itemProveedor").value.trim(),
        reposicion_dias: parseInt(document.getElementById("itemDias").value, 10) || 1
      });
      this.renderView("items-view");
    });
  }

  // --- VISTA RECETAS ---
  bindRecipesView() {
    const container = document.getElementById("recipesCardsContainer");
    const recipes = this.model.getRecipes();
    const items = this.model.getItems();

    if (recipes.length === 0) {
      container.innerHTML = `<div class="card" style="text-align: center; color: var(--text-sub); padding: 24px;">No hay recetas registradas.</div>`;
    } else {
      container.innerHTML = recipes.map(r => {
        const prod = items.find(i => i.id === r.producto_terminado_id) || { nombre: "Producto" };
        let costoInsumos = 0;
        const desglose = (r.ingredientes || []).map(ing => {
          const raw = items.find(i => i.id === ing.materia_prima_id);
          const c = raw ? (Number(ing.cantidad_lote) * Number(raw.costo_unitario)) : 0;
          costoInsumos += c;
          return `<div>• ${raw ? raw.nombre : ing.materia_prima_id}: ${(Number(ing.cantidad_lote) / Number(r.lote_rendimiento)).toFixed(3)} ${raw ? raw.unidad_medida : ''} ($${Math.round(c / Number(r.lote_rendimiento)).toLocaleString()})</div>`;
        }).join("");

        const costoTotal = (costoInsumos * (1 + (Number(r.merma_porcentaje) / 100))) + Number(r.mano_obra_lote);
        const costoUnitario = costoTotal / Number(r.lote_rendimiento);

        return `
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <h3 style="color:var(--accent-gold);">${r.nombre}</h3>
              <span class="badge badge-finished">Rinde ${r.lote_rendimiento} uds</span>
            </div>
            <p style="font-size:0.8rem; color:var(--text-sub); margin-bottom:8px;">Fabrica: <strong>${prod.nombre}</strong></p>
            <div class="recipe-breakdown">
              <small style="color:var(--text-sub); text-transform:uppercase;">Consumo para 1 Unidad:</small>
              ${desglose}
            </div>
            <div class="unit-calc-highlight">
              <span>Costo Real Unitario:</span>
              <span class="unit-calc-val">$ ${Math.round(costoUnitario).toLocaleString()}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    document.getElementById("btnGoNewRecipe").addEventListener("click", () => this.renderRecipeForm());
  }

  // --- FORMULARIO RECETAS ---
  renderRecipeForm() {
    const rawItems = this.model.getItems().filter(i => i.tipo === "MATERIA_PRIMA");
    const finishedItems = this.model.getItems().filter(i => i.tipo === "PRODUCTO_TERMINADO");

    if (rawItems.length === 0 || finishedItems.length === 0) {
      alert("Atención: Debes tener al menos 1 Materia Prima y 1 Producto Terminado creados.");
      this.renderView("items-view");
      return;
    }

    this.contentEl.innerHTML = "";
    const tmpl = document.getElementById("tmpl-recipe-form-view");
    this.contentEl.appendChild(tmpl.content.cloneNode(true));

    const selProd = document.getElementById("recipeProductoId");
    selProd.innerHTML = finishedItems.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");

    const rowsContainer = document.getElementById("recipeIngredientsRows");
    const addRow = () => {
      const row = document.createElement("div");
      row.className = "ingredient-selection-row";
      row.innerHTML = `
        <select class="input-field select-raw" style="flex:2;">
          ${rawItems.map(m => `<option value="${m.id}">${m.nombre} (${m.unidad_medida})</option>`).join("")}
        </select>
        <input type="number" step="any" class="input-field input-qty" style="flex:1;" placeholder="Cant. Lote" required>
        <button type="button" class="btn-delete">✕</button>
      `;
      row.querySelector(".btn-delete").addEventListener("click", () => row.remove());
      rowsContainer.appendChild(row);
    };

    document.getElementById("btnAddIngredientRow").addEventListener("click", addRow);
    addRow(); // Fila inicial

    document.getElementById("btnCancelRecipeForm").addEventListener("click", () => this.renderView("recipes-view"));

    document.getElementById("recipeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const rows = rowsContainer.querySelectorAll(".ingredient-selection-row");
      const ingredients = [];

      rows.forEach(r => {
        const matId = r.querySelector(".select-raw").value;
        const qty = parseFloat(r.querySelector(".input-qty").value) || 0;
        if (qty > 0) ingredients.push({ materia_prima_id: matId, cantidad_lote: qty });
      });

      if (ingredients.length === 0) {
        alert("Agrega al menos un ingrediente con cantidad mayor a 0.");
        return;
      }

      this.model.saveRecipe({
        nombre: document.getElementById("recipeNombre").value.trim(),
        producto_terminado_id: selProd.value,
        lote_rendimiento: parseFloat(document.getElementById("recipeRendimiento").value) || 1,
        mano_obra_lote: parseFloat(document.getElementById("recipeManoObra").value) || 0,
        merma_porcentaje: parseFloat(document.getElementById("recipeMerma").value) || 0
      }, ingredients);

      this.renderView("recipes-view");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new InventoryController();
});
