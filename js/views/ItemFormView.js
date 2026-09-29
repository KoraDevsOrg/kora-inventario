export class ItemFormView {
  constructor(container, onSave, onCancel) {
    this.container = container;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render() {
    this.container.innerHTML = `
      <div class="card form-card">
        <h2 class="card-title">Nuevo Registro de Inventario</h2>
        
        <form id="formNewItem">
          <div class="form-group">
            <label>Nombre del Material o Producto:</label>
            <input type="text" id="itemNombre" class="input-field" required placeholder="Ej: Harina de Maíz, Empanada de Carne">
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Clasificación:</label>
              <select id="itemTipo" class="input-field">
                <option value="MATERIA_PRIMA">Materia Prima / Insumo</option>
                <option value="PRODUCTO_TERMINADO">Producto Terminado (Venta)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Unidad de Medida:</label>
              <select id="itemUnidad" class="input-field">
                <option value="kg">Kilogramos (kg)</option>
                <option value="gr">Gramos (gr)</option>
                <option value="unidad">Unidades (ud)</option>
                <option value="litro">Litros (L)</option>
                <option value="metro">Metros (m)</option>
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Stock Inicial:</label>
              <input type="number" step="any" id="itemStock" class="input-field" value="10" required>
            </div>
            <div class="form-group">
              <label>Alerta Stock Mínimo:</label>
              <input type="number" step="any" id="itemStockMin" class="input-field" value="2" required>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Costo de Compra / Fabricación ($):</label>
              <input type="number" step="any" id="itemCosto" class="input-field" value="1000" required>
            </div>
            <div class="form-group" id="grpPrecioVenta">
              <label>Precio de Venta Sugerido ($):</label>
              <input type="number" step="any" id="itemPrecio" class="input-field" value="0">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Proveedor o Contacto:</label>
              <input type="text" id="itemProveedor" class="input-field" placeholder="Ej: Distribuidora Norte">
            </div>
            <div class="form-group">
              <label>Tiempo de Reposición (Días):</label>
              <input type="number" id="itemDias" class="input-field" value="2">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" id="btnCancelItem" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar Registro</button>
          </div>
        </form>
      </div>
    `;

    const selTipo = this.container.querySelector("#itemTipo");
    const grpPrecio = this.container.querySelector("#grpPrecioVenta");
    selTipo.addEventListener("change", () => {
      grpPrecio.style.display = selTipo.value === "PRODUCTO_TERMINADO" ? "flex" : "none";
    });
    grpPrecio.style.display = "none"; // Por defecto es MATERIA_PRIMA

    this.container.querySelector("#btnCancelItem").addEventListener("click", this.onCancel);

    this.container.querySelector("#formNewItem").addEventListener("submit", (e) => {
      e.preventDefault();
      const itemData = {
        nombre: this.container.querySelector("#itemNombre").value.trim(),
        tipo: selTipo.value,
        unidad_medida: this.container.querySelector("#itemUnidad").value,
        stock_actual: parseFloat(this.container.querySelector("#itemStock").value) || 0,
        stock_minimo: parseFloat(this.container.querySelector("#itemStockMin").value) || 0,
        costo_unitario: parseFloat(this.container.querySelector("#itemCosto").value) || 0,
        precio_venta: parseFloat(this.container.querySelector("#itemPrecio").value) || 0,
        proveedor: this.container.querySelector("#itemProveedor").value.trim(),
        reposicion_dias: parseInt(this.container.querySelector("#itemDias").value, 10) || 1
      };
      this.onSave(itemData);
    });
  }
}
