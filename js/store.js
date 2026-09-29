/**
 * MODELO DE DATOS: Inventario y Recetas
 * KoraDevsOrg - Licencia MIT
 */

export class InventoryModel {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";
    this.KEY_ITEMS = "kora_inv_items_v3";
    this.KEY_RECIPES = "kora_inv_recipes_v3";
    this.initDatabase();
  }

  initDatabase() {
    if (this.hasBridge) {
      const ddl = `
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
          reposicion_dias INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mod_biz_recetas (
          id TEXT PRIMARY KEY,
          producto_terminado_id TEXT NOT NULL,
          nombre TEXT NOT NULL,
          lote_rendimiento REAL NOT NULL,
          mano_obra_lote REAL DEFAULT 0,
          merma_porcentaje REAL DEFAULT 0,
          ingredientes_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `;
      window.KoraDB.registerModule("org.koradevs.negocios.inventario", "Kora Inventario", 1, ddl);
    } else {
      if (!localStorage.getItem(this.KEY_ITEMS)) {
        const seedItems = [
          { id: "item_harina", nombre: "Harina de Maíz", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 20, stock_minimo: 5, costo_unitario: 4500, precio_venta: 0, proveedor: "Central de Abastos", reposicion_dias: 2, updated_at: Date.now() },
          { id: "item_carne", nombre: "Carne de Res", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 8, stock_minimo: 2, costo_unitario: 22000, precio_venta: 0, proveedor: "Carnicería Local", reposicion_dias: 1, updated_at: Date.now() },
          { id: "prod_empanada", nombre: "Empanada de Carne", tipo: "PRODUCTO_TERMINADO", unidad_medida: "unidad", stock_actual: 30, stock_minimo: 10, costo_unitario: 1350, precio_venta: 2500, proveedor: "Propio", reposicion_dias: 0, updated_at: Date.now() }
        ];
        localStorage.setItem(this.KEY_ITEMS, JSON.stringify(seedItems));
      }
      if (!localStorage.getItem(this.KEY_RECIPES)) {
        const seedRecipes = [
          {
            id: "rec_empanada",
            producto_terminado_id: "prod_empanada",
            nombre: "Lote 20 Empanadas",
            lote_rendimiento: 20,
            mano_obra_lote: 6000,
            merma_porcentaje: 5,
            ingredientes: [
              { materia_prima_id: "item_harina", cantidad_lote: 0.8 },
              { materia_prima_id: "item_carne", cantidad_lote: 0.5 }
            ],
            updated_at: Date.now()
          }
        ];
        localStorage.setItem(this.KEY_RECIPES, JSON.stringify(seedRecipes));
      }
    }
  }

  getItems() {
    if (this.hasBridge) {
      try {
        const res = window.KoraDB.query("SELECT * FROM mod_biz_items ORDER BY nombre ASC", "[]");
        return JSON.parse(res);
      } catch (e) {
        console.warn("[Model] Fallback de lectura SQLite:", e);
      }
    }
    return JSON.parse(localStorage.getItem(this.KEY_ITEMS) || "[]");
  }

  getItemById(id) {
    return this.getItems().find(i => i.id === id) || null;
  }

  saveItem(item) {
    const items = this.getItems();
    const record = { ...item, id: item.id || `item_${Date.now()}`, updated_at: Date.now() };
    const idx = items.findIndex(i => i.id === record.id);
    
    if (idx >= 0) items[idx] = record;
    else items.push(record);

    localStorage.setItem(this.KEY_ITEMS, JSON.stringify(items));

    if (this.hasBridge) {
      const sql = `
        INSERT OR REPLACE INTO mod_biz_items 
        (id, nombre, tipo, unidad_medida, stock_actual, stock_minimo, costo_unitario, precio_venta, proveedor, reposicion_dias, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      window.KoraDB.execute(sql, JSON.stringify([
        record.id, record.nombre, record.tipo, record.unidad_medida,
        record.stock_actual, record.stock_minimo, record.costo_unitario,
        record.precio_venta, record.proveedor, record.reposicion_dias, record.updated_at
      ]));
    }
    return record;
  }

  getRecipes() {
    if (this.hasBridge) {
      try {
        const res = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_recetas ORDER BY nombre ASC", "[]"));
        return res.map(r => ({
          ...r,
          ingredientes: typeof r.ingredientes_json === "string" ? JSON.parse(r.ingredientes_json) : (r.ingredientes || [])
        }));
      } catch (e) {
        console.warn("[Model] Fallback recetas SQLite:", e);
      }
    }
    return JSON.parse(localStorage.getItem(this.KEY_RECIPES) || "[]");
  }

  saveRecipe(recipe, ingredients) {
    const recipes = this.getRecipes();
    const record = {
      ...recipe,
      id: recipe.id || `rec_${Date.now()}`,
      ingredientes: ingredients,
      updated_at: Date.now()
    };

    const idx = recipes.findIndex(r => r.id === record.id);
    if (idx >= 0) recipes[idx] = record;
    else recipes.push(record);

    localStorage.setItem(this.KEY_RECIPES, JSON.stringify(recipes));

    if (this.hasBridge) {
      const sql = `
        INSERT OR REPLACE INTO mod_biz_recetas 
        (id, producto_terminado_id, nombre, lote_rendimiento, mano_obra_lote, merma_porcentaje, ingredientes_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
      window.KoraDB.execute(sql, JSON.stringify([
        record.id, record.producto_terminado_id, record.nombre,
        record.lote_rendimiento, record.mano_obra_lote,
        record.merma_porcentaje, JSON.stringify(ingredients), record.updated_at
      ]));
    }
    return record;
  }
}
