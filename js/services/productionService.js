import { dbGet, dbSet, dbUpdate } from "./firebaseService.js";
import { getProduct, adjustStock } from "./inventoryService.js";

const NODE = "producciones";
const COUNTER_PATH = "contadores/produccion";


async function getNextCode() {
  const actual = (await dbGet(COUNTER_PATH)) || 0;
  const siguiente = actual + 1;
  await dbSet(COUNTER_PATH, siguiente);
  return siguiente;
}


export async function validarDisponibilidad(items) {
  const requerimientos = {}; 
  const errores = [];

  for (const item of items) {
    const producto = await getProduct(item.codigo);
    if (!producto) {
      errores.push(`El producto ${item.codigo} no existe`);
      continue;
    }
    if (!producto.esFabricado || !producto.formula || producto.formula.length === 0) {
      errores.push(`El producto ${item.codigo} no tiene fórmula de producción`);
      continue;
    }
    for (const ing of producto.formula) {
      const necesario = ing.cantidad * item.cantidad;
      requerimientos[ing.codigo] = (requerimientos[ing.codigo] || 0) + necesario;
    }
  }

  for (const codigoMP of Object.keys(requerimientos)) {
    const mp = await getProduct(codigoMP);
    const disponible = mp ? mp.stock || 0 : 0;
    if (disponible < requerimientos[codigoMP]) {
      errores.push(
        `Materia prima insuficiente: ${codigoMP} (disponible ${disponible}, se necesita ${requerimientos[codigoMP]})`
      );
    }
  }

  return { ok: errores.length === 0, errores, requerimientos };
}


export async function ejecutarProduccion(items, usuario) {
  const validacion = await validarDisponibilidad(items);
  if (!validacion.ok) {
    const err = new Error("No es posible ejecutar la producción");
    err.detalles = validacion.errores;
    throw err;
  }

  const resumenItems = [];

  for (const item of items) {
    const producto = await getProduct(item.codigo);
    const materiaPrimaUsada = [];

    for (const ing of producto.formula) {
      const cantidadUsada = ing.cantidad * item.cantidad;
      await adjustStock(ing.codigo, -cantidadUsada);
      materiaPrimaUsada.push({
        codigo: ing.codigo,
        nombre: ing.nombre,
        cantidad: cantidadUsada,
        unidad: ing.unidad || "",
      });
    }

    await adjustStock(item.codigo, item.cantidad);

    resumenItems.push({
      codigo: item.codigo,
      nombre: producto.nombre,
      cantidadFabricada: item.cantidad,
      materiaPrimaUsada,
    });
  }

  const codigo = await getNextCode();
  const registro = {
    codigo,
    fecha: new Date().toISOString(),
    usuario: usuario || "desconocido",
    items: resumenItems,
  };

  await dbSet(`${NODE}/${codigo}`, registro);
  return registro;
}

export async function getAllProducciones() {
  const data = await dbGet(NODE);
  if (!data) return [];
  return Object.values(data).sort((a, b) => b.codigo - a.codigo);
}
