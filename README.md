# Trade Reorder Portal

**A B2B ordering portal for a wholesale distributor: customers reorder in a few clicks, and emailed orders are turned into checked order lines with AI instead of being keyed in by hand.**

<p align="center">JavaScript · Node · Claude API · prototype · MIT · <a href="https://latczar.github.io/trade-reorder-portal/">Live demo</a></p>

<p align="center">
  <img src="docs/screenshots/01-home.png" width="49%" alt="Home: the customer's trade account, categories and their usual products">
  <img src="docs/screenshots/03-product.png" width="49%" alt="Product page: contract price, saving, stock, minimum order and delivery details">
  <img src="docs/screenshots/02-shop.png" width="49%" alt="Shop: all products with category filters and search">
  <img src="docs/screenshots/02-email-intake.jpg" width="49%" alt="Email intake: an order email turned into suggested lines, with an out-of-stock line flagged">
</p>
<p align="center">
  <img src="docs/screenshots/04-mobile-home.jpg" width="24%" alt="Mobile home: restock suggestions, basket bar and bottom tabs">
  <img src="docs/screenshots/05-mobile-shop.jpg" width="24%" alt="Mobile shop: two-column product grid with quantity steppers">
</p>

## Why it exists

Many distributors still take most orders by email and phone, then key them into the ERP by hand. That is slow, error-prone and hard to grow. The goal here is the one a lot of these businesses set themselves: move most ordering online, and make the orders that still arrive by email cheap to handle.

All data is made up. Nothing is ordered or sent anywhere.

## What it does

- **A proper shop front.** Home page, category browsing, search, product pages with the customer's own price and saving, and related products.
- **Smart restock.** Learns how often the customer orders each product and suggests what is likely running low, with one tap to add it all.
- **Type your order.** Customers can type an order the way they'd text their rep ("2 espresso beans, 4 12oz cups") and the shop finds the products.
- **Built for phones.** Bottom tab bar, a basket bar that follows you, quantity steppers, swipeable categories, and tables that turn into cards. Remove and empty-basket actions can be undone.
- **Reorder in a few clicks.** Each customer sees their usual products, their own contract prices and live stock. Any past order can be added to the basket in one click.
- **Checks before it accepts.** Minimum quantities, stock, delivery days and the 2pm cut-off, purchase order numbers and credit limits are all checked, with a plain explanation for anything that blocks an order.
- **Email intake with AI.** The sales team pastes an order email. Claude suggests the order lines, the code checks every suggestion against the catalogue and stock, and a person approves them. Items the model couldn't match, or lines that fail a check, are left out for a person to sort.
- **Reliable ERP sync.** Every order is sent to a mock ERP. If it fails, it retries with a growing delay, then flags the order for a person. You can switch on an outage to watch it happen.
- **Tracks the goal.** The insight page shows how orders arrive (portal, email, phone, rep) against a 90% online target.

## How the AI is kept in check

The model reads the email; it doesn't decide anything.

1. Claude returns structured output (SKU, quantity, the words it came from) validated against a schema.
2. Every suggested line is checked by the same rules as a normal order. Unknown SKUs are rejected.
3. A person approves the lines before they reach the basket, and the order still goes through normal checkout.

The API key stays on the server (`api/parse-order.js`). On a static host with no API, a simple keyword matcher stands in so the demo still works; the page shows which one read the email.

## Run it locally

```bash
npm install
npm test
npm start
```

Then open http://localhost:5173. To use Claude for email intake, deploy to Vercel with `ANTHROPIC_API_KEY` set.

## Project layout

| Path | What it is |
| --- | --- |
| `src/logic.js` | Business rules: pricing, stock and checkout checks, delivery dates. No DOM, fully unit tested |
| `src/intake.js` | Email intake: calls the API, falls back to the keyword matcher, checks suggestions |
| `src/app.js` | The screens and the mock ERP sync |
| `src/images.js` | Drawn product images, so the demo needs no photo licences |
| `api/parse-order.js` | Serverless function that calls Claude with structured output |
| `tests/` | Unit tests for the rules and the intake checks |

## What a production version would add

Real sign-in per customer and site, the ERP's own API instead of the mock, a proper queue for sync, audit logs on approvals, and monitoring with alerts when syncs fail.
