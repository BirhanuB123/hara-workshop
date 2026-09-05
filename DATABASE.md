# Database Schema Documentation — Hara Workshop

The relational database enforces data integrity with foreign keys, cascading rules, unique constraints, and indexes.

## Primary Entities
- **users (accounts_user):** Custom user model with email, role, phone_number (+251 format), is_active, created_at.
- **customer_profiles (accounts_customerprofile):** Linked 1:1 to User; contains address, city, company_name, tin_number.
- **employee_profiles (accounts_employeeprofile):** Linked 1:1 to User; contains department, job_title, hire_date, skills.
- **categories & products (products_category, products_product, products_productimage):** Catalog items with SKU, dimensions, starting price (ETB), customizable flags.
- **services (services_servicecategory, services_service):** Workshop services categorized under Metal, Wood, and Custom Solutions.
- **projects (projects_project, projects_projectimage):** Portfolio with before/after images and material tagging.
- **quotes (quotations_quote, quotations_quoteitem, quotations_quoteattachment):** Custom requests with dimensions, cost breakdown (materials, labor, transport, installation, discount, total), and lifecycle statuses.
- **orders (orders_order, orders_orderitem):** Converted orders with sequential code HW-YYYY-XXXX, total, shipping, and delivery state.
- **production (production_productionjob, production_productiontask):** 10-stage workflow (ORDER_CONFIRMED to COMPLETED), progress % (0-100), supervisor and worker assignment.
- **inventory (inventory_material, inventory_inventorytransaction):** Stock items, minimum reorder thresholds, transaction ledger (Purchase, Consumption, Adjustment, Return, Waste).
- **suppliers (suppliers_supplier):** Vendor directory with materials supplied.
- **payments & invoices (payments_payment, invoices_invoice):** Financial settlements in ETB, invoices with tax and discounts, payments via Telebirr, CBE, cash, or wire transfer.
- **expenses (expenses_expense):** Workshop overhead, salaries, machinery maintenance, and procurement.
- **messaging & notifications (messaging_conversation, messaging_message, notifications_notification):** Communications and alerts.
- **audit_logs (core_auditlog):** Administrative and system change logs.
