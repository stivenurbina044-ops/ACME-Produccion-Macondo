import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  increaseStock,
} from "../services/inventoryService.js";

const UNIDADES = ["g", "kg", "ml", "l", "unidad"];

export class InventoryView extends HTMLElement {
  constructor() {
    super();
    this.productos = [];
    this.cargando = true;
    this.filtro = "";
    this.panel = null; 
    this.editandoCodigo = null; 
    this.formulaRows = [];
    this.esFabricadoActual = false;
    this.mensaje = "";
    this.tipoMensaje = "info";
  }

  connectedCallback() {
    this.render();
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    this.render();
    try {
      this.productos = await getAllProducts();
    } catch (err) {
      this.mensaje = `Error al cargar inventario: ${err.message}`;
      this.tipoMensaje = "error";
    }
    this.cargando = false;
    this.render();
  }

  get materiasPrimas() {
    return this.productos.filter((p) => !p.esFabricado);
  }

  get productosFiltrados() {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.productos;
    return this.productos.filter(
      (p) => p.codigo.toLowerCase().includes(f) || p.nombre.toLowerCase().includes(f)
    );
  }

  render() {
    this.innerHTML = `
      <section class="view">
        <div class="view-header">
          <div>
            <h2>Inventario</h2>
            <p class="muted">Materia prima y productos terminados de la planta.</p>
          </div>
          <div class="view-header-actions">
            <button class="btn btn-ghost" id="btnIngreso">↑ Ingresar stock</button>
            <button class="btn btn-primary" id="btnNuevo">+ Nuevo producto</button>
          </div>
        </div>

        ${this.mensaje ? `<div class="banner banner-${this.tipoMensaje}">${this.mensaje}</div>` : ""}

        ${this.panel === "producto" ? this.renderFormProducto() : ""}
        ${this.panel === "ingreso" ? this.renderFormIngreso() : ""}

        <div class="card">
          <label class="field search-field">
            <span>Buscar</span>
            <input type="search" id="buscador" placeholder="Filtrar por código o nombre…" value="${this.filtro}" />
          </label>
          ${this.cargando ? `<p class="muted">Cargando inventario…</p>` : this.renderTabla()}
        </div>
      </section>
    `;

    this.querySelector("#btnNuevo").addEventListener("click", () => {
      this.editandoCodigo = null;
      this.formulaRows = [];
      this.esFabricadoActual = false;
      this.panel = "producto";
      this.render();
    });

    this.querySelector("#btnIngreso").addEventListener("click", () => {
      this.panel = "ingreso";
      this.render();
    });

    this.querySelector("#buscador").addEventListener("input", (e) => {
      this.filtro = e.target.value;
      this.render();
      
      const input = this.querySelector("#buscador");
      input.focus();
      input.selectionStart = input.selectionEnd = input.value.length;
    });

    const formProducto = this.querySelector("#formProducto");
    if (formProducto) this.wireFormProducto(formProducto);

    const formIngreso = this.querySelector("#formIngreso");
    if (formIngreso) this.wireFormIngreso(formIngreso);

    this.querySelectorAll("[data-editar]").forEach((btn) =>
      btn.addEventListener("click", () => this.abrirEdicion(btn.dataset.editar))
    );
    this.querySelectorAll("[data-eliminar]").forEach((btn) =>
      btn.addEventListener("click", () => this.handleEliminar(btn.dataset.eliminar))
    );
  }

  renderTabla() {
    const lista = this.productosFiltrados;
    if (lista.length === 0) {
      return `<p class="muted">No hay productos que coincidan con la búsqueda.</p>`;
    }
    return `
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Proveedor</th>
            <th>Tipo</th>
            <th>Saldo</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${lista
            .map(
              (p) => `
            <tr>
              <td><span class="mono">${p.codigo}</span></td>
              <td>${p.nombre}</td>
              <td>${p.proveedor || "—"}</td>
              <td>${p.esFabricado ? `<span class="pill pill-amber">Fabricado</span>` : `<span class="pill pill-steel">Materia prima</span>`}</td>
              <td><span class="mono">${p.stock ?? 0}</span></td>
              <td class="col-actions">
                <button class="btn btn-sm" data-editar="${p.codigo}">Editar</button>
                <button class="btn btn-sm btn-danger" data-eliminar="${p.codigo}">Eliminar</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  abrirEdicion(codigo) {
    const producto = this.productos.find((p) => p.codigo === codigo);
    if (!producto) return;
    this.editandoCodigo = codigo;
    this.formulaRows = producto.esFabricado ? [...(producto.formula || [])] : [];
    this.esFabricadoActual = !!producto.esFabricado;
    this.panel = "producto";
    this.render();
  }

  renderFormProducto() {
    const producto = this.editandoCodigo
      ? this.productos.find((p) => p.codigo === this.editandoCodigo)
      : null;
    const esFabricado = this.esFabricadoActual;

    return `
      <div class="card card-form">
        <h3>${producto ? "Editar producto" : "Nuevo producto"}</h3>
        <form id="formProducto" class="grid-form" novalidate>
          <label class="field">
            <span>Código</span>
            <input type="text" name="codigo" value="${producto?.codigo || ""}" ${producto ? "readonly" : ""} required />
          </label>
          <label class="field">
            <span>Nombre</span>
            <input type="text" name="nombre" value="${producto?.nombre || ""}" required />
          </label>
          <label class="field">
            <span>Proveedor</span>
            <input type="text" name="proveedor" value="${producto?.proveedor || ""}" />
          </label>
          <label class="field field-checkbox">
            <input type="checkbox" name="esFabricado" id="chkFabricado" ${esFabricado ? "checked" : ""} />
            <span>Es un producto a producir (requiere fórmula)</span>
          </label>

          <div id="bloqueFormula" class="formula-block" style="${esFabricado ? "" : "display:none;"}">
            <div class="formula-header">
              <h4>Fórmula de producción</h4>
              <button type="button" class="btn btn-sm" id="btnAddIngrediente">+ Agregar materia prima</button>
            </div>
            <div id="filasFormula">${this.renderFilasFormula()}</div>
            ${this.materiasPrimas.length === 0 ? `<p class="muted">Aún no hay materia prima registrada para usar en fórmulas.</p>` : ""}
          </div>

          <div class="form-actions">
            <button class="btn btn-ghost" type="button" id="btnCancelarForm">Cancelar</button>
            <button class="btn btn-primary" type="submit">Guardar producto</button>
          </div>
        </form>
      </div>
    `;
  }

  renderFilasFormula() {
    if (this.formulaRows.length === 0) return `<p class="muted">Ningún ingrediente agregado todavía.</p>`;
    return this.formulaRows
      .map(
        (row, idx) => `
      <div class="formula-row" data-idx="${idx}">
        <select class="sel-ingrediente" data-idx="${idx}">
          <option value="">Selecciona materia prima…</option>
          ${this.materiasPrimas
            .map(
              (mp) =>
                `<option value="${mp.codigo}" ${mp.codigo === row.codigo ? "selected" : ""}>${mp.codigo} · ${mp.nombre}</option>`
            )
            .join("")}
        </select>
        <input type="number" class="inp-cantidad" data-idx="${idx}" min="0" step="any" placeholder="Cantidad" value="${row.cantidad ?? ""}" />
        <select class="sel-unidad" data-idx="${idx}">
          ${UNIDADES.map((u) => `<option value="${u}" ${u === row.unidad ? "selected" : ""}>${u}</option>`).join("")}
        </select>
        <button type="button" class="btn btn-sm btn-danger" data-quitar="${idx}">Quitar</button>
      </div>
    `
      )
      .join("");
  }

  wireFormProducto(form) {
    const chkFabricado = form.querySelector("#chkFabricado");
    const bloqueFormula = form.querySelector("#bloqueFormula");

    chkFabricado.addEventListener("change", () => {
      this.esFabricadoActual = chkFabricado.checked;
      if (!chkFabricado.checked) this.formulaRows = [];
      this.render();
    });

    const btnAdd = form.querySelector("#btnAddIngrediente");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        this.formulaRows.push({ codigo: "", nombre: "", cantidad: "", unidad: UNIDADES[0] });
        this.render();
      });
    }

    form.querySelectorAll(".sel-ingrediente").forEach((sel) =>
      sel.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.idx);
        const mp = this.materiasPrimas.find((m) => m.codigo === e.target.value);
        this.formulaRows[idx].codigo = mp ? mp.codigo : "";
        this.formulaRows[idx].nombre = mp ? mp.nombre : "";
      })
    );
    form.querySelectorAll(".inp-cantidad").forEach((inp) =>
      inp.addEventListener("input", (e) => {
        const idx = Number(e.target.dataset.idx);
        this.formulaRows[idx].cantidad = Number(e.target.value);
      })
    );
    form.querySelectorAll(".sel-unidad").forEach((sel) =>
      sel.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.idx);
        this.formulaRows[idx].unidad = e.target.value;
      })
    );
    form.querySelectorAll("[data-quitar]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.quitar);
        this.formulaRows.splice(idx, 1);
        this.render();
      })
    );

    form.querySelector("#btnCancelarForm").addEventListener("click", () => {
      this.panel = null;
      this.render();
    });

    form.addEventListener("submit", (e) => this.handleGuardarProducto(e));
  }

  async handleGuardarProducto(e) {
    e.preventDefault();
    const form = e.target;
    const codigo = form.codigo.value.trim();
    const nombre = form.nombre.value.trim();
    const proveedor = form.proveedor.value.trim();
    const esFabricado = form.querySelector("#chkFabricado").checked;

    if (!codigo || !nombre) {
      this.mensaje = "El código y el nombre no pueden estar vacíos ni contener solo espacios.";
      this.tipoMensaje = "error";
      this.render();
      return;
    }

    if (esFabricado) {
      const filasInvalidas = this.formulaRows.some((r) => !r.codigo || !r.cantidad || r.cantidad <= 0);
      if (this.formulaRows.length === 0 || filasInvalidas) {
        this.mensaje = "Completa la materia prima y la cantidad de cada ingrediente de la fórmula.";
        this.tipoMensaje = "error";
        this.render();
        return;
      }
    }

    try {
      if (this.editandoCodigo) {
        await updateProduct(this.editandoCodigo, {
          nombre,
          proveedor,
          esFabricado,
          formula: esFabricado ? this.formulaRows : [],
        });
        this.mensaje = "Producto actualizado correctamente.";
      } else {
        const existente = await getProduct(codigo);
        if (existente) {
          this.mensaje = "Ya existe un producto con ese código.";
          this.tipoMensaje = "error";
          this.render();
          return;
        }
        await createProduct({ codigo, nombre, proveedor, esFabricado, formula: this.formulaRows });
        this.mensaje = "Producto creado correctamente.";
      }
      this.tipoMensaje = "success";
      this.panel = null;
      this.editandoCodigo = null;
      this.formulaRows = [];
      await this.cargarDatos();
    } catch (err) {
      this.mensaje = `Error al guardar producto: ${err.message}`;
      this.tipoMensaje = "error";
      this.render();
    }
  }

  renderFormIngreso() {
    return `
      <div class="card card-form">
        <h3>Ingresar stock a inventario</h3>
        <form id="formIngreso" class="grid-form" novalidate>
          <label class="field">
            <span>Producto</span>
            <select name="codigo" required>
              <option value="">Selecciona un producto…</option>
              ${this.productos
                .map((p) => `<option value="${p.codigo}">${p.codigo} · ${p.nombre} (saldo actual: ${p.stock ?? 0})</option>`)
                .join("")}
            </select>
          </label>
          <label class="field">
            <span>Cantidad a ingresar</span>
            <input type="number" name="cantidad" min="0.01" step="any" required />
          </label>
          <div class="form-actions">
            <button class="btn btn-ghost" type="button" id="btnCancelarIngreso">Cancelar</button>
            <button class="btn btn-primary" type="submit">Ingresar al inventario</button>
          </div>
        </form>
      </div>
    `;
  }

  wireFormIngreso(form) {
    form.querySelector("#btnCancelarIngreso").addEventListener("click", () => {
      this.panel = null;
      this.render();
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const codigo = form.codigo.value;
      const cantidad = Number(form.cantidad.value);
      if (!codigo || !cantidad || cantidad <= 0) {
        this.mensaje = "Selecciona un producto e indica una cantidad válida.";
        this.tipoMensaje = "error";
        this.render();
        return;
      }
      try {
        await increaseStock(codigo, cantidad);
        this.mensaje = `Se ingresaron ${cantidad} unidades a ${codigo}.`;
        this.tipoMensaje = "success";
        this.panel = null;
        await this.cargarDatos();
      } catch (err) {
        this.mensaje = `Error al ingresar stock: ${err.message}`;
        this.tipoMensaje = "error";
        this.render();
      }
    });
  }

  async handleEliminar(codigo) {
    if (!confirm(`¿Eliminar el producto ${codigo} del inventario?`)) return;
    try {
      await deleteProduct(codigo);
      this.mensaje = "Producto eliminado.";
      this.tipoMensaje = "success";
      await this.cargarDatos();
    } catch (err) {
      this.mensaje = `Error al eliminar: ${err.message}`;
      this.tipoMensaje = "error";
      this.render();
    }
  }
}

customElements.define("inventory-view", InventoryView);