export class ItemsView {
  constructor(container, onNewItemClick) {
    this.container = container;
    this.onNewItemClick = onNewItemClick;
  }

  render(items) {
    this.container.innerHTML = `
      <div class="view-header">
        <button id="btnOpenNewItemForm" class="btn-primary">+ Nuevo Material / Producto</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Material / Insumo</th>
              <th>Tipo</th>
              <th>Stock Disponible</th>
              <th>Costo / Venta</th>
            </tr>
          </thead>
          <tbody>
            ${items.length === 0 ? `<tr><td colspan="4" style="text-align: center; color: var(--text-sub); padding: 24px;">No hay registros en inventario.</td></tr>` : ''}
            ${items.map(item => {
              const isRaw = item.tipo === "MATERIA_PRIMA";
              const isLowStock = Number(item.stock_actual) <= Number(item.stock_minimo);
              return `
                <tr>
                  <td>
                    <strong>${item.nombre}</strong><br>
                    <small style="color: var(--text-sub);">${item.proveedor \vert{}\vert{} 'Sin proveedor'} • Rep: ${item.reposicion_dias || 1}d</small>
                  </td>
                  <td>
                    <span class="badge ${isRaw ? 'badge-raw' : 'badge-finished'}">
                      ${isRaw ? 'MATERIA PRIMA' : 'TERMINADO'}
                    </span>
                  </td>
                  <td>
                    <strong>${item.stock_actual}${item.unidad_medida}</strong>
                    ${isLowStock ? '<br><span class="badge badge-low-stock">BAJO STOCK</span>' : ''}                   </td>                   <td>                     Costo: $${Math.round(item.costo_unitario).toLocaleString()}<br>${!isRaw ? `<strong style="color: var(--accent-green);">Venta: $${Math.round(item.precio_venta).toLocaleString()}</strong>` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.container.querySelector("#btnOpenNewItemForm").addEventListener("click", this.onNewItemClick);
  }
}
