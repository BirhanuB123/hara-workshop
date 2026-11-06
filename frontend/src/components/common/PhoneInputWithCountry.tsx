import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import { 
  COUNTRIES, 
  COUNTRY_BY_CODE, 
  CountryInfo, 
  validatePhoneNumber, 
  detectCountryFromPhone 
} from '../../utils/phoneValidation';
import { useLanguageStore } from '../../store/languageStore';

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (phone: string, isValid: boolean, countryCode: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  onBlur,
  error,
  label,
  required = true,
  disabled = false,
  placeholder,
  className = '',
  id = 'phone-input',
}) => {
  const { language } = useLanguageStore();
  const isAm = language === 'am';

  // Selected country state (defaults to Ethiopia 'ET')
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRY_BY_CODE['ET'] || COUNTRIES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [touched, setTouched] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Sync selected country if value changes from outside (e.g. autofill or edit)
  useEffect(() => {
    if (value) {
      const detected = detectCountryFromPhone(value);
      if (detected && detected.code !== selectedCountry.code) {
        setSelectedCountry(detected);
      }
    }
  }, [value]);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameAm && c.nameAm.toLowerCase().includes(q)) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // Handle selecting a country from the dropdown
  const handleSelectCountry = (country: CountryInfo) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');

    if (country.code === 'ET') {
      // Ethiopia: allow 09XXXXXXXX or keep existing if starting with 09 / +251
      if (!value || value.startsWith('+')) {
        const nextVal = '+251';
        const res = validatePhoneNumber(nextVal, 'ET', language);
        onChange(nextVal, res.isValid, 'ET');
      }
    } else {
      // International country: automatically populate country calling code
      const nextVal = `${country.dialCode}`;
      const res = validatePhoneNumber(nextVal, country.code, language);
      onChange(nextVal, res.isValid, country.code);
    }

    setTimeout(() => phoneInputRef.current?.focus(), 50);
  };

  // Handle typing in phone input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Disallow letters; allow digits, '+', spaces, and hyphens
    // If '+' is typed, it must only be at the first position
    if (raw.startsWith('+')) {
      const rest = raw.slice(1).replace(/[^\d\s\-]/g, '');
      raw = '+' + rest;
    } else {
      raw = raw.replace(/[^\d\s\-]/g, '');
    }

    // Auto-detect country if user typed/pasted a new international prefix
    if (raw.startsWith('+')) {
      const detected = detectCountryFromPhone(raw);
      if (detected && detected.code !== selectedCountry.code) {
        setSelectedCountry(detected);
      }
    } else if (raw.startsWith('09') || raw.startsWith('07')) {
      if (selectedCountry.code !== 'ET') {
        setSelectedCountry(COUNTRY_BY_CODE['ET']);
      }
    }

    const validation = validatePhoneNumber(raw, selectedCountry.code, language);
    onChange(raw, validation.isValid, selectedCountry.code);
  };

  const handleBlur = () => {
    setTouched(true);
    if (onBlur) onBlur();
  };

  // Determine current validation state
  const currentValidation = validatePhoneNumber(value, selectedCountry.code, language);
  const isCurrentlyValid = currentValidation.isValid && Boolean(value.trim());
  const displayError = error || (touched && value.trim() && !currentValidation.isValid ? currentValidation.error : undefined);

  // Dynamic placeholder
  const dynamicPlaceholder = placeholder || (selectedCountry.code === 'ET' 
    ? (isAm ? '0912345678 ወይም +251912345678' : '0912345678 or +251912345678')
    : selectedCountry.example);

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          {label || (isAm ? 'ስልክ ቁጥር' : 'Phone Number')} {required && <span className="text-brand-red">*</span>}
        </label>
        
        {isCurrentlyValid ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>{isAm ? 'ትክክለኛ' : 'Valid'}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-stone-400">
            {selectedCountry.code === 'ET' ? (
              value.startsWith('+') ? `${value.replace(/\s/g, '').length}/13` : `${value.replace(/\D/g, '').length}/10`
            ) : (
              `${selectedCountry.dialCode} (${selectedCountry.minLength}-${selectedCountry.maxLength} digits)`
            )}
          </span>
        )}
      </div>

      {/* Main Input Group */}
      <div className="relative flex rounded-xl shadow-xs">
        {/* Country Selector Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`h-full flex items-center gap-1.5 px-3 py-2.5 bg-stone-50 hover:bg-stone-100 border border-r-0 rounded-l-xl text-stone-800 text-xs font-semibold transition select-none ${
              displayError ? 'border-red-500' : 'border-stone-300'
            }`}
            title={selectedCountry.name}
            aria-label="Select Country"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="font-mono text-xs font-bold text-stone-700">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* Searchable Dropdown Popover */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col text-xs animate-fadeIn">
              {/* Search Bar */}
              <div className="p-2 border-b border-stone-100 bg-stone-50/80 sticky top-0 z-10">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAm ? 'አገር ወይም ኮድ ፈልግ...' : 'Search country or code...'}
                    className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="overflow-y-auto max-h-56 divide-y divide-stone-100 scrollbar-thin">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center text-stone-400">
                    <Globe className="w-5 h-5 mx-auto mb-1 text-stone-300" />
                    <span>{isAm ? 'ምንም አገር አልተገኘም' : 'No country found'}</span>
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.code === selectedCountry.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50 transition ${
                          isSelected ? 'bg-brand-red/5 font-bold text-brand-red' : 'text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate">
                            {isAm && c.nameAm ? c.nameAm : c.name}
                          </span>
                        </div>
                        <span className="font-mono text-stone-500 text-[11px] shrink-0 ml-2">
                          {c.dialCode}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input Box */}
        <input
          ref={phoneInputRef}
          id={id}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={dynamicPlaceholder}
          className={`w-full bg-white border rounded-r-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red placeholder-stone-400 transition ${
            displayError ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
          }`}
        />
      </div>

      {/* Helper text or Error message */}
      {displayError ? (
        <p className="text-[11px] text-red-600 font-medium leading-tight pt-0.5">
          {displayError}
        </p>
      ) : (
        <p className="text-[10px] text-stone-400 leading-tight">
          {selectedCountry.code === 'ET'
            ? (isAm 
                ? 'የኢትዮጵያ ስልክ በ09... (10 አሃዞች) ወይም በ+2519... (13 ፊደላት) ማስገባት ይችላሉ።' 
                : 'Ethiopian customers can enter 09... (10 digits) or +2519... (13 chars).')
            : (isAm
                ? `የ${selectedCountry.nameAm || selectedCountry.name} ዓለም አቀፍ ስልክ ከ"+" ጋር ያስገቡ።`
                : `Enter international number with '+' prefix (e.g. ${selectedCountry.example}).`)}
        </p>
      )}
    </div>
  );
};
