Small Pro ERP Demo - Updated Package

How to run immediately
1) Double click Open Demo.bat
or
2) Open terminal in this folder and run:
   npm run dev

Default demo accounts
- admin@nileagency.com / 123456
- sales@nileagency.com / 123456
- inventory@nileagency.com / 123456
- manager@nileagency.com / 123456

What was enhanced in this package
- Inventory module:
  - add / update product with description, category, supplier, prices, min stock, unit
  - search by code, id, category, supplier id, supplier name, or any text
  - low-stock panel opens product details
  - category modal (get all categories)
  - delete protection when product is linked anywhere else
  - adjust stock with reason + notes + reference number
  - full inventory movement explorer with type/date-range filters

- Suppliers:
  - details include supplier id, created at, product count, order count
  - search by id or any text
  - delete protection when linked by foreign key style references
  - linked products and linked purchase orders in supplier details

- Purchase Orders:
  - richer draft form with notes and multiple items
  - full details popup with item + product info
  - get pending filter (Sent and not Received)
  - update/delete only for Draft
  - send / receive with notifications and receive notes
  - supplier document preview for Draft purchase orders

- Authentication:
  - sign in with email or username
  - register tenant flow (company + admin)
  - register user flow from Users page (admin only)

Notes
- This package is a polished frontend demo built with React + Vite + localStorage.
- It simulates the documented ERP flows inside the UI without a backend server.
