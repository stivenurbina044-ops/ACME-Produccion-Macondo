const BASE_URL = "https://proyectoacmeproduccion1-default-rtdb.firebaseio.com";

/**
 * Construye la URL REST de un nodo de la base de datos.
 * @param {string} path - ruta del nodo, ej: "usuarios/123"
 */
function buildUrl(path) {
  return `${BASE_URL}/${path}.json`;
}


export async function dbGet(path) {
  const res = await fetch(buildUrl(path));
  if (!res.ok) throw new Error(`Error al leer "${path}" (HTTP ${res.status})`);
  return res.json();
}


export async function dbSet(path, data) {
  const res = await fetch(buildUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error al guardar "${path}" (HTTP ${res.status})`);
  return res.json();
}


export async function dbUpdate(path, data) {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error al actualizar "${path}" (HTTP ${res.status})`);
  return res.json();
}


export async function dbDelete(path) {
  const res = await fetch(buildUrl(path), { method: "DELETE" });
  if (!res.ok) throw new Error(`Error al eliminar "${path}" (HTTP ${res.status})`);
  return res.json();
}


export async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
