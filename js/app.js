import { INITIAL_ITEMS, INITIAL_RECIPES } from "./data/seed_data.js";
import { KoraI18n, KORA_LANGUAGES } from "https://cdn.jsdelivr.net/gh/KoraDevsOrg/kora-web-sdk@main/kora-i18n.js";

class InventoryApp {
  constructor() {
    this.i18n = new KoraI18n("kora_inv_lang", "es");
    this.items = [...INITIAL_ITEMS];
    this.recipes = [...INITIAL_RECIPES];
    this.currentView = "items"; // 'items' o 'recipes'

    this.cacheDom();
    this.populateLanguageOptions();
    this.bindEvents();
    this.initKoraSync();
    this.render();
  }

  cacheDom() {
    this.sideDrawer = document.getElementById("sideDrawer");
    this.drawerBackdrop = document.getElementById("drawerBackdrop");
    this.btnOpenDrawer = document.getElementById("btnOpenDrawer");
    this.btnCloseDrawer = document.getElementById("btnCloseDrawer");
    this.langSelect = document.getElementById("langSelect");
    this.appTitle = document.getElementById("appTitle");
    this.offlineBadge = document.getElementById("offlineBadge");
    this.footerText = document.getElementById("footerText");
    this.drawerTitle = document.getElementById("drawerTitle");

    // Pestañas
    this.tabItems = document.getElementById("tabItems");
    this.tabRecipes = document.getElementById("tabRecipes");
    this.viewItems = document.getElementById("viewItems");
    this.viewRecipes = document.getElementById("viewRecipes");

    // Botones y contenedores
    this.btnNewItem = document.getElementById("btnNewItem");
    this.btnNewRecipe = document.getElementById("btnNewRecipe");
    this.itemsTableBody = document.getElementById("itemsTableBody");
    this.recipesContainer = document.getElementById("recipesContainer");
  }

  populateLanguageOptions() {
    this.langSelect.innerHTML = "";
    Object.values(KORA_LANGUAGES).forEach((lang) => {
      const opt = document.createElement("option");
      opt.value = lang.code;
      opt.textContent = lang.name;
      this.langSelect.appendChild(opt);
    });
    this.langSelect.value = this.i18n.getLang();
  }

  bindEvents() {
    this.btnOpenDrawer.addEventListener("click", () => this.toggleDrawer(true));
    this.btnCloseDrawer.addEventListener("click", () => this.toggleDrawer(false));
    this.drawerBackdrop.addEventListener("click", () => this.toggleDrawer(false));

    this.langSelect.addEventListener("change", (e) => {
      this.i18n.setLang(e.target.value);
      this.render();
    });

    this.tabItems.addEventListener("click", () => this.switchTab("items"));
    this.tabRecipes.addEventListener("click", () => this.switchTab("recipes"));

    this.btnNewItem.addEventListener("click", () => this.promptNewItem());
    this.btnNewRecipe.addEventListener("click", () => this.promptNewRecipe());
  }

  toggleDrawer(open) {
    this.sideDrawer.classList.toggle("open", open);
    this.drawerBackdrop.classList.toggle("active", open);
  }

  switchTab(tab) {
    this.currentView = tab;
    this.tabItems.classList.toggle("active", tab === "items");
    this.tabRecipes.classList.toggle("active", tab === "recipes");
    this.viewItems.classList.toggle("active", tab === "items");
    this.viewRecipes.classList.toggle("active", tab === "recipes");
    this.render();
  }

  render() {
    this.appTitle.textContent = this.i18n.t("invTitle");
    this.offlineBadge.textContent = this.i18n.t("offlineTag");
    this.footerText.textContent = this.i18n.t("invFooter");
    this.drawerTitle.textContent = this.i18n.t("invMenu");

    this.tabItems.textContent = this.i18n.t("invTabItems");
    this.tabRecipes.textContent = this.i18n.t("invTabRecipes");
    this.btnNewItem.textContent = this.i18n.t("invBtnNewItem");
    this.btnNewRecipe.textContent = this.i18n.t("invBtnNewRecipe");

    if (this.currentView === "items") {
      this.renderItemsTable();
    } else {
      this.renderRecipesList();
    }
  }

  renderItemsTable() {
    this.itemsTableBody.innerHTML = "";

    this.items.forEach((item) => {
      const isRaw = item.tipo === "MATERIA_PRIMA";
      const isLowStock = item.stock_actual <= item.stock_minimo;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>
          <strong>${item.nombre}</strong><br>
          <small style="color: var(--text-sub);">${item.proveedor} (Rep: ${item.reposicion_dias}d)</small>
        </td>
        <td>
          <span class="badge ${isRaw ? 'badge-raw' : 'badge-finished'}">
            ${isRaw ? 'MATERIA PRIMA' : 'TERMINADO'}
          </span>
        </td>
        <td>
          <strong>${item.stock_actual} ${item.unidad_medida}</strong>
          ${isLowStock ? '<br><span class="badge badge-low-stock">BAJO STOCK</span>' : ''}
        </td>
        <td>
          Costo: $${Math.round(item.costo_unitario).toLocaleString()}<br>
          ${!isRaw ? `<strong style="color: var(--accent-green);">Venta: $${Math.round(item.precio_venta).toLocaleString()}</strong>` : ''}
        </td>
      `;
      this.itemsTableBody.appendChild(row);
    });
  }

  renderRecipesList() {
    this.recipesContainer.innerHTML = "";

    this.recipes.forEach((receta) => {
      const producto = this.items.find((i) => i.id === receta.producto_terminado_id) || { nombre: "Desconocido" };
      const card = document.createElement("div");
      card.className = "card";

      // CÁLCULO DE EXPLOSIÓN: Lote -> Unidad individual
      let costoInsumosLote = 0;
      const ingredientesCalculados = receta.ingredientes.map((ing) => {
        const itemMateria = this.items.find((i) => i.id === ing.materia_prima_id);
        const costoIngredienteLote = itemMateria ? (ing.cantidad_lote * itemMateria.costo_unitario) : 0;
        costoInsumosLote += costoIngredienteLote;

        // Desglose por unidad individual
        const consumoUnitario = ing.cantidad_lote / receta.lote_rendimiento;
        const costoUnitarioIngrediente = costoIngredienteLote / receta.lote_rendimiento;

        return {
          nombre: itemMateria ? itemMateria.nombre : ing.materia_prima_id,
          unidad: itemMateria ? itemMateria.unidad_medida : "",
          cantidadLote: ing.cantidad_lote,
          consumoUnitario: consumoUnitario.toFixed(3),
          costoUnit: Math.round(costoUnitarioIngrediente)
        };
      });

      // Factor de merma sobre insumos
      const costoInsumosConMerma = costoInsumosLote * (1 + (receta.merma_porcentaje / 100));
      const costoTotalLote = costoInsumosConMerma + receta.mano_obra_lote;
      const costoFinalPorUnidad = costoTotalLote / receta.lote_rendimiento;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h2 style="font-size: 1.1rem; color: var(--accent-gold);">${receta.nombre}</h2>
          <span class="badge badge-finished">${receta.lote_rendimiento} Uds / Lote</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-sub);">
          Producto producido: <strong>${producto.nombre}</strong> • Tiempo: ${receta.tiempo_fabricacion_minutos} min
        </p>

        <div class="recipe-breakdown">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-sub); margin-bottom: 6px;">
            Desglose Unitario Automático (Por cada 1 unidad):
          </div>
          ${ingredientesCalculados.map(ing => `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 3px 0;">
              <span>• ${ing.nombre}: <strong>${ing.consumoUnitario} ${ing.unidad}</strong></span>               <span style="color: var(--text-sub);">$ ${ing.costoUnit.toLocaleString()}</span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 3px 0; border-top: 1px solid var(--border); margin-top: 4px;">
            <span>• Mano de obra unitaria:</span>
            <span>$ ${Math.round(receta.mano_obra_lote / receta.lote_rendimiento).toLocaleString()}</span>
          </div>
        </div>

        <div class="unit-calc-highlight">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-sub);">Costo Unitario Real Fabricación</div>
            <div style="font-size: 0.75rem; color: var(--accent-green);">(Incluye insumos, merma ${receta.merma_porcentaje}% y mano de obra)</div>
          </div>
          <div class="unit-calc-val">$ ${Math.round(costoFinalPorUnidad).toLocaleString()}</div>
        </div>
      `;

      this.recipesContainer.appendChild(card);
    });
  }

  promptNewItem() {
    const nombre = prompt("Nombre del Insumo o Producto:");
    if (!nombre) return;
    const esTerminado = confirm("¿Es un PRODUCTO TERMINADO para la venta directa?\n(Aceptar: Producto Terminado, Cancelar: Materia Prima)");
    const unidad = prompt("Unidad de medida (kg, gr, unidad, litro, metro):", esTerminado ? "unidad" : "kg") || "unidad";
    const stock = parseFloat(prompt("Stock inicial:", "10")) || 0;
    const costo = parseFloat(prompt("Costo de compra o valor unitario ($):", "1000")) || 0;
    const precio = esTerminado ? (parseFloat(prompt("Precio de Venta al Público ($):", "2500")) || 0) : 0;

    const newItem = {
      id: `item_${Date.now()}`,
      nombre,
      tipo: esTerminado ? "PRODUCTO_TERMINADO" : "MATERIA_PRIMA",
      unidad_medida: unidad,
      stock_actual: stock,
      stock_minimo: 5,
      costo_unitario: costo,
      precio_venta: precio,
      proveedor: "Proveedor Local",
      reposicion_dias: 2
    };

    this.items.push(newItem);
    this.render();
  }

  promptNewRecipe() {
    const nombre = prompt("Nombre de la Receta (ej: Lote 50 Empanadas):");
    if (!nombre) return;
    const rendimiento = parseInt(prompt("¿Cuántas unidades rinde este lote?", "50"), 10) || 1;
    const manoObra = parseFloat(prompt("Costo de mano de obra total del lote ($):", "15000")) || 0;
    const merma = parseFloat(prompt("Porcentaje de merma / imprevistos (%):", "5")) || 0;

    const materiasPrimas = this.items.filter(i => i.tipo === "MATERIA_PRIMA");
    if (materiasPrimas.length === 0) {
      alert("Debes tener materias primas creadas para ensamblar una receta.");
      return;
    }

    const ingredientes = [];
    alert(`A continuación selecciona cantidades totales para el lote de ${rendimiento} unidades.`);

    materiasPrimas.forEach(m => {
      const cant = parseFloat(prompt(`Cantidad de [${m.nombre}] en ${m.unidad_medida} para TODO el lote:`, "0"));
      if (cant > 0) {
        ingredientes.push({ materia_prima_id: m.id, cantidad_lote: cant });
      }
    });

    const newRecipe = {
      id: `rec_${Date.now()}`,
      producto_terminado_id: this.items.find(i => i.tipo === "PRODUCTO_TERMINADO")?.id || "prod_empanada_carne",
      nombre,
      lote_rendimiento: rendimiento,
      tiempo_fabricacion_minutos: 60,
      mano_obra_lote: manoObra,
      merma_porcentaje: merma,
      ingredientes
    };

    this.recipes.push(newRecipe);
    this.render();
  }

  // Persistencia SQLite en Kora Admin DB
  async initKoraSync() {
    if (typeof window.KoraSyncEngine !== "undefined") {
      const engine = new window.KoraSyncEngine({
        pkgName: "org.koradevs.negocios.inventario",
        appName: "Kora Inventario y Recetas",
        tableName: "mod_biz_items",
        currentHtmlVersion: "1.0.0",
        tableDdl: `
          CREATE TABLE IF NOT EXISTS mod_biz_items (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            unidad_medida TEXT NOT NULL,
            stock_actual REAL DEFAULT 0,
            stock_minimo REAL DEFAULT 0,
            costo_unitario REAL DEFAULT 0,
            precio_venta REAL DEFAULT 0,
            proveedor TEXT,
            reposicion_dias INTEGER DEFAULT 1
          );

          CREATE TABLE IF NOT EXISTS mod_biz_recetas (
            id TEXT PRIMARY KEY,
            producto_terminado_id TEXT NOT NULL,
            nombre TEXT NOT NULL,
            lote_rendimiento INTEGER NOT NULL,
            mano_obra_lote REAL DEFAULT 0,
            merma_porcentaje REAL DEFAULT 0
          );
        `,
        insertHandler: (db, item) => {
          const sql = `
            INSERT OR REPLACE INTO mod_biz_items 
            (id, nombre, tipo, unidad_medida, stock_actual, stock_minimo, costo_unitario, precio_venta, proveedor, reposicion_dias)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;
          db.execute(sql, JSON.stringify([
            item.id, item.nombre, item.tipo, item.unidad_medida,
            item.stock_actual, item.stock_minimo, item.costo_unitario,
            item.precio_venta, item.proveedor, item.reposicion_dias
          ]));
        }
      });

      await engine.sync(this.items);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new InventoryApp();
});
            
