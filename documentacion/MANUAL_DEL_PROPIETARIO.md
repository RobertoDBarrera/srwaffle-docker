# Manual del Propietario - Guía Completa Paso a Paso (Sr. Waffle)

¡Bienvenido al sistema integral de Sr. Waffle! Este documento es tu biblia operativa. Aquí aprenderás **paso a paso** cómo utilizar el 100% de las funciones del sistema. Cualquier usuario nuevo que lea esta guía podrá administrar, operar y entender el negocio sin conocimientos técnicos.

El sistema se divide en cuatro partes operativas principales:
1. **App Cliente (Web Pública):** Donde tus clientes ven el menú y arman sus pedidos.
2. **La Caja Registradora (POS):** Donde cobras y atiendes.
3. **La Pantalla de Cocina (KDS):** Donde preparan los pedidos.
4. **El Panel de Administración:** Donde controlas el negocio, las ventas y el stock.

---

## 🛒 PARTE 1: Cómo operar la Caja Registradora (POS)
La caja es el punto de venta donde tus cajeros registrarán los pedidos. Ingresa a la caja navegando a la pestaña "Caja Registradora" o yendo a `/caja`.

### 1.1 Iniciar sesión en la Caja
1. Aparecerá una pantalla de bloqueo pidiendo un PIN.
2. Haz clic en el desplegable y selecciona el nombre del cajero.
3. Ingresa el **PIN de 4 dígitos** asignado a ese empleado y presiona **Ingresar**.

### 1.2 Agregar productos al pedido
- **Vender un Waffle Especial:** Ve a la pestaña central "Menú", haz clic sobre la imagen del waffle deseado. Se sumará automáticamente a la comanda de la derecha.
- **Vender Bebidas:** Ve a la pestaña "Bebidas / Otros" y haz clic sobre el producto deseado.
- **Armar un Waffle Personalizado:** 
  1. Haz clic en el botón grande morado "Armar Bubble Waffle".
  2. Aparecerá una ventana de 4 pasos. Selecciona la Masa, luego los Toppings, luego las Salsas y finalmente el Helado.
  3. Haz clic en **Añadir a la comanda**.

### 1.3 Fidelizar a un Cliente (Club Waffle)
Si el programa de fidelización está activo, debajo del total a pagar verás un recuadro de "Cliente Sr. Waffle Club".
1. Pregúntale al cliente su número de teléfono celular (ej. 549...).
2. Escríbelo en la caja de texto y presiona el botón azul **Buscar**.
3. **Si el cliente ya existe:** Aparecerá su nombre y cuántos puntos ganará con esta compra.
4. **Si el cliente es nuevo:** Te pedirá que escribas su nombre. Escríbelo para dejarlo registrado.

### 1.4 Cobrar y dar el Código de Rastreo
1. Cuando el pedido esté completo, ve a la parte inferior derecha.
2. Selecciona cómo te está pagando el cliente: **Efectivo**, **Débito** o **Mercado Pago**.
3. Haz clic en el botón verde gigante **Registrar Venta**.
4. ¡Listo! Aparecerá en el centro de la pantalla un cartel que dice "¡Venta Registrada!" y un **Código de 4 dígitos** gigante (Ej: 3A4F).
5. **Díctale ese código al cliente**. Le servirá para retirar su pedido.

### 1.5 Revisar Últimas Ventas
1. Si te olvidaste de darle el código a un cliente, mira arriba a la derecha de la pantalla y haz clic en el botón **Últimas Ventas**.
2. Se abrirá una tabla con todas las ventas del turno de hoy, la hora, el monto, y los **códigos de rastreo** de cada una.

### 1.6 Bloquear la Caja
1. Si el cajero debe ir al baño o apartarse, debe hacer clic en el botón **Bloquear Caja** arriba a la derecha.
2. Esto oculta la caja y vuelve a pedir el PIN de 4 dígitos, evitando robos o ventas no autorizadas.

---

## 👨‍🍳 PARTE 2: Cómo operar la Pantalla de Cocina (KDS)
Tus cocineros tendrán una tablet o pantalla táctil en la cocina (`/cocina`). Funciona sin teclado.

### 2.1 Iniciar Sesión en Cocina
1. Al igual que en la caja, el cocinero selecciona su nombre.
2. Ingresa su **PIN de 4 dígitos** y entra al tablero Kanban.

### 2.2 Flujo de Trabajo (Preparar Pedidos)
1. **Nuevos Pedidos:** Cuando la caja cobra un ticket, este aparece solo por arte de magia en la columna izquierda llamada "Recibidos". El sistema emitirá un **Bip** sonoro para avisarle al cocinero.
2. **Empezar a cocinar:** El cocinero lee el ticket, y cuando va a empezar a hacerlo, **toca la tarjeta con el dedo**. La tarjeta se moverá a la columna del medio: "En Preparación".
3. **Despachar pedido:** Cuando el waffle está servido en su bandeja, el cocinero vuelve a **tocar la tarjeta**. La tarjeta pasa a la columna derecha de "Listos". El cliente ya puede acercarse a retirarlo.

### 2.3 Entender las Alertas de Demora (Parpadeo Rojo)
- Si un ticket entra en la cocina, y el cocinero se olvida de prepararlo o tarda demasiado tiempo (ese tiempo lo configuras tú en Administración), la tarjeta del pedido empezará a **titilar en color rojo brillante**.
- Esto es una alerta visual urgente para que el equipo sepa que ese pedido está demorado y debe priorizarse de inmediato.

---

## ⚙️ PARTE 3: El Panel de Administración (Tu Centro de Mando)
Aquí es donde controlas todo tu negocio (`/admin`). Solo se puede entrar con tu Contraseña Maestra (por defecto `admin`).

### 3.1 Historial y Métricas (Tus Ganancias)
- **Ver mis métricas:** Apenas entras, ves 4 bloques arriba: Ingresos Totales, Cantidad de Ventas, Ticket Promedio y Tiempo en Cocina. Estos números reflejan la salud de tu negocio.
- **Filtrar por Fechas:** Arriba a la derecha dice "Fecha Inicio" y "Fecha Fin". Elige un rango (ej: del 1 al 15 del mes) y presiona **Filtrar**. Toda la pantalla se actualizará para mostrarte solo cuánto ganaste esos días.
- **Revisar Cajeros:** Debajo verás una tabla que dice "Rendimiento por Empleado". Ahí sabrás quién recaudó más dinero y cuántas ventas hizo.
- **Hacer un Reembolso:** Si cobraste mal un pedido, baja hasta "Historial de Ventas Recientes". Busca el ticket erróneo y haz clic en el botón rojo **Devolver**. *Magia:* El dinero se resta de tus ganancias y **todos los insumos (masas, helados) regresan al inventario.**
- **Descargar a Excel:** Presiona el botón verde **Exportar CSV** arriba a la derecha. Se descargará un archivo con todas las ventas para tu contador.

### 3.2 Control de Stock (Inventario Físico)
- Muestra todo tu almacén. Cada producto tiene una barra.
- **Colores:** Azul (bien de stock), Amarilla (hay poco), Roja (¡Crítico, comprar urgente!).
- **Reponer Mercadería:** Cuando llegue el camión del proveedor con 5 kilos de helado nuevo, busca "Helado" en la tabla, haz clic en el botón verde con el símbolo **`+`**, escribe "5", y presiona **Guardar**. Se sumará al stock actual automáticamente.

### 3.3 Editar Insumos (Catálogo de Ingredientes)
Aquí configuras las partes de los waffles (Toppings, Salsas, Bebidas, etc).
- **Crear un ingrediente nuevo:** Usa el formulario superior. Escribe el Nombre (ej. "Rocklets"), elige la Categoría (Toppings), pon el Precio de Venta (cuánto le cobras al cliente), y el **Stock Mínimo** (el número que hará que la barra se ponga roja para avisarte que debes comprar).
- **Modificar precios por inflación:** Busca el producto en la lista y presiona el ícono del **Lápiz azul**. Podrás cambiar su precio al instante en todas las cajas.
- **Borrar:** Presiona el **Tacho de basura rojo** para eliminar un producto que ya no vendes.

### 3.4 Fichas Técnicas (Recetas de Waffles)
Aquí construyes cómo se preparan exactamente tus waffles.
- **Armado del Recetario:** Seleccionas un tipo de Masa elaborada y le agregas las cantidades exactas (ej. porciones o gramos) de materia prima (toppings, salsas) que el cocinero debe utilizar.
- **Cálculo de Costo:** A medida que añades ingredientes, el sistema calcula el costo base exacto de producir ese waffle.
- **Nota Importante:** En esta pestaña NO se define el precio de venta ni si aparece o no en la caja. Aquí solo se define la estructura interna del producto.

### 3.5 Vitrina y Menú Público
Aquí decides qué productos vas a poner a la venta para que tus cajeros los puedan facturar y para que el cliente final los vea.
- **Tipos de Producto que puedes publicar:**
  1. **Receta de Waffle (Compuesto):** Vinculas una de las recetas que armaste en el paso 3.4. Al venderse en la caja, el sistema descontará exactamente los ingredientes indicados en su ficha técnica.
  2. **Producto de Venta Directa:** Vinculas un insumo físico que vendes sin preparación extra (Ej: Una gaseosa o agua). Al venderse, descuenta 1 unidad del stock de forma directa.
- **Pasos para publicar un producto:**
  1. Elige qué vas a publicar (Waffle o Venta Directa).
  2. Selecciona la Referencia (qué waffle de tu recetario o qué insumo de tu stock).
  3. Escribe el **Nombre Comercial** (cómo quieres que lo lea el cliente).
  4. Fija el **Precio Final**.
  5. Asegúrate de marcar "Visible en Caja" y guárdalo.

### 3.6 Opciones Configurables (Apariencia y Reglas)
- **Identidad del local:** Sube tu Logo, sube fotos para el carrusel principal, e ingresa la URL o el HTML de tu Google Maps.
- **Tiempo de Alarma en Cocina:** Ingresa un número en minutos (ej: `10`). Si un pedido tarda más de esos minutos en la cocina, empezará a parpadear en rojo (como vimos en la Parte 2).
- **Programa de Fidelización:** Aquí puedes prender o apagar el programa "Club Waffle". Si lo enciendes, puedes configurar a cuántos pesos equivale 1 Punto.

### 3.7 Datos de Empresa
- Configura el Nombre del Local y la Dirección.
- **Número de WhatsApp:** Ingresa el número oficial de tu negocio (incluyendo código de país, ej. `54911...`). Cuando los clientes pidan desde el catálogo web de sus casas, el mensaje te llegará a este número.

### 3.8 Empleados (Gestión de Personal)
- Usa el formulario de la izquierda para dar de alta a tus empleados.
- Ponles su Nombre, asígnales un **PIN numérico de 4 dígitos** (para que nadie más pueda usar su usuario) y elige su **Rol** (Cajero o Cocinero).
- Si un empleado se va de la empresa, búscalo en la lista y presiona el ícono de **Tacho de basura** para revocarle el acceso.

### 3.9 Seguridad y Control de Sesiones
- Es el lugar más sensible. Aquí cambias la **Contraseña Maestra** que utilizas para entrar a este panel `/admin`. 
- Ingresa tu contraseña actual y escribe una nueva. ¡No la olvides!
- **Sesiones Automáticas:** Por tu seguridad, si tú o tus cajeros dejan el sistema inactivo, el sistema cerrará la sesión de forma automática y volverá a pedir la contraseña o PIN.
- **Defensa Activa:** Si alguien intenta adivinar tu contraseña ingresando claves incorrectas más de 20 veces, el sistema bloqueará temporalmente el acceso para proteger tu negocio.

### 3.10 Temas Visuales (Branding)
*Aparece solo si activaste el "Modo Desarrollador" en la pestaña de Opciones Configurables.*
- Te permite gestionar los "Presets" (Temas) de tu aplicación. 
- Puedes clonar temas existentes, borrarlos o aplicar un tema diferente a todas las pantallas.

### 3.11 Módulo Dev (Herramientas Técnicas)
*Aparece solo si activaste el "Modo Desarrollador". Sección para casos extremos o soporte técnico.*
- Te permite resetear toda la base de datos para empezar de cero (cuidado, esto borra todas tus ventas).
- Te permite inyectar ventas falsas de prueba si estás haciendo simulacros de entrenamiento con tu personal.

---

## 📱 PARTE 4: App Cliente (Web Pública)
Esta es la cara visible de tu negocio. Tus clientes ingresan desde sus celulares (yendo a `/`) y no necesitan ninguna contraseña.

### 4.1 Menú Digital y Armado de Waffle
- **Catálogo:** Los clientes pueden deslizar para ver fotos reales de tus Waffles Especiales y Bebidas, junto a su precio.
- **Armador Interactivo:** Si tocan "Armá tu Waffle", un asistente los guiará para elegir Masa, Toppings, Salsas y Helados. Mientras eligen, verán un dibujo 2D armándose en tiempo real.
- **Pedido por WhatsApp:** Al terminar, el sistema genera automáticamente un mensaje estructurado y abre WhatsApp para enviarlo al número de tu local.

### 4.2 Rastreador de Pedidos
- Arriba de todo, el cliente verá un botón "Rastrear Pedido".
- Ahí pueden escribir el **Código de Rastreo de 4 dígitos** que el cajero les dio en el mostrador. 
- El sistema les dirá al instante si su waffle está "Pendiente", "En Preparación" o "Listo".

---

## 🎨 PARTE 5: Editor de Temas (Theme Builder)
¿Te aburriste de los colores actuales? Como propietario, tienes el poder de rediseñar tu aplicación en tiempo real sin llamar a un programador.

### 5.1 Cómo activar el Editor
1. Ve a la pestaña **Opciones Configurables** en tu panel de Administración y marca la casilla **"Activar Modo Desarrollador"**.
2. A partir de ese momento, verás flotando en la pantalla un ícono circular azul de una paleta de pintor (🎨).

### 5.2 Modificar Colores y Fondos
1. Haz clic en la paleta flotante para abrir el **Theme Builder**.
2. **Colores Base:** Cambia el color de fondo primario, el color de las tarjetas, etc., haciendo clic en los cuadritos de color.
3. **Resplandores Neón:** Ajusta la intensidad y el tono del Morado, Rosa o Cian.
4. **Fondo de Pantalla:** En la sección "Imagen de Fondo", puedes subir una foto (JPG, PNG) directamente desde tu computadora. ¡Tu fondo cambiará al instante!
5. **Guardar Preset:** Si te gusta cómo quedó, escribe un nombre abajo (ej. "Tema Verano") y presiona **Guardar Preset**. Tu diseño quedará guardado para siempre en la base de datos.

---

> 🎓 **Conclusión:** ¡Felicidades! Si has leído este documento, ya estás 100% capacitado para operar, auditar y gestionar "Sr. Waffle". Todo el sistema trabaja en conjunto para que no tengas que calcular nada a mano. ¡Disfruta de las ventas!
