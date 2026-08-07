# Manual de Administración y Despliegue - Sr. Waffle

Este documento reúne toda la información técnica necesaria para desplegar, operar, configurar y administrar el sistema de **Sr. Waffle**.

---

## 🧭 1. Directorio de Acceso (URLs y URIs)

El sistema expone cinco portales web independientes a través del servidor Express:

| Interfaz | URI de Acceso | Rol / Destinatarios | Método de Acceso | Clave por Defecto |
| :--- | :--- | :--- | :--- | :--- |
| **Web de Clientes** | `/` (ej: `http://localhost:3000/`) | Clientes (armado de waffle en 2D y pedidos de WhatsApp) | Público (Acceso libre) | No aplica |
| **App Móvil** | `/app` (ej: `http://localhost:3000/app`) | Clientes en mesa (menú digital, rastreo de pedidos y reseñas) | Público (Acceso libre) | No aplica |
| **Caja Registradora POS** | `/caja` (ej: `http://localhost:3000/caja`) | Cajeros (registro rápido de comandas en mostrador) | Bloqueo por PIN Individual | Asignado en Admin |
| **Pantalla de Cocina KDS** | `/cocina` (ej: `http://localhost:3000/cocina`) | Cocineros (gestión visual de tickets y tiempos de preparación) | Bloqueo por PIN Individual | Asignado en Admin |
| **Pantalla de TV** | `/tv` (ej: `http://localhost:3000/tv`) | Clientes en tienda física (llamador visual y sonoro) | Público (Acceso libre) | No aplica |
| **Panel de Administración** | `/admin` (ej: `http://localhost:3000/admin`) | Propietarios y Administradores (inventario, CRUDs, métricas y CSV) | Bloqueo por Contraseña | **`admin`** |

---

## 🔒 2. Seguridad y Credenciales (Autenticación JWT)

El control de accesos se valida en el backend mediante consultas seguras a la base de datos y la emisión de tokens JWT:
*   **Modificación de claves:** El administrador puede cambiar la contraseña general de administración desde la pestaña **Seguridad**, y gestionar los PINs individuales de acceso para cada cajero/cocinero desde la pestaña **Empleados**.
*   **Tokens (JWT):** Al iniciar sesión correctamente (tanto en el panel de Administración como en la Caja), el servidor genera un `JSON Web Token` (JWT). Este token se almacena en el `sessionStorage` del navegador y es requerido para todas las operaciones (POST, PUT, DELETE y lecturas sensibles) con la API.
*   **Limitación de Tasa (Rate Limiting):** El servidor implementa un límite de peticiones (Rate Limiting) en las rutas de validación de PIN/Contraseña para evitar ataques de fuerza bruta.
*   **Persistencia:** Las credenciales subyacentes se almacenan de forma segura en la tabla `settings` (o en `settings.json` en modo emulación).

---

## ⚙️ 3. Modos de Ejecución y Despliegue

La aplicación está diseñada bajo el principio de **cero fricción** para desarrollo y robustez para producción. Admite tres modos de despliegue:

### 🚀 Modo A: Emulación Local (Sin Base de Datos - Cero Configuración)
Ideal para demostraciones rápidas, pruebas y desarrollo local.
1.  **Ejecución:** No requiere configurar nada. Ejecutá:
    ```bash
    npm start
    ```
2.  **Comportamiento:** El backend detectará la falta de una base de datos PostgreSQL activa y automáticamente activará el modo de emulación local persistiendo los datos dentro del directorio `/data` en archivos `.json`.

---

### 💾 Modo B: Base de Datos PostgreSQL Local
Ideal para validar el comportamiento real de producción de forma local.
1.  **Configurar Entorno:** Creá una base de datos en tu PostgreSQL (ej: `srwaffle`) y configurá la conexión en el archivo local [`.env`](file:///c:/Users/rdbarrera/Documents/proyectos/sr%20waffle/.env):
    ```env
    PORT=3000
    DATABASE_URL=postgresql://tu_usuario:tu_contraseña@localhost:5432/srwaffle
    ```
2.  **Migrar Datos Existentes:** Copiá la información de tus archivos JSON previos hacia la base de datos corriendo el comando de migración:
    ```bash
    npm run migrate
    ```
3.  **Iniciar Servidor:** Corre `npm start`. El sistema inicializará las tablas necesarias si no existen y utilizará PostgreSQL para la persistencia.

---

### 🐳 Modo C: Contenedorizado con Docker (Recomendado para VPS y Local)
Orquesta el servidor Node.js y la base de datos en red con un solo comando.
1.  **Requisitos:** Tener instalado [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose.
2.  **Lanzamiento:** Ejecutá en la raíz del proyecto:
    ```bash
    docker compose up --build -d
    ```
3.  **Migrar Datos JSON:** Si querés inyectar tus datos de prueba en la base de datos del contenedor, ejecutá:
    ```bash
    docker compose exec web npm run migrate
    ```
4.  **Detener el Entorno:** `docker compose down`.

---

### ☁️ Modo D: Despliegue en la Nube (Producción Real)
Para subir la aplicación a internet te recomendamos usar plataformas PaaS optimizadas:
1.  **Base de Datos Postgres:** Creá una base de datos Postgres gratuita en [Neon.tech](https://neon.tech/) o [Supabase](https://supabase.com/) y copia la URI de conexión (`DATABASE_URL`).
2.  **Servidor de Aplicaciones:** Crea un Web Service en [Render.com](https://render.com/) o [Railway.app](https://railway.app/) conectado a tu repositorio Git de código.
3.  **Variables de Entorno:** Agregá en el panel de control de tu PaaS la variable:
    *   `DATABASE_URL`: (La cadena de conexión copiada en el paso 1).
4.  **Despliegue:** Al activar el servicio web, Render instalará las dependencias y ejecutará `npm start`. El script inicializador detectará la conexión a Postgres y creará/sembrará las tablas de forma automática.

---

## 📈 4. Esquema Relacional de Base de Datos

Si necesitas administrar directamente las tablas de PostgreSQL (o realizar consultas manuales), el diseño relacional es el siguiente:

```sql
-- ERP: Sistema de Unidades y Depósitos
CREATE TABLE units (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    base_unit_id VARCHAR(50),
    conversion_factor DECIMAL(18,6) NOT NULL DEFAULT 1
);

CREATE TABLE warehouses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- ERP: Catálogo Base (Insumos/Materias Primas)
CREATE TABLE products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_unit_id VARCHAR(50) NOT NULL,
    min_stock DECIMAL(18,6) NOT NULL DEFAULT 0,
    cost_method VARCHAR(20) NOT NULL DEFAULT 'FIFO',
    portion_size DECIMAL(18,6) NOT NULL DEFAULT 0,
    price_per_portion DECIMAL(18,6) NOT NULL DEFAULT 0
);

-- ERP: Control de Stock Estricto (Lotes y Movimientos)
CREATE TABLE stock_lots (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    warehouse_id VARCHAR(50) NOT NULL,
    quantity_initial DECIMAL(18,6) NOT NULL,
    quantity_current DECIMAL(18,6) NOT NULL,
    unit_cost DECIMAL(18,6) NOT NULL,
    purchase_quantity DECIMAL(18,6) DEFAULT 0,
    purchase_unit VARCHAR(20),
    total_cost DECIMAL(18,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL,
    warehouse_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    quantity DECIMAL(18,6) NOT NULL,
    unit_cost DECIMAL(18,6) NOT NULL,
    lot_id INTEGER,
    reference_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: masas (Insumos Elaborados Internamente)
CREATE TABLE masas (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    yield_qty INTEGER NOT NULL DEFAULT 1,
    cost_per_portion INTEGER NOT NULL DEFAULT 0,
    ingredients JSONB NOT NULL DEFAULT '[]'
);

-- Tabla: waffles (Fichas Técnicas / Recetario)
CREATE TABLE waffles (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]',
    image VARCHAR(255)
);

-- Tabla: menu (Catálogo de Ventas Público)
CREATE TABLE menu (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    is_visible BOOLEAN DEFAULT true
);

-- Tabla: sales (Historial transaccional de ventas)
CREATE TABLE sales (
    id VARCHAR(100) PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    items JSONB NOT NULL,
    total INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    cashier_name VARCHAR(255),
    "kdsStatus" VARCHAR(50) DEFAULT 'pending',
    kds_completed_at TIMESTAMPTZ,
    customer_name VARCHAR(255)
);

-- Tabla: kiosk_orders (Pedidos temporales)
CREATE TABLE kiosk_orders (
    id VARCHAR(100) PRIMARY KEY,
    cart JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: employees (Gestión de Personal)
CREATE TABLE employees (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(4) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: reviews (Feedback de Clientes)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(100) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL, -- 1: negative, 2: positive
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ 5. Operaciones de Mantenimiento Comunes

### A) Reabastecimiento de Insumos (Stock)
Cuando llega mercadería, el cajero o administrador puede ingresar las cantidades:
1.  Ingresar a `/admin` (con clave de administrador).
2.  Navegar a la pestaña **Control de Stock**.
3.  Hacer clic en el icono `+` (Restock) al lado del ingrediente/bebida, ingresar la cantidad y guardar. El sistema actualizará el stock en tiempo real.

### B) Devoluciones / Reembolsos
Si se registra una venta incorrecta:
1.  En el Panel de Administración `/admin`, ir a la pestaña **Historial y Métricas**.
2.  Buscar la venta correspondiente en la lista de "Historial de Ventas Recientes".
3.  Hacer clic en el botón rojo **Devolver**.
4.  **Consecuencia:** La venta cambiará de estado a "Reembolsado" y el stock de todos los insumos descontados en esa venta (masa, toppings, bebidas, helados) se sumará automáticamente de regreso al inventario en la BD.

### C) Dashboard Analítico de Reseñas
El feedback de los clientes se centraliza en el Dashboard de Reseñas:
1. En el Panel de Administración, ir a la pestaña **Reseñas**.
2. Verás tres tarjetas con métricas en vivo: Total de reseñas, Reseñas positivas (👍) y Reseñas negativas (👎).
3. Utilizá los filtros interactivos para buscar un número de ticket, seleccionar un rango de fechas o filtrar por un Cajero en específico.
4. La tabla cruzará automáticamente los datos de la venta para mostrarte qué empleado cobró el ticket que recibió la reseña.

### D) Exportar Auditorías y Filtrado de Fechas
Para realizar conciliaciones de caja o analizar periodos específicos:
1.  En el Panel de Administración, ir a **Historial y Métricas**.
2.  (Opcional) Utilizá los selectores de **Fecha Inicio** y **Fecha Fin** junto al botón **Filtrar** para ver únicamente las ventas de ese rango.
3.  Hacer clic en el botón **Exportar CSV**.
4.  Se descargará un archivo CSV compatible con Excel con el detalle de las transacciones correspondientes al periodo visualizado.

---

## 🙋‍♂️ 6. Módulo de Ayuda Interactiva Integrado (User Onboarding)

Para garantizar que los usuarios puedan utilizar el sistema con confianza y sin fricciones, se ha integrado un **sistema de ayuda interactiva** en los cuatro portales web de la aplicación. Para evitar la contaminación visual del diseño y el solapamiento con otros botones importantes de control, los accesos se ubicaron estratégicamente de la siguiente forma:

1. **Web de Clientes (`/`):** 
   - **Acceso:** Ubicado en la barra de navegación del encabezado (como un enlace neon morado destacado: `Ayuda ❓`).
   - **Guía:** Explica el proceso de armado de Bubble Waffles interactivos (paso a paso: base, toppings, salsas y helados), la visualización 2D dinámica en tiempo real y el envío estructurado del pedido por WhatsApp.
   
2. **Caja Registradora POS (`/caja`):**
   - **Acceso:** Integrado en el encabezado de acciones rápidas, justo al lado del botón de bloqueo (`Ayuda ❓`).
   - **Guía:** Explica la adición de productos del menú/bebidas a la comanda, el armado personalizado para el cliente, la eliminación de ítems en el carrito, la selección del método de pago, la entrega del **código de rastreo**, y la consulta del historial de **Últimas Ventas**.

3. **Panel de Administración (`/admin`):**
   - **Acceso:** Ubicado directamente como una pestaña destacada en el menú de navegación del sidebar lateral izquierdo, separado por una línea divisoria elegante y acompañado de un icono de pregunta (`Ayuda / Guía`).
   - **Guía:** Detalla el uso de métricas e ingresos con filtrado de fechas, el proceso de reembolsos/devoluciones de ventas que restituye el stock automáticamente en base de datos, el reabastecimiento de insumos físicos (restock), la edición de waffles de la carta, las opciones configurables (Logo, Mapa, Fidelización, Alerta en Cocina), la gestión de la contraseña principal, y la administración de empleados (cajeros y cocineros) junto con sus PINs.

4. **Kitchen Display System - KDS (`/cocina`):**
   - **Acceso:** Integrado en el encabezado superior derecho, junto al control de volumen de notificaciones (`Ayuda / Guía`).
   - **Guía:** Explica el inicio de sesión por PIN de 4 dígitos para cocineros, el flujo de tickets por estados (Nuevos Pedidos -> En Preparación -> Listos -> Entregados), el funcionamiento de las notificaciones sonoras breves para pedidos nuevos, y las **alertas visuales pulsantes en rojo** para pedidos demorados según el tiempo configurado dinámicamente en el panel de administración.

Cada una de estas opciones abre un modal translúcido con efecto glassmorphism (`backdrop-filter: blur`) que se integra de manera armónica al estilo cyberpunk de la aplicación.

---

## 🎨 7. Modo Desarrollador y Editor de Temas

El administrador dispone de herramientas exclusivas para el branding y la personalización gráfica avanzada de todas las pantallas del sistema:
1. **Modo Desarrollador:** Se puede activar desde la pestaña de Configuración. Esto habilita el menú **Temas Visuales** y permite inyectar Custom CSS al instante.
2. **Theme Builder / Editor de Temas:** Una vez habilitado el Modo Desarrollador, la página principal y el panel de administración muestran un widget flotante con el icono de una paleta (🎨).
3. **Personalización en Tiempo Real:** 
   - Cambiar colores hexadecimales de las variables de fondo (Primario, Secundario, Terciario), tarjeta, encabezado, etc.
   - Ajustar los colores de los resplandores neón (Morado, Rosa, Cian, Amarillo, Rojo).
   - Configurar la imagen de fondo subiendo una directamente al servidor (sólo admite formatos `.jpg`, `.jpeg`, `.png`, `.webp` por seguridad).
4. **Presets:** Una vez editado un tema, se puede guardar bajo un "Nombre de Preset" personalizado. Los presets pueden ser compartidos o clonados y se almacenan internamente en la Base de Datos para que persistan de manera global en todos los dispositivos conectados.
