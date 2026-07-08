const { pool } = require('../db/pool');

class UnitConverter {
  constructor() {
    this.units = new Map();
  }

  async loadUnits() {
    const res = await pool.query('SELECT * FROM units');
    this.units.clear();
    for (const row of res.rows) {
      this.units.set(row.id, {
        id: row.id,
        name: row.name,
        type: row.type,
        base_unit_id: row.base_unit_id,
        conversion_factor: parseFloat(row.conversion_factor)
      });
    }
  }

  async convert(quantity, fromUnitId, toUnitId) {
    if (this.units.size === 0) await this.loadUnits();
    
    if (fromUnitId === toUnitId) return quantity;

    const fromUnit = this.units.get(fromUnitId);
    const toUnit = this.units.get(toUnitId);

    if (!fromUnit || !toUnit) {
      throw new Error(`Unidad no encontrada: ${fromUnitId} o ${toUnitId}`);
    }

    if (fromUnit.type !== toUnit.type) {
      throw new Error(`Incompatibilidad de tipos: no se puede convertir de ${fromUnit.type} a ${toUnit.type}`);
    }

    // Convert from -> base -> to
    // Example: kg -> g (base) -> mg
    // kg(factor 1000) -> 1 * 1000 = 1000g
    // mg(factor 0.001) -> 1000 / 0.001 = 1000000mg
    const quantityInBase = quantity * fromUnit.conversion_factor;
    return quantityInBase / toUnit.conversion_factor;
  }
  
  async getBaseQuantityFromPresentation(presentationId, quantityPurchased) {
    // E.g. presentationId = "bolsa_10kg" (quantity: 10, unit: "kg")
    const res = await pool.query('SELECT quantity, unit_id, product_id FROM product_presentations WHERE id = $1', [presentationId]);
    if (res.rows.length === 0) throw new Error('Presentation not found');
    
    const pres = res.rows[0];
    const productRes = await pool.query('SELECT base_unit_id FROM products WHERE id = $1', [pres.product_id]);
    const baseUnitId = productRes.rows[0].base_unit_id;
    
    const totalPresentationUnits = parseFloat(pres.quantity) * quantityPurchased;
    return await this.convert(totalPresentationUnits, pres.unit_id, baseUnitId);
  }
}

module.exports = new UnitConverter();
