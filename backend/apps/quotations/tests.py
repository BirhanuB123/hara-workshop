from django.test import TestCase
from decimal import Decimal
from apps.accounts.models import User, UserRole
from apps.quotations.models import Quote, QuoteStatus
from apps.orders.models import Order, OrderStatus
from apps.production.models import ProductionJob

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
