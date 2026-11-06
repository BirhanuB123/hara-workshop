"""
Phone Number Validation Module for HARA WORKSHOP
Implements ITU-T E.164 and country-aware validation.

Rules:
1. Ethiopian Local numbers:
   - Numbers starting with '09' (or '07') must contain exactly 10 digits.
   - Example: '0912345678' -> Valid.
   - Example: '09123456789' -> Invalid.

2. Ethiopian International format:
   - Numbers starting with '+251' must contain exactly 13 characters, including the '+' sign.
   - Example: '+251912345678' -> Valid.
   - Example: '+25191234567' -> Invalid.

3. International customer numbers:
   - Allow customers from ANY country to enter international phone numbers.
   - Requires '+' prefix.
   - Validates country calling code (+1, +44, +33, +49, +91, +971, etc.) and valid national number length.
   - Rejects arbitrary or incomplete phone numbers.
"""

import re
from typing import Tuple, Optional, Dict

# Country calling code metadata: (Country Name, min_national_digits, max_national_digits)
COUNTRY_METADATA: Dict[str, Tuple[str, int, int]] = {
    '+251': ('Ethiopia', 9, 9),
    '+1': ('United States / Canada', 10, 10),
    '+44': ('United Kingdom', 10, 10),
    '+971': ('United Arab Emirates', 9, 9),
    '+966': ('Saudi Arabia', 9, 9),
    '+254': ('Kenya', 9, 9),
    '+49': ('Germany', 10, 11),
    '+33': ('France', 9, 9),
    '+39': ('Italy', 9, 10),
    '+91': ('India', 10, 10),
    '+86': ('China', 11, 11),
    '+81': ('Japan', 10, 10),
    '+61': ('Australia', 9, 9),
    '+974': ('Qatar', 8, 8),
    '+965': ('Kuwait', 8, 8),
    '+973': ('Bahrain', 8, 8),
    '+968': ('Oman', 8, 8),
    '+253': ('Djibouti', 8, 8),
    '+252': ('Somalia', 8, 9),
    '+249': ('Sudan', 9, 9),
    '+211': ('South Sudan', 9, 9),
    '+256': ('Uganda', 9, 9),
    '+255': ('Tanzania', 9, 9),
    '+250': ('Rwanda', 9, 9),
    '+234': ('Nigeria', 10, 10),
    '+27': ('South Africa', 9, 9),
    '+20': ('Egypt', 10, 10),
    '+90': ('Turkey', 10, 10),
    '+31': ('Netherlands', 9, 9),
    '+32': ('Belgium', 9, 9),
    '+46': ('Sweden', 7, 9),
    '+47': ('Norway', 8, 8),
    '+45': ('Denmark', 8, 8),
    '+358': ('Finland', 5, 10),
    '+41': ('Switzerland', 9, 9),
    '+43': ('Austria', 10, 11),
    '+353': ('Ireland', 9, 9),
    '+34': ('Spain', 9, 9),
    '+351': ('Portugal', 9, 9),
    '+30': ('Greece', 10, 10),
    '+972': ('Israel', 9, 9),
    '+962': ('Jordan', 9, 9),
    '+961': ('Lebanon', 7, 8),
    '+82': ('South Korea', 9, 10),
    '+65': ('Singapore', 8, 8),
    '+60': ('Malaysia', 9, 10),
    '+62': ('Indonesia', 9, 11),
    '+66': ('Thailand', 9, 9),
    '+84': ('Vietnam', 9, 9),
    '+63': ('Philippines', 10, 10),
    '+92': ('Pakistan', 10, 10),
    '+880': ('Bangladesh', 10, 10),
    '+55': ('Brazil', 10, 11),
    '+52': ('Mexico', 10, 10),
    '+54': ('Argentina', 10, 10),
    '+56': ('Chile', 9, 9),
    '+57': ('Colombia', 10, 10),
    '+64': ('New Zealand', 8, 10),
    '+233': ('Ghana', 9, 9),
    '+225': ('Ivory Coast', 10, 10),
    '+221': ('Senegal', 9, 9),
    '+237': ('Cameroon', 9, 9),
    '+212': ('Morocco', 9, 9),
    '+216': ('Tunisia', 8, 8),
    '+213': ('Algeria', 9, 9),
    '+48': ('Poland', 9, 9),
    '+420': ('Czech Republic', 9, 9),
    '+36': ('Hungary', 9, 9),
    '+40': ('Romania', 9, 9),
    '+380': ('Ukraine', 9, 9),
    '+7': ('Russia / Kazakhstan', 10, 10),
}

# Sorted calling codes descending by length
SORTED_CALLING_CODES = sorted(COUNTRY_METADATA.keys(), key=lambda x: len(x), reverse=True)


def validate_phone_number(raw_phone: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validates and normalizes phone number according to user specification.
    
    Returns:
        (is_valid: bool, error_message: str, normalized_phone: Optional[str])
    """
    if not raw_phone:
        return False, "Phone number is required.", None

    trimmed = str(raw_phone).strip()
    if not trimmed:
        return False, "Phone number is required.", None

    # 1. Ethiopian Local numbers: starting with '09' (or '07')
    if trimmed.startswith('09') or trimmed.startswith('07'):
        # Only numeric digits allowed
        if not trimmed.isdigit():
            return False, "Ethiopian local phone numbers must contain only numeric digits (0–9).", None
        
        # Must contain exactly 10 digits
        if len(trimmed) != 10:
            return (
                False, 
                f"Ethiopian local numbers starting with 09 must contain exactly 10 digits (provided: {len(trimmed)} digits).",
                None
            )
        return True, "", trimmed

    # 2. Ethiopian International format: starting with '+251'
    if trimmed.startswith('+251'):
        digits_after_plus = trimmed[1:].replace(" ", "").replace("-", "")
        if not digits_after_plus.isdigit():
            return False, "Phone number must contain only numeric digits after the '+' sign.", None
        
        clean_full = '+' + digits_after_plus
        # Exactly 13 characters including the '+' sign
        if len(clean_full) != 13:
            return (
                False,
                f"Ethiopian international numbers starting with +251 must contain exactly 13 characters, including '+' (provided: {len(clean_full)} characters).",
                None
            )
        
        # Mobile prefix check (+2519... or +2517...)
        if clean_full[4] not in ('9', '7', '1'):
            return False, "Ethiopian numbers with +251 must start with +2519... or +2517...", None
        
        return True, "", clean_full

    # Support raw 2519XXXXXXXX (12 digits) by normalizing to +2519XXXXXXXX
    if trimmed.startswith('251') and len(trimmed.replace(" ", "").replace("-", "")) == 12:
        digits_clean = trimmed.replace(" ", "").replace("-", "")
        if digits_clean.isdigit():
            normalized = '+' + digits_clean
            if len(normalized) == 13 and normalized[4] in ('9', '7', '1'):
                return True, "", normalized

    # 3. International customer phone numbers
    # Must require the '+' prefix for international numbers
    if not trimmed.startswith('+'):
        return (
            False,
            "International numbers must start with the '+' prefix (e.g. +1, +44, +971, +251) or use local format (09XXXXXXXX).",
            None
        )

    # Clean characters after '+'
    after_plus = trimmed[1:].replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace(".", "")
    if not after_plus.isdigit():
        return False, "International phone number must contain only numeric digits after '+'.", None

    normalized = '+' + after_plus

    # Match country calling code
    matched_dial_code = None
    matched_meta = None
    for code in SORTED_CALLING_CODES:
        if normalized.startswith(code):
            matched_dial_code = code
            matched_meta = COUNTRY_METADATA[code]
            break

    if matched_meta and matched_dial_code:
        country_name, min_len, max_len = matched_meta
        national_number = after_plus[len(matched_dial_code) - 1:]

        if len(national_number) < min_len:
            return (
                False,
                f"Phone number for {country_name} ({matched_dial_code}) is too short (minimum {min_len} national digits required).",
                None
            )
        if len(national_number) > max_len:
            return (
                False,
                f"Phone number for {country_name} ({matched_dial_code}) is too long (maximum {max_len} national digits allowed).",
                None
            )
        return True, "", normalized

    # Fallback ITU-T E.164 compliance for other valid international countries:
    # E.164 specifies total digits between 7 and 15
    if len(after_plus) < 7 or len(after_plus) > 15:
        return (
            False,
            f"International phone numbers must contain between 7 and 15 digits (provided: {len(after_plus)} digits).",
            None
        )

    return True, "", normalized
