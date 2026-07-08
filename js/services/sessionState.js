const KEY = "acme_sesion";

export function setSession(user) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      identificacion: user.identificacion,
      nombreCompleto: user.nombreCompleto,
      cargo: user.cargo,
    })
  );
}

export function getSession() {
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
