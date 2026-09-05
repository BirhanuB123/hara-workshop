import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# Accounts & Auth Tests
w('backend/apps/accounts/tests.py', '''from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, UserRole

class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testcustomer@example.com',
            password='TestPassword123!',
            first_name='Dawit',
            last_name='Tadesse',
            role=UserRole.CUSTOMER
        )

    def test_customer_registration(self):
        url = reverse('auth-register')
        data = {
            'email': 'newcustomer@example.com',
            'password': 'StrongPassword123!',
            'first_name': 'Solomon',
            'last_name': 'Girma',
            'phone_number': '+251911998877',
            'city': 'Addis Ababa',
            'address': 'Bole Atlas'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', res.data)
        self.assertEqual(res.data['user']['email'], 'newcustomer@example.com')
        self.assertTrue(User.objects.filter(email='newcustomer@example.com').exists())

    def test_jwt_login(self):
        url = reverse('auth-login')
        data = {
            'email': 'testcustomer@example.com',
            'password': 'TestPassword123!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['role'], 'CUSTOMER')

    def test_token_refresh(self):
        login_res = self.client.post(reverse('auth-login'), {
            'email': 'testcustomer@example.com',
            'password': 'TestPassword123!'
        }, format='json')
        refresh_token = login_res.data['refresh']

        refresh_res = self.client.post(reverse('auth-refresh'), {'refresh': refresh_token}, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_res.data)
''')

# Quotations & Workflow Tests
w('backend/apps/quotations/tests.py', '''from django.test import TestCase
from decimal import Decimal
from apps.accounts.models import User, UserRole
from apps.quotations.models import Quote, QuoteStatus
from apps.orders.models import Order, OrderStatus
from apps.production.models import ProductionJob
from apps.invoices.models import Invoice

class QuotationWorkflowTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='cust@test.com',
            password='Password123!',
            first_name='Abel',
            last_name='Mulu',
            role=UserRole.CUSTOMER
        )

    def test_quotation_calculations(self):
        quote = Quote.objects.create(
            customer=self.customer,
            project_title='Custom Entrance Door',
            service_type='Metal Works',
            description='Heavy steel door',
            materials_cost=Decimal('20000.00'),
            labor_cost=Decimal('8000.00'),
            transportation_cost=Decimal('2000.00'),
            installation_cost=Decimal('3000.00'),
            additional_charges=Decimal('0.00'),
            discount=Decimal('1000.00')
        )
        quote.calculate_totals()
        # 20,000 + 8,000 + 2,000 + 3,000 - 1,000 = 32,000 ETB
        self.assertEqual(quote.total_amount, Decimal('32000.00'))
        self.assertTrue(quote.quote_number.startswith('QT-'))
''')

# Inventory Tests
w('backend/apps/inventory/tests.py', '''from django.test import TestCase
from decimal import Decimal
from apps.inventory.models import Material, MaterialCategory, MaterialUnit, InventoryTransaction

class InventoryStockTests(TestCase):
    def test_stock_recalculation_on_transaction(self):
        mat = Material.objects.create(
            sku='TEST-MAT-01',
            name='Test Square Tube',
            category=MaterialCategory.STEEL,
            unit=MaterialUnit.PIECE,
            current_stock=Decimal('10.00'),
            minimum_stock=Decimal('5.00'),
            unit_cost=Decimal('500.00')
        )

        # Purchase 20 units
        InventoryTransaction.objects.create(
            material=mat,
            transaction_type='PURCHASE',
            quantity=Decimal('20.00'),
            unit_cost=Decimal('500.00')
        )
        mat.refresh_from_db()
        self.assertEqual(mat.current_stock, Decimal('30.00'))

        # Consume 15 units
        InventoryTransaction.objects.create(
            material=mat,
            transaction_type='CONSUMPTION',
            quantity=Decimal('15.00')
        )
        mat.refresh_from_db()
        self.assertEqual(mat.current_stock, Decimal('15.00'))
''')

# Payments & Invoices Tests
w('backend/apps/payments/tests.py', '''from django.test import TestCase
from decimal import Decimal
from apps.accounts.models import User, UserRole
from apps.orders.models import Order, OrderStatus
from apps.payments.models import Payment, PaymentMethod, PaymentStatus
from apps.invoices.models import Invoice, InvoiceStatus

class PaymentInvoiceTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='paycust@test.com',
            password='Password123!',
            first_name='Helen',
            last_name='Assefa',
            role=UserRole.CUSTOMER
        )
        self.order = Order.objects.create(
            customer=self.customer,
            status=OrderStatus.CONFIRMED,
            total_amount=Decimal('50000.00'),
            paid_amount=Decimal('0.00')
        )
        self.invoice = Invoice.objects.create(
            order=self.order,
            customer=self.customer,
            subtotal=Decimal('50000.00'),
            tax_amount=Decimal('7500.00'),
            total_amount=Decimal('57500.00'),
            amount_paid=Decimal('0.00'),
            amount_remaining=Decimal('57500.00'),
            status=InvoiceStatus.ISSUED
        )

    def test_successful_payment_updates_order_and_invoice(self):
        pay = Payment.objects.create(
            order=self.order,
            customer=self.customer,
            amount=Decimal('30000.00'),
            payment_method=PaymentMethod.TELEBIRR,
            status=PaymentStatus.SUCCESS
        )

        self.order.refresh_from_db()
        self.invoice.refresh_from_db()

        self.assertEqual(self.order.paid_amount, Decimal('30000.00'))
        self.assertEqual(self.order.status, OrderStatus.PAYMENT_PENDING)
        self.assertEqual(self.invoice.amount_paid, Decimal('30000.00'))
        self.assertEqual(self.invoice.amount_remaining, Decimal('27500.00'))
        self.assertEqual(self.invoice.status, InvoiceStatus.PARTIALLY_PAID)
''')

print('Backend test suites written.')
