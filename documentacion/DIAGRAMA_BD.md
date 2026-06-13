# Diagrama de Entidad-Relación (BD Sr. Waffle)

Aquí tienes el diagrama de la base de datos para comprender la relación entre Stock, Recetas, Menú y Ventas. 

```mermaid
erDiagram
    STOCK {
        string id PK "Ej: base_123, drink_456"
        string name "Nombre del producto/insumo"
        string category "bases, toppings, syrups, drinks"
        float stock "Cantidad actual disponible"
        float minStock "Alerta de stock mínimo"
        float price "Precio (si se vende directo)"
        float cost "Costo de compra o producción"
        string unit "Ej: kg, litros, porciones"
        json recipe "Nulo si es Materia Prima. Lleno si es Insumo Elaborado"
    }

    MENU {
        string id PK "Ej: menu_waffle_1"
        string name "Nombre Público"
        string description "Descripción para el cliente"
        float price "Precio de Venta"
        boolean isVisible "Mostrar en caja/vitrina"
        boolean showPrice "Mostrar precio"
        string type "waffle o direct"
        string base FK "Apunta a STOCK (La Masa del Waffle)"
        string stockId FK "Apunta a STOCK (Si es venta directa ej: Coca Cola)"
    }

    MENU_TOPPINGS {
        string menu_id FK
        string stock_id FK "Apunta a STOCK (Topping)"
    }

    MENU_SYRUPS {
        string menu_id FK
        string stock_id FK "Apunta a STOCK (Salsa)"
    }

    SALES {
        string id PK "Ej: sale_16843..."
        datetime date "Fecha y hora"
        json items "Lista de items vendidos"
        float total "Total facturado"
        string paymentMethod "efectivo, tarjeta, etc."
        string status "pending, completed, kitchen_ready"
        string cashierName "Nombre del empleado"
        string cliente_id FK "Opcional (Puntos de Fidelidad)"
    }

    LOYALTY_CUSTOMERS {
        string id PK
        string phone "Teléfono (Identificador único)"
        string name "Nombre del cliente"
        int points "Puntos actuales"
        float total_spent "Total gastado histórico"
    }

    EMPLOYEES {
        string id PK
        string name
        string role "admin o cashier"
        string pin "PIN de acceso"
    }

    %% Relaciones
    STOCK ||--o{ STOCK : "recipe.ingredients (Fabricación)"
    STOCK ||--o{ MENU : "Es usado como Base (Masa)"
    STOCK ||--o{ MENU : "Es usado como Venta Directa (Bebida)"
    
    MENU ||--o{ MENU_TOPPINGS : "Tiene"
    STOCK ||--o{ MENU_TOPPINGS : "Es"
    
    MENU ||--o{ MENU_SYRUPS : "Tiene"
    STOCK ||--o{ MENU_SYRUPS : "Es"

    LOYALTY_CUSTOMERS ||--o{ SALES : "Realiza"
```

### Explicación del Flujo de Inventario (Opción B)
1. **La Tabla Central es `STOCK`:** Aquí viven todos los elementos físicos que tienes en tu negocio. 
   - Una "Lata de Coca Cola" es un item en `STOCK`.
   - "Un Kilo de Harina" es un item en `STOCK`.
   - "Una Porción de Masa" también es un item en `STOCK`.
2. **El Sistema de Recetas (Insumos Elaborados):** Si un item de `STOCK` tiene el campo interno `recipe` lleno (ej. "Masa Tradicional" rinde 20 porciones y gasta 1kg harina + 5 huevos), el sistema sabe que es un Insumo Elaborado. Cuando le das al botón de "Fabricar", lee esa receta y altera la misma tabla de `STOCK` (Suma 20 Masas, Resta Harina y Huevos).
3. **El Menú Público (`MENU`):** Un Waffle en tu menú no es un elemento físico en tu stock, es un "Ensamblaje virtual". El registro del Waffle en la base de datos simplemente apunta a IDs de la tabla `STOCK` (Apunta a un ID de Masa, un ID de Topping, etc). Cuando se vende el Waffle, el sistema descuenta 1 unidad de cada uno de los items a los que apunta.
4. **Venta Directa:** Si agregas una Bebida y le pones Precio de Venta, el sistema automáticamente crea un registro en `MENU` que apunta 1 a 1 a ese ID de `STOCK`, para que aparezca en la caja registradora.
