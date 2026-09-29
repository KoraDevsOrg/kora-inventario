/**
 * Catálogo Base de Insumos, Productos Terminados y Fórmulas
 * KoraDevsOrg - Licencia Libre MIT
 */

export const INITIAL_ITEMS = Object.freeze([
  {
    id: "item_harina",
    nombre: "Harina de Maíz",
    tipo: "MATERIA_PRIMA",
    unidad_medida: "kg",
    stock_actual: 25.0,
    stock_minimo: 5.0,
    costo_unitario: 4500, // $4.500 por kg ($4.5 por gramo)
    precio_venta: 0,
    proveedor: "Distribuidora Central (Tel: 3001234567)",
    reposicion_dias: 2
  },
  {
    id: "item_carne",
    nombre: "Carne de Res Molida",
    tipo: "MATERIA_PRIMA",
    unidad_medida: "kg",
    stock_actual: 10.0,
    stock_minimo: 2.0,
    costo_unitario: 22000, // $22.000 por kg ($22 por gramo)
    precio_venta: 0,
    proveedor: "Carnicería La Esquina",
    reposicion_dias: 1
  },
  {
    id: "item_papa",
    nombre: "Papa Pastusa",
    tipo: "MATERIA_PRIMA",
    unidad_medida: "kg",
    stock_actual: 40.0,
    stock_minimo: 10.0,
    costo_unitario: 3000,
    precio_venta: 0,
    proveedor: "Plaza Mayorista",
    reposicion_dias: 3
  },
  {
    id: "prod_empanada_carne",
    nombre: "Empanada de Carne Crujiente",
    tipo: "PRODUCTO_TERMINADO",
    unidad_medida: "unidad",
    stock_actual: 35.0,
    stock_minimo: 10.0,
    costo_unitario: 1350, // Calculado por receta
    precio_venta: 2500,
    proveedor: "Producción Propia",
    reposicion_dias: 0
  }
]);

export const INITIAL_RECIPES = Object.freeze([
  {
    id: "rec_empanada_20",
    producto_terminado_id: "prod_empanada_carne",
    nombre: "Lote Base 20 Empanadas",
    lote_rendimiento: 20, // 20 empanadas resultantes
    tiempo_fabricacion_minutos: 60,
    mano_obra_lote: 6000, // $300 por empanada
    merma_porcentaje: 5,  // 5% de merma en fritura y masa
    ingredientes: [
      { materia_prima_id: "item_harina", cantidad_lote: 0.8 }, // 800 g totales (40 g / empanada)
      { materia_prima_id: "item_carne", cantidad_lote: 0.6 },  // 600 g totales (30 g / empanada)
      { materia_prima_id: "item_papa", cantidad_lote: 0.6 }    // 600 g totales (30 g / empanada)
    ]
  }
]);
