// Simple drawn product images, so the demo needs no photo licences or external image hosts.
// Each product type gets a flat illustration on a soft background tied to its category.

const BG = {
  "Coffee & tea": "#f3ece4",
  Disposables: "#eef1f4",
  Cleaning: "#e9f2ef",
  "Dairy & alternatives": "#f1f3e8",
  Bakery: "#f7efe2",
};

const SHAPES = {
  beans: `<rect x="60" y="40" width="80" height="110" rx="10" fill="#5b3a29"/><rect x="60" y="40" width="80" height="22" rx="6" fill="#3e271b"/>
    <rect x="72" y="80" width="56" height="36" rx="4" fill="#f3ece4"/><ellipse cx="92" cy="98" rx="7" ry="10" fill="#5b3a29"/><ellipse cx="108" cy="98" rx="7" ry="10" fill="#7a4e36"/>`,
  tea: `<rect x="50" y="60" width="100" height="80" rx="8" fill="#b0413e"/><rect x="50" y="60" width="100" height="18" rx="6" fill="#8e2f2c"/>
    <rect x="66" y="92" width="68" height="30" rx="3" fill="#f7efe2"/><line x1="100" y1="92" x2="100" y2="122" stroke="#b0413e" stroke-width="3"/>`,
  tin: `<rect x="62" y="50" width="76" height="100" rx="8" fill="#6b4226"/><rect x="58" y="44" width="84" height="16" rx="5" fill="#4a2c18"/>
    <rect x="72" y="84" width="56" height="32" rx="4" fill="#f3ece4"/>`,
  cup: `<path d="M68 60 L132 60 L124 150 L76 150 Z" fill="#ffffff" stroke="#c9d1da" stroke-width="3"/><rect x="62" y="52" width="76" height="12" rx="4" fill="#9aa5b1"/>
    <rect x="74" y="92" width="52" height="26" rx="3" fill="#1f4e79"/>`,
  lid: `<ellipse cx="100" cy="112" rx="56" ry="16" fill="#3b4148"/><ellipse cx="100" cy="102" rx="46" ry="14" fill="#4b525a"/><rect x="88" y="92" width="24" height="6" rx="3" fill="#2a2e33"/>`,
  napkin: `<rect x="52" y="70" width="96" height="70" rx="4" fill="#c8a978"/><path d="M52 70 L100 104 L148 70" fill="none" stroke="#a88a5c" stroke-width="3"/>`,
  bottle: `<rect x="74" y="64" width="52" height="86" rx="10" fill="#2e8b6a"/><rect x="88" y="44" width="24" height="24" rx="4" fill="#1f6a50"/>
    <rect x="80" y="92" width="40" height="34" rx="3" fill="#ffffff"/>`,
  tablets: `<rect x="56" y="56" width="88" height="92" rx="10" fill="#ffffff" stroke="#c9d1da" stroke-width="3"/>
    <circle cx="82" cy="88" r="10" fill="#2e8b6a"/><circle cx="118" cy="88" r="10" fill="#2e8b6a"/><circle cx="82" cy="120" r="10" fill="#2e8b6a"/><circle cx="118" cy="120" r="10" fill="#2e8b6a"/>`,
  roll: `<rect x="58" y="62" width="84" height="86" rx="8" fill="#5b8ec7"/><ellipse cx="100" cy="62" rx="42" ry="12" fill="#7fa9d8"/><ellipse cx="100" cy="62" rx="12" ry="4" fill="#3d6ea6"/>`,
  milk: `<path d="M74 70 L100 48 L126 70 L126 150 L74 150 Z" fill="#ffffff" stroke="#c9d1da" stroke-width="3"/><rect x="74" y="96" width="52" height="30" fill="#1f4e79"/>`,
  oat: `<path d="M74 70 L100 48 L126 70 L126 150 L74 150 Z" fill="#e8d9b5" stroke="#cbb88c" stroke-width="3"/><rect x="74" y="96" width="52" height="30" fill="#6b8f3a"/>`,
  croissant: `<path d="M48 120 Q100 40 152 120 Q130 108 118 118 Q100 96 82 118 Q70 108 48 120 Z" fill="#d99a4e" stroke="#b97a32" stroke-width="3"/>`,
  pastry: `<rect x="56" y="78" width="88" height="50" rx="12" fill="#d99a4e" stroke="#b97a32" stroke-width="3"/><rect x="66" y="96" width="68" height="10" rx="5" fill="#5b3a29"/>`,
};

const TYPE = {
  "CT-101": "beans", "CT-104": "beans", "CT-210": "tea", "CT-305": "tin",
  "DS-001": "cup", "DS-002": "cup", "DS-010": "lid", "DS-011": "lid", "DS-040": "napkin",
  "CL-200": "bottle", "CL-210": "tablets", "CL-300": "roll",
  "DA-001": "milk", "DA-020": "oat", "BK-100": "croissant", "BK-120": "pastry",
};

export function productImage(p) {
  const shape = SHAPES[TYPE[p.sku]] ?? SHAPES.tin;
  return `<svg viewBox="0 0 200 180" role="img" aria-label="${p.name}" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="180" fill="${BG[p.category] ?? "#eef1f4"}"/>${shape}</svg>`;
}

export function categoryImage(category, products) {
  const p = products.find((x) => x.category === category);
  return p ? productImage(p) : "";
}
