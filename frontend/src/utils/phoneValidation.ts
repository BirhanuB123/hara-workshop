/**
 * Phone Number Validation & Country Metadata Module
 * Implements ITU-T E.164 & libphonenumber standards
 * 
 * Supports:
 * 1. Ethiopian Local Numbers (09XXXXXXXX / 07XXXXXXXX, exactly 10 digits)
 * 2. Ethiopian International Numbers (+2519XXXXXXXX / +2517XXXXXXXX, exactly 13 characters including +)
 * 3. International Customer Numbers (any country, required '+' prefix, country calling codes, country-specific length validation)
 */

export interface CountryInfo {
  code: string;         // ISO 3166-1 alpha-2 (e.g. 'ET', 'US', 'GB')
  name: string;         // English country name
  nameAm?: string;      // Amharic country name
  dialCode: string;     // Calling code with plus (e.g. '+251', '+1', '+44')
  flag: string;         // Emoji flag
  minLength: number;    // Minimum national number digits (excluding dial code)
  maxLength: number;    // Maximum national number digits (excluding dial code)
  example: string;      // Example valid number
  pattern?: RegExp;     // Optional national pattern
}

export const COUNTRIES: CountryInfo[] = [
  // Primary / Regional Focus
  { code: 'ET', name: 'Ethiopia', nameAm: 'ኢትዮጵያ', dialCode: '+251', flag: '🇪🇹', minLength: 9, maxLength: 9, example: '0912345678 or +251912345678' },
  { code: 'US', name: 'United States', nameAm: 'አሜሪካ', dialCode: '+1', flag: '🇺🇸', minLength: 10, maxLength: 10, example: '+12025550123' },
  { code: 'GB', name: 'United Kingdom', nameAm: 'እንግሊዝ', dialCode: '+44', flag: '🇬🇧', minLength: 10, maxLength: 10, example: '+447911123456' },
  { code: 'AE', name: 'United Arab Emirates', nameAm: 'የተባበሩት አረብ ኤምሬትስ', dialCode: '+971', flag: '🇦🇪', minLength: 9, maxLength: 9, example: '+971501234567' },
  { code: 'SA', name: 'Saudi Arabia', nameAm: 'ሳውዲ አረቢያ', dialCode: '+966', flag: '🇸🇦', minLength: 9, maxLength: 9, example: '+966501234567' },
  { code: 'KE', name: 'Kenya', nameAm: 'ኬንያ', dialCode: '+254', flag: '🇰🇪', minLength: 9, maxLength: 9, example: '+254712345678' },
  { code: 'CA', name: 'Canada', nameAm: 'ካናዳ', dialCode: '+1', flag: '🇨🇦', minLength: 10, maxLength: 10, example: '+14165550123' },
  { code: 'DE', name: 'Germany', nameAm: 'ጀርመን', dialCode: '+49', flag: '🇩🇪', minLength: 10, maxLength: 11, example: '+4915123456789' },
  { code: 'FR', name: 'France', nameAm: 'ፈረንሳይ', dialCode: '+33', flag: '🇫🇷', minLength: 9, maxLength: 9, example: '+33612345678' },
  { code: 'IT', name: 'Italy', nameAm: 'ጣሊያን', dialCode: '+39', flag: '🇮🇹', minLength: 9, maxLength: 10, example: '+393123456789' },
  { code: 'IN', name: 'India', nameAm: 'ህንድ', dialCode: '+91', flag: '🇮🇳', minLength: 10, maxLength: 10, example: '+919876543210' },
  { code: 'CN', name: 'China', nameAm: 'ቻይና', dialCode: '+86', flag: '🇨🇳', minLength: 11, maxLength: 11, example: '+8613812345678' },
  { code: 'AU', name: 'Australia', nameAm: 'አውስትራሊያ', dialCode: '+61', flag: '🇦🇺', minLength: 9, maxLength: 9, example: '+61412345678' },
  { code: 'QA', name: 'Qatar', nameAm: 'ኳታር', dialCode: '+974', flag: '🇶🇦', minLength: 8, maxLength: 8, example: '+97433123456' },
  { code: 'KW', name: 'Kuwait', nameAm: 'ኩዌት', dialCode: '+965', flag: '🇰🇼', minLength: 8, maxLength: 8, example: '+96591234567' },
  { code: 'BH', name: 'Bahrain', nameAm: 'ባህሬን', dialCode: '+973', flag: '🇧🇭', minLength: 8, maxLength: 8, example: '+97339123456' },
  { code: 'OM', name: 'Oman', nameAm: 'ኦማን', dialCode: '+968', flag: '🇴🇲', minLength: 8, maxLength: 8, example: '+96891234567' },
  { code: 'DJ', name: 'Djibouti', nameAm: 'ጅቡቲ', dialCode: '+253', flag: '🇩🇯', minLength: 8, maxLength: 8, example: '+25377123456' },
  { code: 'SO', name: 'Somalia', nameAm: 'ሶማሊያ', dialCode: '+252', flag: '🇸🇴', minLength: 8, maxLength: 9, example: '+252612345678' },
  { code: 'SD', name: 'Sudan', nameAm: 'ሱዳን', dialCode: '+249', flag: '🇸🇩', minLength: 9, maxLength: 9, example: '+249912345678' },
  { code: 'SS', name: 'South Sudan', nameAm: 'ደቡብ ሱዳን', dialCode: '+211', flag: '🇸🇸', minLength: 9, maxLength: 9, example: '+211912345678' },
  { code: 'UG', name: 'Uganda', nameAm: 'ዩጋንዳ', dialCode: '+256', flag: '🇺🇬', minLength: 9, maxLength: 9, example: '+256771234567' },
  { code: 'TZ', name: 'Tanzania', nameAm: 'ታንዛኒያ', dialCode: '+255', flag: '🇹🇿', minLength: 9, maxLength: 9, example: '+255712345678' },
  { code: 'RW', name: 'Rwanda', nameAm: 'ሩዋንዳ', dialCode: '+250', flag: '🇷🇼', minLength: 9, maxLength: 9, example: '+250781234567' },
  { code: 'NG', name: 'Nigeria', nameAm: 'ናይጄሪያ', dialCode: '+234', flag: '🇳🇬', minLength: 10, maxLength: 10, example: '+2348012345678' },
  { code: 'ZA', name: 'South Africa', nameAm: 'ደቡብ አፍሪካ', dialCode: '+27', flag: '🇿🇦', minLength: 9, maxLength: 9, example: '+27821234567' },
  { code: 'EG', name: 'Egypt', nameAm: 'ግብጽ', dialCode: '+20', flag: '🇪🇬', minLength: 10, maxLength: 10, example: '+201012345678' },
  { code: 'TR', name: 'Turkey', nameAm: 'ቱርክ', dialCode: '+90', flag: '🇹🇷', minLength: 10, maxLength: 10, example: '+905123456789' },
  { code: 'NL', name: 'Netherlands', nameAm: 'ኔዘርላንድስ', dialCode: '+31', flag: '🇳🇱', minLength: 9, maxLength: 9, example: '+31612345678' },
  { code: 'BE', name: 'Belgium', nameAm: 'ቤልጂየም', dialCode: '+32', flag: '🇧🇪', minLength: 9, maxLength: 9, example: '+32470123456' },
  { code: 'SE', name: 'Sweden', nameAm: 'ስዊድን', dialCode: '+46', flag: '🇸🇪', minLength: 7, maxLength: 9, example: '+46701234567' },
  { code: 'NO', name: 'Norway', nameAm: 'ኖርዌይ', dialCode: '+47', flag: '🇳🇴', minLength: 8, maxLength: 8, example: '+4791234567' },
  { code: 'DK', name: 'Denmark', nameAm: 'ዴንማርክ', dialCode: '+45', flag: '🇩🇰', minLength: 8, maxLength: 8, example: '+4520123456' },
  { code: 'FI', name: 'Finland', nameAm: 'ፊንላንድ', dialCode: '+358', flag: '🇫🇮', minLength: 5, maxLength: 10, example: '+358401234567' },
  { code: 'CH', name: 'Switzerland', nameAm: 'ስዊዘርላንድ', dialCode: '+41', flag: '🇨🇭', minLength: 9, maxLength: 9, example: '+41791234567' },
  { code: 'AT', name: 'Austria', nameAm: 'ኦስትሪያ', dialCode: '+43', flag: '🇦🇹', minLength: 10, maxLength: 11, example: '+436641234567' },
  { code: 'IE', name: 'Ireland', nameAm: 'አየርላንድ', dialCode: '+353', flag: '🇮🇪', minLength: 9, maxLength: 9, example: '+353851234567' },
  { code: 'ES', name: 'Spain', nameAm: 'ስፔን', dialCode: '+34', flag: '🇪🇸', minLength: 9, maxLength: 9, example: '+34612345678' },
  { code: 'PT', name: 'Portugal', nameAm: 'ፖርቱጋል', dialCode: '+351', flag: '🇵🇹', minLength: 9, maxLength: 9, example: '+351912345678' },
  { code: 'GR', name: 'Greece', nameAm: 'ግሪክ', dialCode: '+30', flag: '🇬🇷', minLength: 10, maxLength: 10, example: '+306912345678' },
  { code: 'IL', name: 'Israel', nameAm: 'እስራኤል', dialCode: '+972', flag: '🇮🇱', minLength: 9, maxLength: 9, example: '+972501234567' },
  { code: 'JO', name: 'Jordan', nameAm: 'ዮርዳኖስ', dialCode: '+962', flag: '🇯🇴', minLength: 9, maxLength: 9, example: '+962791234567' },
  { code: 'LB', name: 'Lebanon', nameAm: 'ሊባኖስ', dialCode: '+961', flag: '🇱🇧', minLength: 7, maxLength: 8, example: '+96170123456' },
  { code: 'JP', name: 'Japan', nameAm: 'ጃፓን', dialCode: '+81', flag: '🇯🇵', minLength: 10, maxLength: 10, example: '+819012345678' },
  { code: 'KR', name: 'South Korea', nameAm: 'ደቡብ ኮሪያ', dialCode: '+82', flag: '🇰🇷', minLength: 9, maxLength: 10, example: '+821012345678' },
  { code: 'SG', name: 'Singapore', nameAm: 'ሲንጋፖር', dialCode: '+65', flag: '🇸🇬', minLength: 8, maxLength: 8, example: '+6591234567' },
  { code: 'MY', name: 'Malaysia', nameAm: 'ማሌዢያ', dialCode: '+60', flag: '🇲🇾', minLength: 9, maxLength: 10, example: '+60123456789' },
  { code: 'ID', name: 'Indonesia', nameAm: 'ኢንዶኔዢያ', dialCode: '+62', flag: '🇮🇩', minLength: 9, maxLength: 11, example: '+6281234567890' },
  { code: 'TH', name: 'Thailand', nameAm: 'ታይላንድ', dialCode: '+66', flag: '🇹🇭', minLength: 9, maxLength: 9, example: '+66812345678' },
  { code: 'VN', name: 'Vietnam', nameAm: 'ቪየትናም', dialCode: '+84', flag: '🇻🇳', minLength: 9, maxLength: 9, example: '+84912345678' },
  { code: 'PH', name: 'Philippines', nameAm: 'ፊሊፒንስ', dialCode: '+63', flag: '🇵🇭', minLength: 10, maxLength: 10, example: '+639123456789' },
  { code: 'PK', name: 'Pakistan', nameAm: 'ፓኪስታን', dialCode: '+92', flag: '🇵🇰', minLength: 10, maxLength: 10, example: '+923001234567' },
  { code: 'BD', name: 'Bangladesh', nameAm: 'ባንግላዴሽ', dialCode: '+880', flag: '🇧🇩', minLength: 10, maxLength: 10, example: '+8801712345678' },
  { code: 'BR', name: 'Brazil', nameAm: 'ብራዚል', dialCode: '+55', flag: '🇧🇷', minLength: 10, maxLength: 11, example: '+5511912345678' },
  { code: 'MX', name: 'Mexico', nameAm: 'ሜክሲኮ', dialCode: '+52', flag: '🇲🇽', minLength: 10, maxLength: 10, example: '+525512345678' },
  { code: 'AR', name: 'Argentina', nameAm: 'አርጀንቲና', dialCode: '+54', flag: '🇦🇷', minLength: 10, maxLength: 10, example: '+5491112345678' },
  { code: 'CL', name: 'Chile', nameAm: 'ቺሊ', dialCode: '+56', flag: '🇨🇱', minLength: 9, maxLength: 9, example: '+56912345678' },
  { code: 'CO', name: 'Colombia', nameAm: 'ኮሎምቢያ', dialCode: '+57', flag: '🇨🇴', minLength: 10, maxLength: 10, example: '+573001234567' },
  { code: 'NZ', name: 'New Zealand', nameAm: 'ኒው ዚላንድ', dialCode: '+64', flag: '🇳🇿', minLength: 8, maxLength: 10, example: '+64211234567' },
  { code: 'GH', name: 'Ghana', nameAm: 'ጋና', dialCode: '+233', flag: '🇬🇭', minLength: 9, maxLength: 9, example: '+233241234567' },
  { code: 'CI', name: 'Ivory Coast', nameAm: 'ኮትዲቯር', dialCode: '+225', flag: '🇨🇮', minLength: 10, maxLength: 10, example: '+2250712345678' },
  { code: 'SN', name: 'Senegal', nameAm: 'ሴኔጋል', dialCode: '+221', flag: '🇸🇳', minLength: 9, maxLength: 9, example: '+221771234567' },
  { code: 'CM', name: 'Cameroon', nameAm: 'ካሜሩን', dialCode: '+237', flag: '🇨🇲', minLength: 9, maxLength: 9, example: '+237671234567' },
  { code: 'MA', name: 'Morocco', nameAm: 'ሞሮኮ', dialCode: '+212', flag: '🇲🇦', minLength: 9, maxLength: 9, example: '+212612345678' },
  { code: 'TN', name: 'Tunisia', nameAm: 'ቱኒዚያ', dialCode: '+216', flag: '🇹🇳', minLength: 8, maxLength: 8, example: '+21691234567' },
  { code: 'DZ', name: 'Algeria', nameAm: 'አልጄሪያ', dialCode: '+213', flag: '🇩🇿', minLength: 9, maxLength: 9, example: '+213551234567' },
  { code: 'PL', name: 'Poland', nameAm: 'ፖላንድ', dialCode: '+48', flag: '🇵🇱', minLength: 9, maxLength: 9, example: '+48501234567' },
  { code: 'CZ', name: 'Czech Republic', nameAm: 'ቼክ ሪፐብሊክ', dialCode: '+420', flag: '🇨🇿', minLength: 9, maxLength: 9, example: '+420601234567' },
  { code: 'HU', name: 'Hungary', nameAm: 'ሀንጋሪ', dialCode: '+36', flag: '🇭🇺', minLength: 9, maxLength: 9, example: '+36201234567' },
  { code: 'RO', name: 'Romania', nameAm: 'ሮማኒያ', dialCode: '+40', flag: '🇷🇴', minLength: 9, maxLength: 9, example: '+40712345678' },
  { code: 'UA', name: 'Ukraine', nameAm: 'ዩክሬን', dialCode: '+380', flag: '🇺🇦', minLength: 9, maxLength: 9, example: '+380501234567' },
  { code: 'RU', name: 'Russia', nameAm: 'ሩሲያ', dialCode: '+7', flag: '🇷🇺', minLength: 10, maxLength: 10, example: '+79123456789' },
  { code: 'KZ', name: 'Kazakhstan', nameAm: 'ካዛክስታን', dialCode: '+7', flag: '🇰🇿', minLength: 10, maxLength: 10, example: '+77012345678' },
];

/** Lookup map by ISO country code */
export const COUNTRY_BY_CODE: Record<string, CountryInfo> = COUNTRIES.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {} as Record<string, CountryInfo>);

/** Sorted list of calling codes descending by length (e.g. +358 before +35, etc.) */
const SORTED_DIAL_CODES = [...COUNTRIES]
  .map(c => c.dialCode)
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => b.length - a.length);

/** Find country by calling code */
export function findCountryByDialCode(dialCode: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/** Detect country from a phone string */
export function detectCountryFromPhone(phone: string): CountryInfo {
  const trimmed = phone.trim();
  if (!trimmed) {
    return COUNTRY_BY_CODE['ET'];
  }
  
  // Ethiopian local format: 09... or 07...
  if (trimmed.startsWith('09') || trimmed.startsWith('07')) {
    return COUNTRY_BY_CODE['ET'];
  }

  // International starting with +
  if (trimmed.startsWith('+')) {
    for (const code of SORTED_DIAL_CODES) {
      if (trimmed.startsWith(code)) {
        // Special case for +1: distinguish US vs CA if needed, defaults to US
        const match = COUNTRIES.find(c => c.dialCode === code);
        if (match) return match;
      }
    }
  }

  // Raw digits starting with 251
  if (trimmed.startsWith('251')) {
    return COUNTRY_BY_CODE['ET'];
  }

  return COUNTRY_BY_CODE['ET'];
}

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
  country?: CountryInfo;
}

/**
 * Validates a customer phone number according to user requirements:
 * 
 * 1. Ethiopian Local Numbers:
 *    - Must start with '09' (or '07')
 *    - Must contain exactly 10 digits
 *    - Example: '0912345678' is Valid.
 *    - Example: '09123456789' is Invalid.
 * 
 * 2. Ethiopian International Format:
 *    - Must start with '+251'
 *    - Must contain exactly 13 characters including the '+' sign
 *    - Example: '+251912345678' is Valid.
 *    - Example: '+25191234567' is Invalid.
 * 
 * 3. International Numbers:
 *    - Allowed from ANY country
 *    - Supports calling codes (+1, +44, +33, +49, +91, +971, etc.)
 *    - Requires '+' prefix for international format
 *    - Validates according to country calling code and valid national length
 *    - Rejects arbitrary or incomplete numbers
 */
export function validatePhoneNumber(
  rawPhone: string,
  selectedCountryCode: string = 'ET',
  language: string = 'en'
): PhoneValidationResult {
  const isAm = language === 'am';
  const trimmed = (rawPhone || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: isAm ? 'ስልክ ቁጥር ማስገባት ግዴታ ነው' : 'Phone number is required.'
    };
  }

  // 1. Ethiopian Local Number (09XXXXXXXX or 07XXXXXXXX)
  if (trimmed.startsWith('09') || trimmed.startsWith('07')) {
    // Only numeric digits allowed
    if (!/^\d+$/.test(trimmed)) {
      return {
        isValid: false,
        error: isAm
          ? 'የአገር ውስጥ ስልክ ቁጥር አሃዞችን (0-9) ብቻ መያዝ አለበት'
          : 'Local phone number must contain only numeric digits (0–9).'
      };
    }
    // Must contain exactly 10 digits
    if (trimmed.length !== 10) {
      return {
        isValid: false,
        error: isAm
          ? `በ09 የሚጀምር የኢትዮጵያ ስልክ ቁጥር በትክክል 10 አሃዞች መሆን አለበት (ያስገቡት: ${trimmed.length} አሃዝ)`
          : `Ethiopian local numbers starting with 09 must contain exactly 10 digits (entered: ${trimmed.length}).`
      };
    }
    return {
      isValid: true,
      normalized: trimmed,
      country: COUNTRY_BY_CODE['ET']
    };
  }

  // 2. Ethiopian International Format (+251...)
  if (trimmed.startsWith('+251')) {
    // Must be '+' followed by digits only
    const digitsAfterPlus = trimmed.slice(1).replace(/[\s-]/g, '');
    if (!/^\d+$/.test(digitsAfterPlus)) {
      return {
        isValid: false,
        error: isAm
          ? 'ስልክ ቁጥር ከ+ በኋላ አሃዞችን ብቻ መያዝ አለበት'
          : 'Phone number must contain only digits after the + sign.'
      };
    }
    const cleanFull = '+' + digitsAfterPlus;
    // Exactly 13 characters including the + sign
    if (cleanFull.length !== 13) {
      return {
        isValid: false,
        error: isAm
          ? `በ+251 የሚጀምር የኢትዮጵያ ስልክ ቁጥር + ጨምሮ በትክክል 13 ፊደላት መሆን አለበት (ያስገቡት: ${cleanFull.length})`
          : `Ethiopian international numbers starting with +251 must contain exactly 13 characters, including '+' (entered: ${cleanFull.length}).`
      };
    }
    // Valid national mobile prefix check (+2519... or +2517...)
    const nationalFirstDigit = cleanFull.charAt(4);
    if (nationalFirstDigit !== '9' && nationalFirstDigit !== '7' && nationalFirstDigit !== '1') {
      return {
        isValid: false,
        error: isAm
          ? 'የኢትዮጵያ ስልክ ቁጥር በ+251 9... ወይም በ+251 7... መጀመር አለበት'
          : 'Ethiopian international mobile numbers must start with +2519... or +2517...'
      };
    }
    return {
      isValid: true,
      normalized: cleanFull,
      country: COUNTRY_BY_CODE['ET']
    };
  }

  // Also support 2519XXXXXXXX without + by guiding user or auto-validating
  if (trimmed.startsWith('251')) {
    const clean = trimmed.replace(/[\s-]/g, '');
    if (/^\d{12}$/.test(clean)) {
      return {
        isValid: true,
        normalized: '+' + clean,
        country: COUNTRY_BY_CODE['ET']
      };
    }
    return {
      isValid: false,
      error: isAm
        ? 'በ+251 የሚጀምር ዓለም አቀፍ ቁጥር + ጨምሮ 13 ፊደላት መሆን አለበት (ለምሳሌ፡ +251912345678)'
        : 'International format requires "+" prefix (e.g., +251912345678, exactly 13 characters).'
    };
  }

  // 3. International Customer Numbers from ANY Country
  // Rule: Must require the '+' prefix for international numbers
  if (!trimmed.startsWith('+')) {
    return {
      isValid: false,
      error: isAm
        ? 'ዓለም አቀፍ ስልክ ቁጥሮች በ"+" መጀመር አለባቸው (ለምሳሌ፡ +1, +44, +971, +251)'
        : 'International numbers must start with the "+" prefix (e.g. +1, +44, +971, +251).'
    };
  }

  // Strip spaces, dashes, parentheses after the leading '+'
  const digitsOnly = trimmed.slice(1).replace(/[\s\-().]/g, '');
  if (!/^\d+$/.test(digitsOnly)) {
    return {
      isValid: false,
      error: isAm
        ? 'ስልክ ቁጥር ከ"+" በኋላ አሃዞችን ብቻ መያዝ አለበት'
        : 'Phone number must contain only numeric digits after "+".'
    };
  }

  const normalized = '+' + digitsOnly;

  // Match calling code
  let matchedCountry: CountryInfo | undefined;
  for (const code of SORTED_DIAL_CODES) {
    if (normalized.startsWith(code)) {
      // If selectedCountryCode matches this dialCode, prefer selected
      const selected = COUNTRY_BY_CODE[selectedCountryCode];
      if (selected && selected.dialCode === code) {
        matchedCountry = selected;
      } else {
        matchedCountry = COUNTRIES.find(c => c.dialCode === code);
      }
      break;
    }
  }

  if (matchedCountry) {
    const dialCodeLength = matchedCountry.dialCode.length - 1; // remove '+'
    const nationalNumber = digitsOnly.slice(dialCodeLength);

    if (nationalNumber.length < matchedCountry.minLength) {
      return {
        isValid: false,
        error: isAm
          ? `የ${matchedCountry.nameAm || matchedCountry.name} ስልክ ቁጥር በጣም አጭር ነው (ቢያንስ ${matchedCountry.minLength} አሃዞች ያስፈልጋል)`
          : `Phone number for ${matchedCountry.name} is too short (minimum ${matchedCountry.minLength} national digits required).`,
        country: matchedCountry
      };
    }

    if (nationalNumber.length > matchedCountry.maxLength) {
      return {
        isValid: false,
        error: isAm
          ? `የ${matchedCountry.nameAm || matchedCountry.name} ስልክ ቁጥር ከሚፈቀደው በላይ ረጅም ነው (ከፍተኛው ${matchedCountry.maxLength} አሃዞች)`
          : `Phone number for ${matchedCountry.name} is too long (maximum ${matchedCountry.maxLength} national digits allowed).`,
        country: matchedCountry
      };
    }

    // Specific country pattern checks if defined
    if (matchedCountry.pattern && !matchedCountry.pattern.test(nationalNumber)) {
      return {
        isValid: false,
        error: isAm
          ? `ትክክለኛ የ${matchedCountry.nameAm || matchedCountry.name} ስልክ ቁጥር ያስገቡ (ለምሳሌ፡ ${matchedCountry.example})`
          : `Invalid format for ${matchedCountry.name}. Example: ${matchedCountry.example}`,
        country: matchedCountry
      };
    }

    return {
      isValid: true,
      normalized,
      country: matchedCountry
    };
  }

  // Fallback for ANY country calling code under ITU E.164
  // ITU-T E.164 recommends max 15 digits total, country code 1-3 digits, subscriber number 4-12 digits
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      isValid: false,
      error: isAm
        ? `ዓለም አቀፍ ስልክ ቁጥር በጠቅላላው ከ7 እስከ 15 አሃዞች መሆን አለበት (ያስገቡት: ${digitsOnly.length} አሃዝ)`
        : `International phone numbers must contain between 7 and 15 digits (entered: ${digitsOnly.length}).`
    };
  }

  return {
    isValid: true,
    normalized
  };
}
