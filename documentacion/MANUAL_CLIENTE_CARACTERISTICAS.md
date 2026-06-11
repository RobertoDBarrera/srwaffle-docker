# Manual del Sistema Integral "Sr. Waffle"

¡Bienvenido al sistema integral de gestión y ventas **Sr. Waffle**! 
Este documento detalla todas las características, módulos y funcionalidades implementadas en la plataforma, diseñada específicamente para optimizar la operación de tu negocio, desde la experiencia interactiva del cliente hasta la sincronización en tiempo real de la cocina.

---

## 🌟 1. Módulo de Clientes (Catálogo Interactivo)
La cara visible de la marca, diseñada para atraer y brindar una experiencia única de compra ("Wow Factor").
*   **Waffle Builder 2D:** Permite a los clientes armar su propio *Bubble Waffle* paso a paso (Base, Toppings, Salsas, Helado) viendo en tiempo real una previsualización visual del producto.
*   **Catálogo de Especialidades:** Una sección dedicada a mostrar los waffles pre-armados del menú (las recetas de la casa) con imágenes dinámicas, descripciones y precios.
*   **Carrito de Compras y Pedidos de WhatsApp:** Los clientes pueden añadir múltiples waffles al carrito. Al finalizar, el sistema estructura automáticamente el pedido en un mensaje claro y lo envía al WhatsApp del local.
*   **Rastreo de Pedidos (Order Tracking):** Los clientes pueden consultar el estado de su orden ingresando el número de ticket de 4 dígitos. El sistema le dice en qué estado está (Pendiente, Preparando, Listo).
*   **Programa de Fidelización (Loyalty):** Los clientes frecuentes acumulan puntos por cada compra (asociados a su número de teléfono) y pueden consultar su estado y progreso hacia su próximo Waffle gratis. (Opcional - Se puede activar y desactivar desde el panel de administración)
*   **Diseño Personalizable:** El cliente verá el logo de la marca, imágenes de portada (Hero) y mapa de ubicación cargados desde el panel de administración.

---

## 💳 2. Módulo de Caja Registradora (POS)
Un punto de venta (POS) de alta velocidad diseñado para el registro ágil de comandas en el mostrador físico.
*   **Acceso por PIN:** Sistema de bloqueo de pantalla integrado. Los cajeros seleccionan su nombre e ingresan su PIN personal para abrir la caja.
*   **Gestión Multi-cajero:** Permite registrar qué empleado realizó cada venta para futuras auditorías o cálculos de comisiones.
*   **Ingreso Rápido de Pedidos:** Interfaz optimizada para añadir bebidas, waffles especiales y armar waffles personalizados en segundos.
*   **Registro de Métodos de Pago:** Posibilidad de registrar ventas con Múltiples medios (Efectivo, Mercado Pago, Tarjeta de Débito/Crédito, los movimientos no son registrados fiscalmente, solo se registra el método de pago para conciliación de caja) y también se pueden registrar ventas con puntos de fidelidad (Opcional - Se puede activar y desactivar desde el panel de administración).
*   **Integración en Tiempo Real con Cocina (KDS):** Al confirmar el cobro en la caja, el pedido "vuela" instantáneamente a la pantalla de la cocina.

---

## 🍳 3. Kitchen Display System (KDS)
El corazón de la operación. Una pantalla digital para la cocina que reemplaza las comandas de papel y organiza la producción.
*   **Acceso para Cocineros:** Autenticación por PIN exclusivo para el personal de cocina.
*   **Tablero Kanban Dinámico:** Organiza el flujo de trabajo en 3 columnas:
    *   *Nuevos Pedidos:* Tickets recién ingresados.
    *   *En Preparación:* Tickets en los que el cocinero está trabajando activamente.
    *   *Listos (Esperando Entrega):* Waffles terminados, listos para que el personal de mostrador los entregue al cliente.
*   **Alertas Inteligentes:** 
    *   *Auditivas:* Sonido de notificación personalizable cuando ingresa un nuevo pedido.
    *   *Visuales (Urgencias):* Los pedidos que superan el tiempo de espera configurado (por defecto 10 minutos) se marcan en rojo intermitente. Este tiempo límite se puede personalizar desde el Panel de Administración.
*   **Sincronización Inmediata:** Los cajeros pueden ver desde su pantalla cuando un pedido cambia de estado a "Listo".

---

## 📊 4. Panel de Administración y Control de Stock
El centro de mando para propietarios y gerentes, protegido por contraseña maestra.

### Inteligencia de Negocios (Business Intelligence)
*   **Métricas en Vivo:** Visualización de ingresos totales, cantidad de ventas, ticket promedio de venta y **Tiempo Promedio en Cocina**.
*   **Filtros de Fechas:** Selector dinámico que recalcula todas las métricas, gráficos de barras y tablas según un rango de fechas personalizado.
*   **Reportes de Productos Estrella y Cajeros:** Rankings automáticos de los insumos más vendidos y rendimiento de ingresos por empleado.
*   **Exportación de Auditoría:** Posibilidad de descargar el historial de ventas en formato CSV (Excel) respetando los filtros de fecha aplicados.
*   **Gestión de Reembolsos:** Botón de "Devolver" para cancelar ventas erróneas. Al hacer un reembolso, el inventario descontado se restituye automáticamente.

### Control de Inventario
*   **Alertas de Insumos:** Las barras de stock cambian de color (Cian: Saludable, Amarillo: Bajo, Rojo: Crítico) según los límites mínimos configurados para cada ingrediente.
*   **Gestión de Recetas (Menú):** Permite crear waffles pre-armados, definir qué toppings y salsas incluyen por defecto, establecer el precio y subir imágenes. Al vender estos waffles, el sistema sabe exactamente qué ingredientes descontar de la base de datos.
*   **Restock Ágil:** Carga rápida de stock cuando ingresa mercadería, con un par de clics.

### Fidelización (Loyalty Program)
*   **Configuración Flexible:** El administrador define cuántos "puntos" (o monto en dinero) equivalen a la recompensa, ajustando la dificultad para que los clientes ganen premios.
*   **Activación Global:** Permite encender o apagar el programa de puntos de fidelidad en toda la tienda (sin que los clientes pierdan su progreso guardado en la base de datos).

### Opciones Configurables
*   **Identidad Visual:** Permite cambiar el Logo del sistema, que se refleja automáticamente en la vista del cliente.
*   **Contenido Dinámico:** Subida de imágenes para la portada principal (Hero) y actualización del Mapa de ubicación de Google Maps.
*   **Ajustes Operativos:** Configuración del umbral de tiempo (en minutos) para disparar las "Alertas Inteligentes" en la pantalla de la cocina.

### Gestión de Personal (Recursos Humanos)
*   **CRUD de Empleados:** Creación, edición, activación y baja de personal.
*   **Roles del Sistema:** Asignación de permisos específicos (`Cajero` o `Cocinero`) para restringir qué partes de la plataforma puede ver y utilizar cada empleado.

---

## 📱 5. Diseño y Experiencia de Usuario (UI/UX)
*   **Aesthetic Cyberpunk:** Interfaz moderna en Modo Oscuro (Dark Mode), con efectos de neón, acentos brillantes (cian, púrpura, magenta) y *glassmorphism* (fondos translúcidos).
*   **Responsivo (Mobile-First):** El catálogo de clientes está optimizado para funcionar perfectamente en pantallas de celulares de cualquier tamaño.
*   **Módulo de Ayuda (Onboarding):** Todos los módulos (Caja, Cocina, Admin, Cliente) cuentan con botones de "Ayuda" que despliegan guías rápidas e interactivas para enseñar a los usuarios a utilizar las funciones de la pantalla en la que se encuentran.

---
**Sr. Waffle** no es solo un menú, es un ecosistema tecnológico diseñado para vender más, operar más rápido y fidelizar mejor. 🚀
