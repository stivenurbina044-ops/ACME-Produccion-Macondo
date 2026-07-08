import { dbGet, dbSet, dbUpdate, dbDelete, hashText } from "./firebaseService.js";

const NODE = "usuarios";

export async function getUser(identificacion) {
  return dbGet(`${NODE}/${identificacion}`);
}

export async function getAllUsers() {
  const data = await dbGet(NODE);
  if (!data) return [];
  return Object.values(data);
}

export async function createUser({ identificacion, nombreCompleto, cargo, password }) {
  const passwordHash = await hashText(password);
  const user = { identificacion, nombreCompleto, cargo, passwordHash };
  await dbSet(`${NODE}/${identificacion}`, user);
  return user;
}

export async function updateUser(identificacion, cambios) {
  const payload = { ...cambios };
  if (payload.password) {
    payload.passwordHash = await hashText(payload.password);
    delete payload.password;
  }
  await dbUpdate(`${NODE}/${identificacion}`, payload);
}

export async function deleteUser(identificacion) {
  await dbDelete(`${NODE}/${identificacion}`);
}

export async function verifyPassword(identificacion, password) {
  const user = await getUser(identificacion);
  if (!user) return { exists: false, valid: false, user: null };
  const hash = await hashText(password);
  return { exists: true, valid: hash === user.passwordHash, user };
}
