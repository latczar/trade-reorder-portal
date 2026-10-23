import { test } from "node:test";
import assert from "node:assert/strict";
import { PRODUCTS, BAND_DISCOUNT, SEED_ORDERS } from "../src/data.js";
import { unitPrice, lineProblems, basketTotals, checkoutProblems, deliveryOptions, mergeLines, usuals, digitalShare } from "../src/logic.js";
import { fallbackParse, reviewSuggestions } from "../src/intake.js";

const p = (sku) => PRODUCTS.find((x) => x.sku === sku);

test("band discount applies to the list price", () => {
  assert.equal(unitPrice(p("CT-101"), "B", BAND_DISCOUNT), 77.28);
  assert.equal(unitPrice(p("CT-101"), "D", BAND_DISCOUNT), 84);
});

test("line checks catch minimum quantity, stock and bad input", () => {
  assert.deepEqual(lineProblems(p("CT-101"), 2), []);
  assert.match(lineProblems(p("DS-001"), 1)[0], /Minimum order is 2/);
  assert.match(lineProblems(p("DS-011"), 10)[0], /Only 9 in stock/);
  assert.match(lineProblems(p("CT-305"), 1)[0], /Out of stock/);
  assert.match(lineProblems(p("CT-101"), 1.5)[0], /whole number/);
});

test("VAT is charged only on standard-rated lines", () => {
  const t = basketTotals([{ sku: "CT-101", qty: 1 }, { sku: "DS-001", qty: 2 }], PRODUCTS, "D", BAND_DISCOUNT);
  assert.deepEqual(t, { net: 161.5, vat: 15.5, gross: 177 });
});

test("checkout explains every blocker in plain words", () => {
  const problems = checkoutProblems({ lines: [], products: PRODUCTS, po: " ", deliveryDate: "", gross: 900, creditLimit: 1000, creditUsed: 500 });
  assert.equal(problems.length, 4);
  assert.ok(problems.some((x) => x.includes("£400.00 over your credit limit")));
});

test("delivery dates respect delivery days and the 2pm cut-off", () => {
  const monMorning = new Date(2026, 9, 19, 9); // Mon 19 Oct
  const monAfternoon = new Date(2026, 9, 19, 15);
  const days = [1, 3, 5];
  assert.equal(deliveryOptions(monMorning, days)[0], "2026-10-21"); // Wednesday
  assert.equal(deliveryOptions(monMorning, days).length, 4);
  assert.ok(deliveryOptions(monAfternoon, days)[0] >= deliveryOptions(monMorning, days)[0]);
});

test("reorder merges into existing basket lines", () => {
  assert.deepEqual(mergeLines([{ sku: "CT-101", qty: 1 }], [{ sku: "CT-101", qty: 2 }, { sku: "DA-001", qty: 6 }]),
    [{ sku: "CT-101", qty: 3 }, { sku: "DA-001", qty: 6 }]);
});

test("usuals ranks the most frequently ordered products", () => {
  assert.equal(usuals(SEED_ORDERS)[0].sku, "CT-101");
});

test("digital share is portal orders over all orders", () => {
  assert.equal(digitalShare({ portal: 9, email: 1 }), 0.9);
  assert.equal(digitalShare({}), 0);
});

test("email intake matches products, reads the PO and flags unknown items", () => {
  const r = fallbackParse("Usual please, plus 2 oat milk and 3 boxes of 12oz cups, also 1 gluten-free brownies. PO: NG-0941", PRODUCTS);
  assert.equal(r.wantsUsual, true);
  assert.equal(r.po, "NG-0941");
  assert.ok(r.lines.some((l) => l.sku === "DA-020" && l.qty === 2));
  assert.ok(r.lines.some((l) => l.sku === "DS-002" && l.qty === 3));
  assert.equal(r.unmatched.length, 1);
});

test("suggestions are never trusted: unknown SKUs and stock problems are flagged", () => {
  const reviewed = reviewSuggestions({ lines: [{ sku: "XX-999", qty: 1, note: "" }, { sku: "CT-305", qty: 1, note: "" }, { sku: "CT-101", qty: 1, note: "" }] }, PRODUCTS);
  assert.deepEqual(reviewed.map((l) => l.ok), [false, false, true]);
});
