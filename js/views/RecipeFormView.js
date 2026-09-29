export class RecipeFormView {
  constructor(container, onSave, onCancel) {
    this.container = container;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.selectedIngredients = [];
  }

  render(availableItems) {
    const rawMaterials = availableItems.filter(i => i.tipo === "MATERIA_PRIMA");
    const finishedProducts = availableItems.filter(i => i.tipo === "PRODUCTO_TERMINADO");

    if (rawMaterials.length === 0 || finishedProducts.length === 0) {
      this.container.innerHTML = `
        <div class="card" style="text-align: center; padding: 24px;">
          <p style="color: var(--red-alert); font-weight: bold; margin-bottom: 12px;">
            Atención: Se requiere tener registrada al menos 1 Materia Prima y 1 Producto Terminado antes de crear una receta.
          </p>
          <button id="btnBackToItems" class="btn-primary">Volver al Inventario</button>
        </div>
      `;
      this.container.querySelector("#btnBackToItems").addEventListener("click", this.onCancel);
      return;
    }

    this.container.innerHTML = `
      <div class="card form-card">
        <h2 class="card-title">Nueva Receta (Escandallo de Lote)</h2>
        <p style="font-size: 0.8rem; color: var(--text-sub); margin-bottom: 14px;">
          Ingresa las cantidades para el lote completo; el sistema calculará la descomposición por unidad.
        </p>

        <form id="formRecipe">
          <div class="form-group">
            <label>Nombre de la Fórmula o Receta:</label>
            <input type="text" id="recNombre" class="input-field" required placeholder="Ej: Lote 50 Empanadas de Pollo">
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Producto Terminado que Fabrica:</label>
              <select id="recProductoId" class="input-field">
                ${finishedProducts.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Rendimiento Total del Lote (Unidades):</label>
              <input type="number" id="recRendimiento" class="input-field" value="20" min="1" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Mano de Obra Total del Lote ($):</label>
              <input type="number" id="recManoObra" class="input-field" value="6000" min="0">
            </div>
            <div class="form-group">
              <label>Margen de Merma / Desperdicio (%):</label>
              <input type="number" id="recMerma" class="input-field" value="5" min="0">
            </div>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 16px 0;">

          <h3 style="font-size: 0.9rem; color: var(--accent-gold); margin-bottom: 8px;">Insumos Consumidos en el Lote Completo</h3>
          <div id="recipeIngredientsRows"></div>

          <button type="button" id="btnAddIngredientRow" class="btn-secondary" style="margin-top: 8px;">
            + Seleccionar Insumo
          </button>

          <div class="form-actions" style="margin-top: 20px;">
            <button type="button" id="btnCancelRecipe" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar Receta y Calcular</button>
          </div>
        </form>
      </div>
    `;

    const rowsContainer = this.container.querySelector("#recipeIngredientsRows");
    const btnAdd = this.container.querySelector("#btnAddIngredientRow");

    const addRow = () => {
      const row = document.createElement("div");
      row.className = "ingredient-selection-row";
      row.innerHTML = `
        <select class="input-field select-raw" style="flex: 2;">
          ${rawMaterials.map(m => `<option value="${m.id}">${m.nombre} (${m.unidad_medida})</option>`).join('')}
        </select>
        <input type="number" step="any" class="input-field input-qty" style="flex: 1;" placeholder="Cantidad Lote" required>
        <button type="button" class="btn-delete">✕</button>
      `;
      row.querySelector(".btn-delete").addEventListener("click", () => row.remove());
      rowsContainer.appendChild(row);
    };

    btnAdd.addEventListener("click", addRow);
    addRow(); // Primera fila por defecto

    this.container.querySelector("#btnCancelRecipe").addEventListener("click", this.onCancel);

    this.container.querySelector("#formRecipe").addEventListener("submit", (e) => {
      e.preventDefault();
      const rows = rowsContainer.querySelectorAll(".ingredient-selection-row");
      const ingredients = [];

      rows.forEach(r => {
        const matId = r.querySelector(".select-raw").value;
        const qty = parseFloat(r.querySelector(".input-qty").value) || 0;
        if (qty > 0) {
          ingredients.push({ materia_prima_id: matId, cantidad_lote: qty });
        }
      });

      if (ingredients.length === 0) {
        alert("Debes agregar al menos un insumo con cantidad mayor a cero.");
        return;
      }

      const recipeData = {
        nombre: this.container.querySelector("#recNombre").value.trim(),
        producto_terminado_id: this.container.querySelector("#recProductoId").value,
        lote_rendimiento: parseFloat(this.container.querySelector("#recRendimiento").value) || 1,
        mano_obra_lote: parseFloat(this.container.querySelector("#recManoObra").value) || 0,
        merma_porcentaje: parseFloat(this.container.querySelector("#recMerma").value) || 0,
        tiempo_fabricacion_minutos: 60
      };

      this.onSave(recipeData, ingredients);
    });
  }
}
