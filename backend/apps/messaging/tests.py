from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import CustomerProfile, UserRole
from .models import Conversation


class MessagingSearchQueryP2Tests(TestCase):
    """Regression tests for ConversationViewSet search lookup across customer profiles."""

    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            email='msg_admin@haraworkshop.com',
            password='Password123!',
            first_name='Admin',
            last_name='Messaging',
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            email='msg_cust@haraworkshop.com',
            password='Password123!',
            first_name='Dawit',
            last_name='Bekele',
            role=UserRole.CUSTOMER,
        )
        CustomerProfile.objects.create(
            user=self.customer,
            company_name='Abyssinia Builders PLC',
        )
        self.conv = Conversation.objects.create(
            customer=self.customer,
            subject='Villa Sliding Gate Query',
        )
        self.client = APIClient()

    def test_admin_search_conversations_matches_customer_profile_company_name(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/messaging/conversations/', {'search': 'Abyssinia'})
        self.assertEqual(resp.status_code, 200)
        results = resp.data.get('results', resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]['id']), str(self.conv.id))
