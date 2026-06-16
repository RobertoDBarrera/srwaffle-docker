# Mapa General de Funcionalidades - Sr. Waffle

Este documento es una guía de referencia rápida para ubicar todas las funcionalidades del sistema, entender en qué módulo están y para qué sirven.

El sistema se divide en 3 módulos principales (aplicaciones web):
1. **App Cliente** (`/`) - Menú público y pedidos online.
2. **Caja POS** (`/caja`) - Punto de venta físico para empleados.
3. **Panel KDS Cocina** (`/cocina`) - Pantalla para cocineros.
4. **Panel de Administración** (`/admin`) - Control total y métricas para el dueño.

---

## 1. Módulo: App Cliente (Pública)
**URL de acceso:** `http://localhost:3000/`

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Ver Menú Digital** | Pantalla principal (Scroll) | El cliente puede ver todos los Waffles pre-armados disponibles, sus fotos y precios actualizados. |
| **Armado de Bubble Waffle (Paso a Paso)** | Botón "Armá tu Waffle" (Pantalla principal) | Asistente interactivo de 4 pasos (Base, Toppings, Salsas, Helados) para personalizar un waffle. Incluye un visualizador 2D dinámico del producto final. |
| **Rastreador de Pedidos** | Botón "Rastrear Pedido" (Header) | El cliente ingresa los últimos 4 dígitos de su código de pedido y el sistema le dice en qué estado está (Pendiente, Preparando, Listo). |
| **Pedido por WhatsApp** | Al finalizar el armado o elegir un producto del menú | Genera un resumen del pedido y abre automáticamente WhatsApp para enviarlo al número oficial del local (si la opción está habilitada en Admin). |

---

## 2. Módulo: Caja Registradora (POS)
**URL de acceso:** `http://localhost:3000/caja/`  
*(Requiere PIN de empleado con rol "Cajero" o el PIN Maestro de Admin)*

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Facturar Waffles Especiales** | Pestaña "Menú" (Centro) | Permite agregar a la comanda con 1 clic los waffles pre-diseñados (ej: Choco Bomba). |
| **Armar Waffle Personalizado** | Botón "Armar Bubble Waffle" (Menú) | Permite al cajero construir el waffle paso a paso a pedido del cliente en el mostrador. |
| **Vender Bebidas y Extras** | Pestaña "Bebidas / Otros" (Centro) | Agrega productos sueltos al ticket de compra. |
| **Carrito de Compras** | Panel lateral derecho | Muestra la lista de ítems a cobrar, el total en ARS y permite eliminar ítems individualmente. |
| **Cobro y Medios de Pago** | Panel lateral derecho (Botones verdes) | Permite registrar la venta indicando si el cliente pagó en Efectivo, Débito o MercadoPago. Envía automáticamente el pedido al KDS de cocina y muestra un cartel con el **Código de Rastreo**. |
| **Últimas Ventas** | Botón "Últimas Ventas" (Arriba a la derecha) | Muestra una lista con las ventas cobradas durante el día actual y sus respectivos códigos de rastreo por si el cliente lo olvida. |
| **Club Waffle (Fidelización)** | Panel lateral derecho (Al cobrar) | El cajero puede ingresar el celular del cliente. Si el cliente está registrado, se le suman puntos según la compra. Si acumula suficientes, se le informa para canjear recompensas. |
| **Bloqueo Rápido** | Botón "Bloquear" (Arriba a la derecha) | Cierra la sesión del cajero temporalmente por seguridad cuando se aleja de la caja. |

---

## 3. Módulo: Pantalla de Cocina (KDS)
**URL de acceso:** `http://localhost:3000/cocina/`  
*(Requiere PIN de empleado con rol "Cocinero" o el PIN Maestro de Admin)*

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Bandeja de Entrada (Nuevos)** | Columna "Recibidos" (Izquierda) | Muestra los tickets de los pedidos apenas son cobrados en Caja. |
| **En Preparación** | Columna "En Preparación" (Centro) | Cuando el cocinero hace clic en un ticket "Nuevo", pasa a esta columna indicando que ya se está cocinando. |
| **Listo / Despachado** | Columna "Listos" (Derecha) | Al terminar, el cocinero hace clic en el ticket. El sistema guarda la hora de finalización (para las métricas de promedio de tiempo) y el cliente puede ver que su pedido está listo en el rastreador. |
| **Alertas Inteligentes (Flash)** | Automático en los tickets | Si un ticket pasa más de X minutos (configurable en Admin) sin ser preparado o terminado, el ticket empezará a parpadear en rojo alertando al personal. |

---

## 4. Módulo: Panel de Administración
**URL de acceso:** `http://localhost:3000/admin/`  
*(Requiere Contraseña de Administrador)*

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Historial y Métricas de Ventas** | Menú lateral -> "Historial y Métricas" | Panel analítico con Ingresos Totales, Cantidad de Ventas, Ticket Promedio y Tiempo Promedio en Cocina. |
| **Filtro de Fechas y Gráficos** | Menú lateral -> "Historial y Métricas" (Arriba a la derecha) | Permite seleccionar "Fecha Inicio" y "Fecha Fin". Al hacer clic en "Filtrar", los gráficos, las tablas de cajeros y las ganancias se recalculan solo para esos días. |
| **Ventas por Cajero** | Menú lateral -> "Historial y Métricas" (Centro) | Muestra cuántas operaciones y cuánto dinero recaudó cada empleado. |
| **Reembolsos / Devoluciones** | Menú lateral -> "Historial y Métricas" (Tabla de Últimas Operaciones) | Botón "Devolver". Cancela una venta hecha por error y **devuelve automáticamente los ingredientes descontados al inventario**. |
| **Exportar CSV** | Menú lateral -> "Historial y Métricas" (Arriba a la derecha) | Descarga un archivo Excel con todas las ventas del periodo seleccionado. |
| **Control de Stock y Restock** | Menú lateral -> "Control de Stock" | Visualiza los niveles físicos de cada ingrediente. Si hay poco, la barra se pone amarilla o roja. Permite reabastecer haciendo clic en el botón `+`. |
| **Gestión de Insumos Elaborados** | Menú lateral -> "Insumos (Masas)" | Convertir materias primas del stock en insumos elaborados (ej. Masas), fijar su rendimiento y calcular su costo por porción. |
| **Fichas Técnicas / Recetario** | Menú lateral -> "Recetas (Waffles)" | Crear y administrar las recetas de los Waffles. Permite elegir la masa y las cantidades exactas de ingredientes para determinar su costo de producción (sin asignar precio de venta). |
| **Gestión de Carta (Menú Público)**| Menú lateral -> "Menú (Público)" | Decidir qué Waffles (del recetario) o Bebidas (del stock) se publicarán en la Caja. Aquí se asigna el nombre comercial, el precio final para el cliente y su visibilidad. |
| **Opciones Configurables (UI / Datos)** | Menú lateral -> "Opciones Configurables" | Cambiar el Logo, las imágenes del Carrusel de Portada, el Mapa de ubicación, activa el Club Waffle (fidelización) y el Tiempo de Alerta en Cocina. |
| **Datos de Empresa** | Menú lateral -> "Datos Empresa" | Configurar el nombre comercial, la dirección, los horarios y el WhatsApp oficial que recibe los pedidos online. |
| **Gestión de Cajeros/Cocineros** | Menú lateral -> "Empleados" | Crear perfiles de empleados con nombre, PIN único de 4 dígitos y definir su rol (Cajero o Cocinero) para limitar su acceso a otras áreas. |
| **Seguridad y Contraseñas** | Menú lateral -> "Seguridad" | Cambiar la contraseña principal de Administración del sistema. |
| **Módulo Dev / Testing** | Menú lateral -> "Módulo Dev" | Herramientas exclusivas para el desarrollador: Inyectar ventas de prueba, simular pedidos masivos, resetear el inventario o purgar la base de datos completa. |
