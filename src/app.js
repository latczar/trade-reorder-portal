import { CUSTOMER, CATEGORIES, PRODUCTS, BAND_DISCOUNT, SEED_ORDERS, CHANNEL_MIX, DIGITAL_TARGET } from "./data.js";
import {
  unitPrice, lineProblems, basketTotals, checkoutProblems, deliveryOptions,
  mergeLines, usuals, digitalShare, localIso, MAX_ERP_ATTEMPTS, retryDelayMs,
} from "./logic.js";
import { parseEmail, reviewSuggestions, SAMPLE_EMAILS } from "./intake.js";
import { productImage, categoryImage } from "./images.js";

// ---------- State (localStorage keeps the basket across refreshes; the app works without it) ----------

const KEY = "reorder-portal-v1";
const fresh = () => ({ basket: [], orders: structuredClone(SEED_ORDERS), erpLog: [], erpDown: false, po: "", site: 0, delivery: "" });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    return fresh();
  }
}
let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep going in memory */ }
}
function set(patch) {
  state = { ...state, ...patch };
  save();
  render();
}

// ---------- Helpers ----------

const $ = (sel) => document.querySelector(sel);
const money = (n) => "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const product = (sku) => PRODUCTS.find((p) => p.sku === sku);
const price = (p) => unitPrice(p, CUSTOMER.priceBand, BAND_DISCOUNT);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const basketCount = () => state.basket.reduce((a, l) => a + l.qty, 0);

function stockLabel(p) {
  if (p.stock === 0) return `<span class="stock out">Out of stock</span>`;
  if (p.stock < 20) return `<span class="stock low">${p.stock} left</span>`;
  return `<span class="stock">In stock</span>`;
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2800);
}

function addToBasket(sku, qty) {
  set({ basket: mergeLines(state.basket, [{ sku, qty }]) });
  toast(`Added ${qty} x ${product(sku).name}`);
}

// ---------- Views ----------

const ui = { query: "", category: "All", openOrder: null, email: SAMPLE_EMAILS[0], intake: null, reading: false };

function viewCatalogue() {
  const q = ui.query.toLowerCase();
  const list = PRODUCTS.filter((p) =>
    (ui.category === "All" || p.category === ui.category) &&
    (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));

  return `
    <section class="panel">
      <div class="panel-head"><h2>Your usuals</h2><span class="muted">Based on your last ${state.orders.length} orders</span></div>
      <div class="usuals">
        ${usuals(state.orders).map(({ sku, times }) => {
          const p = product(sku);
          return `<div class="usual">
            <div><strong>${esc(p.name)}</strong><div class="muted small">${esc(p.pack)} · ordered ${times} times</div></div>
            <div class="usual-side">${money(price(p))}
              <button class="btn small" data-add="${p.sku}" data-qty="${p.minQty}" ${p.stock === 0 ? "disabled" : ""}>Add</button></div>
          </div>`;
        }).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Catalogue</h2>
        <div class="filters">
          <input id="search" type="search" placeholder="Search by name or code" value="${esc(ui.query)}" aria-label="Search products">
          <select id="category" aria-label="Category">
            ${["All", ...CATEGORIES].map((c) => `<option ${c === ui.category ? "selected" : ""}>${esc(c)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Product</th><th>Pack</th><th>Stock</th><th class="num">Your price</th><th class="num">Qty</th><th></th></tr></thead>
        <tbody>
          ${list.map((p) => `<tr>
            <td><strong>${esc(p.name)}</strong><div class="muted small">${p.sku}</div></td>
            <td>${esc(p.pack)}</td>
            <td>${stockLabel(p)}</td>
            <td class="num">${money(price(p))}<div class="muted small strike">${money(p.listPrice)}</div></td>
            <td class="num"><input class="qty" type="number" min="${p.minQty}" value="${p.minQty}" data-qty-for="${p.sku}" aria-label="Quantity for ${esc(p.name)}" ${p.stock === 0 ? "disabled" : ""}></td>
            <td class="num"><button class="btn small" data-add="${p.sku}" ${p.stock === 0 ? "disabled" : ""}>Add</button></td>
          </tr>`).join("") || `<tr><td colspan="6" class="empty">No products match. Try a shorter search.</td></tr>`}
        </tbody>
      </table></div>
    </section>`;
}


function card(p) {
  return `<article class="card">
    <a class="card-img" href="#/product/${p.sku}" aria-label="${esc(p.name)}">${productImage(p)}</a>
    <div class="card-body">
      <a class="card-title" href="#/product/${p.sku}">${esc(p.name)}</a>
      <div class="muted small">${esc(p.pack)}</div>
      <div class="card-foot">
        <div><strong>${money(price(p))}</strong> <span class="muted small strike">${money(p.listPrice)}</span><div>${stockLabel(p)}</div></div>
        <button class="btn small primary" data-add="${p.sku}" data-qty="${p.minQty}" ${p.stock === 0 ? "disabled" : ""}>Add</button>
      </div>
    </div>
  </article>`;
}

function viewHome() {
  const mine = usuals(state.orders, 4).map(({ sku }) => product(sku));
  const last = state.orders[0];
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Trade account · ${esc(CUSTOMER.name)}</p>
        <h1>Everything your café needs, delivered ${CUSTOMER.deliveryDays.length} days a week.</h1>
        <p class="muted">Your contract prices, live stock and order by 2pm for next-day delivery.</p>
        <div class="row"><a class="btn primary" href="#/shop">Shop all products</a>
          ${last ? `<button class="btn" data-reorder="${last.id}">Reorder last order (${last.id})</button>` : ""}</div>
      </div>
      <div class="hero-img">${productImage(product("CT-101"))}</div>
    </section>

    <section>
      <div class="section-head"><h2>Shop by category</h2></div>
      <div class="cats">
        ${CATEGORIES.map((c) => `<a class="cat" href="#/shop" data-cat="${esc(c)}">${categoryImage(c, PRODUCTS)}<span>${esc(c)}</span></a>`).join("")}
      </div>
    </section>

    <section>
      <div class="section-head"><h2>Your usuals</h2><a href="#/shop">See everything</a></div>
      <div class="grid">${mine.map(card).join("")}</div>
    </section>`;
}

function viewShop() {
  const q = ui.query.toLowerCase();
  const list = PRODUCTS.filter((p) =>
    (ui.category === "All" || p.category === ui.category) &&
    (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
  return `
    <div class="shop">
      <aside class="filters-side">
        <h2>Categories</h2>
        ${["All", ...CATEGORIES].map((c) => `<button class="cat-link ${c === ui.category ? "on" : ""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("")}
      </aside>
      <section>
        <div class="section-head">
          <h2>${ui.category === "All" ? "All products" : esc(ui.category)} <span class="muted small">${list.length} items</span></h2>
          <input id="search" type="search" placeholder="Search by name or code" value="${esc(ui.query)}" aria-label="Search products">
        </div>
        <div class="grid">${list.map(card).join("") || `<p class="muted">No products match. Try a shorter search.</p>`}</div>
      </section>
    </div>`;
}

function viewProduct(sku) {
  const p = product(sku);
  if (!p) return `<section class="panel empty-state"><h2>Product not found</h2><a class="btn" href="#/shop">Back to the shop</a></section>`;
  const related = PRODUCTS.filter((x) => x.category === p.category && x.sku !== p.sku).slice(0, 4);
  const saving = p.listPrice - price(p);
  return `
    <p class="crumbs"><a href="#/shop">Shop</a> / <button class="link" data-filter="${esc(p.category)}">${esc(p.category)}</button> / ${esc(p.name)}</p>
    <section class="pdp">
      <div class="pdp-img">${productImage(p)}</div>
      <div class="pdp-info">
        <h1>${esc(p.name)}</h1>
        <p class="muted">${esc(p.pack)} · Code ${p.sku}</p>
        <p class="pdp-price">${money(price(p))} <span class="muted small">per pack, ${p.vat ? "plus VAT" : "zero-rated VAT"}</span></p>
        <p class="small">Your band ${CUSTOMER.priceBand} price saves ${money(saving)} on the list price of ${money(p.listPrice)}.</p>
        <p>${stockLabel(p)}${p.minQty > 1 ? ` <span class="muted small">· Minimum order ${p.minQty} packs</span>` : ""}</p>
        <div class="row">
          <input class="qty" type="number" min="${p.minQty}" value="${p.minQty}" data-qty-for="${p.sku}" aria-label="Quantity" ${p.stock === 0 ? "disabled" : ""}>
          <button class="btn primary" data-add="${p.sku}" ${p.stock === 0 ? "disabled" : ""}>Add to basket</button>
        </div>
        <ul class="perks small muted"><li>Order by 2pm for the next delivery day</li><li>Delivered to either of your sites</li><li>Pay on account, ${money(CUSTOMER.creditLimit - CUSTOMER.creditUsed)} credit available</li></ul>
      </div>
    </section>
    ${related.length ? `<section><div class="section-head"><h2>More in ${esc(p.category)}</h2></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
}

function viewIntake() {
  const r = ui.intake;
  const reviewed = r ? reviewSuggestions(r, PRODUCTS) : [];
  const okLines = reviewed.filter((l) => l.ok);
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-head"><h2>Order from an email</h2><span class="muted">For the sales team</span></div>
        <p class="muted small">Paste an order a customer sent by email. AI suggests the order lines, the system checks them against the catalogue and stock, and you approve them before anything is ordered.</p>
        <textarea id="email" rows="11" aria-label="Customer email">${esc(ui.email)}</textarea>
        <div class="row">
          <button class="btn primary" data-action="read" ${ui.reading ? "disabled" : ""}>${ui.reading ? "Reading…" : "Read email"}</button>
          ${SAMPLE_EMAILS.map((_, i) => `<button class="link" data-sample="${i}">Sample ${i + 1}</button>`).join("")}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Suggested order</h2>${r ? `<span class="muted small">Read by ${esc(r.source)}</span>` : ""}</div>
        ${!r ? `<p class="muted">Suggestions appear here. Nothing is added until you approve it.</p>` : `
          ${r.wantsUsual ? `<div class="callout">The customer asked for their usual. <button class="link" data-action="add-usual">Add their last order</button></div>` : ""}
          <table class="table">
            <thead><tr><th>From the email</th><th>Matched product</th><th class="num">Qty</th><th>Check</th></tr></thead>
            <tbody>
              ${reviewed.map((l) => `<tr class="${l.ok ? "" : "has-issue"}">
                <td class="muted">“${esc(l.note)}”</td>
                <td>${product(l.sku) ? esc(product(l.sku).name) : `<em>${esc(l.sku)}</em>`}</td>
                <td class="num">${l.qty}</td>
                <td>${l.ok ? `<span class="stock">OK</span>` : l.issues.map((i) => `<div class="issue">${esc(i)}</div>`).join("")}</td>
              </tr>`).join("") || `<tr><td colspan="4" class="empty">No products recognised.</td></tr>`}
              ${r.unmatched.map((u) => `<tr class="has-issue"><td class="muted">“${esc(u)}”</td><td colspan="3"><div class="issue">No match in the catalogue. Check with the customer.</div></td></tr>`).join("")}
            </tbody>
          </table>
          ${r.po ? `<p class="small">Purchase order found: <strong>${esc(r.po)}</strong></p>` : ""}
          <button class="btn primary" data-action="approve" ${okLines.length ? "" : "disabled"}>Approve ${okLines.length} line${okLines.length === 1 ? "" : "s"} into the basket</button>
          <p class="muted small">Lines that failed a check are left out for a person to sort.</p>`}
      </section>
    </div>`;
}

function viewBasket() {
  if (state.basket.length === 0) {
    return `<section class="panel empty-state"><h2>Your basket is empty</h2>
      <p class="muted">Reorder a past order in one click, or add your usuals from the catalogue.</p>
      <a class="btn" href="#/orders">See past orders</a></section>`;
  }
  const totals = basketTotals(state.basket, PRODUCTS, CUSTOMER.priceBand, BAND_DISCOUNT);
  const dates = deliveryOptions(new Date(), CUSTOMER.deliveryDays);
  const delivery = dates.includes(state.delivery) ? state.delivery : "";
  const problems = checkoutProblems({
    lines: state.basket, products: PRODUCTS, po: state.po, deliveryDate: delivery,
    gross: totals.gross, creditLimit: CUSTOMER.creditLimit, creditUsed: CUSTOMER.creditUsed,
  });

  return `
    <div class="split">
      <section class="panel">
        <div class="panel-head"><h2>Basket</h2><button class="link" data-action="clear">Empty basket</button></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Product</th><th class="num">Price</th><th class="num">Qty</th><th class="num">Line total</th><th></th></tr></thead>
          <tbody>
            ${state.basket.map((l) => {
              const p = product(l.sku);
              const issues = lineProblems(p, l.qty);
              return `<tr class="${issues.length ? "has-issue" : ""}">
                <td><strong>${esc(p.name)}</strong><div class="muted small">${p.sku} · ${esc(p.pack)}</div>
                  ${issues.map((i) => `<div class="issue">${esc(i)}</div>`).join("")}</td>
                <td class="num">${money(price(p))}</td>
                <td class="num"><input class="qty" type="number" min="1" value="${l.qty}" data-line="${p.sku}" aria-label="Quantity for ${esc(p.name)}"></td>
                <td class="num">${money(price(p) * l.qty)}</td>
                <td class="num"><button class="link" data-remove="${p.sku}">Remove</button></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table></div>
      </section>

      <aside class="panel checkout">
        <h2>Order details</h2>
        <label>Deliver to
          <select id="site">${CUSTOMER.sites.map((s, i) => `<option value="${i}" ${i === state.site ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
        </label>
        <label>Delivery date
          <select id="delivery"><option value="">Choose a date</option>
            ${dates.map((d) => `<option value="${d}" ${d === delivery ? "selected" : ""}>${fmtDate(d)}</option>`).join("")}
          </select>
          <span class="hint">Order by 2pm for the next delivery day.</span>
        </label>
        <label>Purchase order number
          <input id="po" type="text" value="${esc(state.po)}" placeholder="e.g. NG-0940">
        </label>
        <dl class="totals">
          <div><dt>Net</dt><dd>${money(totals.net)}</dd></div>
          <div><dt>VAT</dt><dd>${money(totals.vat)}</dd></div>
          <div class="grand"><dt>Total</dt><dd>${money(totals.gross)}</dd></div>
        </dl>
        <p class="muted small">Credit available: ${money(CUSTOMER.creditLimit - CUSTOMER.creditUsed)}</p>
        ${problems.length ? `<ul class="problems">${problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        <button class="btn primary block" data-action="place" ${problems.length ? "disabled" : ""}>Place order</button>
      </aside>
    </div>`;
}

const ERP_LABEL = { synced: "Sent to ERP", pending: "Sending to ERP", retrying: "Retrying", failed: "Needs attention" };

function viewOrders() {
  return `
    <section class="panel">
      <div class="panel-head"><h2>Orders</h2><span class="muted">Reorder anything in one click. Stock and prices are checked again.</span></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Order</th><th>Date</th><th>PO</th><th>Received by</th><th>Status</th><th class="num">Total</th><th></th></tr></thead>
        <tbody>
          ${state.orders.map((o) => {
            const t = basketTotals(o.lines, PRODUCTS, CUSTOMER.priceBand, BAND_DISCOUNT);
            const open = ui.openOrder === o.id;
            return `<tr>
              <td><button class="link" data-open="${o.id}" aria-expanded="${open}">${o.id}</button></td>
              <td>${fmtDate(o.date)}</td>
              <td>${esc(o.po)}</td>
              <td class="cap">${esc(o.channel)}</td>
              <td>${esc(o.status)}<div class="erp ${o.erp}">${ERP_LABEL[o.erp]}</div></td>
              <td class="num">${money(t.gross)}</td>
              <td class="num nowrap"><button class="btn small" data-reorder="${o.id}">Reorder</button>
                ${o.erp === "failed" ? `<button class="btn small" data-retry="${o.id}">Retry</button>` : ""}</td>
            </tr>
            ${open ? `<tr class="detail"><td colspan="7">${o.lines.map((l) => `${l.qty} x ${esc(product(l.sku).name)}`).join(" · ")}</td></tr>` : ""}`;
          }).join("")}
        </tbody>
      </table></div>
    </section>`;
}

function viewInsight() {
  const share = digitalShare(CHANNEL_MIX);
  const total = Object.values(CHANNEL_MIX).reduce((a, b) => a + b, 0);
  const pct = (n) => Math.round((n / total) * 100);

  return `
    <div class="stats">
      <div class="stat"><span class="muted small">Orders through the portal</span><strong>${Math.round(share * 100)}%</strong>
        <div class="meter" role="meter" aria-label="Portal share" aria-valuenow="${Math.round(share * 100)}" aria-valuemin="0" aria-valuemax="100">
          <span style="width:${share * 100}%"></span><i style="left:${DIGITAL_TARGET * 100}%"></i></div>
        <span class="muted small">Target ${DIGITAL_TARGET * 100}% by 2027</span></div>
      <div class="stat"><span class="muted small">Orders keyed in by hand</span><strong>${total - CHANNEL_MIX.portal}</strong>
        <span class="muted small">this month, from email, phone and reps</span></div>
      <div class="stat"><span class="muted small">Gap to target</span><strong>${Math.max(0, Math.ceil(total * DIGITAL_TARGET - CHANNEL_MIX.portal))}</strong>
        <span class="muted small">more portal orders a month</span></div>
    </div>

    <div class="split">
      <section class="panel">
        <div class="panel-head"><h2>How orders arrive</h2><span class="muted">All customers, this month</span></div>
        ${Object.entries(CHANNEL_MIX).map(([k, v]) => `
          <div class="bar-row"><span class="cap">${k}</span>
            <div class="bar"><span style="width:${pct(v)}%" class="${k === "portal" ? "on" : ""}"></span></div>
            <span class="num">${v} <span class="muted">(${pct(v)}%)</span></span></div>`).join("")}
        <p class="muted small">Email orders can go through <a href="#/intake">email intake</a> instead of being keyed in by hand.</p>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>ERP sync</h2>
          <label class="toggle"><input type="checkbox" id="erp-down" ${state.erpDown ? "checked" : ""}> Simulate ERP outage</label></div>
        <p class="muted small">Every order is sent to the ERP. Failures retry ${MAX_ERP_ATTEMPTS} times with a growing delay, then wait for a person.</p>
        <ol class="log">
          ${state.erpLog.slice(-8).reverse().map((e) => `<li class="${e.level}"><time>${e.time}</time> ${esc(e.msg)}</li>`).join("")
            || `<li class="muted">No activity yet. Place an order to see it sync.</li>`}
        </ol>
      </section>
    </div>`;
}

// ---------- Mock ERP sync with retries ----------

function log(level, msg) {
  const time = new Date().toLocaleTimeString("en-GB");
  state.erpLog = [...state.erpLog, { level, msg, time }].slice(-50);
}

function updateOrder(id, patch) {
  state.orders = state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
}

function syncToErp(id, attempt = 0) {
  setTimeout(() => {
    if (state.erpDown) {
      if (attempt + 1 >= MAX_ERP_ATTEMPTS) {
        updateOrder(id, { erp: "failed" });
        log("error", `${id}: ERP did not respond after ${MAX_ERP_ATTEMPTS} attempts. Flagged for the sales team.`);
      } else {
        updateOrder(id, { erp: "retrying" });
        log("warn", `${id}: ERP timed out (attempt ${attempt + 1}). Retrying in ${retryDelayMs(attempt + 1) / 1000}s.`);
        syncToErp(id, attempt + 1);
      }
    } else {
      updateOrder(id, { erp: "synced", status: "Confirmed" });
      log("ok", `${id}: accepted by ERP${attempt ? ` after ${attempt + 1} attempts` : ""}.`);
    }
    save();
    render();
  }, attempt === 0 ? 1200 : retryDelayMs(attempt));
}

function nextOrderId() {
  const max = Math.max(...state.orders.map((o) => Number(o.id.slice(3))));
  return "SO-" + (max + 1);
}

function placeOrder() {
  const id = nextOrderId();
  const order = {
    id, date: localIso(new Date()), po: state.po.trim(), site: state.site,
    channel: state.fromEmail ? "email intake" : "portal", status: "Received", erp: "pending",
    lines: state.basket.map((l) => ({ ...l })),
  };
  state.orders = [order, ...state.orders];
  log("info", `${id}: order placed, sending to ERP.`);
  set({ basket: [], po: "", delivery: "", fromEmail: false });
  location.hash = "#/orders";
  toast(`Order ${id} placed. We'll confirm it shortly.`);
  syncToErp(id);
}

async function readEmail() {
  ui.reading = true;
  render();
  ui.intake = await parseEmail(ui.email, PRODUCTS);
  ui.reading = false;
  render();
}

// ---------- Render and events ----------

const ROUTES = { home: viewHome, shop: viewShop, product: viewProduct, catalogue: viewCatalogue, intake: viewIntake, basket: viewBasket, orders: viewOrders, insight: viewInsight };

function render() {
  const [route, arg] = (location.hash.replace("#/", "") || "home").split("/");
  const view = ROUTES[route] ?? viewHome;
  const key = route + (arg ?? "");
  if (key !== render.last) window.scrollTo(0, 0);
  render.last = key;
  const active = document.activeElement;
  const focusId = active?.id;
  const caret = active?.selectionStart;
  $("#view").innerHTML = view(arg);
  document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#/" + (route === "product" ? "shop" : route)));
  $("#basket-count").textContent = basketCount();
  const el = focusId && document.getElementById(focusId);
  if (el) {
    el.focus();
    if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch { /* not a text input */ }
  }
}

document.addEventListener("click", (e) => {
  const cat = e.target.closest("[data-cat]");
  if (cat) { ui.category = cat.dataset.cat; ui.query = ""; }
  const t = e.target.closest("button");
  if (!t) return;
  const d = t.dataset;
  if (d.filter) { ui.category = d.filter; if (location.hash !== "#/shop") location.hash = "#/shop"; else render(); return; }
  if (d.add) {
    const input = document.querySelector(`[data-qty-for="${d.add}"]`);
    addToBasket(d.add, Number(d.qty ?? input?.value ?? 1));
  } else if (d.remove) {
    set({ basket: state.basket.filter((l) => l.sku !== d.remove) });
  } else if (d.reorder) {
    const o = state.orders.find((x) => x.id === d.reorder);
    set({ basket: mergeLines(state.basket, o.lines) });
    location.hash = "#/basket";
    toast(`Added ${o.lines.length} lines from ${o.id}. Check stock before you place it.`);
  } else if (d.retry) {
    updateOrder(d.retry, { erp: "pending" });
    log("info", `${d.retry}: retry requested by a person.`);
    save(); render();
    syncToErp(d.retry);
  } else if (d.open) {
    ui.openOrder = ui.openOrder === d.open ? null : d.open;
    render();
  } else if (d.sample) {
    ui.email = SAMPLE_EMAILS[Number(d.sample)];
    ui.intake = null;
    render();
  } else if (d.action === "read") {
    readEmail();
  } else if (d.action === "add-usual") {
    set({ basket: mergeLines(state.basket, state.orders[0].lines) });
    toast(`Added their last order (${state.orders[0].id}).`);
  } else if (d.action === "approve") {
    const ok = reviewSuggestions(ui.intake, PRODUCTS).filter((l) => l.ok).map(({ sku, qty }) => ({ sku, qty }));
    set({ basket: mergeLines(state.basket, ok), po: ui.intake.po || state.po, fromEmail: true });
    ui.intake = null;
    location.hash = "#/basket";
    toast(`Added ${ok.length} approved lines. Check the details and place the order.`);
  } else if (d.action === "clear") {
    set({ basket: [] });
  } else if (d.action === "place") {
    placeOrder();
  } else if (d.action === "reset") {
    state = fresh(); save(); location.hash = "#/home"; render();
    toast("Demo data reset.");
  }
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "search") { ui.query = t.value; render(); }
  else if (t.id === "po") { state.po = t.value; save(); render(); }
  else if (t.id === "email") { ui.email = t.value; }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "category") { ui.category = t.value; render(); }
  else if (t.id === "site") set({ site: Number(t.value) });
  else if (t.id === "delivery") set({ delivery: t.value });
  else if (t.id === "erp-down") set({ erpDown: t.checked });
  else if (t.dataset.line) {
    const qty = Math.max(0, Math.floor(Number(t.value) || 0));
    set({ basket: qty === 0 ? state.basket.filter((l) => l.sku !== t.dataset.line)
      : state.basket.map((l) => (l.sku === t.dataset.line ? { ...l, qty } : l)) });
  }
});

window.addEventListener("hashchange", render);

$("#account").textContent = `${CUSTOMER.name} · ${CUSTOMER.account}`;
render();
// Resume any syncs that were in flight when the page was closed.
state.orders.filter((o) => o.erp === "pending" || o.erp === "retrying").forEach((o) => syncToErp(o.id));
