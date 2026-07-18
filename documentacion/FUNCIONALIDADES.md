# Mapa General de Funcionalidades - Sr. Waffle

Este documento es una guía de referencia rápida para ubicar todas las funcionalidades del sistema, entender en qué módulo están y para qué sirven.

El sistema se divide en 5 módulos principales (aplicaciones web):
1. **App Cliente** (`/`) - Menú público y pedidos online.
2. **Caja POS** (`/caja`) - Punto de venta físico para empleados.
3. **Panel KDS Cocina** (`/cocina`) - Pantalla para cocineros.
4. **Panel de Administración** (`/admin`) - Control total y métricas para el dueño.
5. **App Móvil** (`/app`) - Mini módulo para clientes sentados (rastreo, menú y reseñas).

---

## 1. Módulo: App Cliente (Pública)
**URL de acceso:** `http://localhost:3000/`

> [!NOTE]
> Esta es la única interfaz accesible públicamente sin autenticación. Los clientes no tienen acceso al inventario ni a los datos de la empresa, ya que la comunicación con el Backend está restringida.

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Ver Menú Digital** | Pantalla principal (Scroll) | El cliente puede ver todos los Waffles pre-armados disponibles, sus fotos y precios actualizados. |
| **Armado de Bubble Waffle (Paso a Paso)** | Botón "Armá tu Waffle" (Pantalla principal) | Asistente interactivo de 4 pasos (Base, Toppings, Salsas, Helados) para personalizar un waffle. Incluye un visualizador 2D dinámico del producto final. |
| **Rastreador de Pedidos** | Botón "Rastrear Pedido" (Header) | El cliente ingresa los últimos 4 dígitos de su código de pedido y el sistema le dice en qué estado está (Pendiente, Preparando, Listo). |
| **Pedido por WhatsApp** | Al finalizar el armado o elegir un producto del menú | Genera un resumen del pedido y abre automáticamente WhatsApp para enviarlo al número oficial del local (si la opción está habilitada en Admin). |
| **Pedido por Kiosco** | Botón "Generar Pedido" (Final del armado) | Envía el pedido al sistema interno (sin usar WhatsApp) y devuelve un código de 4 dígitos. El cliente debe acercarse a la caja y dictar este código para abonar y retirar. |

---

## 2. Módulo: Caja Registradora (POS)
**URL de acceso:** `http://localhost:3000/caja/`  
*(Requiere PIN de empleado con rol "Cajero" o el PIN Maestro de Admin. Genera un Token JWT de sesión)*

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Facturar Waffles Especiales** | Pestaña "Menú" (Centro) | Permite agregar a la comanda con 1 clic los waffles pre-diseñados (ej: Choco Bomba). |
| **Armar Waffle Personalizado** | Botón "Armar Bubble Waffle" (Menú) | Permite al cajero construir el waffle paso a paso a pedido del cliente en el mostrador. |
| **Vender Bebidas y Extras** | Pestaña "Bebidas / Otros" (Centro) | Agrega productos sueltos al ticket de compra. |
| **Recuperar de Kiosco** | Botón "Recuperar de Kiosco" (Panel derecho) | Permite ingresar el código de 4 dígitos de un cliente que usó la tablet. Carga automáticamente todos los ítems en el carrito para cobrarlos. |
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
*(Requiere Contraseña de Administrador. Genera un Token JWT de sesión)*

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Historial y Métricas de Ventas** | Menú lateral -> "Historial y Métricas" | Panel analítico con Ingresos Totales, Cantidad de Ventas, Ticket Promedio y Tiempo Promedio en Cocina. |
| **Filtro de Fechas y Gráficos** | Menú lateral -> "Historial y Métricas" (Arriba a la derecha) | Permite seleccionar "Fecha Inicio" y "Fecha Fin". Al hacer clic en "Filtrar", los gráficos, las tablas de cajeros y las ganancias se recalculan solo para esos días. |
| **Ventas por Cajero** | Menú lateral -> "Historial y Métricas" (Centro) | Muestra cuántas operaciones y cuánto dinero recaudó cada empleado. |
| **Reembolsos / Devoluciones** | Menú lateral -> "Historial y Métricas" (Tabla de Últimas Operaciones) | Botón "Devolver". Cancela una venta hecha por error y **devuelve automáticamente los ingredientes descontados al inventario**. |
| **Exportar CSV** | Menú lateral -> "Historial y Métricas" (Arriba a la derecha) | Descarga un archivo Excel con todas las ventas del periodo seleccionado. |
| **Inventario (Vista General)** | Menú lateral -> "Vista General" | Panorama completo de los niveles de inventario combinando stock base y masas. |
| **Control de Stock y Restock** | Menú lateral -> "Stock (Compras)" | Módulo para dar de alta materias primas (ej. Harina, Helado) y registrar reabastecimientos (botón `+`). Las compras ingresan como Lotes con método FIFO y se mantiene un historial de Movimientos de Almacén. |
| **Gestión de Insumos Elaborados** | Menú lateral -> "Insumos (Masas)" | Convertir materias primas del stock en insumos elaborados (ej. Masas), fijar su rendimiento y calcular su costo por porción, descontando stock a través de una orden de producción. |
| **Fichas Técnicas / Recetario** | Menú lateral -> "Recetas (Waffles)" | Crear y administrar las recetas de los Waffles. Permite elegir la masa y las cantidades exactas de ingredientes para determinar su costo de producción (sin asignar precio de venta). |
| **Gestión de Carta (Menú Público)**| Menú lateral -> "Menú (Público)" | Decidir qué Waffles (del recetario) o Bebidas (del stock) se publicarán en la Caja. Aquí se asigna el nombre comercial, el precio final para el cliente y su visibilidad. |
| **Dashboard de Reseñas** | Menú lateral -> "Reseñas" | Analítica en tiempo real del feedback de clientes. Muestra métricas totales, positivas (👍) y negativas (👎). Permite filtrar reseñas por fecha, buscar por ticket y cruza automáticamente los datos para mostrar el **cajero responsable** de esa venta. |
| **Seguridad y Contraseñas** | Menú lateral -> "Seguridad" | Cambiar la contraseña principal de Administración del sistema. |
| **Opciones Configurables (UI / Datos)** | Menú lateral -> "Opciones Configurables" | Cambiar el Logo, las imágenes del Carrusel de Portada, el Mapa de ubicación, activa el Club Waffle (fidelización), el Tiempo de Alerta en Cocina y el interruptor del "Modo Desarrollador". |
| **Theme Builder (Gestor de Temas)** | Menú lateral -> "Temas" / Botón Flotante 🎨 | Aparece solo si activaste el Modo Dev. Herramienta para gestionar presets de temas, personalizar colores, fondos de pantalla y CSS personalizado. |
| **Datos de Empresa** | Menú lateral -> "Datos Empresa" | Configurar el nombre comercial, la dirección, los horarios y el WhatsApp oficial que recibe los pedidos online. |
| **Gestión de Cajeros/Cocineros** | Menú lateral -> "Empleados" | Crear perfiles de empleados con nombre, PIN único de 4 dígitos y definir su rol (Cajero o Cocinero) para limitar su acceso a otras áreas. |
| **Visor de Manuales** | Menú lateral -> "Documentación" | Visor Markdown integrado (`marked.js`) para consultar las guías técnicas y esquemas de datos del sistema dinámicamente. |

---

## 5. Módulo: App Móvil (Rastreador, Menú y Reseñas)
**URL de acceso:** `http://localhost:3000/app/`  

| Funcionalidad | Cómo Llegar | Para qué sirve |
|--------------|-------------|----------------|
| **Rastreador de Pedidos en Vivo** | Pestaña "Rastreador" | Ingresar el código de 4 dígitos para ver el estado del pedido en tiempo real con animaciones fluidas (En Cola, Preparando, ¡Listo!). |
| **Menú Digital** | Pestaña "Menú" | Visualización elegante y mobile-friendly de los Waffles y Bebidas disponibles, ideal para ver desde la mesa a través de un código QR. |
| **Reseñas Integradas** | Automático al estar "Listo" | Permite calificar la experiencia con estrellas y comentarios (alimentando el dashboard del Admin) una vez finalizada la preparación. |

---

## 6. Guía de CSS para Theme Builder (Editor Avanzado)

Cuando utilices el botón **Abrir Editor de CSS 📝** en el **Theme Builder**, el código CSS inyectado tendrá el máximo nivel de prioridad para sobreescribir la apariencia de la aplicación. 

A continuación se detallan las **Variables CSS nativas** del sistema, que puedes usar o modificar dentro de tus propias reglas CSS.

### A. Variables de Color (Raíz `:root`)
El sistema Sr. Waffle utiliza un ecosistema de variables CSS para el coloreo. Si diseñas CSS personalizado, es recomendable utilizar estas variables (`var(--nombre-variable)`) para mantener coherencia, o puedes reescribirlas para forzar cambios drásticos.

**Fondos y Paneles:**
- `--bg-primary` : Color principal de fondo (Cuerpo entero de la web).
- `--bg-secondary` : Color de tarjetas, paneles y modales.
- `--bg-tertiary` : Color para hover (al pasar el ratón) o fondos de inputs.
- `--bg-card-raw` : Color puro (hex) utilizado para generar tarjetas con transparencia.
- `--bg-header-raw` : Color puro (hex) del header / navbar.
- `--bg-footer` : Color del pie de página.

**Acentos (Luces Neón / Colores Primarios):**
- `--neon-purple` : Color de acento principal (Botones primarios, enlaces).
- `--neon-pink` : Color de acento secundario (Alertas, elementos destacados).
- `--neon-cyan` : Color terciario (Botones secundarios, iconos).
- `--neon-yellow` : Alertas medias (Stock bajo, advertencias).
- `--neon-red` : Alertas críticas (Errores, eliminar, stock vacío).

**Variables Derivadas (Brillos Neón):**
*Estas variables se autogeneran con opacidad basándose en los acentos anteriores, ideales para usar en `box-shadow` o `text-shadow`.*
- `--neon-purple-glow`, `--neon-pink-glow`, `--neon-cyan-glow`, `--neon-yellow-glow`, `--neon-red-glow`.

**Textos:**
- `--text-primary` : Títulos y textos principales (Por defecto blanco/claro).
- `--text-secondary` : Textos mutados, subtítulos y descripciones (Por defecto gris).

### B. Clases Especiales del Layout (App Cliente)
Si deseas inyectar reglas CSS que afecten **únicamente a la página pública del cliente** (y no rompan el panel de Administrador), debes anteponer el selector `body.is-client-page`.

**Ejemplos de selectores útiles:**
- `body.is-client-page header { ... }` : Modifica la cabecera / menú del cliente.
- `body.is-client-page nav { ... }` : Modifica la lista de botones de navegación.
- `body.is-client-page .hero-title { ... }` : El título principal gigante en el inicio.
- `body.is-client-page .neon-slogan { ... }` : El banner publicitario debajo del título.
- `body.is-client-page .waffle-card { ... }` : Las tarjetas de productos en el menú.

### C. Ejemplo de Uso en CSS Avanzado
Si deseas crear un "Tema Playa" y quieres que todas las tarjetas de Waffles públicas tengan esquinas súper redondeadas y un borde amarillo sin afectar la caja registradora, tu CSS personalizado sería:

```css
/* Limita las modificaciones solo a la web pública */
body.is-client-page .waffle-card {
  border-radius: 30px;
  border: 2px solid var(--neon-yellow);
  background-color: rgba(255, 255, 255, 0.9);
  color: #333; /* Texto oscuro para legibilidad en fondo claro */
}

/* Cambiar fuente y color del título principal */
body.is-client-page .hero-title {
  color: var(--neon-cyan);
  text-shadow: 2px 2px 5px var(--neon-cyan-glow);
  text-transform: uppercase;
}
```
