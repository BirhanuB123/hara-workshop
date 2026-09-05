from django.test import TestCase
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
