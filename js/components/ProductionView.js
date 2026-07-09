import { getAllProducts } from "../services/inventoryService.js";
import { ejecutarProduccion, getAllProducciones } from "../services/productionService.js";

export class ProductionView extends HTMLElement {
  constructor() {
    super();
    this.productosFabricados = [];
    this.itemsSeleccionados = []; 
    this.historial = [];
    this.cargando = true;
    this.mensaje = "";
    this.tipoMensaje = "info";
    this.ultimoResultado = null;
  }

  connectedCallback() {
    this.render();
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    this.render();
    try {
      const productos = await getAllProducts();
      this.productosFabricados = productos.filter((p) => p.esFabricado);
      this.historial = await getAllProducciones();
    } catch (err) {
      this.mensaje = `Error al cargar datos de producción: ${err.message}`;
      this.tipoMensaje = "error";
    }
    this.cargando = false;
    this.render();
  }

  render() {
    const usuario = this.getAttribute("usuario") || "";

    this.innerHTML = `
      <section class="view">
        <div class="view-header">
          <div>
            <h2>Producción</h2>
            <p class="muted">Transforma materia prima en productos terminados según su fórmula.</p>
          </div>
        </div>

        ${this.mensaje ? `<div class="banner banner-${this.tipoMensaje}">${this.mensaje}</div>` : ""}

        <div class="card card-form">
          <h3>Nueva orden de producción</h3>
          ${
            this.cargando
              ? `<p class="muted">Cargando productos…</p>`
              : this.productosFabricados.length === 0
              ? `<p class="muted">No hay productos con fórmula registrada. Crea uno en el módulo de Inventario.</p>`
              : this.renderSelector()
          }

          ${this.itemsSeleccionados.length > 0 ? this.renderBatch() : ""}
        </div>

        ${this.ultimoResultado ? this.renderResumen(this.ultimoResultado) : ""}

        <div class="card">
          <h3>Historial de producción</h3>
          ${this.renderHistorial()}
        </div>
      </section>
    `;

    const formSelector = this.querySelector("#formSelector");
    if (formSelector) formSelector.addEventListener("submit", (e) => this.handleAgregarItem(e));

    this.querySelectorAll("[data-quitar-item]").forEach((btn) =>
      btn.addEventListener("click", () => {
        this.itemsSeleccionados.splice(Number(btn.dataset.quitarItem), 1);
        this.render();
      })
    );

    const btnEjecutar = this.querySelector("#btnEjecutar");
    if (btnEjecutar) btnEjecutar.addEventListener("click", () => this.handleEjecutar(usuario));
  }

  renderSelector() {
    return `
      <form id="formSelector" class="grid-form">
        <label class="field">
          <span>Producto a fabricar</span>
          <select name="codigo" required>
            <option value="">Selecciona un producto…</option>
            ${this.productosFabricados
              .map((p) => `<option value="${p.codigo}">${p.codigo} · ${p.nombre}</option>`)
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Cantidad a producir</span>
          <input type="number" name="cantidad" min="0.01" step="any" required />
        </label>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">Agregar a la orden</button>
        </div>
      </form>
    `;
  }

  renderBatch() {
    return `
      <div class="batch">
        <h4>Productos en esta orden</h4>
        <table class="table">
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Cantidad</th><th class="col-actions">Acciones</th></tr>
          </thead>
          <tbody>
            ${this.itemsSeleccionados
              .map(
                (it, idx) => `
              <tr>
                <td><span class="mono">${it.codigo}</span></td>
                <td>${it.nombre}</td>
                <td><span class="mono">${it.cantidad}</span></td>
                <td class="col-actions"><button class="btn btn-sm btn-danger" data-quitar-item="${idx}">Quitar</button></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="form-actions">
          <button class="btn btn-primary" id="btnEjecutar">Ejecutar producción</button>
        </div>
      </div>
    `;
  }

  renderResumen(resultado) {
    return `
      <div class="card card-summary">
        <div class="batch-tag">Proceso N.º <span class="mono">${resultado.codigo}</span></div>
        <h3>Resumen de producción</h3>
        ${resultado.items
          .map(
            (item) => `
          <div class="summary-item">
            <div class="summary-item-head">
              <strong>${item.nombre}</strong>
              <span class="pill pill-amber">${item.cantidadFabricada} producidas</span>
            </div>
            <ul class="summary-list">
              ${item.materiaPrimaUsada
                .map((m) => `<li><span class="mono">${m.codigo}</span> · ${m.nombre}: <strong>${m.cantidad}</strong> ${m.unidad}</li>`)
                .join("")}
            </ul>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  renderHistorial() {
    if (this.historial.length === 0) return `<p class="muted">Aún no se han registrado procesos de producción.</p>`;
    
    const historialOrdenado = [...this.historial].sort((a, b) => {
        return a.codigo - b.codigo;
    });

    return `
      <table class="table">
        <thead>
          <tr><th>N.º proceso</th><th>Fecha</th><th>Usuario</th><th>Productos</th></tr>
        </thead>
        <tbody>
          ${historialOrdenado
            .map(
              (p) => `
            <tr>
              <td><span class="mono">${p.codigo}</span></td>
              <td>${new Date(p.fecha).toLocaleString()}</td>
              <td>${p.usuario}</td>
              <td>${p.items.map((i) => `${i.nombre} (${i.cantidadFabricada})`).join(", ")}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
}

  handleAgregarItem(e) {
    e.preventDefault();
    const form = e.target;
    const codigo = form.codigo.value;
    const cantidad = Number(form.cantidad.value);
    if (!codigo || !cantidad || cantidad <= 0) return;

    const producto = this.productosFabricados.find((p) => p.codigo === codigo);
    const existente = this.itemsSeleccionados.find((i) => i.codigo === codigo);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      this.itemsSeleccionados.push({ codigo, nombre: producto.nombre, cantidad });
    }
    this.ultimoResultado = null;
    this.render();
  }

  async handleEjecutar(usuario) {
    this.mensaje = "Procesando producción…";
    this.tipoMensaje = "info";
    this.render();

    try {
      const resultado = await ejecutarProduccion(this.itemsSeleccionados, usuario);
      this.ultimoResultado = resultado;
      this.itemsSeleccionados = [];
      this.mensaje = "Producción ejecutada correctamente.";
      this.tipoMensaje = "success";
      await this.cargarDatos();
    } catch (err) {
      const detalles = err.detalles ? `: ${err.detalles.join(" · ")}` : ` (${err.message})`;
      this.mensaje = `No fue posible ejecutar la producción${detalles}`;
      this.tipoMensaje = "error";
      this.render();
    }
  }
}

customElements.define("production-view", ProductionView);
