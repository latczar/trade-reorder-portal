// Product photos, stored in the repo as WebP (480 and 960 px wide, 4:3).
// All are CC0 or CC BY 2.0, found through Openverse. Credits are listed in the README and shown on product pages.

export const PHOTOS = {
  "CT-101": { alt: "Roasted coffee beans", by: "Michal Jarmoluk", source: "https://stocksnap.io/photo/coffee-beans-PM0QDTADIN", licence: "CC0 1.0" },
  "CT-104": { alt: "Coffee beans spilling from a bag onto a cloth", by: "Anastasia Zhenina", source: "https://stocksnap.io/photo/coffee-beans-X2HTBSJDKF", licence: "CC0 1.0" },
  "CT-210": { alt: "Three tea bags hanging on strings", by: "S Baker", source: "https://www.flickr.com/photos/57373363@N00/67864825", licence: "CC BY 2.0" },
  "CT-305": { alt: "Hot chocolate with marshmallows", by: "Tohm Brigitte", source: "https://stocksnap.io/photo/hot-chocolate-TKMJJ9D81G", licence: "CC0 1.0" },
  "DS-001": { alt: "Two kraft takeaway cups", by: "Senior Living", source: "https://stocksnap.io/photo/coffee-cup-KBPLPXZBRB", licence: "CC0 1.0" },
  "DS-002": { alt: "A takeaway cup with a white lid", by: "Lisa Fotios", source: "https://stocksnap.io/photo/woman-holding-UESXHK58NI", licence: "CC0 1.0" },
  "DS-010": { alt: "A takeaway coffee next to its black sip lid", by: "Jeffrey Betts", source: "https://stocksnap.io/photo/coffee-cup-VS5KJKKI33", licence: "CC0 1.0" },
  "DS-011": { alt: "A white sip lid seen from above", by: "renaissancechambara", source: "https://www.flickr.com/photos/39435232@N00/2451804238", licence: "CC BY 2.0" },
  "DS-040": { alt: "A stack of white paper napkins", by: "準建築人手札網站 Forgemind ArchiMedia", source: "https://www.flickr.com/photos/44343967@N00/10781395574", licence: "CC BY 2.0" },
  "CL-200": { alt: "A trigger spray bottle", by: "the.barb", source: "https://www.flickr.com/photos/46439517@N00/402739799", licence: "CC BY 2.0" },
  "CL-210": { alt: "An espresso machine pouring two shots", by: "Chevanon", source: "https://stocksnap.io/photo/chocolate-hot-GEBMMDX5VW", licence: "CC0 1.0" },
  "CL-300": { alt: "A centrefeed paper roll in its dispenser", by: "Mark Turnauckas", source: "https://www.flickr.com/photos/30329962@N08/6009596457", licence: "CC BY 2.0" },
  "DA-001": { alt: "Shelves of two-litre milk bottles", by: "markhillary", source: "https://www.flickr.com/photos/56087830@N00/829573216", licence: "CC BY 2.0" },
  "DA-020": { alt: "A glass of plant milk with a straw", by: "AmazingAlmonds", source: "https://www.flickr.com/photos/71430589@N02/8596721996", licence: "CC BY 2.0" },
  "BK-100": { alt: "A tray of baked croissants", by: "Olia Gozha", source: "https://stocksnap.io/photo/croissant-bread-8GMCKXR6GE", licence: "CC0 1.0" },
  "BK-120": { alt: "Pain au chocolat on a plate", by: "A writer afoot", source: "https://www.flickr.com/photos/60255232@N00/4533917238", licence: "CC BY 2.0" },
  "hero": { alt: "A barista pouring milk into a coffee", by: "Tim Wright", source: "https://stocksnap.io/photo/coffee-cafe-ICUFSN4V4U", licence: "CC0 1.0" },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Cards and thumbnails sit next to the product name, so the photo is decorative there (alt="").
export function productImage(p, { alt = false, sizes = "(max-width: 820px) 50vw, 300px", eager = false } = {}) {
  const base = `assets/products/${p.sku.toLowerCase()}`;
  return `<img src="${base}-480.webp" srcset="${base}-480.webp 480w, ${base}-960.webp 960w" sizes="${sizes}"
    width="480" height="360" alt="${alt ? esc(PHOTOS[p.sku]?.alt ?? p.name) : ""}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
}

export function categoryImage(category, products) {
  const p = products.find((x) => x.category === category);
  return p ? productImage(p, { sizes: "(max-width: 820px) 42vw, 240px" }) : "";
}

export function photoCredit(key) {
  const c = PHOTOS[key];
  return c ? `Photo: <a href="${c.source}" rel="noopener">${esc(c.by)}</a>, ${c.licence}` : "";
}
