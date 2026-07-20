const { pool } = require('./pool');
const { getDemoMode } = require('./demoState');

const seedDemo = async () => {
    if (!getDemoMode()) {
        console.log("Not in demo mode, skipping demo seeder.");
        return;
    }

    const client = await pool.connect(); // search_path is 'demo' via pool wrapper
    try {
        await client.query('BEGIN');
        
        // CREATE SCHEMA
        await client.query('CREATE SCHEMA IF NOT EXISTS demo;');
        
        // We do not need to SET search_path TO demo here, because pool.connect already did it!
        // But just to be sure:
        await client.query('SET search_path TO demo;');

        // Check if already seeded to avoid re-seeding
        const checkTable = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'demo' AND table_name = 'settings'
            );
        `);
        
        if (checkTable.rows[0].exists) {
            const checkCount = await client.query('SELECT COUNT(*) FROM settings');
            if (parseInt(checkCount.rows[0].count) > 0) {
                console.log("Demo schema already seeded.");
                await client.query('COMMIT');
                return;
            }
        }

        console.log("Seeding Demo Schema...");

        // DDLs
        const ddls = [
            `CREATE TABLE IF NOT EXISTS units (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100) NOT NULL, type VARCHAR(50) NOT NULL, base_unit_id VARCHAR(50), conversion_factor DECIMAL(18,6) NOT NULL DEFAULT 1)`,
            `CREATE TABLE IF NOT EXISTS warehouses (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL)`,
            `CREATE TABLE IF NOT EXISTS products (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, category VARCHAR(50) NOT NULL, base_unit_id VARCHAR(50) NOT NULL, min_stock DECIMAL(18,6) NOT NULL DEFAULT 0, cost_method VARCHAR(20) NOT NULL DEFAULT 'FIFO', portion_size DECIMAL(18,6) NOT NULL DEFAULT 0, price_per_portion DECIMAL(18,6) NOT NULL DEFAULT 0)`,
            `CREATE TABLE IF NOT EXISTS product_presentations (id VARCHAR(100) PRIMARY KEY, product_id VARCHAR(100) NOT NULL, name VARCHAR(255) NOT NULL, quantity DECIMAL(18,6) NOT NULL, unit_id VARCHAR(50) NOT NULL)`,
            `CREATE TABLE IF NOT EXISTS stock_lots (id SERIAL PRIMARY KEY, product_id VARCHAR(100) NOT NULL, warehouse_id VARCHAR(50) NOT NULL, quantity_initial DECIMAL(18,6) NOT NULL, quantity_current DECIMAL(18,6) NOT NULL, unit_cost DECIMAL(18,6) NOT NULL, purchase_quantity DECIMAL(18,6) DEFAULT 0, purchase_unit VARCHAR(20), total_cost DECIMAL(18,6) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS stock_movements (id SERIAL PRIMARY KEY, product_id VARCHAR(100) NOT NULL, warehouse_id VARCHAR(50) NOT NULL, type VARCHAR(20) NOT NULL, reason VARCHAR(50) NOT NULL, quantity DECIMAL(18,6) NOT NULL, unit_cost DECIMAL(18,6) NOT NULL, lot_id INTEGER, reference_id VARCHAR(100), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS masas (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, stock INTEGER NOT NULL DEFAULT 0, min_stock INTEGER NOT NULL DEFAULT 0, yield_qty INTEGER NOT NULL DEFAULT 1, cost_per_portion INTEGER NOT NULL DEFAULT 0, ingredients JSONB NOT NULL DEFAULT '[]')`,
            `CREATE TABLE IF NOT EXISTS waffles (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, cost INTEGER NOT NULL DEFAULT 0, image VARCHAR(255), ingredients JSONB NOT NULL DEFAULT '[]')`,
            `CREATE TABLE IF NOT EXISTS menu (id VARCHAR(100) PRIMARY KEY, type VARCHAR(50) NOT NULL, reference_id VARCHAR(100) NOT NULL, name VARCHAR(255) NOT NULL, price INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN DEFAULT TRUE)`,
            `CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, admin_password VARCHAR(255) NOT NULL, cashier_pin VARCHAR(4) NOT NULL DEFAULT '1234', data JSONB DEFAULT '{}')`,
            `CREATE TABLE IF NOT EXISTS sales (id VARCHAR(100) PRIMARY KEY, date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, items JSONB NOT NULL, total INTEGER NOT NULL, payment_method VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL DEFAULT 'completed', cashier_name VARCHAR(255) DEFAULT 'Administrador', "kdsStatus" VARCHAR(50) DEFAULT 'pending', kds_completed_at TIMESTAMPTZ, customer_name VARCHAR(255))`,
            `CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, sale_id VARCHAR(100) NOT NULL REFERENCES sales(id), rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 2), comment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS kiosk_orders (id VARCHAR(100) PRIMARY KEY, cart JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS employees (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, pin VARCHAR(4) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'cashier', active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`
        ];

        for (const ddl of ddls) {
            await client.query(ddl);
        }

        // SEED UNITS
        const basicUnits = [
            ['g', 'Gramos', 'mass', 'g', 1],
            ['kg', 'Kilogramos', 'mass', 'g', 1000],
            ['ml', 'Mililitros', 'volume', 'ml', 1],
            ['l', 'Litros', 'volume', 'ml', 1000],
            ['un', 'Unidades', 'item', 'un', 1]
        ];
        for (const u of basicUnits) {
            await client.query('INSERT INTO units (id, name, type, base_unit_id, conversion_factor) VALUES ($1, $2, $3, $4, $5)', u);
        }

        // SEED WAREHOUSE
        await client.query("INSERT INTO warehouses (id, name) VALUES ('dep_principal', 'Depósito Principal')");

        // SEED PRODUCTS (Raw Materials, Toppings, Drinks)
        const products = [
            // Masas Ingredients
            { id: 'harina', name: 'Harina 0000', cat: 'raw_material', unit: 'g', stock: 50000, cost: 0.8 }, // 0.8 per gram
            { id: 'leche', name: 'Leche Entera', cat: 'raw_material', unit: 'ml', stock: 20000, cost: 0.9 },
            { id: 'huevos', name: 'Huevos', cat: 'raw_material', unit: 'un', stock: 360, cost: 150 },
            { id: 'vainilla', name: 'Esencia Vainilla', cat: 'raw_material', unit: 'ml', stock: 2000, cost: 5 },
            { id: 'azucar', name: 'Azúcar Blanca', cat: 'raw_material', unit: 'g', stock: 10000, cost: 1.2 },
            { id: 'sal', name: 'Sal Fina', cat: 'raw_material', unit: 'g', stock: 2000, cost: 0.5 },
            { id: 'aceite', name: 'Aceite Girasol', cat: 'raw_material', unit: 'ml', stock: 5000, cost: 1.5 },
            { id: 'manteca', name: 'Manteca', cat: 'raw_material', unit: 'g', stock: 3000, cost: 4 },
            
            // Dulces
            { id: 'crema', name: 'Crema Batida', cat: 'topping', unit: 'g', stock: 5000, cost: 3, port: 50, price: 800 },
            { id: 'nutella', name: 'Nutella', cat: 'syrup', unit: 'g', stock: 4000, cost: 15, port: 40, price: 1500 },
            { id: 'ddl', name: 'Dulce de Leche', cat: 'syrup', unit: 'g', stock: 10000, cost: 5, port: 50, price: 900 },
            { id: 'frutilla', name: 'Frutillas Frescas', cat: 'topping', unit: 'g', stock: 3000, cost: 8, port: 40, price: 1100 },
            { id: 'oreo', name: 'Oreo Molidas', cat: 'topping', unit: 'g', stock: 2000, cost: 12, port: 30, price: 800 },
            { id: 'rocklets', name: 'Rocklets', cat: 'topping', unit: 'g', stock: 2000, cost: 10, port: 30, price: 700 },
            
            // Salados
            { id: 'lechuga', name: 'Lechuga Capuchina', cat: 'topping', unit: 'g', stock: 1000, cost: 2, port: 30, price: 500 },
            { id: 'tomate', name: 'Tomate Fresco', cat: 'topping', unit: 'g', stock: 2000, cost: 2.5, port: 40, price: 600 },
            { id: 'jamon', name: 'Jamón Cocido', cat: 'topping', unit: 'g', stock: 3000, cost: 15, port: 50, price: 1200 },
            { id: 'queso', name: 'Queso Tybo', cat: 'topping', unit: 'g', stock: 4000, cost: 12, port: 50, price: 1100 },
            
            // Bebidas
            { id: 'coca', name: 'Coca-Cola 500ml', cat: 'drink', unit: 'un', stock: 150, cost: 800, port: 1, price: 1500 },
            { id: 'fanta', name: 'Fanta 500ml', cat: 'drink', unit: 'un', stock: 100, cost: 800, port: 1, price: 1500 },
            { id: 'cafe', name: 'Café Espresso', cat: 'drink', unit: 'un', stock: 500, cost: 300, port: 1, price: 1200 },
            { id: 'jugo', name: 'Jugo de Naranja', cat: 'drink', unit: 'un', stock: 80, cost: 500, port: 1, price: 1300 },
        ];

        for (const p of products) {
            await client.query(
                'INSERT INTO products (id, name, category, base_unit_id, min_stock, portion_size, price_per_portion) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [p.id, p.name, p.cat, p.unit, 100, p.port || 0, p.price || 0]
            );
            const lotRes = await client.query(
                'INSERT INTO stock_lots (product_id, warehouse_id, quantity_initial, quantity_current, unit_cost, purchase_quantity, purchase_unit, total_cost) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [p.id, 'dep_principal', p.stock, p.stock, p.cost, p.stock, p.unit, (p.stock * p.cost)]
            );
            await client.query(
                "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, $2, 'IN', 'INITIAL', $3, $4, $5)",
                [p.id, 'dep_principal', p.stock, p.cost, lotRes.rows[0].id]
            );
        }

        // SEED MASAS
        const masas = [
            { id: 'masa_dulce', name: 'Masa Tradicional Dulce', stock: 120, cost: 250, 
              ing: [{id: 'harina', qty: 1000}, {id: 'leche', qty: 500}, {id: 'huevos', qty: 4}, {id: 'azucar', qty: 200}, {id: 'vainilla', qty: 20}, {id: 'manteca', qty: 100}] },
            { id: 'masa_salada', name: 'Masa Salada Clásica', stock: 80, cost: 200, 
              ing: [{id: 'harina', qty: 1000}, {id: 'leche', qty: 600}, {id: 'huevos', qty: 3}, {id: 'sal', qty: 15}, {id: 'aceite', qty: 50}] }
        ];

        for (const m of masas) {
            await client.query(
                'INSERT INTO masas (id, name, stock, min_stock, yield_qty, cost_per_portion, ingredients) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [m.id, m.name, m.stock, 20, 10, m.cost, JSON.stringify(m.ing)]
            );
        }

        // SEED WAFFLES
        const waffles = [
            { id: 'w_bomba', name: 'Bomba Dulce', desc: 'Masa dulce con Nutella, frutillas y crema', cost: 1800,
              ing: [{type: 'masa', id: 'masa_dulce', qty: 1}, {type: 'stock', id: 'nutella', qty: 60}, {type: 'stock', id: 'frutilla', qty: 50}, {type: 'stock', id: 'crema', qty: 60}] },
            { id: 'w_oreo', name: 'Locura Oreo', desc: 'Masa dulce, dulce de leche, extra oreo', cost: 1500,
              ing: [{type: 'masa', id: 'masa_dulce', qty: 1}, {type: 'stock', id: 'ddl', qty: 80}, {type: 'stock', id: 'oreo', qty: 50}] },
            { id: 'w_caprese', name: 'Waffle Caprese', desc: 'Masa salada, queso, tomate', cost: 1600,
              ing: [{type: 'masa', id: 'masa_salada', qty: 1}, {type: 'stock', id: 'queso', qty: 80}, {type: 'stock', id: 'tomate', qty: 60}] },
            { id: 'w_jamon', name: 'Waffle Jamón y Queso', desc: 'Masa salada clásica con fiambre', cost: 1900,
              ing: [{type: 'masa', id: 'masa_salada', qty: 1}, {type: 'stock', id: 'queso', qty: 60}, {type: 'stock', id: 'jamon', qty: 80}] }
        ];

        for (const w of waffles) {
            await client.query(
                'INSERT INTO waffles (id, name, description, cost, image, ingredients) VALUES ($1, $2, $3, $4, $5, $6)',
                [w.id, w.name, w.desc, w.cost, null, JSON.stringify(w.ing)]
            );
        }

        // SEED MENU
        const menu = [
            { id: 'm1', type: 'waffle', ref: 'w_bomba', name: 'Bomba Dulce', price: 4500 },
            { id: 'm2', type: 'waffle', ref: 'w_oreo', name: 'Locura Oreo', price: 4200 },
            { id: 'm3', type: 'waffle', ref: 'w_caprese', name: 'Waffle Caprese', price: 4300 },
            { id: 'm4', type: 'waffle', ref: 'w_jamon', name: 'Waffle Especial JyQ', price: 4800 },
            { id: 'm5', type: 'direct', ref: 'coca', name: 'Coca-Cola 500ml', price: 1500 },
            { id: 'm6', type: 'direct', ref: 'cafe', name: 'Café Espresso', price: 1200 },
            { id: 'm7', type: 'direct', ref: 'jugo', name: 'Jugo Naranja', price: 1300 },
        ];
        for (const m of menu) {
            await client.query('INSERT INTO menu (id, type, reference_id, name, price, is_visible) VALUES ($1, $2, $3, $4, $5, true)', [m.id, m.type, m.ref, m.name, m.price]);
        }

        // SEED SETTINGS & EMPLOYEES
        const demoSettingsData = JSON.stringify({
            companyName: 'Sr Waffle Patagonia (Demo)',
            companyAddress: 'Av. Arrayanes 123, Villa La Angostura',
            companyHours: 'Lunes a Domingos: 10:00 a 22:00',
            companyInstagram: '@srwaffle.patagonia',
            companyPhone: '5491123456789',
            whatsappOrdersEnabled: true
        });
        await client.query("INSERT INTO settings (admin_password, data) VALUES ('admin', $1)", [demoSettingsData]);
        const employees = [
            { id: 'emp_1', name: 'Martín (Caja)', pin: '1111', role: 'Caja' },
            { id: 'emp_2', name: 'Sofía (Caja)', pin: '2222', role: 'Caja' },
            { id: 'emp_3', name: 'Lucas (Cocina)', pin: '3333', role: 'Cocina' }
        ];
        for (const e of employees) {
            await client.query("INSERT INTO employees (id, name, pin, role) VALUES ($1, $2, $3, $4)", [e.id, e.name, e.pin, e.role]);
        }

        // GENERATE 100 SALES SPREAD OVER 30 DAYS
        const payments = ['Efectivo', 'Mercado Pago', 'Tarjeta'];
        const cashiers = ['Martín (Caja)', 'Sofía (Caja)'];
        let totalSalesCount = 0;
        
        for (let i = 0; i < 150; i++) {
            // Distribute exponentially over last 30 days (more sales recently)
            const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 30);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            // Random time between 11:00 and 23:00
            date.setHours(11 + Math.floor(Math.random() * 12));
            date.setMinutes(Math.floor(Math.random() * 60));

            // Generate items
            const itemCount = 1 + Math.floor(Math.random() * 3);
            let items = [];
            let total = 0;
            
            for (let j = 0; j < itemCount; j++) {
                const menuItem = menu[Math.floor(Math.random() * menu.length)];
                items.push({
                    id: menuItem.ref,
                    type: menuItem.type === 'waffle' ? 'menu_waffle' : 'menu_direct',
                    name: menuItem.name,
                    price: menuItem.price,
                    config: {}
                });
                total += menuItem.price;
            }

            const saleId = `${1000 + i}`;
            const pay = payments[Math.floor(Math.random() * payments.length)];
            const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
            
            // KDS completed logic
            let status = 'completed';
            let kdsStatus = 'completed';
            let kdsCompletedDate = new Date(date.getTime() + (5 + Math.floor(Math.random() * 10)) * 60000);
            let kdsCompletedStr = kdsCompletedDate.toISOString();

            // 15% chance of being active (pending/preparing) if it's very recent (last 1-2 days)
            if (daysAgo <= 2 && Math.random() < 0.15) {
                status = 'pending';
                kdsStatus = Math.random() < 0.5 ? 'pending' : 'preparing';
                kdsCompletedStr = null;
            }

            await client.query(
                `INSERT INTO sales (id, date, items, total, payment_method, status, cashier_name, "kdsStatus", kds_completed_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [saleId, date.toISOString(), JSON.stringify(items), total, pay, cashier, status, kdsStatus, kdsCompletedStr]
            );

            // 30% chance of getting a review (only for completed sales)
            if (status === 'completed' && Math.random() > 0.7) {
                const rating = Math.random() > 0.2 ? 2 : 1; // mostly positive
                const commentsPos = ['¡Riquísimo!', 'Excelente atención', 'Volveré pronto', 'El mejor waffle'];
                const commentsNeg = ['Tardaron mucho', 'Vino frío', 'No me gustó el sabor'];
                const comment = rating === 2 
                    ? commentsPos[Math.floor(Math.random() * commentsPos.length)]
                    : commentsNeg[Math.floor(Math.random() * commentsNeg.length)];

                await client.query(
                    `INSERT INTO reviews (sale_id, rating, comment, created_at) VALUES ($1, $2, $3, $4)`,
                    [saleId, rating, comment, kdsCompletedStr] // Review shortly after completed
                );
            }
            totalSalesCount++;
        }

        console.log(`Demo Schema Seeding Complete! Inserted ${totalSalesCount} sales.`);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error seeding demo:", err);
    } finally {
        client.release();
    }
};

module.exports = { seedDemo };
