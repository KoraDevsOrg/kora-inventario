import { InventoryModel } from "./store.js";

class InventoryController {
  constructor() {
    this.model = new InventoryModel();
    this.mainEl = document.getElementById("appContent");
    
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
    const btnOpen = document.getElementById("btnOpenDrawer");
    const btnClose = document.getElementById("btnCloseDrawer");

    const toggle = (open) => {
      if (drawer) drawer.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("active", open);
    };

    if (btnOpen) btnOpen.onclick = () => toggle(true);
    if (btnClose) btnClose.onclick = () => toggle(false);
    if (backdrop) backdrop.onclick = () => toggle(false);

    document.querySelectorAll(".drawer-item").forEach(btn => {
      btn.onclick = () => {
        toggle(false);
        const action = btn.dataset.action;
        if (action === "home") this.renderHome();
        else this.showExternalModuleNotice(btn.textContent.trim());
      };
    });

    const btnAdmin = document.getElementById("btnOpenKoraAdmin");
    if (btnAdmin) {
      btnAdmin.onclick = () => {
        toggle(false);
        window.location.href = "intent://org.koradevs.admindb/#Intent;scheme=package;end";
      };
    }
  }

  showExternalModuleNotice(modName) {
    this.mainEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px 16px;">
        <span style="font-size: 2.5rem;">📦</span>
        <h2 style="color: var(--accent-gold); margin: 12px 0; font-size: 1.25rem;">${modName}</h2>
        <p style="color: var(--text-sub); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px;">
          Este módulo está desacoplado para mantener el inventario puramente físico. Puedes abrirlo o instalarlo desde <strong>Kora Admin DB</strong> para compartir el catálogo.
        </p>
        <button id="btnReturnHomeNotice" class="btn-primary" style="width: 100%;">Volver al Inventario</button>
      </div>
    `;
    const btn = document.getElementById("btnReturnHomeNotice");
    if (btn) btn.onclick = () => this.renderHome();
  }

  mountTemplate(tmplId) {
    this.mainEl.innerHTML = "";
    const tmpl = document.getElementById(tmplId);
    if (!tmpl) return;
    this.mainEl.appendChild(tmpl.content.cloneNode(true));
  }

  // --- 1. PANTALLA PRINCIPAL (HUB TÁCTIL) ---
  renderHome() {
    this.mountTemplate("tmpl-home-view");
    document.getElementById("headerTitle").textContent = "Kora Inventario";

    const btnNewItem = document.getElementById("btnActionNewItem");
    const btnBOM = document.getElementById("btnActionBOM");
    const btnStock = document.getElementById("btnActionStockReport");

    if (btnNewItem) btnNewItem.onclick = () => this.renderItemForm(null);
    if (btnBOM) btnBOM.onclick = () => this.renderBOMForm();
    if (btnStock) btnStock.onclick = () => this.renderStockSearch();
  }

  // --- 2. FORMULARIO: CREAR Y EDITAR MATERIAL ---
  renderItemForm(itemId = null) {
    this.mountTemplate("tmpl-item-form-view");
    document.getElementById("headerTitle").textContent = itemId ? "Editar Material" : "Nuevo Material";

    const item = itemId ? this.model.getItemById(itemId) : null;
    const form = document.getElementById("itemForm");
    const titleEl = document.getElementById("itemFormTitle");
    const idInput = document.getElementById("itemId");
    const nombreInput = document.getElementById("itemNombre");
    const tipoSelect = document.getElementById("itemTipo");
    const unidadSelect = document.getElementById("itemUnidad");
    const stockInput = document.getElementById("itemStock");
    const stockMinInput = document.getElementById("itemStockMin");
    const proveedorInput = document.getElementById("itemProveedor");

    if (item) {
      if (titleEl) titleEl.textContent = "Editar Material";
      idInput.value = item.id;
      nombreInput.value = item.nombre;
      tipoSelect.value = item.tipo;
      unidadSelect.value = item.unidad_medida;
      stockInput.value = item.stock_actual;
      stockMinInput.value = item.stock_minimo;
      proveedorInput.value = item.proveedor || "";
    }

    const btnBack = document.getElementById("btnBackHome");
    const btnCancel = document.getElementById("btnCancelItemForm");
    if (btnBack) btnBack.onclick = () => (itemId ? this.renderStockDetail() : this.renderHome());
    if (btnCancel) btnCancel.onclick = () => (itemId ? this.renderStockDetail() : this.renderHome());

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const saved = this.model.saveItem({
          id: idInput.value || null,
          nombre: nombreInput.value.trim(),
          tipo: tipoSelect.value,
          unidad_medida: unidadSelect.value,
          stock_actual: parseFloat(stockInput.value) || 0,
          stock_minimo: parseFloat(stockMinInput.value) || 0,
          proveedor: proveedorInput.value.trim()
        });

        this.selectedMaterialId = saved.id;
        this.renderStockDetail();
      };
    }
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
    if (selProd) {
      selProd.innerHTML = finishedItems.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");
    }

    const rowsContainer = document.getElementById("bomMaterialsRows");
    const addRow = () => {
      const row = document.createElement("div");
      row.className = "ingredient-selection-row";
      row.innerHTML = `
        <select class="input-field select-raw" style="flex:2;">
          ${rawItems.map(m => `<option value="${m.id}">${m.nombre} (${m.unidad_medida})</option>`).join("")}
        </select>
        <input type="number" step="any" class="input-field input-qty" style="flex:1;" placeholder="Cantidad" required>
        <button type="button" class="btn-delete">✕</button>
      `;
      row.querySelector(".btn-delete").onclick = () => row.remove();
      rowsContainer.appendChild(row);
    };

    const btnAdd = document.getElementById("btnAddBOMRow");
    if (btnAdd) btnAdd.onclick = addRow;
    addRow();

    const btnBack = document.getElementById("btnBackHomeBOM");
    const btnCancel = document.getElementById("btnCancelBOM");
    if (btnBack) btnBack.onclick = () => this.renderHome();
    if (btnCancel) btnCancel.onclick = () => this.renderHome();

    const form = document.getElementById("bomForm");
    if (form) {
      form.onsubmit = (e) => {
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
      };
    }
  }

  // --- 4. BÚSQUEDA Y PARÁMETRO DE SELECCIÓN ---
  renderStockSearch() {
    this.mountTemplate("tmpl-stock-search-view");
    document.getElementById("headerTitle").textContent = "Consultar Material";

    const input = document.getElementById("searchMaterialInput");
    const resultsContainer = document.getElementById("searchMaterialResults");
    const btnBack = document.getElementById("btnBackHomeSearch");
    if (btnBack) btnBack.onclick = () => this.renderHome();

    const doSearch = () => {
      const q = input ? input.value.toLowerCase().trim() : "";
      const items = this.model.getItems().filter(i => i.nombre.toLowerCase().includes(q));

      if (items.length === 0) {
        resultsContainer.innerHTML = `<p style="text-align:center; color:var(--text-sub); padding:20px;">No se encontraron materiales.</p>`;
        return;
      }

      resultsContainer.innerHTML = items.map(i => `
        <div class="material-search-item" data-id="${i.id}">
          <div>
            <strong style="color:#fff; font-size:1rem;">${i.nombre}</strong><br>
            <small style="color:var(--text-sub);">${i.tipo === 'MATERIA_PRIMA' ? 'Materia Prima' : 'Producto Terminado'} • Stock: <strong>${i.stock_actual} ${i.unidad_medida}</strong></small>
          </div>
          <span style="font-size:1.1rem; color:var(--accent-gold);">➔</span>
        </div>
      `).join("");

      resultsContainer.querySelectorAll(".material-search-item").forEach(card => {
        card.onclick = () => {
          this.selectedMaterialId = card.dataset.id;
          this.currentPage = 1;
          this.filterFrom = null;
          this.filterTo = null;
          this.renderStockDetail();
        };
      });
    };

    if (input) input.oninput = doSearch;
    doSearch();
  }

  // --- 5. DETALLE FÍSICO Y KARDEX DE MOVIMIENTOS ---
  renderStockDetail() {
    const item = this.model.getItemById(this.selectedMaterialId);
    if (!item) {
      this.renderStockSearch();
      return;
    }

    this.mountTemplate("tmpl-stock-detail-view");
    document.getElementById("headerTitle").textContent = "Detalle: " + item.nombre;

    document.getElementById("detMaterialNombre").textContent = item.nombre;
    const badge = document.getElementById("detMaterialBadge");
    const isRaw = item.tipo === "MATERIA_PRIMA";
    badge.className = `badge ${isRaw ? 'badge-raw' : 'badge-finished'}`;
    badge.textContent = isRaw ? "MATERIA PRIMA" : "PRODUCTO TERMINADO";

    document.getElementById("detMaterialStock").textContent = `${item.stock_actual} ${item.unidad_medida}`;
    document.getElementById("detMaterialStockMin").textContent = `${item.stock_minimo} ${item.unidad_medida}`;

    const btnBack = document.getElementById("btnBackToSearch");
    if (btnBack) btnBack.onclick = () => this.renderStockSearch();

    const btnEdit = document.getElementById("btnEditCurrentMaterial");
    if (btnEdit) btnEdit.onclick = () => this.renderItemForm(item.id);

    const btnDelete = document.getElementById("btnDeleteCurrentMaterial");
    if (btnDelete) {
      btnDelete.onclick = () => {
        if (confirm(`¿Eliminar definitivamente el material "${item.nombre}"?`)) {
          this.model.deleteItem(item.id);
          this.renderStockSearch();
        }
      };
    }

    // Ajuste manual directo
    const btnAdjust = document.getElementById("btnQuickAdjustStock");
    if (btnAdjust) {
      btnAdjust.onclick = () => {
        const nuevo = prompt(`Stock actual: ${item.stock_actual} ${item.unidad_medida}.\nIngresa la cantidad física real en bodega:`, item.stock_actual);
        if (nuevo !== null && !isNaN(parseFloat(nuevo))) {
          const motivo = prompt("Motivo del conteo físico:", "Conteo de inventario");
          this.model.adjustStockManual(item.id, parseFloat(nuevo), motivo);
          this.renderStockDetail();
        }
      };
    }

    // Verificar si hay desajuste entre Kardex y Cabecera
    const movs = this.model.getMovimientos(item.id);
    let balanceKardex = 0;
    movs.forEach(m => {
      if (m.tipo_movimiento === "ENTRADA") balanceKardex += Number(m.cantidad);
      else if (m.tipo_movimiento === "SALIDA") balanceKardex -= Number(m.cantidad);
    });

    const diff = Number(item.stock_actual) - balanceKardex;
    const fabSection = document.getElementById("fabricationSection");

    // Si hay discrepancia, mostrar banner de reconciliación
    if (diff !== 0 && fabSection) {
      fabSection.innerHTML = `
        <div class="card" style="border: 1px solid var(--red-alert); background: rgba(239, 68, 68, 0.1);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#fca5a5; font-size:0.9rem;">⚠️ Desajuste Detectado</strong>
              <p style="color:var(--text-sub); font-size:0.75rem; margin-top:2px;">
                Stock registrado (${item.stock_actual}) no coincide con el balance de movimientos (${balanceKardex}).
              </p>
            </div>
            <button id="btnReconcile" class="btn-primary btn-sm" style="background:#ef4444; color:#fff;">
              Cuadrar a ${balanceKardex}
            </button>
          </div>
        </div>
      `;
      document.getElementById("btnReconcile").onclick = () => {
        this.model.reconcileItemStock(item.id);
        alert("Stock ajustado correctamente al balance contable del Kardex.");
        this.renderStockDetail();
      };
    } else {
      // Si está cuadrado, revisar si tiene BOM
      const bom = this.model.getBOMByProductId(item.id);
      if (bom && fabSection) {
        fabSection.innerHTML = `
          <div class="card" style="border: 1px dashed var(--accent-gold);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h3 style="color:var(--accent-gold); font-size:0.95rem; font-weight:800;">Lista de Materiales Vinculada</h3>
                <small style="color:var(--text-sub);">${bom.nombre} (Lote: ${bom.lote_rendimiento} ${item.unidad_medida})</small>
              </div>
              <button id="btnTriggerFabrication" class="btn-primary btn-sm">⚙️ Fabricar Lote</button>
            </div>
          </div>
        `;
        const btnFab = document.getElementById("btnTriggerFabrication");
        if (btnFab) {
          btnFab.onclick = () => this.showExternalModuleNotice("Módulo Kora Fabricación (Órdenes de Producción)");
        }
      }
    }

    const btnCostos = document.getElementById("btnGoModuleCostos");
    if (btnCostos) {
      btnCostos.onclick = () => this.showExternalModuleNotice("Módulo Kora Costos (Valuación de Existencias)");
    }

    this.renderMovimientosTable(item);
  }

  renderMovimientosTable(item) {
    const allMovs = this.model.getMovimientos(item.id, this.filterFrom, this.filterTo);
    const tbody = document.getElementById("movimientosTbody");

    const totalPages = Math.max(1, Math.ceil(allMovs.length / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const paginatedMovs = allMovs.slice(start, start + this.pageSize);

    if (paginatedMovs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-sub); padding:16px;">Sin movimientos registrados para este material.</td></tr>`;
    } else {
      tbody.innerHTML = paginatedMovs.map(m => {
        const isEntry = m.tipo_movimiento === "ENTRADA";
        const dateStr = new Date(m.fecha).toLocaleDateString();
        return `
          <tr>
            <td><small>${dateStr}</small></td>
            <td><span class="badge ${isEntry ? 'badge-finished' : 'badge-low-stock'}">${m.tipo_movimiento}</span></td>
            <td><strong>${isEntry ? '+' : '-'}${m.cantidad} ${item.unidad_medida}</strong></td>
            <td><small style="color:var(--text-sub);">${m.motivo || '--'}</small></td>
          </tr>
        `;
      }).join("");
    }

    const lblPage = document.getElementById("lblPageIndicator");
    const btnPrev = document.getElementById("btnPrevPage");
    const btnNext = document.getElementById("btnNextPage");

    if (lblPage) lblPage.textContent = `Página ${this.currentPage} de ${totalPages}`;
    if (btnPrev) {
      btnPrev.disabled = this.currentPage === 1;
      btnPrev.onclick = () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderMovimientosTable(item);
        }
      };
    }
    if (btnNext) {
      btnNext.disabled = this.currentPage === totalPages;
      btnNext.onclick = () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderMovimientosTable(item);
        }
      };
    }

    const btnFiltrar = document.getElementById("btnFiltrarMovs");
    if (btnFiltrar) {
      btnFiltrar.onclick = () => {
        const fDesde = document.getElementById("filtroFechaDesde").value;
        const fHasta = document.getElementById("filtroFechaHasta").value;
        this.filterFrom = fDesde ? new Date(fDesde).getTime() : null;
        this.filterTo = fHasta ? new Date(fHasta).setHours(23, 59, 59, 999) : null;
        this.currentPage = 1;
        this.renderMovimientosTable(item);
      };
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new InventoryController();
});
