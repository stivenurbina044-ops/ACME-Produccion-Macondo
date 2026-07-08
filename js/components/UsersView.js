import { getAllUsers, createUser, updateUser, deleteUser, getUser } from "../services/usersService.js";

export class UsersView extends HTMLElement {
  constructor() {
    super();
    this.usuarios = [];
    this.editando = null; 
    this.cargando = true;
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
      this.usuarios = await getAllUsers();
    } catch (err) {
      this.mensaje = `Error al cargar usuarios: ${err.message}`;
      this.tipoMensaje = "error";
    }
    this.cargando = false;
    this.render();
  }

  render() {
    this.innerHTML = `
      <section class="view">
        <div class="view-header">
          <div>
            <h2>Usuarios</h2>
            <p class="muted">Crea, modifica o elimina usuarios con acceso al sistema.</p>
          </div>
          <button class="btn btn-primary" id="btnNuevo">+ Nuevo usuario</button>
        </div>

        ${this.mensaje ? `<div class="banner banner-${this.tipoMensaje}">${this.mensaje}</div>` : ""}

        ${this.editando !== undefined && this.editando !== null ? this.renderFormulario() : ""}

        <div class="card">
          ${this.cargando ? `<p class="muted">Cargando usuarios…</p>` : this.renderTabla()}
        </div>
      </section>
    `;

    const btnNuevo = this.querySelector("#btnNuevo");
    if (btnNuevo) {
      btnNuevo.addEventListener("click", () => {
        this.editando = "__nuevo__";
        this.render();
      });
    }

    const form = this.querySelector("#formUsuario");
    if (form) {
      form.addEventListener("submit", (e) => this.handleGuardar(e));
      this.querySelector("#btnCancelarForm").addEventListener("click", () => {
        this.editando = null;
        this.render();
      });
    }

    this.querySelectorAll("[data-editar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.editando = btn.dataset.editar;
        this.render();
      });
    });

    this.querySelectorAll("[data-eliminar]").forEach((btn) => {
      btn.addEventListener("click", () => this.handleEliminar(btn.dataset.eliminar));
    });
  }

  renderTabla() {
    if (this.usuarios.length === 0) {
      return `<p class="muted">Aún no hay usuarios registrados.</p>`;
    }

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Identificación</th>
            <th>Nombre completo</th>
            <th>Cargo</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${this.usuarios
            .map(
              (u) => `
            <tr>
              <td><span class="mono">${u.identificacion}</span></td>
              <td>${u.nombreCompleto}</td>
              <td>${u.cargo}</td>
              <td class="col-actions">
                <button class="btn btn-sm" data-editar="${u.identificacion}">Editar</button>
                <button class="btn btn-sm btn-danger" data-eliminar="${u.identificacion}">Eliminar</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  renderFormulario() {
    const esNuevo = this.editando === "__nuevo__";
    const usuario = esNuevo ? null : this.usuarios.find((u) => u.identificacion === this.editando);

    return `
      <div class="card card-form">
        <h3>${esNuevo ? "Nuevo usuario" : "Editar usuario"}</h3>
        <form id="formUsuario" class="grid-form" novalidate>
          <label class="field">
            <span>Número de identificación</span>
            <input type="text" name="identificacion" value="${usuario?.identificacion || ""}" ${esNuevo ? "" : "readonly"} required />
          </label>
          <label class="field">
            <span>Nombre completo</span>
            <input type="text" name="nombreCompleto" value="${usuario?.nombreCompleto || ""}" required />
          </label>
          <label class="field">
            <span>Cargo</span>
            <input type="text" name="cargo" value="${usuario?.cargo || ""}" required />
          </label>
          <label class="field">
            <span>${esNuevo ? "Contraseña" : "Nueva contraseña (opcional)"}</span>
            <input type="password" name="password" ${esNuevo ? "required" : ""} minlength="4" />
          </label>
          <label class="field">
            <span>Confirmar contraseña</span>
            <input type="password" name="confirmPassword" ${esNuevo ? "required" : ""} minlength="4" />
          </label>
          <div class="form-actions">
            <button class="btn btn-ghost" type="button" id="btnCancelarForm">Cancelar</button>
            <button class="btn btn-primary" type="submit">Guardar</button>
          </div>
        </form>
      </div>
    `;
  }

  async handleGuardar(e) {
    e.preventDefault();
    const form = e.target;
    const identificacion = form.identificacion.value.trim();
    const nombreCompleto = form.nombreCompleto.value.trim();
    const cargo = form.cargo.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const esNuevo = this.editando === "__nuevo__";

    if (!identificacion || !nombreCompleto || !cargo) {
      this.mensaje = "La identificación, el nombre completo y el cargo no pueden estar vacíos ni contener solo espacios.";
      this.tipoMensaje = "error";
      this.render();
      return;
    }

    if (esNuevo && (!password.trim() || !confirmPassword.trim())) {
      this.mensaje = "La contraseña no puede estar vacía ni contener solo espacios.";
      this.tipoMensaje = "error";
      this.render();
      return;
    }

    if ((password || confirmPassword) && !password.trim()) {
      this.mensaje = "La nueva contraseña no puede contener solo espacios.";
      this.tipoMensaje = "error";
      this.render();
      return;
    }

    if (password || confirmPassword || esNuevo) {
      if (password !== confirmPassword) {
        this.mensaje = "Las contraseñas no coinciden.";
        this.tipoMensaje = "error";
        this.render();
        return;
      }
    }

    try {
      if (esNuevo) {
        const existente = await getUser(identificacion);
        if (existente) {
          this.mensaje = "Ya existe un usuario con esa identificación.";
          this.tipoMensaje = "error";
          this.render();
          return;
        }
        await createUser({ identificacion, nombreCompleto, cargo, password });
        this.mensaje = "Usuario creado correctamente.";
      } else {
        const cambios = { nombreCompleto, cargo };
        if (password) cambios.password = password;
        await updateUser(identificacion, cambios);
        this.mensaje = "Usuario actualizado correctamente.";
      }
      this.tipoMensaje = "success";
      this.editando = null;
      await this.cargarDatos();
    } catch (err) {
      this.mensaje = `Error al guardar: ${err.message}`;
      this.tipoMensaje = "error";
      this.render();
    }
  }

  async handleEliminar(identificacion) {
    if (!confirm(`¿Eliminar el usuario ${identificacion}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(identificacion);
      this.mensaje = "Usuario eliminado.";
      this.tipoMensaje = "success";
      await this.cargarDatos();
    } catch (err) {
      this.mensaje = `Error al eliminar: ${err.message}`;
      this.tipoMensaje = "error";
      this.render();
    }
  }
}

customElements.define("users-view", UsersView);