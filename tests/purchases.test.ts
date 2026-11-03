import Decimal from 'decimal.js';
import {
  calculateWAC,
  allocateLandedCostByValue,
  allocateLandedCostByWeight,
  calculateExchangeGainLoss,
} from '@/lib/utils';

describe('Module 3: Purchases & Landed Cost Business Logic', () => {
  describe('Import Shipment Landed Cost Distribution', () => {
    test('distributes freight, customs duty, clearance, and inland transport by value', () => {
      // Scenario:
      // Shipment from China contains two bearing models:
      // Item A: 1,000 units @ $10.00 = $10,000 (Ex-rate: 48.00 EGP = 480,000 EGP)
      // Item B: 500 units @ $40.00 = $20,000 (Ex-rate: 48.00 EGP = 960,000 EGP)
      // Total FOB value: 1,440,000 EGP
      //
      // Additional Expenses (in EGP):
      // - Ocean Freight: 120,000 EGP
      // - Customs Duty & VAT: 180,000 EGP
      // - Clearance agent & port charges: 45,000 EGP
      // - Inland transport (Alexandria port to Cairo warehouse): 15,000 EGP
      // Total Landed Expenses: 360,000 EGP (25% on top of FOB)

      const itemA_Value = new Decimal(480000);
      const itemB_Value = new Decimal(960000);
      const totalFOB = itemA_Value.plus(itemB_Value); // 1,440,000
      const totalExpenses = new Decimal(120000 + 180000 + 45000 + 15000); // 360,000

      // Item A represents 33.3333% of value -> share = 120,000 EGP / 1000 units = 120 EGP/unit
      const landedSharePerUnit_A = allocateLandedCostByValue(itemA_Value, totalFOB, totalExpenses, 1000);
      expect(landedSharePerUnit_A.toNumber()).toBe(120);

      // Item B represents 66.6667% of value -> share = 240,000 EGP / 500 units = 480 EGP/unit
      const landedSharePerUnit_B = allocateLandedCostByValue(itemB_Value, totalFOB, totalExpenses, 500);
      expect(landedSharePerUnit_B.toNumber()).toBe(480);

      // True Landed Unit Cost:
      // Item A: ($10 * 48) + 120 = 480 + 120 = 600 EGP per bearing
      const trueUnitCost_A = new Decimal(10).times(48).plus(landedSharePerUnit_A);
      expect(trueUnitCost_A.toNumber()).toBe(600);

      // Item B: ($40 * 48) + 480 = 1920 + 480 = 2,400 EGP per bearing
      const trueUnitCost_B = new Decimal(40).times(48).plus(landedSharePerUnit_B);
      expect(trueUnitCost_B.toNumber()).toBe(2400);

      // Verify total sum reconciliation:
      const totalShipmentCost = trueUnitCost_A.times(1000).plus(trueUnitCost_B.times(500));
      expect(totalShipmentCost.toNumber()).toBe(1440000 + 360000);
    });

    test('distributes landed cost by weight across heavy and light spare parts', () => {
      // Washing machine drums (heavy): 200 units, 15 kg each = 3,000 kg
      // Refrigerator sensors (light): 1,000 units, 0.2 kg each = 200 kg
      // Total weight: 3,200 kg
      // Total air freight & shipping cost: 64,000 EGP (20 EGP per kg)

      const totalWeight = new Decimal(3200);
      const totalFreight = new Decimal(64000);

      // Drum unit share: 15 kg * 20 = 300 EGP per unit
      const drumShare = allocateLandedCostByWeight(3000, totalWeight, totalFreight, 200);
      expect(drumShare.toNumber()).toBe(300);

      // Sensor unit share: 0.2 kg * 20 = 4 EGP per unit
      const sensorShare = allocateLandedCostByWeight(200, totalWeight, totalFreight, 1000);
      expect(sensorShare.toNumber()).toBe(4);
    });
  });

  describe('Receipt & Weighted Average Cost (WAC) Updating', () => {
    test('updates inventory WAC correctly when receiving shipment at higher landed cost', () => {
      // Existing stock in Cairo warehouse:
      // 500 bearings in stock with current WAC = 500 EGP
      // New import received:
      // 1,000 bearings at true landed cost = 600 EGP
      // Expected new WAC: ((500 * 500) + (1000 * 600)) / 1500 = (250000 + 600000) / 1500 = 850000 / 1500 = 566.6667 EGP

      const currentQty = 500;
      const currentWAC = 500;
      const receivedQty = 1000;
      const newTrueCost = 600;

      const newWAC = calculateWAC(currentQty, currentWAC, receivedQty, newTrueCost);
      expect(newWAC.toFixed(2)).toBe('566.67');
    });

    test('updates inventory WAC correctly when receiving shipment at lower landed cost', () => {
      // Existing: 200 units @ 1,200 EGP
      // Received: 300 units @ 1,000 EGP
      // New: (240000 + 300000) / 500 = 540000 / 500 = 1,080 EGP
      const newWAC = calculateWAC(200, 1200, 300, 1000);
      expect(newWAC.toNumber()).toBe(1080);
    });
  });

  describe('Supplier Foreign Currency Payment & FX Gains/Losses', () => {
    test('calculates realized foreign exchange gain when paying at favorable rate', () => {
      // PO booked when USD = 49.50 EGP for $25,000 (Accounts Payable liability = 1,237,500 EGP)
      // Payment executed via Bank transfer when USD = 48.00 EGP (Paid = 1,200,000 EGP)
      // Realized FX Gain = +37,500 EGP
      const gain = calculateExchangeGainLoss(49.50, 48.00, 25000);
      expect(gain.toNumber()).toBe(37500);
    });

    test('calculates realized foreign exchange loss when paying at higher rate', () => {
      // PO booked when EUR = 52.00 EGP for €10,000 (liability = 520,000 EGP)
      // Payment executed when EUR = 53.50 EGP (Paid = 535,000 EGP)
      // Realized FX Loss = -15,000 EGP
      const loss = calculateExchangeGainLoss(52.00, 53.50, 10000);
      expect(loss.toNumber()).toBe(-15000);
    });
  });
});
