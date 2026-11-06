import re
from rest_framework.exceptions import ValidationError

def normalize_phone_number(phone_str: str) -> str:
    """
    Normalizes a phone number to standard Ethiopian/E.164 canonical format (+251...).
    Accepts:
      +251911234567 -> +251911234567
      251911234567  -> +251911234567
      00251911234567-> +251911234567
      0911234567    -> +251911234567
      911234567     -> +251911234567
      0712345678    -> +251712345678 (Safaricom Ethiopia)
      +251 911 234 567 -> +251911234567
      0911-234-567  -> +251911234567
    """
    if not phone_str:
        return None

    raw = str(phone_str).strip()
    if not raw:
        return None

    # Remove formatting characters: spaces, hyphens, parentheses, periods, slashes
    cleaned = re.sub(r'[\s\-\(\)\.\/]', '', raw)

    # 1. Handle Ethiopian national formats
    if cleaned.startswith('00251'):
        cleaned = '+' + cleaned[2:]
    elif cleaned.startswith('251') and len(cleaned) == 12:
        cleaned = '+' + cleaned
    elif cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+251' + cleaned[1:]
    elif (cleaned.startswith('9') or cleaned.startswith('7')) and len(cleaned) == 9:
        cleaned = '+251' + cleaned
    elif cleaned.startswith('1') and len(cleaned) == 9:
        cleaned = '+251' + cleaned

    if cleaned.startswith('251') and len(cleaned) == 12:
        cleaned = '+' + cleaned

    ethiopian_regex = r'^\+251[1-9]\d{8}$'
    if re.match(ethiopian_regex, cleaned):
        return cleaned

    intl_regex = r'^\+[1-9]\d{7,14}$'
    if re.match(intl_regex, cleaned):
        return cleaned

    raise ValidationError('Please enter a valid phone number (e.g. 0911234567 or +251911234567).')

def normalize_email_address(email_str: str) -> str:
    """
    Normalizes email by trimming whitespace and converting to lowercase.
    """
    if not email_str:
        return ''
    return str(email_str).strip().lower()
