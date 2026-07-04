import { getSession } from "../services/sessionState.js";

export class AppNavbar extends HTMLElement {
  static get observedAttributes() {
    return ["current"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const current = this.getAttribute("current") || "inventario";
    const sesion = getSession();

    this.innerHTML = `
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">AC</span>
          <div class="brand-text">
            <strong>Acme · Macondo</strong>
            <span>Gestión de producción</span>
          </div>
        </div>

        <nav class="tabs" role="tablist" aria-label="Módulos de la aplicación">
          <button class="tab ${current === "inventario" ? "active" : ""}" data-view="inventario">Inventario</button>
          <button class="tab ${current === "produccion" ? "active" : ""}" data-view="produccion">Producción</button>
          <button class="tab ${current === "usuarios" ? "active" : ""}" data-view="usuarios">Usuarios</button>
        </nav>

        <div class="session">
          <div class="session-user">
            <strong>${sesion?.nombreCompleto || ""}</strong>
            <span>${sesion?.cargo || ""}</span>
          </div>
          <button class="btn btn-ghost" id="btnLogout">Salir</button>
        </div>
      </header>
    `;

    this.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("acme-navigate", {
            detail: { view: btn.dataset.view },
            bubbles: true,
          })
        );
      });
    });

    this.querySelector("#btnLogout").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("acme-logout", { bubbles: true }));
    });
  }
}

customElements.define("app-navbar", AppNavbar);
