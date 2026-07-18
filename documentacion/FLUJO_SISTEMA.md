# Diagramas de Flujo del Sistema - Sr. Waffle

Este documento ilustra los flujos de trabajo principales de la aplicación a través de diagramas visuales (Mermaid). 
El sistema soporta múltiples circuitos de ventas que convergen en el mismo embudo de facturación (POS), producción (Cocina / KDS) y post-venta (Rastreo y Reseñas).

---

## 1. Circuito A: Autopedido (Menú Público / Kiosco)

Este es el camino que sigue un cliente que arma su pedido desde su celular (Menú Público) o desde una tablet física en el local (Kiosco). El proceso genera un pre-ticket en la base de datos sin descontar stock físico hasta que es facturado en caja.

```mermaid
sequenceDiagram
    actor C as Cliente (Celular / Kiosco)
    actor CA as Cajero (POS)
    participant DB as Servidor / BD
    actor K as Cocina (KDS)

    C->>C: Explora Menú o arma su Waffle 
    C->>DB: Presiona "Confirmar Pedido (Pagar en Caja)"
    DB-->>C: Devuelve Código de 4 dígitos (Ej: 2459)
    Note over C, CA: El cliente se acerca a la caja y dicta el código "2459"
    CA->>DB: Abre POS, clic en "Recuperar de Kiosco", ingresa "2459"
    DB-->>CA: Devuelve el carrito armado por el cliente
    CA->>CA: (Opcional) Modifica el pedido o agrega extras
    CA->>DB: Cobra Venta y cierra el ticket
    DB->>DB: Registra Venta, elimina Kiosco Order y descuenta Stock
    DB->>K: Muestra Ticket "2459" en Pantalla de Cocina (KDS)
```

*(Nota: Opcionalmente, desde el menú público web, el cliente podría enviar su pedido por WhatsApp si el administrador tiene habilitada esta opción en configuraciones).*

---

## 2. Circuito B: Venta Presencial Asistida (Mostrador)

El camino clásico donde el cliente ingresa al local y el empleado toma su pedido directamente desde la caja registradora.

```mermaid
graph TD
    %% Nodos principales
    Start(["Cliente pide en mostrador"]) --> Caja
    
    subgraph Módulo_Caja ["Caja Registradora (POS)"]
        Caja["Cajero arma comanda en el POS"]
        Caja --> Cobro["Cajero cobra y finaliza venta"]
        Cobro --> Descuento[("Se descuenta Stock y Masas en BD")]
        Cobro --> Ticket["El sistema genera Código de 4 Dígitos"]
    end
    
    Ticket --> EntregaCodigo(("Cajero dicta código al cliente"))
    EntregaCodigo --> ClienteEspera["Cliente espera en el local"]
    ClienteEspera -.->|Opcional| RastreaMovil("Rastrea estado escaneando QR de mesa")
    
    subgraph Módulo_KDS ["Cocina (KDS)"]
        Ticket --> KDS_N["Aparece en Pedidos Pendientes"]
        KDS_N --> KDS_L["Cocina prepara y toca: Terminado"]
        KDS_L --> Llamado(("Llaman al cliente por su número"))
    end
```

---

## 3. Circuito C: Gestión de Inventario y Producción (Admin)

Este diagrama muestra cómo el administrador gestiona la cadena de suministro, desde la compra bruta hasta el producto final y cómo se revierten operaciones ante errores (Reembolsos).

```mermaid
stateDiagram-v2
    [*] --> COMPRA_PROVEEDOR
    
    COMPRA_PROVEEDOR --> STOCK_LOTE : Admin ingresa Insumo (Crea Lote FIFO)
    
    STOCK_LOTE --> ELABORACION : Cocina fabrica 1 Lote de Masa
    
    state "Elaboración de Masas" as ELABORACION {
        [*] --> MASAS
        MASAS --> [*]
    }
    note right of ELABORACION
        El sistema resta gramos/ml del Stock base
        y suma X porciones de Masa al stock intermedio.
    end note
    
    ELABORACION --> RECETAS : Se usa en una Ficha Técnica (Waffle)
    RECETAS --> MENU_PUBLICO : Se fija el precio y se habilita para vender
    
    MENU_PUBLICO --> VENTA : Cajero factura Producto
    VENTA --> DINERO_CAJA : Sube facturación del día
    VENTA --> DESCUENTO_FINAL : Se resta 1 Masa + X gramos de Toppings
    
    DINERO_CAJA --> REEMBOLSO : Admin anula la venta desde 'Historial'
    
    state "Reembolso (Devolución)" as REEMBOLSO {
        [*] --> ANULACION
        ANULACION --> DINERO_RESTADO : Se descuenta de las ventas
        DINERO_RESTADO --> STOCK_DEVUELTO : Cantidades exactas vuelven a Stock/Masas
        STOCK_DEVUELTO --> [*]
    }
    
    REEMBOLSO --> STOCK_LOTE : Retorna inventario físico
    
    DESCUENTO_FINAL --> [*]
```

---

## 4. Circuito D: Rastreo, Módulo Móvil y Reseñas

Este circuito explica qué pasa desde que el cliente obtiene su ticket pagado hasta que deja una reseña post-consumo en la aplicación `/app`.

```mermaid
graph TD
    Start(["Cliente se sienta a esperar"]) --> ScanQR["Ingresa a /app (Escanea QR)"]
    
    subgraph Módulo_Móvil ["App Móvil / Rastreador"]
        ScanQR --> IngresaCodigo["Ingresa su Número de Ticket (Ej: 2459)"]
        IngresaCodigo --> ConsultaEstado{"Consulta Estado (Web Polling)"}
    end
    
    subgraph Módulo_KDS ["Cocina (KDS)"]
        KDS_Pendiente["Estado: Pendiente (Caja lo envió)"]
        KDS_Listo["Estado: Terminado (Cocina tocó Check)"]
        
        KDS_Pendiente --> KDS_Listo
    end
    
    ConsultaEstado -- "kdsStatus: pending" --> MostrarReloj(("Animación: Reloj de Arena / Fuego"))
    ConsultaEstado -- "kdsStatus: completed" --> MostrarTilde(("Animación: Check Verde"))
    
    MostrarReloj -.->|Actualización en vivo| ConsultaEstado
    
    KDS_Pendiente -.->|Dispara| MostrarReloj
    KDS_Listo -.->|Dispara| MostrarTilde
    
    MostrarTilde --> HabilitaReseña["Se habilita botón: Dejar Reseña"]
    
    subgraph Feedback ["Sistema de Reseñas (Admin)"]
        HabilitaReseña --> FormReseña["Cliente elige (Positivo/Negativo) y comenta"]
        FormReseña --> DB_Reseñas[("Se vincula reseña al sale_id en BD")]
        DB_Reseñas --> Dashboard["Aparece en Métricas del Administrador"]
    end
```
