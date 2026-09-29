/**
 * Capa de Persistencia y Transacciones Relacionales
 * KoraDevsOrg - Licencia MIT
 */

export class InventoryRepository {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";
    this.memoryItems = [];
    this.memoryRecipes = [];
    this.memoryRecipeDetails = [];
    this.initDatabase();
  }

  initDatabase() {
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
        tiempo_fabricacion_minutos INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mod_biz_receta_detalles (
        id TEXT PRIMARY KEY,
        receta_id TEXT NOT NULL,
        materia_prima_id TEXT NOT NULL,
        cantidad_lote REAL NOT NULL,
        FOREIGN KEY (receta_id) REFERENCES mod_biz_recetas(id),
        FOREIGN KEY (materia_prima_id) REFERENCES mod_biz_items(id)
      );
    `;

    if (this.hasBridge) {
      window.KoraDB.registerModule(
        "org.koradevs.negocios.inventario",
        "Kora Inventario y Recetas",
        1,
        ddl
      );
    } else {
      // Semilla inicial en memoria para pruebas directas en navegador web
      this.seedInMemory();
    }
  }

  seedInMemory() {
    if (this.memoryItems.length === 0) {
      this.memoryItems = [
        { id: "item_harina", nombre: "Harina de Maíz", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 25.0, stock_minimo: 5.0, costo_unitario: 4500, precio_venta: 0, proveedor: "Distribuidora Central", reposicion_dias: 2, updated_at: Date.now() },
        { id: "item_carne", nombre: "Carne de Res Molida", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 10.0, stock_minimo: 2.0, costo_unitario: 22000, precio_venta: 0, proveedor: "Carnicería Local", reposicion_dias: 1, updated_at: Date.now() },
        { id: "prod_empanada", nombre: "Empanada de Carne", tipo: "PRODUCTO_TERMINADO", unidad_medida: "unidad", stock_actual: 30.0, stock_minimo: 10.0, costo_unitario: 1400, precio_venta: 2500, proveedor: "Taller Propio", reposicion_dias: 0, updated_at: Date.now() }
      ];
      this.memoryRecipes = [
        { id: "rec_empanadas_20", producto_terminado_id: "prod_empanada", nombre: "Lote Estándar 20 Empanadas", lote_rendimiento: 20, mano_obra_lote: 6000, merma_porcentaje: 5, tiempo_fabricacion_minutos: 60, updated_at: Date.now() }
      ];
      this.memoryRecipeDetails = [
        { id: "det_1", receta_id: "rec_empanadas_20", materia_prima_id: "item_harina", cantidad_lote: 0.8 },
        { id: "det_2", receta_id: "rec_empanadas_20", materia_prima_id: "item_carne", cantidad_lote: 0.5 }
      ];
    }
  }

  // --- TRANSACCIONES DE ITEMS ---
  getAllItems() {
    if (this.hasBridge) {
      const res = window.KoraDB.query("SELECT * FROM mod_biz_items ORDER BY nombre ASC");
      try { return JSON.parse(res); } catch (e) { return []; }
    }
    return [...this.memoryItems];
  }

  insertItem(item) {
    const record = { ...item, id: item.id || `item_${Date.now()}`, updated_at: Date.now() };
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
    } else {
      const idx = this.memoryItems.findIndex(i => i.id === record.id);
      if (idx >= 0) this.memoryItems[idx] = record;
      else this.memoryItems.push(record);
    }
    return record;
  }

  // --- TRANSACCIONES ATÓMICAS DE RECETAS ---
  getAllRecipes() {
    let recipes = [];
    let details = [];

    if (this.hasBridge) {
      try {
        recipes = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_recetas ORDER BY nombre ASC"));
        details = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_receta_detalles"));
      } catch (e) { return []; }
    } else {
      recipes = [...this.memoryRecipes];
      details = [...this.memoryRecipeDetails];
    }

    return recipes.map(r => ({
      ...r,
      ingredientes: details.filter(d => d.receta_id === r.id)
    }));
  }

  saveRecipeTransaction(recipeData, ingredientsArray) {
    const recipeId = recipeData.id || `rec_${Date.now()}`;
    const timestamp = Date.now();

    if (this.hasBridge) {
      // Se utiliza el gestor transaccional de SQLite
      window.KoraDB.execute("BEGIN TRANSACTION;");
      try {
        const sqlRecipe = `
          INSERT OR REPLACE INTO mod_biz_recetas 
          (id, producto_terminado_id, nombre, lote_rendimiento, mano_obra_lote, merma_porcentaje, tiempo_fabricacion_minutos, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sqlRecipe, JSON.stringify([
          recipeId, recipeData.producto_terminado_id, recipeData.nombre,
          recipeData.lote_rendimiento, recipeData.mano_obra_lote,
          recipeData.merma_porcentaje, recipeData.tiempo_fabricacion_minutos, timestamp
        ]));

        // Limpiar detalles anteriores si es edición
        window.KoraDB.execute("DELETE FROM mod_biz_receta_detalles WHERE receta_id = ?;", JSON.stringify([recipeId]));

        const sqlDetail = `
          INSERT INTO mod_biz_receta_detalles (id, receta_id, materia_prima_id, cantidad_lote)
          VALUES (?, ?, ?, ?);
        `;
        ingredientsArray.forEach((ing, idx) => {
          window.KoraDB.execute(sqlDetail, JSON.stringify([
            `det_${recipeId}_${idx}`, recipeId, ing.materia_prima_id, ing.cantidad_lote
          ]));
        });

        window.KoraDB.execute("COMMIT;");
      } catch (e) {
        window.KoraDB.execute("ROLLBACK;");
        throw e;
      }
    } else {
      const rRecord = { ...recipeData, id: recipeId, updated_at: timestamp };
      this.memoryRecipes = this.memoryRecipes.filter(r => r.id !== recipeId);
      this.memoryRecipes.push(rRecord);

      this.memoryRecipeDetails = this.memoryRecipeDetails.filter(d => d.receta_id !== recipeId);
      ingredientsArray.forEach((ing, idx) => {
        this.memoryRecipeDetails.push({
          id: `det_${recipeId}_${idx}`,
          receta_id: recipeId,
          materia_prima_id: ing.materia_prima_id,
          cantidad_lote: ing.cantidad_lote
        });
      });
    }
    return true;
  }
}
