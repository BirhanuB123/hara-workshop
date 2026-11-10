from rest_framework.settings import api_settings
from rest_framework.throttling import SimpleRateThrottle


class ClientIdentRateThrottle(SimpleRateThrottle):
    """
    Rate-limits requests per authenticated user ID or anonymous client IP.
    """
    def get_rate(self):
        if not getattr(self, 'scope', None):
            return super().get_rate()
        rates = api_settings.DEFAULT_THROTTLE_RATES or {}
        if self.scope in rates:
            return rates[self.scope]
        return super().get_rate()

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user:{request.user.pk}"
        else:
            ident = f"ip:{self.get_ident(request)}"
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


class QuoteCreateThrottle(ClientIdentRateThrottle):
    scope = 'quote_submit'


class ContactSubmitThrottle(ClientIdentRateThrottle):
    scope = 'contact_submit'


class AuthLoginThrottle(ClientIdentRateThrottle):
    scope = 'auth_login'


class AuthRegisterThrottle(ClientIdentRateThrottle):
    scope = 'auth_register'
