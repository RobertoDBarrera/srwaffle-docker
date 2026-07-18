# Tecnologías Utilizadas - Sr. Waffle

Este documento describe en detalle el stack tecnológico, la arquitectura y los componentes implementados en el desarrollo del sistema de **Sr. Waffle**.

---

## 🖥️ 1. Arquitectura General y Backend

El backend se ha desarrollado como un servidor ligero en **Node.js** enfocado en un alto rendimiento local, simplicidad de despliegue y persistencia atómica sin dependencias externas complejas.

*   **Entorno de Ejecución:** [Node.js](https://nodejs.org/) (v16+)
*   **Framework Web:** [Express.js](https://expressjs.com/) (v4.19.2)
    *   Utilizado para servir el contenido estático de las interfaces de cliente, caja y administración.
    *   Provee los endpoints de la API REST que gestionan las consultas de menú, stock, historial y seguridad.
    *   Configurado con un límite de payload de `5mb` (para prevenir ataques DoS de cargas masivas) permitiendo transferencias ágiles.
*   **Middleware y Seguridad:**
    *   [CORS](https://www.npmjs.com/package/cors) (v2.8.5) para permitir solicitudes de recursos cruzados.
    *   [JSON Web Tokens (JWT)](https://www.npmjs.com/package/jsonwebtoken) para autenticación basada en tokens sin estado (Stateless Auth) en todas las rutas privadas.
    *   [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit) para mitigar y prevenir ataques de fuerza bruta limitando los intentos de inicio de sesión de caja y administración.
*   **Persistencia de Datos (PostgreSQL con Emulación Local):**
    *   Migrada de archivos locales JSON a una base de datos relacional **PostgreSQL** para garantizar la escalabilidad, la integridad de los datos y la preparación para despliegues en la nube.
    *   **Capa de Emulación Local Integrada:** Si no se detecta una conexión activa a PostgreSQL en el puerto configurado (o si falta `DATABASE_URL` en `.env`), el backend inicia de forma automática en modo de **emulación local**, redirigiendo transparentemente las operaciones DDL, CRUD y transaccionales a archivos JSON locales en `/data`. Esto elimina la necesidad de configurar bases de datos para desarrollo y pruebas en local.
    *   Utiliza un Pool de conexiones asíncronas configurado mediante la variable de entorno `DATABASE_URL` y soporte de SSL condicional automático para plataformas de producción (Neon, Supabase, Render, Heroku).
    *   **Tablas de la Base de Datos (Nuevo Esquema ERP):**
        *   `units` y `warehouses`: Control maestro de magnitudes de medida (gramos, mililitros, unidades) y depósitos físicos.
        *   `products` y `product_presentations`: Inventario maestro de materias primas con método de costeo, y presentaciones comerciales de proveedores.
        *   `stock_lots` y `stock_movements`: Motor de control de inventario estricto. Cada ingreso crea un Lote (FIFO) y todo descuento/ajuste se asienta como un movimiento histórico inmutable.
        *   `masas`: Almacena insumos elaborados internamente en cocina descontando materias primas.
        *   `waffles`: Fichas técnicas de elaboración de waffles (recetario base), indicando insumos exactos requeridos y costo base calculado.
        *   `menu`: Catálogo comercial de venta pública (vitrina). Vincula recetas de `waffles` o insumos de venta directa de `products`.
        *   `sales`: Guarda el historial de facturación estructurado usando `JSONB` y mantiene sincronización directa del estado con KDS (`kdsStatus`, `kds_completed_at`).
        *   `kiosk_orders`: Cola temporal de pre-pedidos armados por los clientes en las tablets (Autopedido).
        *   `employees` y `settings`: Gestión de accesos, contraseñas, PINs y variables del negocio (tiempos de cocina, fidelización, UI).
        *   `reviews`: Retroalimentación centralizada y vinculada mediante clave foránea a cada venta específica (`sale_id`).
    *   **Control de Concurrencia:** Empleo de transacciones relacionales de base de datos (`BEGIN/COMMIT/ROLLBACK`) y bloqueos exclusivos de filas (`SELECT ... FOR UPDATE`) en checkouts y reembolsos para evitar colisiones de stock o condiciones de carrera concurrentes.

---

## 🎨 2. Frontend y Experiencia de Usuario (UX/UI)

El frontend se divide en cuatro portales independientes de diseño responsivo y estética neo-retro/cyberpunk con luces de neón en morado y cian. Toda la interfaz se construyó de manera nativa sin frameworks pesados, garantizando un tiempo de carga inmediato y total compatibilidad.

### A) Web Pública de Clientes (`/`)
*   **HTML5:** Estructura semántica moderna e interactiva.
*   **CSS3 Avanzado (Vanilla CSS):**
    *   Diseño adaptable (`@media` queries) para teléfonos inteligentes, tablets y computadoras de escritorio.
    *   Visuales enriquecidos con gradients, sombras difusas de neón y micro-animaciones fluidas (`transition` y `@keyframes`).
*   **JavaScript (Vanilla JS):**
    *   **Constructor Visual de Waffles en 2D:** Motor interactivo que renderiza de forma gráfica y en tiempo real el waffle a medida que el cliente lo arma (apilando dinámicamente capas CSS para la masa seleccionada, los toppings, las salsas aplicadas y las bochas de helado en posiciones superpuestas estilizadas).
    *   **Integración de Autopedido (Kiosco):** Generación de pre-tickets mediante llamadas Fetch POST, almacenando el carrito localmente en la base de datos y devolviendo un código PIN de recuperación a la interfaz, reduciendo los tiempos en caja.
    *   **Integración Opcional de WhatsApp:** Generación del mensaje estructurado codificando el pedido y datos del cliente para su envío automatizado directo al chat del comercio (configurable vía panel Admin).

### B) Módulo POS de Caja (`/caja`)
*   **Objetivo:** Interfaz ágil para la facturación rápida del personal en punto de venta.
*   **Seguridad:** Pantalla de bloqueo integrada a nivel de interfaz que se autentica consumiendo el endpoint `/api/auth/verify-cashier` del servidor.
*   **Características:** Carrito de compras local (comanda) que soporta waffles personalizados y de carta con cálculo dinámico de subtotales, método de pago y envío directo al registro central de transacciones.

### C) Módulo de Pantalla de Cocina (KDS) (`/cocina`)
*   **Objetivo:** Gestión visual de tickets en preparación para los cocineros.
*   **Seguridad:** Autenticación por PIN (`/api/auth/verify-kitchen`) generando un JWT.
*   **Características:** Tablero estilo Kanban (Recibidos, Preparando, Listos) con alertas intermitentes automáticas para pedidos demorados y notificaciones sonoras.

### D) Módulo de Administración (`/admin`)
*   **Objetivo:** Dashboard centralizado para gerencia e inventario.
*   **Autenticación:** Bloqueo de seguridad que requiere contraseña validada mediante `/api/auth/verify-admin`.
*   **Características Especiales:**
    *   **Dashboard de Métricas:** KPIs financieros y de ventas en tiempo real.
    *   **Visualización de Datos:** Gráfico de ventas semanales interactivo y ranking de toppings favoritos programados directamente mediante manipulación del DOM y hojas de estilo CSS.
    *   **Gestión de Catálogo (CRUDs):** Formularios dinámicos e independientes para dar de alta, modificar y eliminar insumos y platos del menú.
    *   **Carga de Imágenes Integrada:** Implementa la API `FileReader` de JS para codificar imágenes del menú seleccionadas localmente a formato Base64, subiéndolas a través del servidor a la carpeta física del proyecto y refrescando la vista previa al instante.
    *   **Seguridad Interna:** Interfaz dedicada para el cambio de credenciales de caja y administración.
    *   **Exportación de Informes:** Generación nativa de reportes de transacciones en formato CSV descargable con codificación UTF-8 BOM.
    *   **Visor de Documentación Integrado:** Sistema interno que lee y renderiza dinámicamente manuales escritos en Markdown (`.md`) utilizando las librerías `marked.js` (para formateo de texto) y `mermaid.js` (para la generación y trazado en vivo de diagramas visuales Entidad-Relación y flujos de arquitectura desde código).

### E) Mini App Móvil (`/app`)
*   **Objetivo:** Interfaz para clientes físicos en mesa (menú, seguimiento y reseñas).
*   **Arquitectura:** Single Page Application (SPA) con navegación inferior (Bottom Nav) y "Dark Premium" theme.
*   **Características Especiales:**
    *   **Polling de Estado:** Consulta en segundo plano `/api/tracking/:id` cada 5 segundos mediante Fetch API.
    *   **Micro-animaciones:** Uso intensivo de keyframes (`@keyframes`) y transformaciones CSS para feedback visual de estados de pedidos.
    *   **Formulario Dinámico:** Inyección asíncrona del panel de reseñas al detectar que el ticket está listo.

---

## 🛠️ 3. Herramientas de Desarrollo y Validación

*   **Testing, Migración y Validación:**
    *   `migrate.js`: Script automatizado para transferir los datos heredados de los archivos JSON a PostgreSQL de forma limpia e idempotente (`ON CONFLICT`).
    *   `test_apis.js` y `test_helados.js`: Scripts de pruebas de integración que validan de forma integral los endpoints del servidor (autenticaciones de caja/admin, CRUDs y deducción/restitución transaccional de stock).
