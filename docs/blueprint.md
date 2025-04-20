# **App Name**: DoortoDoor POS

## Core Features:

- Excel Import: Upload product data from ".xlsx" files. The parser auto-detects and maps key columns: Code, Name, and Price. Uses fallback logic to intelligently auto-map headers even if columns are mislabeled or out of order.
- Cart System: Add products to an active cart. Adjust quantities using plus/minus buttons. Include per-order notes/comments. Ability to clear/reset the cart at any time.
- WhatsApp Export: Compose a structured message including: Seller and buyer names, Line-item list of products, Total price, Auto-generated Gist link to the JSON invoice. Export and open using `wa.me` for instant WhatsApp sending
- Seller Login: Secure seller authentication using Firebase Auth. Supports email/password login. Saves session state. Tracks orders by seller ID for historical data.
- Buyer Selector: Dropdown list or searchable input for selecting a buyer. Buyer information is attached to each order. Enables order history per customer.
- AI Product Suggestions: AI-assisted suggestions for product names and descriptions. Uses product code and Excel data to infer enhancements. Incorporates AI only when additional attributes can provide meaningful improvement (e.g., category, brand, size).

## Style Guidelines:

- Primary Color: #000000 (Black) — for a sleek, minimal interface
- Secondary Color: #B22222 (Brick Orange) — to highlight primary actions
- Accent Color: #D3D3D3 (Light Gray) — for subtle contrasts and clarity
- Icons: Use a consistent modern icon set with Brick Orange as the accent color
- Layout: Clean, mobile-first design optimized for readability and fast data entry

## Original User Request:
📦 Product Import from Excel

Upload .xlsx files

Parse specific columns (A: Code, B: Name, H: Price)

Auto-map fields with fallback logic

Display import summary

🛒 Cart System

Add/search products

Quantity adjustment with buttons

Per-order notes/comments

Clear/reset cart functionality

📤 Order Export via WhatsApp

Compose message with:

Seller name

Buyer name

List of items

Total price

Invoice/downloadable link (e.g. PDF or Gist JSON)

Send using https://wa.me/?text=...

🔐 Seller Login

Firebase Auth (email/password or phone)

Save seller sessions

Track orders by seller ID

👤 Buyer Selector

Dropdown list or search field

Attach buyer info to each order

🛠️ Advanced POS Features to Add
🧾 Invoice Generation

PDF invoice creation (browser or server-side)

Upload to cloud (e.g., Firebase, S3, or Gist)

Shareable link in WhatsApp/email/SMS

📡 Offline Support + Sync

Store cart/products in localStorage or IndexedDB

Auto-sync when back online

📊 Sales Dashboard

Daily/weekly order count

Revenue tracking per seller

Top selling products

📥 Product Catalog Management

Optional admin panel

Edit product prices or names

Add categories

and also add some several features that you think is nessesary or that it needs in the app
also i want it have a very good frontend with icons and black and brick orange colors as the main theme
  