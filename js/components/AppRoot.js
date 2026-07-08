import { getSession, clearSession } from "../services/sessionState.js";
import "./LoginView.js";
import "./AppNavbar.js";
import "./UsersView.js";
import "./InventoryView.js";
import "./ProductionView.js";

export class AppRoot extends HTMLElement {
  constructor() {
    super();
    this.currentView = "inventario";
  }

  connectedCallback() {
    this.render();
    this.addEventListener("acme-login-success", () => {
      this.currentView = "inventario";
      this.render();
    });
    this.addEventListener("acme-logout", () => {
      clearSession();
      this.render();
    });
    this.addEventListener("acme-navigate", (e) => {
      this.currentView = e.detail.view;
      this.render();
    });
  }

  render() {
    const sesion = getSession();

    if (!sesion) {
      this.innerHTML = `<login-view></login-view>`;
      return;
    }

    this.innerHTML = `
      <app-navbar current="${this.currentView}"></app-navbar>
      <main class="app-main">
        ${this.renderView(sesion)}
      </main>
    `;
  }

  renderView(sesion) {
    switch (this.currentView) {
      case "usuarios":
        return `<users-view></users-view>`;
      case "produccion":
        return `<production-view usuario="${sesion.identificacion}"></production-view>`;
      case "inventario":
      default:
        return `<inventory-view></inventory-view>`;
    }
  }
}

customElements.define("app-root", AppRoot);
