export class RecipesView {
  constructor(container, onNewRecipeClick) {
    this.container = container;
    this.onNewRecipeClick = onNewRecipeClick;
  }

  render(recipes, items) {
    this.container.innerHTML = `
      <div class="view-header">
        <button id="btnOpenNewRecipeForm" class="btn-primary">+ Nueva Receta (Escandallo de Lote)</button>
      </div>
      <div id="recipeCardsGrid">
        ${recipes.length === 0 ? `<div style="text-align: center; color: var(--text-sub); padding: 24px;">No hay fórmulas o recetas registradas.</div>` : ''}
        ${recipes.map(rec => {
          const finishedProd = items.find(i => i.id === rec.producto_terminado_id) || { nombre: "Producto no vinculado" };
          
          let costoMateriaLote = 0;
          const desgloseUnitario = rec.ingredientes.map(ing => {
            const raw = items.find(i => i.id === ing.materia_prima_id);
            const costoIngLote = raw ? (Number(ing.cantidad_lote) * Number(raw.costo_unitario)) : 0;
            costoMateriaLote += costoIngLote;
            
            const consumoUnidad = Number(ing.cantidad_lote) / Number(rec.lote_rendimiento);
            const costoUnidad = costoIngLote / Number(rec.lote_rendimiento);

            return {
              nombre: raw ? raw.nombre : ing.materia_prima_id,
              unidad: raw ? raw.unidad_medida : '',
              consumoUnitario: consumoUnidad.toFixed(3),
              costoUnitario: Math.round(costoUnidad)
            };
          });

          const costoLoteConMerma = costoMateriaLote * (1 + (Number(rec.merma_porcentaje) / 100));
          const costoTotalLote = costoLoteConMerma + Number(rec.mano_obra_lote);
          const costoUnitarioFinal = costoTotalLote / Number(rec.lote_rendimiento);

          return `
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                <h3 style="font-size: 1.1rem; color: var(--accent-gold);">${rec.nombre}</h3>
                <span class="badge badge-finished">Rinde ${rec.lote_rendimiento} Uds</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 8px;">
                Fabrica: <strong>${finishedProd.nombre}</strong> • Tiempo: ${rec.tiempo_fabricacion_minutos || 0} min
              </p>

              <div class="recipe-breakdown">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-sub); margin-bottom: 6px;">
                  Consumo Calculado para 1 Sola Unidad:
                </div>
                ${desgloseUnitario.map(d => `
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 2px 0;">
                    <span>• ${d.nombre}: <strong>${d.consumoUnitario} ${d.unidad}</strong></span>
                    <span style="color: var(--text-sub);">$ ${d.costoUnitario.toLocaleString()}</span>
                  </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 2px 0; border-top: 1px solid var(--border); margin-top: 4px;">
                  <span>• Mano de obra unitaria:</span>
                  <span>$ ${Math.round(Number(rec.mano_obra_lote) / Number(rec.lote_rendimiento)).toLocaleString()}</span>
                </div>
              </div>

              <div class="unit-calc-highlight">
                <div>
                  <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-sub);">Costo Real por Unidad</div>
                  <div style="font-size: 0.7rem; color: var(--accent-green);">(Insumos + ${rec.merma_porcentaje}\% merma + Sueldo)</div>                 </div>                 <div class="unit-calc-val">$ ${Math.round(costoUnitarioFinal).toLocaleString()}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.container.querySelector("#btnOpenNewRecipeForm").addEventListener("click", this.onNewRecipeClick);
  }
}
