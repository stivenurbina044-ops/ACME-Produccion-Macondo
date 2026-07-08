import { verifyPassword, createUser } from "../services/usersService.js";
import { setSession } from "../services/sessionState.js";

export class LoginView extends HTMLElement {
  constructor() {
    super();
    this.mode = "login"; 
    this.mensaje = "";
    this.tipoMensaje = "info";
    this.identificacion = "";
    this.password = "";
  }

  connectedCallback() {
    this.render();
  }

  setMensaje(texto, tipo = "info") {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    this.render();
  }

  render() {
    this.innerHTML = `
      <section class="auth-screen">
        <div class="auth-panel">
          <div class="auth-brand">
            <span class="brand-mark brand-mark-lg">AC</span>
            <h1>Acme · Planta Macondo</h1>
            <p>Control de inventario y producción</p>
          </div>

          ${this.mensaje ? `<div class="banner banner-${this.tipoMensaje}">${this.mensaje}</div>` : ""}

          ${this.mode === "login" ? this.renderLoginForm() : this.renderRegisterForm()}
        </div>
      </section>
    `;

    if (this.mode === "login") {
      this.querySelector("#formLogin").addEventListener("submit", (e) => this.handleLogin(e));
    } else {
      this.querySelector("#formRegister").addEventListener("submit", (e) => this.handleRegister(e));
      this.querySelector("#btnCancelar").addEventListener("click", () => {
        this.mode = "login";
        this.mensaje = "";
        this.render();
      });
    }
  }

  renderLoginForm() {
    return `
      <form id="formLogin" class="auth-form" novalidate>
        <label class="field">
          <span>Número de identificación</span>
          <input type="text" name="identificacion" value="${this.identificacion}" required autocomplete="username" />
        </label>
        <label class="field">
          <span>Contraseña</span>
          <input type="password" name="password" required autocomplete="current-password" />
        </label>
        <button class="btn btn-primary" type="submit">Ingresar</button>
        <p class="auth-hint">Si tu identificación aún no está registrada, podrás crear tu usuario en el siguiente paso.</p>
      </form>
    `;
  }

  renderRegisterForm() {
    return `
      <form id="formRegister" class="auth-form" novalidate>
        <p class="auth-hint">No encontramos ese número de identificación. Completa tus datos para registrarte.</p>
        <label class="field">
          <span>Número de identificación</span>
          <input type="text" name="identificacion" value="${this.identificacion}" readonly />
        </label>
        <label class="field">
          <span>Nombre completo</span>
          <input type="text" name="nombreCompleto" required />
        </label>
        <label class="field">
          <span>Cargo</span>
          <input type="text" name="cargo" required />
        </label>
        <label class="field">
          <span>Contraseña</span>
          <input type="password" name="password" value="${this.password}" required minlength="4" />
        </label>
        <label class="field">
          <span>Confirmar contraseña</span>
          <input type="password" name="confirmPassword" required minlength="4" />
        </label>
        <div class="form-actions">
          <button class="btn btn-ghost" type="button" id="btnCancelar">Cancelar</button>
          <button class="btn btn-primary" type="submit">Registrar y entrar</button>
        </div>
      </form>
    `;
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const identificacion = form.identificacion.value.trim();
    const password = form.password.value;

    if (!identificacion || !password.trim()) {
      this.setMensaje("Ingresa identificación y contraseña.", "error");
      return;
    }

    this.setMensaje("Verificando usuario…", "info");

    try {
      const { exists, valid, user } = await verifyPassword(identificacion, password);

      if (!exists) {
        this.identificacion = identificacion;
        this.password = password;
        this.mode = "register";
        this.mensaje = "";
        this.render();
        return;
      }

      if (!valid) {
        this.setMensaje("Contraseña incorrecta.", "error");
        return;
      }

      setSession(user);
      this.dispatchEvent(new CustomEvent("acme-login-success", { bubbles: true }));
    } catch (err) {
      this.setMensaje(`No fue posible validar el usuario: ${err.message}`, "error");
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const identificacion = form.identificacion.value.trim();
    const nombreCompleto = form.nombreCompleto.value.trim();
    const cargo = form.cargo.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!identificacion || !nombreCompleto || !cargo) {
      this.setMensaje("Completa identificación, nombre completo y cargo (no pueden ser solo espacios).", "error");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      this.setMensaje("La contraseña no puede estar vacía ni contener solo espacios.", "error");
      return;
    }

    if (password !== confirmPassword) {
      this.setMensaje("Las contraseñas no coinciden. Verifícalas.", "error");
      return;
    }

    this.setMensaje("Creando tu usuario…", "info");

    try {
      const user = await createUser({ identificacion, nombreCompleto, cargo, password });
      setSession(user);
      this.dispatchEvent(new CustomEvent("acme-login-success", { bubbles: true }));
    } catch (err) {
      this.setMensaje(`No fue posible registrar el usuario: ${err.message}`, "error");
    }
  }
}

customElements.define("login-view", LoginView);