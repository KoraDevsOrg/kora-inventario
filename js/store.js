/**
 * MODELO DE DATOS: Inventario Físico, BOM y Kardex con Integridad Contable
 * KoraDevsOrg - Licencia MIT
 */

export class InventoryModel {
  constructor() {
    this.hasBridge = typeof window.KoraDB !== "undefined";
    this.KEY_ITEMS = "kora_inv_items_v6";
    this.KEY_BOM = "kora_inv_bom_v6";
    this.KEY_MOVS = "kora_inv_movs_v6";
    this.initDatabase();
  }

  initDatabase() {
    if (this.hasBridge) {
      try {
        const ddl = `
          CREATE TABLE IF NOT EXISTS mod_biz_items (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            unidad_medida TEXT NOT NULL,
            stock_actual REAL DEFAULT 0,
            stock_minimo REAL DEFAULT 0,
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
            motivo TEXT,
            fecha INTEGER NOT NULL
          );
        `;
        window.KoraDB.registerModule("org.koradevs.negocios.inventario", "Kora Inventario", 1, ddl);
      } catch (e) {
        console.warn("[Model] Fallo registrando en KoraDB:", e);
      }
    }

    if (!localStorage.getItem(this.KEY_ITEMS) || JSON.parse(localStorage.getItem(this.KEY_ITEMS)).length === 0) {
      const seedItems = [
        { id: "item_harina", nombre: "Harina de Maíz", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 35.0, stock_minimo: 10.0, proveedor: "Distribuidora Central", updated_at: Date.now() },
        { id: "item_carne", nombre: "Carne de Res Molida", tipo: "MATERIA_PRIMA", unidad_medida: "kg", stock_actual: 12.0, stock_minimo: 4.0, proveedor: "Carnicería Local", updated_at: Date.now() },
        { id: "prod_empanada", nombre: "Empanada Tradicional", tipo: "PRODUCTO_TERMINADO", unidad_medida: "unidad", stock_actual: 50.0, stock_minimo: 20.0, proveedor: "Taller Propio", updated_at: Date.now() }
      ];
      localStorage.setItem(this.KEY_ITEMS, JSON.stringify(seedItems));
    }

    if (!localStorage.getItem(this.KEY_BOM)) {
      const seedBOM = [
        {
          id: "bom_empanada",
          producto_terminado_id: "prod_empanada",
          nombre: "Lista Ensamble 20 Empanadas",
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

    if (!localStorage.getItem(this.KEY_MOVS) || JSON.parse(localStorage.getItem(this.KEY_MOVS)).length === 0) {
      const now = Date.now();
      const seedMovs = [
        { id: "mov_1", material_id: "item_harina", tipo_movimiento: "ENTRADA", cantidad: 50, motivo: "Compra inicial proveedor", fecha: now - 86400000 * 5 },
        { id: "mov_2", material_id: "item_harina", tipo_movimiento: "SALIDA", cantidad: 15, motivo: "Producción de lote", fecha: now - 86400000 * 3 },
        { id: "mov_3", material_id: "item_carne", tipo_movimiento: "ENTRADA", cantidad: 20, motivo: "Compra carnicería", fecha: now - 86400000 * 4 },
        { id: "mov_4", material_id: "item_carne", tipo_movimiento: "SALIDA", cantidad: 8, motivo: "Producción fin de semana", fecha: now - 86400000 * 2 },
        { id: "mov_5", material_id: "prod_empanada", tipo_movimiento: "ENTRADA", cantidad: 50, motivo: "Ingreso inicial producto terminado", fecha: now - 86400000 * 1 }
      ];
      localStorage.setItem(this.KEY_MOVS, JSON.stringify(seedMovs));
    }
  }

  getItems() {
    if (this.hasBridge) {
      try {
        const res = window.KoraDB.query("SELECT * FROM mod_biz_items ORDER BY nombre ASC", "[]");
        const list = JSON.parse(res);
        if (list && list.length > 0) return list;
      } catch (e) {
        console.warn("[Model] Fallo lectura SQLite:", e);
      }
    }
    return JSON.parse(localStorage.getItem(this.KEY_ITEMS) || "[]");
  }

  getItemById(id) {
    return this.getItems().find(i => String(i.id) === String(id)) || null;
  }

  saveItem(item) {
    const items = this.getItems();
    const existing = items.find(i => String(i.id) === String(item.id));
    const targetStock = Number(item.stock_actual) || 0;

    const record = {
      ...item,
      id: item.id || `item_${Date.now()}`,
      stock_actual: targetStock,
      stock_minimo: Number(item.stock_minimo) || 0,
      updated_at: Date.now()
    };

    if (existing) {
      // 1. CASO EDICIÓN: Si el stock cambió en la ficha, registrar el delta en el Kardex
      const diff = targetStock - Number(existing.stock_actual);
      if (diff !== 0) {
        const tipo = diff > 0 ? "ENTRADA" : "SALIDA";
        this.addMovimientoRecord({
          id: `mov_adj_${Date.now()}`,
          material_id: record.id,
          tipo_movimiento: tipo,
          cantidad: Math.abs(diff),
          motivo: "Ajuste directo desde edición de ficha",
          fecha: Date.now()
        });
      }
      const idx = items.findIndex(i => String(i.id) === String(record.id));
      items[idx] = record;
    } else {
      // 2. CASO CREACIÓN NUEVA: Si inicia con stock, registrar movimiento de entrada inicial
      items.push(record);
      if (record.stock_actual > 0) {
        this.addMovimientoRecord({
          id: `mov_init_${Date.now()}`,
          material_id: record.id,
          tipo_movimiento: "ENTRADA",
          cantidad: record.stock_actual,
          motivo: "Inventario inicial de creación",
          fecha: Date.now()
        });
      }
    }

    localStorage.setItem(this.KEY_ITEMS, JSON.stringify(items));

    if (this.hasBridge) {
      try {
        const sql = `
          INSERT OR REPLACE INTO mod_biz_items 
          (id, nombre, tipo, unidad_medida, stock_actual, stock_minimo, proveedor, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sql, JSON.stringify([
          record.id, record.nombre, record.tipo, record.unidad_medida,
          record.stock_actual, record.stock_minimo, record.proveedor || "", record.updated_at
        ]));
      } catch (e) {
        console.warn("[Model] Fallo inserción SQLite:", e);
      }
    }
    return record;
  }

  deleteItem(id) {
    let items = this.getItems().filter(i => String(i.id) !== String(id));
    localStorage.setItem(this.KEY_ITEMS, JSON.stringify(items));

    if (this.hasBridge) {
      try {
        window.KoraDB.execute("DELETE FROM mod_biz_items WHERE id = ?;", JSON.stringify([String(id)]));
      } catch (e) {
        console.warn("[Model] Fallo eliminación SQLite:", e);
      }
    }
  }

  getBOMs() {
    if (this.hasBridge) {
      try {
        const res = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_bom ORDER BY nombre ASC", "[]"));
        if (res && res.length > 0) {
          return res.map(b => ({
            ...b,
            materiales: typeof b.materiales_json === "string" ? JSON.parse(b.materiales_json) : (b.materiales || [])
          }));
        }
      } catch (e) { console.warn(e); }
    }
    return JSON.parse(localStorage.getItem(this.KEY_BOM) || "[]");
  }

  getBOMByProductId(prodId) {
    return this.getBOMs().find(b => String(b.producto_terminado_id) === String(prodId)) || null;
  }

  saveBOM(bomData, materialsArray) {
    const boms = this.getBOMs();
    const record = {
      ...bomData,
      id: bomData.id || `bom_${Date.now()}`,
      materiales: materialsArray,
      updated_at: Date.now()
    };
    const idx = boms.findIndex(b => String(b.id) === String(record.id));
    if (idx >= 0) boms[idx] = record;
    else boms.push(record);

    localStorage.setItem(this.KEY_BOM, JSON.stringify(boms));

    if (this.hasBridge) {
      try {
        const sql = `
          INSERT OR REPLACE INTO mod_biz_bom 
          (id, producto_terminado_id, nombre, lote_rendimiento, materiales_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?);
        `;
        window.KoraDB.execute(sql, JSON.stringify([
          record.id, record.producto_terminado_id, record.nombre,
          record.lote_rendimiento, JSON.stringify(materialsArray), record.updated_at
        ]));
      } catch (e) { console.warn(e); }
    }
    return record;
  }

  getMovimientos(materialId, fechaInicio = null, fechaFin = null) {
    let movs = [];
    if (this.hasBridge) {
      try {
        movs = JSON.parse(window.KoraDB.query("SELECT * FROM mod_biz_movimientos WHERE material_id = ? ORDER BY fecha DESC", JSON.stringify([String(materialId)])));
      } catch (e) { console.warn(e); }
    }
    if (!movs || movs.length === 0) {
      const all = JSON.parse(localStorage.getItem(this.KEY_MOVS) || "[]");
      movs = all.filter(m => String(m.material_id) === String(materialId));
    }

    if (fechaInicio) movs = movs.filter(m => m.fecha >= fechaInicio);
    if (fechaFin) movs = movs.filter(m => m.fecha <= fechaFin);
    return movs.sort((a, b) => b.fecha - a.fecha);
  }

  addMovimientoRecord(movRecord) {
    const allMovs = JSON.parse(localStorage.getItem(this.KEY_MOVS) || "[]");
    allMovs.push(movRecord);
    localStorage.setItem(this.KEY_MOVS, JSON.stringify(allMovs));

    if (this.hasBridge) {
      try {
        const sqlMov = `INSERT INTO mod_biz_movimientos (id, material_id, tipo_movimiento, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?, ?);`;
        window.KoraDB.execute(sqlMov, JSON.stringify([movRecord.id, movRecord.material_id, movRecord.tipo_movimiento, movRecord.cantidad, movRecord.motivo, movRecord.fecha]));
      } catch (e) { console.warn(e); }
    }
  }

  adjustStockManual(materialId, nuevoStock, motivo) {
    const item = this.getItemById(materialId);
    if (!item) return;

    const diferencia = Number(nuevoStock) - Number(item.stock_actual);
    if (diferencia === 0) return;

    const tipo = diferencia > 0 ? "ENTRADA" : "SALIDA";
    this.addMovimientoRecord({
      id: `mov_kardex_${Date.now()}`,
      material_id: item.id,
      tipo_movimiento: tipo,
      cantidad: Math.abs(diferencia),
      motivo: motivo || "Ajuste manual directo de kardex",
      fecha: Date.now()
    });

    item.stock_actual = Number(nuevoStock);
    
    // Guardamos directo sin recalcular deltas duplicados
    const items = this.getItems();
    const idx = items.findIndex(i => String(i.id) === String(item.id));
    if (idx >= 0) {
      items[idx].stock_actual = Number(nuevoStock);
      localStorage.setItem(this.KEY_ITEMS, JSON.stringify(items));
    }
    if (this.hasBridge) {
      try {
        window.KoraDB.execute("UPDATE mod_biz_items SET stock_actual = ? WHERE id = ?;", JSON.stringify([Number(nuevoStock), item.id]));
      } catch (e) {}
    }
  }

  // Utilidad para limpiar desajustes: Fuerza a que el stock coincida con el saldo del Kardex
  reconcileItemStock(materialId) {
    const item = this.getItemById(materialId);
    if (!item) return 0;

    const movs = this.getMovimientos(materialId);
    let balance = 0;
    movs.forEach(m => {
      if (m.tipo_movimiento === "ENTRADA") balance += Number(m.cantidad);
      else if (m.tipo_movimiento === "SALIDA") balance -= Number(m.cantidad);
    });

    const items = this.getItems();
    const idx = items.findIndex(i => String(i.id) === String(item.id));
    if (idx >= 0) {
      items[idx].stock_actual = balance;
      localStorage.setItem(this.KEY_ITEMS, JSON.stringify(items));
    }
    if (this.hasBridge) {
      try {
        window.KoraDB.execute("UPDATE mod_biz_items SET stock_actual = ? WHERE id = ?;", JSON.stringify([balance, item.id]));
      } catch (e) {}
    }
    return balance;
  }
}
