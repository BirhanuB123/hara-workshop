from django.test import TestCase
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
