<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Kora Inventario</title>
  <link rel="stylesheet" href="css/styles.css">
  <script src="https://cdn.jsdelivr.net/gh/KoraDevsOrg/kora-web-sdk@main/kora-sync.js"></script>
</head>
<body>

  <!-- Backdrop del Drawer -->
  <div id="drawerBackdrop" class="drawer-backdrop"></div>

  <!-- Menú Lateral: Conector de Módulos ERP -->
  <aside id="sideDrawer" class="side-drawer">
    <div class="drawer-header">
      <h2>Módulos Kora</h2>
      <button id="btnCloseDrawer" class="btn-icon">✕</button>
    </div>
    
    <div class="drawer-section-title">SUITE DE NEGOCIO</div>
    <nav class="drawer-list">
      <button class="drawer-item active" data-action="home">📦 Gestión de Inventario</button>
      <button class="drawer-item" data-action="mod-fabricacion">⚙️ Fabricación (Órdenes)</button>
      <button class="drawer-item" data-action="mod-ventas">🏷️ Ventas & Mostrador</button>
      <button class="drawer-item" data-action="mod-costos">💡 Costos & Servicios Indirectos</button>
      <button class="drawer-item" data-action="mod-financiero">📊 Financiero & Cuentas</button>
    </nav>

    <div class="drawer-footer">
      <small style="color: var(--text-sub); display: block; margin-bottom: 8px;">Kora Admin DB (Motor Central)</small>
      <button id="btnOpenKoraAdmin" class="btn-secondary" style="width: 100%; font-size: 0.8rem;">
        ⚙️ Administrar Bases de Datos
      </button>
    </div>
  </aside>

  <!-- Encabezado Principal -->
  <header>
    <div class="header-left">
      <button id="btnOpenDrawer" class="btn-icon">☰</button>
      <h1 id="headerTitle">Kora Inventario</h1>
    </div>
    <div class="offline-badge">100% Offline</div>
  </header>

  <!-- Contenedor Principal donde se montan las Vistas -->
  <main id="appContent"></main>

  <!-- ========================================== -->
  <!-- PLANTILLAS DE VISTAS (TEMPLATES)          -->
  <!-- ========================================== -->

  <!-- 1. PANTALLA PRINCIPAL: ACCIONES DE INVENTARIO -->
  <template id="tmpl-home-view">
    <div class="hub-grid">
      <button class="hub-card" id="btnActionNewItem">
        <span class="hub-icon">➕</span>
        <span class="hub-title">Crear Material</span>
        <span class="hub-desc">Dar de alta materias primas o productos terminados</span>
      </button>

      <button class="hub-card" id="btnActionBOM">
        <span class="hub-icon">📐</span>
        <span class="hub-title">Lista de Materiales</span>
        <span class="hub-desc">Fórmulas de insumos requeridos por lote para fabricar</span>
      </button>

      <button class="hub-card" id="btnActionStockReport">
        <span class="hub-icon">📊</span>
        <span class="hub-title">Reporte de Stock</span>
        <span class="hub-desc">Consultar existencias, movimientos históricos y costos</span>
      </button>
    </div>
  </template>

  <!-- 2. FORMULARIO: CREAR / EDITAR MATERIAL -->
  <template id="tmpl-item-form-view">
    <div class="card">
      <div class="card-header-bar">
        <h2 class="card-title" id="itemFormTitle">Crear Material</h2>
        <button type="button" class="btn-icon" id="btnBackHome">←</button>
      </div>
      <form id="itemForm">
        <input type="hidden" id="itemId">
        <div class="form-group">
          <label>Nombre del Material o Producto:</label>
          <input type="text" id="itemNombre" class="input-field" required placeholder="Ej: Harina de Maíz">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Tipo de Material:</label>
            <select id="itemTipo" class="input-field">
              <option value="MATERIA_PRIMA">Materia Prima (Insumo)</option>
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
            <label>Stock Disponible:</label>
            <input type="number" step="any" id="itemStock" class="input-field" required value="10">
          </div>
          <div class="form-group">
            <label>Stock Mínimo (Alerta):</label>
            <input type="number" step="any" id="itemStockMin" class="input-field" required value="2">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Costo Actual de Compra ($):</label>
            <input type="number" step="any" id="itemCosto" class="input-field" required value="1000">
          </div>
          <div class="form-group" id="grpPrecioVenta" style="display: none;">
            <label>Precio de Venta Sugerido ($):</label>
            <input type="number" step="any" id="itemPrecio" class="input-field" value="2500">
          </div>
        </div>
        <div class="form-group">
          <label>Proveedor / Teléfono:</label>
          <input type="text" id="itemProveedor" class="input-field" placeholder="Ej: Distribuidora Central">
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" id="btnCancelItemForm">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Material</button>
        </div>
      </form>
    </div>
  </template>

  <!-- 3. LISTA DE MATERIALES (BOM) -->
  <template id="tmpl-bom-form-view">
    <div class="card">
      <div class="card-header-bar">
        <h2 class="card-title">Lista de Materiales (BOM)</h2>
        <button type="button" class="btn-icon" id="btnBackHomeBOM">←</button>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-sub); margin-bottom: 12px;">
        Define qué materias primas componen un lote de fabricación.
      </p>
      <form id="bomForm">
        <div class="form-group">
          <label>Nombre de la Lista / Identificador:</label>
          <input type="text" id="bomNombre" class="input-field" required placeholder="Ej: Ensamble 20 Empanadas">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Producto Terminado:</label>
            <select id="bomProductoId" class="input-field" required></select>
          </div>
          <div class="form-group">
            <label>Rendimiento por Lote (Uds):</label>
            <input type="number" step="any" id="bomRendimiento" class="input-field" required value="20" min="1">
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid var(--border); margin: 16px 0;">
        <h3 style="font-size: 0.85rem; color: var(--accent-gold); margin-bottom: 8px;">Materias Primas Requeridas por Lote</h3>
        <div id="bomMaterialsRows"></div>
        <button type="button" class="btn-secondary" id="btnAddBOMRow" style="width: 100%; margin-top: 6px;">
          + Añadir Materia Prima
        </button>
        <div class="form-actions" style="margin-top: 18px;">
          <button type="button" class="btn-secondary" id="btnCancelBOM">Cancelar</button>
          <button type="submit" class="btn-primary">Guardar Lista de Materiales</button>
        </div>
      </form>
    </div>
  </template>

  <!-- 4. REPORTE DE STOCK: BÚSQUEDA Y SELECCIÓN -->
  <template id="tmpl-stock-search-view">
    <div class="card-header-bar" style="margin-bottom: 12px;">
      <h2 style="font-size: 1.1rem; color: var(--text-main);">Consultar Material</h2>
      <button type="button" class="btn-icon" id="btnBackHomeSearch">←</button>
    </div>
    <div class="search-box">
      <input type="text" id="searchMaterialInput" class="input-field" placeholder="🔍 Escribe para buscar material..." autocomplete="off">
    </div>
    <div id="searchMaterialResults" class="materials-list"></div>
  </template>

  <!-- 5. DETALLE DE STOCK, FABRICACIÓN E HISTORIAL PAGINADO -->
  <template id="tmpl-stock-detail-view">
    <div class="card-header-bar" style="margin-bottom: 12px;">
      <button type="button" class="btn-icon" id="btnBackToSearch">← Volver</button>
      <div style="display: flex; gap: 8px;">
        <button id="btnEditCurrentMaterial" class="btn-secondary btn-sm">✏️ Editar</button>
        <button id="btnDeleteCurrentMaterial" class="btn-danger btn-sm">🗑️</button>
      </div>
    </div>

    <!-- Resumen del Material -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h2 id="detMaterialNombre" style="color: var(--accent-gold); font-size: 1.25rem;">--</h2>
        <span id="detMaterialBadge" class="badge">--</span>
      </div>
      <div class="metrics-grid" style="margin-top: 12px;">
        <div class="metric-box">
          <div class="metric-label">Stock Actual</div>
          <div id="detMaterialStock" class="metric-value">--</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Costo Unitario</div>
          <div id="detMaterialCosto" class="metric-value">--</div>
        </div>
      </div>
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button id="btnQuickAdjustStock" class="btn-secondary" style="flex: 1; font-size: 0.85rem;">
          ⚙️ Ajuste Manual de Cantidades
        </button>
      </div>
    </div>

    <!-- Sección de Fabricación (Solo si tiene Lista de Materiales) -->
    <div id="fabricationSection"></div>

    <!-- Historial de Movimientos con Filtros -->
    <div class="card">
      <h3 style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 10px;">Historial de Movimientos</h3>
      
      <div class="form-grid" style="margin-bottom: 10px;">
        <div class="form-group">
          <label>Desde:</label>
          <input type="date" id="filtroFechaDesde" class="input-field" style="padding: 8px;">
        </div>
        <div class="form-group">
          <label>Hasta:</label>
          <input type="date" id="filtroFechaHasta" class="input-field" style="padding: 8px;">
        </div>
      </div>
      <button id="btnFiltrarMovs" class="btn-secondary" style="width: 100%; margin-bottom: 12px; padding: 8px;">
        Aplicar Filtro de Fechas
      </button>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Costo Momento</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody id="movimientosTbody"></tbody>
        </table>
      </div>

      <!-- Paginación Simple -->
      <div class="pagination-bar">
        <button id="btnPrevPage" class="btn-secondary btn-sm">◀ Anterior</button>
        <span id="lblPageIndicator" style="font-size: 0.8rem; color: var(--text-sub);">Página 1</span>
        <button id="btnNextPage" class="btn-secondary btn-sm">Siguiente ▶</button>
      </div>

      <div class="unit-calc-highlight" style="margin-top: 14px;">
        <span>Costo Total en Movimientos Filtrados:</span>
        <span id="lblCostoTotalFiltrado" class="unit-calc-val">$ 0</span>
      </div>
    </div>
  </template>

  <!-- Script Controlador Modular -->
  <script type="module" src="js/app.js"></script>
</body>
</html>
