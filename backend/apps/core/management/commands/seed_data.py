from django.core.management.base import BaseCommand
from django.utils.text import slugify
from decimal import Decimal
from datetime import date, timedelta
from apps.accounts.models import User, UserRole, CustomerProfile, EmployeeProfile
from apps.core.models import WorkshopSettings, AuditLog
from apps.products.models import Category, Product, ProductImage
from apps.services.models import ServiceCategory, Service
from apps.projects.models import Project, ProjectImage
from apps.suppliers.models import Supplier
from apps.inventory.models import Material, MaterialCategory, MaterialUnit, InventoryTransaction
from apps.quotations.models import Quote, QuoteStatus, QuoteItem
from apps.orders.models import Order, OrderStatus, OrderItem
from apps.production.models import ProductionJob, ProductionStage, ProductionTask
from apps.invoices.models import Invoice, InvoiceStatus
from apps.payments.models import Payment, PaymentMethod, PaymentStatus
from apps.expenses.models import Expense, ExpenseCategory
from apps.messaging.models import Conversation, Message
from apps.notifications.models import Notification, NotificationType

class Command(BaseCommand):
    help = 'Seeds database with realistic initial data for Hara Workshop'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding Hara Workshop initial data...'))

        # 1. Workshop Settings
        settings, _ = WorkshopSettings.objects.get_or_create(
            id='00000000-0000-0000-0000-000000000001',
            defaults={
                'name': 'Hara Workshop',
                'tagline': 'Metal and Wood Solution',
                'phone': '+251926629999',
                'email': 'info@haraworkshop.com',
                'telegram': '@haraworkshop',
                'address': 'Addis Ababa, Bole Arabsa, Water Tanker',
                'address_amharic': 'አዲስ አበባ ቦሌ አራብሳ ውሃ ታንከር',
                'working_hours': 'Mon - Sat: 8:00 AM - 6:00 PM',
                'currency': 'ETB',
                'vat_percentage': Decimal('15.00'),
                'quote_validity_days': 15,
            }
        )

        # 2. Users & Roles
        users_data = [
            ('admin@haraworkshop.com', 'Admin@123456', 'Dawit', 'Haile', '+251911000001', UserRole.SUPER_ADMIN, True),
            ('manager@haraworkshop.com', 'Manager@123456', 'Kidus', 'Tadesse', '+251911000002', UserRole.MANAGER, True),
            ('sales@haraworkshop.com', 'Sales@123456', 'Bethlehem', 'Alemu', '+251911000003', UserRole.SALES, True),
            ('production@haraworkshop.com', 'Production@123456', 'Yohannes', 'Bekele', '+251911000004', UserRole.PRODUCTION, True),
            ('accountant@haraworkshop.com', 'Accountant@123456', 'Selamawit', 'Girma', '+251911000005', UserRole.ACCOUNTANT, True),
            ('customer@haraworkshop.com', 'Customer@123456', 'Abebe', 'Kebede', '+251922334455', UserRole.CUSTOMER, False),
            ('sara@gmail.com', 'Customer@123456', 'Sara', 'Hailu', '+251933445566', UserRole.CUSTOMER, False),
        ]

        created_users = {}
        for email, pwd, first, last, phone, role, is_staff in users_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'phone_number': phone,
                    'role': role,
                    'is_staff': is_staff,
                    'is_superuser': (role == UserRole.SUPER_ADMIN),
                }
            )
            if created or not user.check_password(pwd):
                user.set_password(pwd)
                user.save()

            if role == UserRole.CUSTOMER:
                CustomerProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'address': 'Bole Sub-city, Woreda 03, Addis Ababa',
                        'city': 'Addis Ababa',
                        'company_name': 'Kebede Real Estate' if email == 'customer@haraworkshop.com' else 'Sara Home Design',
                        'tin_number': '0049283719' if email == 'customer@haraworkshop.com' else '0058291034',
                    }
                )
            else:
                EmployeeProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'department': 'Management' if role in [UserRole.SUPER_ADMIN, UserRole.MANAGER] else ('Sales' if role == UserRole.SALES else ('Workshop' if role == UserRole.PRODUCTION else 'Finance')),
                        'job_title': role.replace('_', ' ').title(),
                        'skills': 'Welding, Joinery, Cost Estimation, CNC' if role == UserRole.PRODUCTION else 'Customer relations, Project Management',
                        'hire_date': date(2023, 1, 15)
                    }
                )
            created_users[email] = user

        # 3. Product Categories
        categories_data = [
            ('Doors', 'Custom steel, security, and wooden interior/exterior doors.'),
            ('Windows', 'Acoustic, burglar-proof, and modern sliding windows.'),
            ('Furniture', 'Premium wooden, metal-framed tables, desks, and shelving.'),
            ('Gates', 'Heavy-duty laser cut, sliding, and swing perimeter gates.'),
            ('Railings', 'Balcony, staircase, and terrace safety railings in metal & wood.'),
            ('Cabinets', 'Custom kitchen, wardrobe, and office storage cabinets.'),
            ('Custom Solutions', 'Architectural combined wood-and-metal solutions.'),
        ]

        cat_objs = {}
        for name, desc in categories_data:
            cat, _ = Category.objects.get_or_create(
                slug=slugify(name),
                defaults={'name': name, 'description': desc}
            )
            cat_objs[name] = cat

        # 4. Products
        products_data = [
            (
                'Modern Laser-Cut Security Door',
                'HW-DR-001',
                'Doors',
                'Heavy-gauge galvanized steel frame with laser-cut geometric patterns, multi-point lock system, and weather-resistant powder coating.',
                'Galvanized Steel & Hardwood Inlay',
                Decimal('210.00'), Decimal('100.00'), Decimal('12.00'),
                Decimal('48000.00'),
                True,
            ),
            (
                'Solid Mahogany Executive Dining Table',
                'HW-TB-001',
                'Furniture',
                'Handcrafted Ethiopian Mahogany (Tikur Inchet) 8-seater dining table with natural oil satin finish and sturdy matte black steel base.',
                'Solid Mahogany & Steel Legs',
                Decimal('240.00'), Decimal('100.00'), Decimal('76.00'),
                Decimal('65000.00'),
                True,
            ),
            (
                'Acoustic Double-Glazed Sliding Window',
                'HW-WN-001',
                'Windows',
                'Thermally broken aluminum frame with 6mm+6mm double acoustic glazing and multi-point lock security latch.',
                'Powder Coated Aluminum & Tempered Glass',
                Decimal('150.00'), Decimal('120.00'), Decimal('8.00'),
                Decimal('28000.00'),
                False,
            ),
            (
                'Laser-Cut Estate Sliding Gate',
                'HW-GT-001',
                'Gates',
                'Engineered heavy sliding gate for villas and compounds. Integrated pedestrian door, motorized track compatibility, anti-corrosion coating.',
                'Structural Steel & Iron Plates',
                Decimal('400.00'), Decimal('220.00'), Decimal('10.00'),
                Decimal('135000.00'),
                True,
            ),
            (
                'Custom Modular Kitchen Cabinet Set',
                'HW-CB-001',
                'Cabinets',
                'High-density moisture-resistant MDF with melamine facing, soft-close German hinges, quartz counter base, and modern linear handles.',
                'HDF/MDF, Steel Pulls & Quartz',
                Decimal('360.00'), Decimal('60.00'), Decimal('90.00'),
                Decimal('95000.00'),
                True,
            ),
            (
                'Wrought Iron & Wood Balcony Railing',
                'HW-RL-001',
                'Railings',
                'Decorative vertical balusters with hardwood top handrail, anchor bolted to concrete floor for maximum safety.',
                'Solid Iron & Treated Eucalyptus/Teak',
                Decimal('100.00'), Decimal('15.00'), Decimal('95.00'),
                Decimal('12000.00'),
                False,
            ),
        ]

        prod_objs = {}
        for name, sku, cat_name, desc, mat, l, w, h, price, feat in products_data:
            prod, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': cat_objs[cat_name],
                    'description': desc,
                    'material': mat,
                    'dimensions_length': l,
                    'dimensions_width': w,
                    'dimensions_height': h,
                    'starting_price': price,
                    'is_featured': feat,
                    'stock_status': Product.StockStatus.MADE_TO_ORDER,
                    'is_customizable': True,
                }
            )
            prod_objs[sku] = prod

        # 5. Service Categories & Services
        svc_cats = [
            ('Metal Works', 'Precision welding, laser cutting, metal gates, doors, and architectural structures.'),
            ('Wood Works', 'Custom cabinetry, hardwood furniture, interior paneling, and architectural woodworking.'),
            ('Hybrid Metal + Wood Construction', 'Architectural fusion combining structural steel frames with artisan woodwork.'),
        ]

        svc_cat_objs = {}
        for name, desc in svc_cats:
            sc, _ = ServiceCategory.objects.get_or_create(
                slug=slugify(name),
                defaults={'name': name, 'description': desc}
            )
            svc_cat_objs[name] = sc

        services_data = [
            (
                'Metal Works', 
                'Metal Works', 
                'Heavy-duty structural steel fabrication, architectural frameworks, precision MIG/TIG welding, security gates, doors, and laser-cut metal solutions.', 
                Decimal('35000.00'),
                'services/metal-works.jpg'
            ),
            (
                'Wood Works', 
                'Wood Works', 
                'Bespoke solid hardwood furniture, architectural cabinetry, executive office desks, and luxury interior timber craftsmanship.', 
                Decimal('45000.00'),
                'services/wood-works.jpg'
            ),
            (
                'Hybrid Metal + Wood Construction', 
                'Hybrid Metal + Wood Construction', 
                'Architectural fusion combining structural matte-black steel frameworks with warm, rich solid hardwood for floating staircases, pergolas, and cafe/office fitouts.', 
                Decimal('95000.00'),
                'services/hybrid-construction.jpg'
            ),
        ]

        for title, cat_name, desc, start_p, img_path in services_data:
            Service.objects.update_or_create(
                slug=slugify(title),
                defaults={
                    'title': title,
                    'category': svc_cat_objs[cat_name],
                    'short_description': desc[:120],
                    'full_description': desc,
                    'starting_price': start_p,
                    'price_unit': 'per project',
                    'turnaround_time': '1-3 weeks',
                    'image': img_path,
                    'is_active': True,
                }
            )

        # 6. Portfolio Projects
        projects_data = [
            (
                'Bole Arabsa Residence Main Compound Gate',
                'METAL',
                'COMMERCIAL',
                'Heavy motorized sliding gate with integrated pedestrian pass door and laser perforated leaf motifs. Weather-shield electrostatic coating applied.',
                'Heavy RHS Steel, Laser Cut Plate 3mm, Industrial Roller Track',
                date(2025, 11, 20),
                True
            ),
            (
                'Kazanchis Corporate Executive Boardroom Table',
                'WOOD',
                'OFFICE',
                '14-seater 4.2 meter conference table crafted from kiln-dried Ethiopian Wanza with integrated wire channels and concealed power banks.',
                'Kiln-Dried Wanza, Cast Iron Legs, Natural Wax Sealant',
                date(2025, 12, 10),
                True
            ),
            (
                'CMC Villa Panoramic Acoustic French Windows',
                'WINDOWS',
                'RESIDENTIAL',
                'Set of 12 soundproof French-style windows with internal security grills, installed for high-altitude wind insulation and urban noise reduction.',
                'Cold-rolled Steel, Double Insulated Laminated Glass',
                date(2026, 1, 18),
                True
            ),
            (
                'Old Airport Luxury Villa Floating Metal & Wood Staircase',
                'CUSTOM',
                'SPECIAL',
                'Custom engineered central steel spine with cantilevered solid oak wood steps and frameless glass balustrade.',
                'Structural H-Beam, Solid Oak Treads, Stainless Standoffs',
                date(2026, 2, 5),
                True
            ),
        ]

        for title, cat, client, desc, mat, cdate, feat in projects_data:
            Project.objects.get_or_create(
                slug=slugify(title),
                defaults={
                    'title': title,
                    'category': cat,
                    'client_type': client,
                    'description': desc,
                    'materials_used': mat,
                    'completion_date': cdate,
                    'is_featured': feat,
                    'is_published': True
                }
            )

        # 7. Suppliers
        suppliers_data = [
            ('Addis Steel Rolling Mill PLC', 'Ato Girma Wolde', '+251911223344', 'sales@addissteel.com', 'Structural RHS tubes, angle irons, sheet metals'),
            ('Oromia Forest & Timber Enterprise', 'Wro Aster Mengistu', '+251911556677', 'aster@timber.et', 'Wanza, Mahogany, Zigba seasoned timber boards'),
            ('Ethiopian Crown Hardware & Fasteners', 'Ato Samuel Bekele', '+251911889900', 'samuel@crownhardware.com', 'Heavy hinges, soft-close drawer slides, lock sets'),
            ('Ethio-Glass & Aluminum Solutions', 'Ato Daniel Kassa', '+251911334455', 'daniel@ethioglass.et', 'Tempered float glass, laminated security glass, aluminum profiles'),
        ]

        supplier_objs = {}
        for name, cp, ph, em, mat in suppliers_data:
            sup, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={'contact_person': cp, 'phone': ph, 'email': em, 'materials_supplied': mat}
            )
            supplier_objs[name] = sup

        # 8. Raw Materials (Inventory)
        materials_data = [
            ('MAT-STL-001', '50x50x2mm RHS Steel Section (6m)', MaterialCategory.STEEL, MaterialUnit.PIECE, Decimal('85.00'), Decimal('20.00'), Decimal('1250.00'), 'Addis Steel Rolling Mill PLC', 'Rack A1'),
            ('MAT-STL-002', 'Cold Rolled Steel Sheet 2mm (1.2x2.4m)', MaterialCategory.STEEL, MaterialUnit.SHEET, Decimal('42.00'), Decimal('15.00'), Decimal('3400.00'), 'Addis Steel Rolling Mill PLC', 'Bay 2'),
            ('MAT-WOD-001', 'Kiln-Dried Wanza Timber Board 2x10 (3m)', MaterialCategory.WOOD, MaterialUnit.PIECE, Decimal('68.00'), Decimal('15.00'), Decimal('2800.00'), 'Oromia Forest & Timber Enterprise', 'Lumber Shed B'),
            ('MAT-WOD-002', 'High Density MDF Board 18mm', MaterialCategory.WOOD, MaterialUnit.SHEET, Decimal('50.00'), Decimal('10.00'), Decimal('4200.00'), 'Oromia Forest & Timber Enterprise', 'Lumber Shed A'),
            ('MAT-GLS-001', '8mm Clear Tempered Glass Panel (1x2m)', MaterialCategory.GLASS, MaterialUnit.SHEET, Decimal('24.00'), Decimal('8.00'), Decimal('3800.00'), 'Ethio-Glass & Aluminum Solutions', 'Glass Rack G1'),
            ('MAT-PNT-001', 'Matte Black Epoxy Primer & Topcoat (4L)', MaterialCategory.PAINT, MaterialUnit.LITER, Decimal('36.00'), Decimal('10.00'), Decimal('1650.00'), 'Ethiopian Crown Hardware & Fasteners', 'Paint Cabinet'),
            ('MAT-HRD-001', 'Heavy Duty Ball-Bearing Gate Hinges (Pair)', MaterialCategory.HARDWARE, MaterialUnit.PIECE, Decimal('54.00'), Decimal('12.00'), Decimal('950.00'), 'Ethiopian Crown Hardware & Fasteners', 'Shelf H3'),
            ('MAT-CON-001', 'E6013 3.2mm Mild Steel Welding Electrodes (5kg)', MaterialCategory.CONSUMABLE, MaterialUnit.PIECE, Decimal('4.00'), Decimal('10.00'), Decimal('850.00'), 'Ethiopian Crown Hardware & Fasteners', 'Bin C4'), # Low stock!
        ]

        for sku, name, cat, unit, curr_s, min_s, ucost, sup_name, loc in materials_data:
            Material.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': cat,
                    'unit': unit,
                    'current_stock': curr_s,
                    'minimum_stock': min_s,
                    'unit_cost': ucost,
                    'supplier': supplier_objs[sup_name],
                    'location': loc,
                }
            )

        # 9. Quotations & Workflow Demo
        cust_user = created_users['customer@haraworkshop.com']
        sara_user = created_users['sara@gmail.com']

        # Quote 1: Under Review
        q1, _ = Quote.objects.get_or_create(
            quote_number='QT-2026-0001',
            defaults={
                'customer': sara_user,
                'project_title': 'Custom Villa Entrance Door and Stair Railing',
                'service_type': 'Metal & Wood Works',
                'description': 'Double leaf entrance security door with wooden insert panels and 15 meters of matching staircase railing with wood handrails.',
                'material_preference': 'Galvanized Steel and Teak Wood',
                'width_cm': Decimal('160.00'),
                'height_cm': Decimal('240.00'),
                'quantity': 1,
                'preferred_completion_date': date.today() + timedelta(days=25),
                'installation_required': True,
                'delivery_required': True,
                'status': QuoteStatus.UNDER_REVIEW,
                'materials_cost': Decimal('32000.00'),
                'labor_cost': Decimal('12000.00'),
                'transportation_cost': Decimal('2500.00'),
                'installation_cost': Decimal('4500.00'),
                'discount': Decimal('1000.00'),
                'subtotal': Decimal('50000.00'),
                'total_amount': Decimal('50000.00'),
            }
        )

        # Quote 2: Price Proposed
        q2, _ = Quote.objects.get_or_create(
            quote_number='QT-2026-0002',
            defaults={
                'customer': cust_user,
                'project_title': 'Executive Conference Table & Wall Shelving',
                'service_type': 'Wood Works',
                'description': '10-seater conference table with solid wanza wood top, black metal frame, and matching 3-meter open shelving unit.',
                'material_preference': 'Ethiopian Wanza Wood and Powder-Coated Metal',
                'width_cm': Decimal('120.00'),
                'height_cm': Decimal('76.00'),
                'length_cm': Decimal('320.00'),
                'quantity': 1,
                'preferred_completion_date': date.today() + timedelta(days=20),
                'installation_required': True,
                'delivery_required': True,
                'status': QuoteStatus.PRICE_PROPOSED,
                'materials_cost': Decimal('45000.00'),
                'labor_cost': Decimal('18000.00'),
                'transportation_cost': Decimal('3000.00'),
                'installation_cost': Decimal('4000.00'),
                'discount': Decimal('2000.00'),
                'subtotal': Decimal('68000.00'),
                'total_amount': Decimal('68000.00'),
                'workshop_notes': 'Includes laser routing for concealed electrical cords and natural oil finish.',
            }
        )

        # Quote 3: Converted to Order
        q3, _ = Quote.objects.get_or_create(
            quote_number='QT-2026-0003',
            defaults={
                'customer': cust_user,
                'project_title': 'Motorized Compound Perimeter Gate',
                'service_type': 'Metal Works',
                'description': '4.5m heavy sliding compound gate with motorized rack and safety sensors.',
                'material_preference': 'Structural Steel, Laser Perforated Panels',
                'width_cm': Decimal('450.00'),
                'height_cm': Decimal('230.00'),
                'quantity': 1,
                'preferred_completion_date': date.today() + timedelta(days=15),
                'installation_required': True,
                'delivery_required': True,
                'status': QuoteStatus.CONVERTED_TO_ORDER,
                'materials_cost': Decimal('65000.00'),
                'labor_cost': Decimal('25000.00'),
                'transportation_cost': Decimal('4000.00'),
                'installation_cost': Decimal('8000.00'),
                'discount': Decimal('2000.00'),
                'subtotal': Decimal('100000.00'),
                'total_amount': Decimal('100000.00'),
            }
        )

        # 10. Orders & Production
        order1, _ = Order.objects.get_or_create(
            order_number='HW-2026-0001',
            defaults={
                'quote': q3,
                'customer': cust_user,
                'status': OrderStatus.IN_PRODUCTION,
                'total_amount': Decimal('100000.00'),
                'paid_amount': Decimal('60000.00'),
                'delivery_address': 'Bole Arabsa, Block 14, Villa 8',
                'delivery_city': 'Addis Ababa',
                'expected_delivery_date': date.today() + timedelta(days=12),
                'notes': 'Advance payment received. In assembly stage.',
            }
        )

        OrderItem.objects.get_or_create(
            order=order1,
            item_title='Motorized Compound Perimeter Gate',
            defaults={
                'description': '4.5m x 2.3m heavy sliding gate with motorized frame',
                'quantity': 1,
                'unit_price': Decimal('100000.00'),
                'total_price': Decimal('100000.00'),
            }
        )

        # Production Job
        prod_job, _ = ProductionJob.objects.get_or_create(
            order=order1,
            defaults={
                'job_code': 'JOB-2026-0001',
                'stage': ProductionStage.FABRICATION,
                'priority': 'HIGH',
                'progress_percentage': 45,
                'supervisor': created_users['production@haraworkshop.com'],
                'start_date': date.today() - timedelta(days=4),
                'expected_completion': date.today() + timedelta(days=10),
                'notes': 'Steel frame welded and squared. Laser cut sheets currently being welded into sub-panels.',
            }
        )

        # Production Tasks
        ProductionTask.objects.get_or_create(
            job=prod_job,
            title='Material sizing and cutting on band saw',
            defaults={'stage': ProductionStage.CUTTING, 'is_completed': True}
        )
        ProductionTask.objects.get_or_create(
            job=prod_job,
            title='MIG welding of outer perimeter 80x80 box tube',
            defaults={'stage': ProductionStage.FABRICATION, 'is_completed': True}
        )
        ProductionTask.objects.get_or_create(
            job=prod_job,
            title='Installing track guide rollers and motor gear rack',
            defaults={'stage': ProductionStage.ASSEMBLY, 'is_completed': False}
        )

        # 11. Invoices & Payments
        inv1, _ = Invoice.objects.get_or_create(
            invoice_number='INV-2026-0001',
            defaults={
                'order': order1,
                'customer': cust_user,
                'subtotal': Decimal('100000.00'),
                'discount': Decimal('0.00'),
                'tax_amount': Decimal('15000.00'),
                'total_amount': Decimal('115000.00'),
                'amount_paid': Decimal('60000.00'),
                'amount_remaining': Decimal('55000.00'),
                'status': InvoiceStatus.PARTIALLY_PAID,
                'issue_date': date.today() - timedelta(days=5),
                'due_date': date.today() + timedelta(days=25),
                'notes': '50% deposit plus VAT advance settled via Telebirr.',
            }
        )

        Payment.objects.get_or_create(
            payment_number='PAY-2026-0001',
            defaults={
                'order': order1,
                'customer': cust_user,
                'amount': Decimal('60000.00'),
                'currency': 'ETB',
                'payment_method': PaymentMethod.TELEBIRR,
                'transaction_reference': 'TB-89481920392',
                'status': PaymentStatus.SUCCESS,
                'payment_date': date.today() - timedelta(days=5),
                'recorded_by': created_users['accountant@haraworkshop.com'],
                'notes': 'Verified deposit via Telebirr merchant portal.',
            }
        )

        # 12. Expenses
        expenses_list = [
            ('EXP-2026-0001', ExpenseCategory.MATERIALS, Decimal('42500.00'), date.today() - timedelta(days=6), 'BANK_TRANSFER', 'Purchase of 30 pcs 50x50 steel tubes and sheet metal from Addis Steel.'),
            ('EXP-2026-0002', ExpenseCategory.SALARIES, Decimal('68000.00'), date.today() - timedelta(days=7), 'CBE_BIRR', 'Bi-weekly workshop artisan wages for 4 fabricators & 2 carpenters.'),
            ('EXP-2026-0003', ExpenseCategory.UTILITIES, Decimal('4800.00'), date.today() - timedelta(days=10), 'TELEBIRR', 'Ethiopian Electric Utility 3-phase industrial power bill for workshop.'),
            ('EXP-2026-0004', ExpenseCategory.MAINTENANCE, Decimal('3200.00'), date.today() - timedelta(days=12), 'CASH', 'Hydraulic fluid replacement and blade sharpening for circular wood saw.'),
        ]

        for exp_no, cat, amt, dt, meth, desc in expenses_list:
            Expense.objects.get_or_create(
                expense_number=exp_no,
                defaults={
                    'category': cat,
                    'amount': amt,
                    'date': dt,
                    'payment_method': meth,
                    'description': desc,
                    'recorded_by': created_users['accountant@haraworkshop.com'],
                }
            )

        # 13. Messaging
        conv, _ = Conversation.objects.get_or_create(
            customer=cust_user,
            subject='Inquiry regarding gate paint finish color code',
            defaults={'status': 'OPEN'}
        )
        Message.objects.get_or_create(
            conversation=conv,
            sender=cust_user,
            content='Good afternoon Hara Workshop team, could we please confirm the RAL color code for the matte black powder coating on our sliding gate?',
            defaults={'is_read': True}
        )
        Message.objects.get_or_create(
            conversation=conv,
            sender=created_users['sales@haraworkshop.com'],
            content='Dear Ato Abebe, we are using RAL 9005 Jet Black with a fine-texture matte finish. We have set aside a metal test swatch for you to inspect anytime!',
            defaults={'is_read': False}
        )

        # 14. Notifications
        notifications_list = [
            (cust_user, 'Quotation Price Proposed', 'Your quote QT-2026-0002 for the Executive Conference Table has been priced.', NotificationType.QUOTE, '/quotes/QT-2026-0002'),
            (cust_user, 'Production Stage Advanced', 'Order HW-2026-0001 has entered the Fabrication stage.', NotificationType.PRODUCTION, '/orders/HW-2026-0001'),
            (created_users['production@haraworkshop.com'], 'Low Stock Alert', 'E6013 Mild Steel Welding Electrodes is below minimum stock threshold (4 boxes remaining).', NotificationType.STOCK, '/admin/inventory'),
        ]

        for u, title, msg, ntype, link in notifications_list:
            Notification.objects.get_or_create(
                user=u,
                title=title,
                defaults={'message': msg, 'notification_type': ntype, 'link_url': link, 'is_read': False}
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all Hara Workshop initial data!'))
