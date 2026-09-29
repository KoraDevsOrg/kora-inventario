import { InventoryModel } from "./store.js";

class InventoryController {
  constructor() {
    this.model = new InventoryModel();
    this.mainEl = document.getElementById("appContent");
    
    // Estado de navegación
    this.selectedMaterialId = null;
    this.currentPage = 1;
    this.pageSize = 5;
    this.filterFrom = null;
    this.filterTo = null;

    this.initDrawer();
    this.renderHome();
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
        const action = btn.dataset.action;
        if (action === "home") this.renderHome();
        else this.showExternalModuleNotice(btn.textContent.trim());
      });
    });

    document.getElementById("btnOpenKoraAdmin").addEventListener("click", () => {
      toggle(false);
      window.location.href = "intent://org.koradevs.admindb/#Intent;scheme=package;end";
    });
  }

  showExternalModuleNotice(modName) {
    this.mainEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 30px;">
        <span style="font-size: 2.5rem;">📦</span>
        <h2 style="color: var(--accent-gold); margin: 12px 0;">${modName}</h2>
        <p style="color: var(--text-sub); font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;">
          Este módulo está desacoplado para mantener el teléfono liviano. Puedes instalarlo o abrirlo como acceso directo desde la tienda de <strong>Kora Admin DB</strong> para compartir la misma base de datos.
        </p>
        <button id="btnReturnHomeNotice" class="btn-primary">Volver al Inventario</button>
      </div>
    `;
    document.getElementById("btnReturnHomeNotice").addEventListener("click", () => this.renderHome());
  }

  mountTemplate(tmplId) {
    this.mainEl.innerHTML = "";
    const tmpl = document.getElementById(tmplId);
    if (tmpl) this.mainEl.appendChild(tmpl.content.cloneNode(true));
  }

  // --- 1. PANTALLA PRINCIPAL: BOTONES DE ACCIÓN ---
  renderHome() {
    this.mountTemplate("tmpl-home-view");
    document.getElementById("headerTitle").textContent = "Kora Inventario";

    document.getElementById("btnActionNewItem").addEventListener("click", () => this.renderItemForm(null));
    document.getElementById("btnActionBOM").addEventListener("click", () => this.renderBOMForm());
    document.getElementById("btnActionStockReport").addEventListener("click", () => this.renderStockSearch());
  }

  // --- 2. FORMULARIO MATERIAL ---
  renderItemForm(itemId) {
    this.mountTemplate("tmpl-item-form-view");
    document.getElementById("headerTitle").textContent = itemId ? "Editar Material" : "Nuevo Material";

    const item = itemId ? this.model.getItemById(itemId) : null;
    const selTipo = document.getElementById("itemTipo");
    const grpPrecio = document.getElementById("grpPrecioVenta");

    if (item) {
      document.getElementById("itemFormTitle").textContent = "Editar Material";
      document.getElementById("itemId").value = item.id;
      document.getElementById("itemNombre").value = item.nombre;
      selTipo.value = item.tipo;
      document.getElementById("itemUnidad").value = item.unidad_medida;
      document.getElementById("itemStock").value = item.stock_actual;
      document.getElementById("itemStockMin").value = item.stock_minimo;
      document.getElementById("itemCosto").value = item.costo_unitario;
      document.getElementById("itemPrecio").value = item.precio_venta;
      document.getElementById("itemProveedor").value = item.proveedor || "";
    }

    grpPrecio.style.display = selTipo.value === "PRODUCTO_TERMINADO" ? "flex" : "none";
    selTipo.addEventListener("change", () => {
      grpPrecio.style.display = selTipo.value === "PRODUCTO_TERMINADO" ? "flex" : "none";
    });

    document.getElementById("btnBackHome").addEventListener("click", () => this.renderHome());
    document.getElementById("btnCancelItemForm").addEventListener("click", () => this.renderHome());

    document.getElementById("itemForm").addEventListener("submit", (e) => {
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
        proveedor: document.getElementById("itemProveedor").value.trim()
      });
      this.renderStockSearch();
    });
  }

  // --- 3. LISTA DE MATERIALES (BOM) ---
  renderBOMForm() {
    const rawItems = this.model.getItems().filter(i => i.tipo === "MATERIA_PRIMA");
    const finishedItems = this.model.getItems().filter(i => i.tipo === "PRODUCTO_TERMINADO");

    if (rawItems.length === 0 || finishedItems.length === 0) {
      alert("Atención: Registra al menos 1 Materia Prima y 1 Producto Terminado antes de crear una Lista de Materiales.");
      this.renderHome();
      return;
    }

    this.mountTemplate("tmpl-bom-form-view");
    document.getElementById("headerTitle").textContent = "Lista de Materiales";

    const selProd = document.getElementById("bomProductoId");
    selProd.innerHTML = finishedItems.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");

    const rowsContainer = document.getElementById("bomMaterialsRows");
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

    document.getElementById("btnAddBOMRow").addEventListener("click", addRow);
    addRow();

    document.getElementById("btnBackHomeBOM").addEventListener("click", () => this.renderHome());
    document.getElementById("btnCancelBOM").addEventListener("click", () => this.renderHome());

    document.getElementById("bomForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const rows = rowsContainer.querySelectorAll(".ingredient-selection-row");
      const materials = [];

      rows.forEach(r => {
        const matId = r.querySelector(".select-raw").value;
        const qty = parseFloat(r.querySelector(".input-qty").value) || 0;
        if (qty > 0) materials.push({ material_id: matId, cantidad_lote: qty });
      });

      if (materials.length === 0) {
        alert("Agrega al menos una materia prima con cantidad válida.");
        return;
      }

      this.model.saveBOM({
        nombre: document.getElementById("bomNombre").value.trim(),
        producto_terminado_id: selProd.value,
        lote_rendimiento: parseFloat(document.getElementById("bomRendimiento").value) || 1
      }, materials);

      alert("Lista de Materiales guardada con éxito.");
      this.renderHome();
    });
  }

  // --- 4. BÚSQUEDA Y PARÁMETRO DE SELECCIÓN ---
  renderStockSearch() {
    this.mountTemplate("tmpl-stock-search-view");
    document.getElementById("headerTitle").textContent = "Consultar Material";

    const input = document.getElementById("searchMaterialInput");
    const resultsContainer = document.getElementById("searchMaterialResults");

    const doSearch = () => {
      const q = input.value.toLowerCase().trim();
      const items = this.model.getItems().filter(i => i.nombre.toLowerCase().includes(q));

      if (items.length === 0) {
        resultsContainer.innerHTML = `<p style="text-align:center; color:var(--text-sub); padding:20px;">No se encontraron materiales.</p>`;
        return;
      }

      resultsContainer.innerHTML = items.map(i => `
        <div class="material-search-item" data-id="${i.id}">
          <div>
            <strong style="color:#fff; font-size:1rem;">${i.nombre}</strong><br>
            <small style="color:var(--text-sub);">${i.tipo === 'MATERIA_PRIMA' ? 'Materia Prima' : 'Producto Terminado'} • Stock: ${i.stock_actual} ${i.unidad_medida}</small>
          </div>
          <span style="font-size:1.2rem; color:var(--accent-gold);">➔</span>
        </div>
      `).join("");

      resultsContainer.querySelectorAll(".material-search-item").forEach(card => {
        card.addEventListener("click", () => {
          this.selectedMaterialId = card.dataset.id;
          this.currentPage = 1;
          this.filterFrom = null;
          this.filterTo = null;
          this.renderStockDetail();
        });
      });
    };

    input.addEventListener("input", doSearch);
    document.getElementById("btnBackHomeSearch").addEventListener("click", () => this.renderHome());
    doSearch();
  }

  // --- 5. DETALLE DE STOCK, HISTORIAL Y FABRICACIÓN ---
  renderStockDetail() {
    const item = this.model.getItemById(this.selectedMaterialId);
    if (!item) { this.renderStockSearch(); return; }

    this.mountTemplate("tmpl-stock-detail-view");
    document.getElementById("headerTitle").textContent = "Detalle: " + item.nombre;

    document.getElementById("detMaterialNombre").textContent = item.nombre;
    const badge = document.getElementById("detMaterialBadge");
    const isRaw = item.tipo === "MATERIA_PRIMA";
    badge.className = `badge ${isRaw ? 'badge-raw' : 'badge-finished'}`;
    badge.textContent = isRaw ? "MATERIA PRIMA" : "PRODUCTO TERMINADO";

    document.getElementById("detMaterialStock").textContent = `${item.stock_actual} ${item.unidad_medida}`;
    document.getElementById("detMaterialCosto").textContent = `$ ${Math.round(item.costo_unitario).toLocaleString()}`;

    // Navegación y Edición
    document.getElementById("btnBackToSearch").addEventListener("click", () => this.renderStockSearch());
    document.getElementById("btnEditCurrentMaterial").addEventListener("click", () => this.renderItemForm(item.id));
    document.getElementById("btnDeleteCurrentMaterial").addEventListener("click", () => {
      if (confirm(`¿Eliminar definitivamente el material "${item.nombre}"?`)) {
        this.model.deleteItem(item.id);
        this.renderStockSearch();
      }
    });

    // Ajuste manual de cantidades
    document.getElementById("btnQuickAdjustStock").addEventListener("click", () => {
      const nuevo = prompt(`Stock actual: ${item.stock_actual} ${item.unidad_medida}.\nIngresa la cantidad real física en bodega:`, item.stock_actual);
      if (nuevo !== null && !isNaN(parseFloat(nuevo))) {
        const motivo = prompt("Motivo del ajuste:", "Conteo físico en bodega");
        this.model.adjustStockManual(item.id, parseFloat(nuevo), motivo);
        this.renderStockDetail();
      }
    });

    // Validar Lista de Materiales / Módulo de Fabricación
    const fabSection = document.getElementById("fabricationSection");
    const bom = this.model.getBOMByProductId(item.id);

    if (bom) {
      fabSection.innerHTML = `
        <div class="card" style="border: 1px dashed var(--accent-gold);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="color:var(--accent-gold); font-size:0.95rem;">Lista de Materiales Vinculada</h3>
              <small style="color:var(--text-sub);">${bom.nombre} (Rinde ${bom.lote_rendimiento} uds)</small>
            </div>
            <button id="btnTriggerFabrication" class="btn-primary btn-sm">⚙️ Fabricar Lote</button>
          </div>
        </div>
      `;
      document.getElementById("btnTriggerFabrication").addEventListener("click", () => {
        this.showExternalModuleNotice("Módulo de Fabricación (Órdenes de Producción)");
      });
    }

    this.renderMovimientosTable(item);
  }

  renderMovimientosTable(item) {
    const allMovs = this.model.getMovimientos(item.id, this.filterFrom, this.filterTo);
    const tbody = document.getElementById("movimientosTbody");

    // Cálculo del costo total de la selección filtrada
    const costoTotalFiltrado = allMovs.reduce((acc, curr) => acc + (curr.cantidad * curr.costo_unitario_momento), 0);
    document.getElementById("lblCostoTotalFiltrado").textContent = `$ ${Math.round(costoTotalFiltrado).toLocaleString()}`;

    // Paginación
    const totalPages = Math.max(1, Math.ceil(allMovs.length / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const paginatedMovs = allMovs.slice(start, start + this.pageSize);

    if (paginatedMovs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-sub); padding:16px;">Sin movimientos en el período seleccionado.</td></tr>`;
    } else {
      tbody.innerHTML = paginatedMovs.map(m => {
        const isEntry = m.tipo_movimiento === "ENTRADA";
        const dateStr = new Date(m.fecha).toLocaleDateString();
        return `
          <tr>
            <td><small>${dateStr}</small></td>
            <td><span class="badge ${isEntry ? 'badge-finished' : 'badge-low-stock'}">${m.tipo_movimiento}</span></td>
            <td><strong>${m.cantidad} ${item.unidad_medida}</strong></td>
            <td>$ ${Math.round(m.costo_unitario_momento).toLocaleString()}</td>
            <td><small style="color:var(--text-sub);">${m.motivo || '--'}</small></td>
          </tr>
        `;
      }).join("");
    }

    document.getElementById("lblPageIndicator").textContent = `Página ${this.currentPage} de ${totalPages}`;
    document.getElementById("btnPrevPage").disabled = this.currentPage === 1;
    document.getElementById("btnNextPage").disabled = this.currentPage === totalPages;

    document.getElementById("btnPrevPage").onclick = () => {
      if (this.currentPage > 1) { this.currentPage--; this.renderMovimientosTable(item); }
    };
    document.getElementById("btnNextPage").onclick = () => {
      if (this.currentPage < totalPages) { this.currentPage++; this.renderMovimientosTable(item); }
    };

    document.getElementById("btnFiltrarMovs").onclick = () => {
      const fDesde = document.getElementById("filtroFechaDesde").value;
      const fHasta = document.getElementById("filtroFechaHasta").value;
      this.filterFrom = fDesde ? new Date(fDesde).getTime() : null;
      this.filterTo = fHasta ? new Date(fHasta).setHours(23, 59, 59, 999) : null;
      this.currentPage = 1;
      this.renderMovimientosTable(item);
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new InventoryController();
});
