/**
 * MODELO DE DATOS: Inventario, Lista de Materiales (BOM) y Movimientos
 * KoraDevsOrg - Licencia MIT
 */

export class InventoryModel {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";
    this.KEY_ITEMS = "kora_inv_items_v4";
    this.KEY_BOM = "kora_inv_bom_v4";
    this.KEY_MOVS = "kora_inv_movs_v4";
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
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mod_biz_bom (
          id TEXT PRIMARY KEY,
          producto_terminado_id TEXT NOT NULL,
          nombre TEXT NOT NULL,
          lote_rendimiento REAL NOT NULL,
          materiales_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mod_biz_movimientos (
          id TEXT PRIMARY KEY,
          material_id TEXT NOT NULL,
          tipo_movimiento TEXT NOT NULL,
          cantidad REAL NOT NULL,
          costo_unitario_momento REAL NOT NULL,
          motivo TEXT,
          fecha INTEGER NOT NULL
        );
      `;
      window.KoraDB.registerModule("org.koradevs.negocios.inventario", "Kora Inventario", 1, ddl);
    } else {
      if (!localStorage.getItem(this.KEY_ITEMS)) {
        const seedItems = [
          { id: "item_harina", nombre: "Harina de Maíz", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 25, stock_minimo: 5, costo_unitario: 4500, precio_venta: 0, proveedor: "Distribuidora Central", updated_at: Date.now() },
          { id: "item_carne", nombre: "Carne Molida", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 10, stock_minimo: 2, costo_unitario: 22000, precio_venta: 0, proveedor: "Carnicería La 10", updated_at: Date.now() },
          { id: "prod_empanada", nombre: "Empanada Tradicional", tipo: "PRODUCTO_TERMINADO", unidad_medida: "unidad", stock_actual: 40, stock_minimo: 15, costo_unitario: 1350, precio_venta: 2500, proveedor: "Fabricación Propia", updated_at: Date.now() }
        ];
        localStorage.setItem(this.KEY_ITEMS, JSON.stringify(seedItems));
      }

      if (!localStorage.getItem(this.KEY_BOM)) {
        const seedBOM = [
          {
            id: "bom_empanada",
            producto_terminado_id: "prod_empanada",
            nombre: "Empanada Estándar (Lote 20)",
            lote_rendimiento: 20,
            materiales: [
              { material_id: "item_harina", cantidad_lote: 0.8 },
              { material_id: "item_carne", cantidad_lote: 0.5 }
            ],
            updated_at: Date.now()
          }
        ];
        localStorage.setItem(this.KEY_BOM, JSON.stringify(seedBOM));
      }

      if (!localStorage.getItem(this.KEY_MOVS)) {
        const now = Date.now();
        const seedMovs = [
          { id: "mov_1", material_id: "item_harina", tipo_movimiento: "ENTRADA", cantidad: 30, costo_unitario_momento: 4000, motivo: "Compra inicial proveedor", fecha: now - 86400000 * 5 },
          { id: "mov_2", material_id: "item_harina", tipo_movimiento: "SALIDA", cantidad: 5, costo_unitario_momento: 4000, motivo: "Producción lote prueba", fecha: now - 86400000 * 3 },
          { id: "mov_3", material_id: "item_harina", tipo_movimiento: "ENTRADA", cantidad: 10, costo_unitario_momento: 4500, motivo: "Reposición (aumento de precio)", fecha: now - 86400000 * 1 },
          { id: "mov_4", material_id: "prod_empanada", tipo_movimiento: "ENTRADA", cantidad: 40, costo_unitario_momento: 1350, motivo: "Producción de lote", fecha: now - 86400000 * 2 }
        ];
        localStorage.setItem(this.KEY_MOVS, JSON.stringify(seedMovs));
      }
    }
  }

  getItems() {
    if (this.hasBridge) {
      try {
        return JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_items ORDER BY nombre ASC", "[]"));
      } catch (e) { console.warn(e); }
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
        (id, nombre, tipo, unidad_medida, stock_actual, stock_minimo, costo_unitario, precio_venta, proveedor, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      window.KoraDB.execute(sql, JSON.stringify([
        record.id, record.nombre, record.tipo, record.unidad_medida,
        record.stock_actual, record.stock_minimo, record.costo_unitario,
        record.precio_venta, record.proveedor, record.updated_at
      ]));
    }
    return record;
  }

  deleteItem(id) {
    const items = this.getItems().filter(i => i.id !== id);
    localStorage.setItem(this.KEY_ITEMS, JSON.stringify(items));
    if (this.hasBridge) {
      window.KoraDB.execute("DELETE FROM mod_biz_items WHERE id = ?;", JSON.stringify([id]));
    }
  }

  getBOMs() {
    if (this.hasBridge) {
      try {
        const res = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_bom ORDER BY nombre ASC", "[]"));
        return res.map(b => ({
          ...b,
          materiales: typeof b.materiales_json === "string" ? JSON.parse(b.materiales_json) : (b.materiales || [])
        }));
      } catch (e) { console.warn(e); }
    }
    return JSON.parse(localStorage.getItem(this.KEY_BOM) || "[]");
  }

  getBOMByProductId(prodId) {
    return this.getBOMs().find(b => b.producto_terminado_id === prodId) || null;
  }

  saveBOM(bomData, materialsArray) {
    const boms = this.getBOMs();
    const record = {
      ...bomData,
      id: bomData.id || `bom_${Date.now()}`,
      materiales: materialsArray,
      updated_at: Date.now()
    };
    const idx = boms.findIndex(b => b.id === record.id);
    if (idx >= 0) boms[idx] = record;
    else boms.push(record);

    localStorage.setItem(this.KEY_BOM, JSON.stringify(boms));

    if (this.hasBridge) {
      const sql = `
        INSERT OR REPLACE INTO mod_biz_bom 
        (id, producto_terminado_id, nombre, lote_rendimiento, materiales_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      window.KoraDB.execute(sql, JSON.stringify([
        record.id, record.producto_terminado_id, record.nombre,
        record.lote_rendimiento, JSON.stringify(materialsArray), record.updated_at
      ]));
    }
    return record;
  }

  getMovimientos(materialId, fechaInicio = null, fechaFin = null) {
    let movs = [];
    if (this.hasBridge) {
      try {
        movs = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_movimientos WHERE material_id = ? ORDER BY fecha DESC", JSON.stringify([materialId])));
      } catch (e) { console.warn(e); }
    } else {
      movs = JSON.parse(localStorage.getItem(this.KEY_MOVS) || "[]").filter(m => m.material_id === materialId);
    }

    if (fechaInicio) movs = movs.filter(m => m.fecha >= fechaInicio);
    if (fechaFin) movs = movs.filter(m => m.fecha <= fechaFin);
    return movs.sort((a, b) => b.fecha - a.fecha);
  }

  adjustStockManual(materialId, nuevoStock, motivo) {
    const item = this.getItemById(materialId);
    if (!item) return;

    const diferencia = nuevoStock - Number(item.stock_actual);
    if (diferencia === 0) return;

    const tipo = diferencia > 0 ? "ENTRADA" : "SALIDA";
    const movRecord = {
      id: `mov_${Date.now()}`,
      material_id: materialId,
      tipo_movimiento: tipo,
      cantidad: Math.abs(diferencia),
      costo_unitario_momento: Number(item.costo_unitario),
      motivo: motivo || "Ajuste manual de existencias",
      fecha: Date.now()
    };

    // Actualizar movimiento
    const allMovs = JSON.parse(localStorage.getItem(this.KEY_MOVS) || "[]");
    allMovs.push(movRecord);
    localStorage.setItem(this.KEY_MOVS, JSON.stringify(allMovs));

    if (this.hasBridge) {
      const sqlMov = `INSERT INTO mod_biz_movimientos (id, material_id, tipo_movimiento, cantidad, costo_unitario_momento, motivo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?);`;
      window.KoraDB.execute(sqlMov, JSON.stringify([movRecord.id, movRecord.material_id, movRecord.tipo_movimiento, movRecord.cantidad, movRecord.costo_unitario_momento, movRecord.motivo, movRecord.fecha]));
    }

    // Actualizar ítem
    item.stock_actual = nuevoStock;
    this.saveItem(item);
  }
}
