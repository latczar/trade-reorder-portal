// Email-to-order intake.
//
// The model only reads the email and suggests lines. The code then checks every suggestion
// against the real catalogue and stock rules, and a person approves the result before it
// becomes an order. On a static host (no /api), a simple keyword matcher stands in for the
// model so the demo still works.

import { lineProblems } from "./logic.js";

const NUMBER_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };

// Keyword stand-in for the model. Good enough for the sample emails, deliberately simple.
export function fallbackParse(email, products) {
  const text = email.toLowerCase();
  const lines = [];
  const unmatched = [];
  const wantsUsual = /\b(usual|same as last|regular order)\b/.test(text);

  for (const raw of text.split(/[\n,;.]|\band\b|\bplus\b/)) {
    const m = raw.match(/(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(?:x\s+)?(?:more\s+)?(?:boxes|cases|packs|bags|tubs|of)?\s*(?:of\s+)?(.+)/);
    if (!m || /\b(usual|same as last|regular order)\b/.test(raw)) continue;
    const qty = Number(m[1]) || NUMBER_WORDS[m[1]] || 1;
    const words = m[2].replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
    if (!words.length) continue;
    let best = null;
    let bestScore = 0;
    for (const p of products) {
      const hay = [p.name, p.sku, p.category, p.keywords ?? ""].join(" ").toLowerCase();
      const score = words.filter((w) => hay.includes(w.replace(/s$/, ""))).length;
      if (score > bestScore) { best = p; bestScore = score; }
    }
    if (best && bestScore >= 1) lines.push({ sku: best.sku, qty, note: m[0].trim() });
    else unmatched.push(m[0].trim());
  }
  const po = email.match(/\bPO[:#\s-]*([A-Z0-9-]{3,})/i)?.[1] ?? "";
  return { lines, unmatched, wantsUsual, po, source: "keyword matcher (demo)" };
}

export async function parseEmail(email, products) {
  try {
    const res = await fetch("api/parse-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, catalogue: products.map(({ sku, name, pack }) => ({ sku, name, pack })) }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return { ...data, source: "Claude" };
  } catch {
    return fallbackParse(email, products);
  }
}

// Check the suggestions against the catalogue. Nothing the model says is trusted as-is.
export function reviewSuggestions(parsed, products) {
  return parsed.lines.map((l) => {
    const p = products.find((x) => x.sku === l.sku);
    if (!p) return { ...l, ok: false, issues: ["Not in the catalogue. Pick the right product by hand."] };
    const issues = lineProblems(p, l.qty);
    return { ...l, ok: issues.length === 0, issues };
  });
}

export const SAMPLE_EMAILS = [
  `Hi team,

Can we get the usual for Friday please, plus 2 more oat milk and 3 boxes of 12oz cups.
Also a pack of hot chocolate if you have it.

PO: NG-0941
Thanks, Sam`,
  `Morning! Running low at Riverside. Need 1 decaf beans, 2 sanitiser, 1 cleaning tablets and some gluten-free brownies if you stock them. Cheers`,
];
