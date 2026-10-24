// Pure business rules. No DOM, no storage, so they can be unit tested.

const round2 = (n) => Math.round(n * 100) / 100;

export function unitPrice(product, band, discounts) {
  const discount = discounts[band] ?? 0;
  return round2(product.listPrice * (1 - discount));
}

// Returns a list of problems for one basket line. An empty list means the line can be ordered.
export function lineProblems(product, qty) {
  const problems = [];
  if (!Number.isInteger(qty) || qty < 1) problems.push("Quantity must be a whole number of 1 or more.");
  else if (qty < product.minQty) problems.push(`Minimum order is ${product.minQty} packs.`);
  if (product.stock === 0) problems.push("Out of stock. Remove it or ask us for an alternative.");
  else if (qty > product.stock) problems.push(`Only ${product.stock} in stock.`);
  return problems;
}

export function basketTotals(lines, products, band, discounts) {
  let net = 0;
  let vat = 0;
  for (const { sku, qty } of lines) {
    const p = products.find((x) => x.sku === sku);
    if (!p) continue;
    const lineNet = round2(unitPrice(p, band, discounts) * qty);
    net += lineNet;
    vat += round2((lineNet * p.vat) / 100);
  }
  net = round2(net);
  vat = round2(vat);
  return { net, vat, gross: round2(net + vat) };
}

// Everything that would stop an order being placed, in plain words.
export function checkoutProblems({ lines, products, po, deliveryDate, gross, creditLimit, creditUsed }) {
  const problems = [];
  if (lines.length === 0) problems.push("Your basket is empty.");
  for (const l of lines) {
    const p = products.find((x) => x.sku === l.sku);
    if (!p) problems.push(`${l.sku} is no longer available.`);
    else if (lineProblems(p, l.qty).length) problems.push(`Check the quantity for ${p.name}.`);
  }
  if (!po || !po.trim()) problems.push("Add your purchase order number.");
  if (!deliveryDate) problems.push("Choose a delivery date.");
  if (creditUsed + gross > creditLimit) {
    problems.push(`This order would take you £${round2(creditUsed + gross - creditLimit).toFixed(2)} over your credit limit.`);
  }
  return problems;
}

// Next delivery dates on the customer's delivery days. Orders after the cut-off skip the next day.
export function deliveryOptions(now, deliveryDays, count = 4, cutoffHour = 14) {
  const out = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (now.getHours() >= cutoffHour ? 2 : 1));
  while (out.length < count) {
    if (deliveryDays.includes(d.getDay())) out.push(localIso(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Merge a past order into the basket, adding to quantities already there.
export function mergeLines(basket, lines) {
  const out = basket.map((l) => ({ ...l }));
  for (const { sku, qty } of lines) {
    const existing = out.find((l) => l.sku === sku);
    if (existing) existing.qty += qty;
    else out.push({ sku, qty });
  }
  return out;
}

// SKUs ordered most often across past orders, for the "Your usuals" list.
export function usuals(orders, limit = 6) {
  const counts = new Map();
  for (const o of orders) for (const l of o.lines) counts.set(l.sku, (counts.get(l.sku) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([sku, times]) => ({ sku, times }));
}

export function digitalShare(mix) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  return total ? mix.portal / total : 0;
}

// Delay before the next ERP retry: 2s, 4s, 8s, then give up and flag for a person.
export const MAX_ERP_ATTEMPTS = 3;
export function retryDelayMs(attempt) {
  return 1000 * 2 ** attempt;
}

// YYYY-MM-DD in local time (toISOString would shift the date in timezones ahead of UTC).
export function localIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Smart restock: from how often each product is ordered, work out which ones are probably due.
// Needs at least two past orders of a product to see a pattern.
export function restockSuggestions(orders, today, horizonDays = 3) {
  const day = 86400000;
  const bySku = new Map();
  for (const o of orders) for (const l of o.lines) {
    if (!bySku.has(l.sku)) bySku.set(l.sku, []);
    bySku.get(l.sku).push({ date: new Date(o.date + "T00:00:00"), qty: l.qty });
  }
  const out = [];
  for (const [sku, hist] of bySku) {
    if (hist.length < 2) continue;
    hist.sort((a, b) => a.date - b.date);
    const gaps = hist.slice(1).map((h, i) => (h.date - hist[i].date) / day);
    const every = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    const last = hist[hist.length - 1];
    const due = new Date(last.date.getTime() + every * day);
    const daysLeft = Math.round((due - today) / day);
    if (daysLeft <= horizonDays) {
      const qty = Math.round(hist.reduce((a, h) => a + h.qty, 0) / hist.length);
      out.push({ sku, qty, every, daysLeft });
    }
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}
