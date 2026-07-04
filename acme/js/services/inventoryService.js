import { dbGet, dbSet, dbUpdate, dbDelete } from "./firebaseService.js";

const NODE = "productos";

export async function getProduct(codigo) {
  return dbGet(`${NODE}/${codigo}`);
}

export async function getAllProducts() {
  const data = await dbGet(NODE);
  if (!data) return [];
  return Object.values(data);
}


export async function createProduct({ codigo, nombre, proveedor, esFabricado, formula }) {
  const producto = {
    codigo,
    nombre,
    proveedor,
    esFabricado: !!esFabricado,
    formula: esFabricado ? formula || [] : [],
    stock: 0,
  };
  await dbSet(`${NODE}/${codigo}`, producto);
  return producto;
}

export async function updateProduct(codigo, cambios) {
  await dbUpdate(`${NODE}/${codigo}`, cambios);
}

export async function deleteProduct(codigo) {
  await dbDelete(`${NODE}/${codigo}`);
}


export async function increaseStock(codigo, cantidad) {
  const producto = await getProduct(codigo);
  if (!producto) throw new Error("El producto no existe");
  const nuevoStock = (producto.stock || 0) + Number(cantidad);
  await dbUpdate(`${NODE}/${codigo}`, { stock: nuevoStock });
  return nuevoStock;
}


export async function adjustStock(codigo, delta) {
  const producto = await getProduct(codigo);
  if (!producto) throw new Error(`El producto ${codigo} no existe`);
  const nuevoStock = (producto.stock || 0) + delta;
  await dbUpdate(`${NODE}/${codigo}`, { stock: nuevoStock });
  return nuevoStock;
}
