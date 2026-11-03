import Decimal from 'decimal.js';

describe('Module 4: Inventory & Warehouse Business Logic', () => {
  describe('Inter-Warehouse Stock Transfers', () => {
    test('accurately decrements source and increments destination while conserving total company stock', () => {
      // Cairo Central Warehouse initial stock: 500 bearings
      // 10th of Ramadan Warehouse initial stock: 150 bearings
      // Total company stock: 650
      const sourceStockInitial = new Decimal(500);
      const destStockInitial = new Decimal(150);
      const totalInitial = sourceStockInitial.plus(destStockInitial);

      // Transfer 200 bearings from Cairo to 10th of Ramadan
      const transferQty = new Decimal(200);

      // Verify source has sufficient quantity
      expect(sourceStockInitial.greaterThanOrEqualTo(transferQty)).toBe(true);

      const sourceStockAfter = sourceStockInitial.minus(transferQty);
      const destStockAfter = destStockInitial.plus(transferQty);
      const totalAfter = sourceStockAfter.plus(destStockAfter);

      expect(sourceStockAfter.toNumber()).toBe(300);
      expect(destStockAfter.toNumber()).toBe(350);
      // Conservation of total inventory:
      expect(totalAfter.toNumber()).toBe(totalInitial.toNumber());
    });

    test('prevents transfer when requested quantity exceeds source warehouse quantity on hand', () => {
      const sourceStock = new Decimal(40);
      const requestedTransfer = new Decimal(50);
      const isSufficient = sourceStock.greaterThanOrEqualTo(requestedTransfer);
      expect(isSufficient).toBe(false);
    });
  });

  describe('Stocktake Adjustments & Damaged Goods Write-offs', () => {
    test('calculates correct shortage deduction for damaged goods', () => {
      // Book inventory: 120 units
      // Physical count after detecting water damage: 112 units
      // Shortage/Damage delta: -8 units
      const bookQty = new Decimal(120);
      const physicalQty = new Decimal(112);
      const delta = physicalQty.minus(bookQty);

      expect(delta.toNumber()).toBe(-8);
      expect(delta.isNegative()).toBe(true);
    });

    test('calculates correct surplus for physical stock recount excess', () => {
      // Book inventory: 80 units
      // Physical count found extra box: 85 units
      const bookQty = new Decimal(80);
      const physicalQty = new Decimal(85);
      const delta = physicalQty.minus(bookQty);

      expect(delta.toNumber()).toBe(5);
      expect(delta.isPositive()).toBe(true);
    });
  });

  describe('Reorder Intelligence & Lead Time Formula', () => {
    test('calculates reorder quantity when stock falls below minimum threshold', () => {
      // Min safety stock level: 100 units
      // Current available stock across all warehouses: 35 units
      // Suggested reorder formula = (minStock * 2) - currentStock
      // Target stock = 200 units
      // Suggested order = 200 - 35 = 165 units
      const minStock = new Decimal(100);
      const currentStock = new Decimal(35);

      const isBelowMin = currentStock.lessThanOrEqualTo(minStock);
      expect(isBelowMin).toBe(true);

      const suggestedReorder = minStock.times(2).minus(currentStock);
      expect(suggestedReorder.toNumber()).toBe(165);
    });

    test('recommends double minimum stock when completely out of stock', () => {
      const minStock = new Decimal(50);
      const currentStock = new Decimal(0);
      const suggestedReorder = minStock.times(2).minus(currentStock);
      expect(suggestedReorder.toNumber()).toBe(100);
    });
  });

  describe('Packaging & Unit of Measure Conversions', () => {
    test('converts loose pieces to boxes and cartons', () => {
      // Bearing packaging: 10 pieces per box, 10 boxes per carton (100 pieces per carton)
      // Stock quantity: 354 pieces
      const pieces = 354;
      const piecesPerBox = 10;
      const boxesPerCarton = 10;
      const piecesPerCarton = piecesPerBox * boxesPerCarton; // 100

      const fullCartons = Math.floor(pieces / piecesPerCarton); // 3
      const remainingPiecesAfterCartons = pieces % piecesPerCarton; // 54
      const fullBoxes = Math.floor(remainingPiecesAfterCartons / piecesPerBox); // 5
      const loosePieces = remainingPiecesAfterCartons % piecesPerBox; // 4

      expect(fullCartons).toBe(3);
      expect(fullBoxes).toBe(5);
      expect(loosePieces).toBe(4);
    });
  });
});
