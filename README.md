# Gestión de Producción - ACME

## Descripción

Este proyecto corresponde al desarrollo de una aplicación web para la empresa **ACME**, cuyo objetivo es automatizar el proceso de producción de la planta ubicada en la ciudad de Macondo.

La aplicación fue desarrollada utilizando **HTML, CSS y JavaScript**, implementando una arquitectura modular mediante **Web Components** para facilitar la reutilización del código y el mantenimiento del sistema.

---

# Objetivos

- Automatizar el proceso de producción.
- Gestionar usuarios del sistema.
- Administrar el inventario de materias primas y productos terminados.
- Registrar procesos productivos.
- Implementar una interfaz responsive y amigable para el usuario.

---

# Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript (ES6)
- Web Components
- Firebase Realtime Database
- Fetch API

---

# Estructura del proyecto

```
ProyectoAcmeProduccion_JavaScript_ApellidoNombre/

│
├── css/
│   └── styles.css
│
├── js/
│   ├── components/
│   │   ├── AppNavbar.js
│   │   ├── AppRoot.js
│   │   ├── InventoryView.js
│   │   ├── LoginView.js
│   │   ├── ProductionView.js
│   │   └── UsersView.js
│   │
│   ├── services/
│   │   ├── firebaseService.js
│   │   ├── inventoryService.js
│   │   ├── productiondraftstate.js
│   │   ├── productionService.js
│   │   ├── sessionState.js
│   │   └── usersService.js
│   │
│   └── main.js
│
├── index.html
└── README.md
```

---

# Funcionalidades

## Login

Permite el acceso al sistema mediante:

- Número de identificación.
- Contraseña.

El sistema valida que el usuario exista antes de permitir el ingreso,.

---

## Módulo de Usuarios

Permite:

- Registrar usuarios.
- Modificar usuarios.
- Eliminar usuarios.

Datos registrados:

- Identificación
- Nombre completo
- Cargo
- Contraseña

---

## Módulo de Inventario

Permite administrar las materias primas y productos.

Cada producto contiene:

- Código
- Nombre
- Proveedor
- Cantidad disponible

También permite aumentar el stock existente.

---

## Módulo de Producción

Permite fabricar productos terminados utilizando materias primas.

Durante el proceso:

- Disminuye automáticamente el inventario de materias primas.
- Incrementa el inventario del producto terminado.
- Genera un código consecutivo para cada proceso.

---

## Consulta de Inventario

Incluye:

- Lista completa de productos.
- Cantidad disponible.
- Buscador mediante filtros.

---

## Resumen de Producción

Después de fabricar un producto, el sistema presenta:

- Producto fabricado.
- Cantidad producida.
- Materia prima utilizada.
- Cantidad consumida.

---

# Base de datos

El proyecto utiliza **Firebase Realtime Database** para almacenar la información del sistema.

Colecciones principales:

- Usuarios
- Productos
- Inventario
- Producción

---

# Diseño

El proyecto fue desarrollado siguiendo principios de:

- Responsive Design
- Experiencia de Usuario (UX)
- Componentes reutilizables mediante Web Components.

---

# Cómo ejecutar el proyecto

1. Clonar el repositorio.

```
git clone https://github.com/usuario/ProyectoAcmeProduccion_JavaScript_ApellidoNombre.git
```

2. Abrir el proyecto en Visual Studio Code.

3. Instalar la extensión **Live Server**.

4. Ejecutar el archivo `index.html`.

---

# Requisitos

- Navegador moderno.
- Visual Studio Code.
- Live Server.
- Conexión a Internet.
- Firebase Realtime Database configurado.

---

# Autor

**Stiven Urbina**

Proyecto desarrollado como evidencia para el módulo de JavaScript.