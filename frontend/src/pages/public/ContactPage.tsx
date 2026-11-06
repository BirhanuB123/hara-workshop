import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';
import { contactApi } from '../../services/api';
import { PhoneInputWithCountry } from '../../components/common/PhoneInputWithCountry';
import { validatePhoneNumber } from '../../utils/phoneValidation';

export const ContactPage: React.FC = () => {
  const { t, language } = useLanguageStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { name?: string; phone?: string; message?: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = t('contact.nameRequired') || 'Customer name is required.';
    }
    const phoneClean = formData.phone.trim();
    if (!phoneClean) {
      newErrors.phone = t('contact.phoneRequired') || 'Phone number is required.';
    } else if (!/^\d+$/.test(phoneClean)) {
      newErrors.phone = language === 'am' ? 'ቁጥሮች (0–9) ብቻ ይፈቀዳሉ' : 'Allow only numeric digits (0–9)';
    } else if (phoneClean.length !== 10 && phoneClean.length !== 12) {
      newErrors.phone = language === 'am'
        ? `ስልክ ቁጥር በትክክል 10 ወይም 12 አሃዞች መሆን አለበት (ያስገቡት: ${phoneClean.length})`
        : `Phone number must contain exactly 10 or 12 digits (entered: ${phoneClean.length})`;
    }
    if (!formData.message.trim()) {
      newErrors.message = t('contact.messageRequired') || 'Message / inquiry is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') {
      finalValue = value;
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await contactApi.sendMessage({
        name: formData.name.trim(),
        phone: validatePhoneNumber(formData.phone, undefined, language).normalized || formData.phone.trim(),
        email: formData.email.trim() || undefined,
        message: formData.message.trim(),
      });

      if (res.data?.success) {
        setSent(true);
        // Only clear form after confirmed delivery
        setFormData({
          name: '',
          phone: '',
          email: '',
          message: '',
        });
        setErrors({});
      } else {
        setSubmitError(res.data?.error || t('contact.deliveryError'));
      }
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.errors) {
        setErrors(errData.errors);
      }
      setSubmitError(errData?.error || errData?.message || t('contact.deliveryError'));
      // Keep form inputs preserved so the customer can retry without retyping!
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setSubmitError(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 select-none text-left">
      {/* Top Banner Header */}
      <div className="bg-[#FAF7F2] border-b border-stone-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center space-x-2 bg-brand-red/10 border border-brand-red/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-red uppercase tracking-wider">
            {t('contact.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 uppercase tracking-tight">
            {t('contact.title')}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details & Hours Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-6 text-left shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-3">
                {t('contact.detailsTitle')}
              </h3>

              <div className="space-y-5 text-xs sm:text-sm text-stone-700">
                {/* Physical Location */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-red-50 text-brand-red flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{t('contact.addressLabel')}</p>
                    <p className="text-stone-600 mt-0.5">{t('contact.addressBole')}</p>
                    {language === 'en' && (
                      <p className="text-stone-500 text-xs mt-0.5">ቦሌ አረብሳ፣ የውሃ ታንከር አጠገብ</p>
                    )}
                    <p className="text-stone-500 text-xs mt-0.5">{t('contact.addressCity')}</p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-red-50 text-brand-red flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{t('contact.phoneLabel')}</p>
                    <a 
                      href="tel:+251926629999" 
                      className="text-brand-red hover:underline font-bold block text-sm mt-0.5"
                    >
                      +251 926 629 999
                    </a>
                  </div>
                </div>

                {/* Telegram */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-sky-50 text-[#229ED9] flex-shrink-0 mt-0.5">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="w-full">
                    <p className="font-bold text-stone-900">{t('contact.telegramLabel')}</p>
                    <p className="text-xs text-stone-500 mt-0.5 mb-1.5">
                      {language === 'am' ? 'የስራ አስኪያጅ ሳሙኤል ቀጥተኛ ቴሌግራም' : 'Direct Workshop Manager Contact'}
                    </p>
                    <a 
                      href="https://t.me/Manager_Samuel_A" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] rounded-lg border border-[#229ED9]/30 text-xs font-bold transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>@Manager_Samuel_A</span>
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-red-50 text-brand-red flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{t('contact.emailLabel')}</p>
                    <a 
                      href="mailto:info@haraworkshop.com" 
                      className="text-stone-700 hover:text-brand-red font-medium transition-colors mt-0.5 block"
                    >
                      info@haraworkshop.com
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-700 flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{t('contact.hoursLabel')}</p>
                    <p className="text-stone-600 mt-0.5">{t('contact.hoursVal')}</p>
                    <p className="text-stone-400 text-xs mt-0.5">{t('contact.closedVal')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Message Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 text-left shadow-xs">
              <h3 className="text-base font-bold text-stone-900 uppercase tracking-wider mb-1">
                {t('contact.formTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mb-6">
                {t('contact.formSubtitle')}
              </p>

              {sent ? (
                <div className="p-8 sm:p-10 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-bold text-stone-900">{t('contact.successTitle')}</h4>
                    <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                      {t('contact.successDesc')}
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#229ED9]/10 text-[#229ED9] rounded-full text-xs font-semibold border border-[#229ED9]/25">
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('contact.telegramSuccess')}</span>
                    </span>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow"
                    >
                      {t('contact.sendAnother')}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-bold">{language === 'am' ? 'መልዕክት መላክ አልተሳካም' : 'Message Delivery Notice'}</p>
                        <p className="text-stone-700 leading-relaxed">{submitError}</p>
                        <p className="text-stone-500 text-xs">
                          {language === 'am'
                            ? 'የእርስዎ መልዕክት አልተሰረዘም። እባክዎ እንደገና ይሞክሩ ወይም በቀጥታ በስልክ/ቴሌግራም ያግኙን።'
                            : 'Your form input has been preserved. You can retry sending or reach us directly via Telegram or phone.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        {t('contact.yourName')} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t('contact.namePlaceholder')}
                        className={`w-full bg-white border ${
                          errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                        } rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-xs transition-colors`}
                      />
                      {errors.name && (
                        <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <PhoneInputWithCountry
                        value={formData.phone}
                        onChange={(phone, isValid, countryCode) => {
                          setFormData((prev) => ({ ...prev, phone }));
                          if (errors.phone) {
                            const res = validatePhoneNumber(phone, countryCode, language);
                            if (res.isValid) {
                              setErrors((prev) => ({ ...prev, phone: undefined }));
                            }
                          }
                        }}
                        onBlur={() => {
                          const res = validatePhoneNumber(formData.phone, undefined, language);
                          if (!res.isValid && formData.phone.trim()) {
                            setErrors((prev) => ({ ...prev, phone: res.error }));
                          }
                        }}
                        error={errors.phone}
                        label={t('contact.yourPhone')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      {t('contact.yourEmail')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contact.emailPlaceholder')}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      {t('contact.message')} *
                    </label>
                    <textarea
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder={t('contact.msgPlaceholder')}
                      className={`w-full bg-white border ${
                        errors.message ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                      } rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-xs transition-colors`}
                    />
                    {errors.message && (
                      <p className="text-red-600 text-xs mt-1">{errors.message}</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-full text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-95 inline-flex items-center space-x-2 ${
                        submitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('contact.sending')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('contact.sendBtn')}</span>
                        </>
                      )}
                    </button>

                    <p className="text-stone-400 text-xs">
                      {language === 'am'
                        ? 'መልዕክትዎ በቀጥታ ለስራ አስኪያጃችን ቴሌግራም ይደርሳል'
                        : 'Dispatched directly to the workshop admin Telegram'}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

