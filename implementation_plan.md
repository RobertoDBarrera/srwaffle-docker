# Implementación de "Modo Demo"

El objetivo de esta actualización es permitir al dueño o administrador alternar entre los datos reales (Producción) y datos de muestra (Demo) con un solo clic, permitiendo exhibir el sistema a inversores o clientes sin comprometer ni alterar la contabilidad real.
# Mejoras al Dashboard Administrativo

El objetivo de este plan es actualizar la pantalla principal del panel de administración (Dashboard y Métricas) para convertirla en una verdadera "torre de control" interactiva, ofreciendo datos más útiles, alertas predictivas y mejores visualizaciones.

## User Review Required

- Se agregará una nueva librería de gráficos (`chart.js`) al front-end del panel administrativo.
- ¿Deseas que los gráficos tengan la opción de descargar la imagen (PNG) para incluirla en reportes manuales o reuniones?

## Open Questions

> [!IMPORTANT]
> **Definición de Alertas:** ¿A partir de cuántas porciones restantes te gustaría que el sistema dispare la "Smart Alert" de stock crítico en el Dashboard? (ej: "Stock crítico: quedan menos de 10 porciones de Masa Vainilla").

> [!NOTE]
> **Heatmap de Horarios:** El mapa de calor agrupará ventas por bloques de horas. ¿Te parece bien bloques de 2 horas (ej: 18:00 - 20:00)?

## Proposed Changes

### Front-End (Módulo Admin)

#### [MODIFY] admin/index.html
- Importar librería `Chart.js` vía CDN.
- Reestructurar el contenedor de métricas (`#sales-bar-chart`) para soportar múltiples canvas de Chart.js.
- Agregar nueva sección (Grid) debajo del gráfico principal para incluir:
  - Pie Chart de Medios de Pago.
  - Heatmap (tabla de calor simple por días y bloques de horas).
- Agregar componente de "Smart Alerts" (Alertas predictivas de stock en tiempo real).

#### [MODIFY] admin/app.js
- **Lógica de Gráficos:** Eliminar la generación actual de barras con HTML puro y reemplazarla por la inicialización de instancias de `Chart.js` (Línea/Barras para ingresos en el tiempo, Dona para medios de pago).
- **Rendimiento de Empleados:** Modificar la tabla actual de Cajeros para incluir una columna extra de "Estrellas Promedio", cruzando los IDs de las ventas hechas por ese cajero con las reseñas obtenidas.
- **Smart Alerts:** Implementar función que calcule un estimado simple (basado en ventas de la última semana) para alertar sobre productos cuyo stock bajó del `min_stock` o que están próximos a agotarse.
- **Heatmap:** Procesar las horas de las ventas (`new Date(sale.date).getHours()`) y llenar una matriz bidimensional (Día de la semana vs Bloque horario) asignándole opacidad de color basada en el volumen.

### Back-End / Base de Datos
*(No se requieren cambios estructurales mayores en la DB ni nuevas tablas para estas mejoras, todo el análisis se realizará procesando el payload de `/api/sales`, `/api/menu` y `/api/stock`).*

## Verification Plan

### Manual Verification
- Validar que al cambiar el rango de fechas en la interfaz, los gráficos (Chart.js) se redibujen con una animación suave sin parpadear.
- Revisar que el gráfico de dona (Medios de pago) cuadre exactamente con la suma del desglose por tipo.
- Testear que las reseñas (estrellas) se promedien correctamente bajo el cajero correspondiente.
- Forzar el stock de un producto a casi cero y verificar que la Smart Alert aparezca en el dashboard con estilo `[WARNING]`.
