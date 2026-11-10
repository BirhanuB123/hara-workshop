import React from 'react';
import { ShieldCheck, Award, MapPin, Phone, Users, Clock } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

export const AboutPage: React.FC = () => {
  const { t } = useLanguageStore();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 text-left">
      {/* Top Banner Header */}
      <div className="bg-[#FAF7F2] border-b border-stone-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center space-x-2 bg-brand-red/10 border border-brand-red/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-red uppercase tracking-wider">
            {t('about.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 uppercase tracking-tight">
            {t('about.title')}
          </h1>
          <p className="text-sm sm:text-base font-bold text-stone-800">
            {t('about.subtitle')}
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
            {t('about.desc')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* 3 Grid Highlights (Philosophy, Craftsmen, Quality) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Philosophy */}
          <div className="bg-white border border-stone-200/90 p-8 rounded-2xl space-y-4 shadow-xs hover:shadow-md hover:border-brand-red/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
              {t('about.philosophy')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {t('about.philosophyDesc')}
            </p>
          </div>

          {/* Card 2: Craftsmen */}
          <div className="bg-white border border-stone-200/90 p-8 rounded-2xl space-y-4 shadow-xs hover:shadow-md hover:border-brand-red/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
              {t('about.expert')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {t('about.expertDesc')}
            </p>
          </div>

          {/* Card 3: Quality */}
          <div className="bg-white border border-stone-200/90 p-8 rounded-2xl space-y-4 shadow-xs hover:shadow-md hover:border-brand-red/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
              {t('about.quality')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {t('about.qualityDesc')}
            </p>
          </div>
        </div>

        {/* Workshop Location & Credentials Container */}
        <div className="rounded-3xl border border-stone-200/90 bg-[#FAF7F2] p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Visit Details */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-brand-red uppercase tracking-wider">
                {t('about.facilities')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-tight">
                {t('about.visitUs')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {t('about.visitDesc')}
              </p>
              
              <div className="space-y-3 pt-2 text-xs sm:text-sm text-stone-700">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <span className="font-medium">{t('contact.addressVal')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <a href="tel:+251926629999" className="hover:text-brand-red font-semibold text-stone-900 transition-colors">
                    +251 926 629 999
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <span className="font-medium">{t('contact.hoursVal')}</span>
                </div>
              </div>
            </div>

            {/* Right: Compliance Credentials Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 space-y-4 text-xs text-stone-700 shadow-xs">
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-3">
                {t('about.credentialsTitle')}
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">{t('about.companyName')}</span>
                  <span className="font-bold text-stone-900 text-right">{t('about.companyNameVal')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">{t('about.registration')}</span>
                  <span className="font-bold text-emerald-700">{t('about.registrationVal')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">{t('about.facility')}</span>
                  <span className="font-bold text-stone-900 text-right">{t('about.facilityVal')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">{t('about.qualityAssurance')}</span>
                  <span className="font-bold text-stone-900 text-right">{t('about.qualityAssuranceVal')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-stone-500">{t('about.serviceArea')}</span>
                  <span className="font-bold text-stone-900 text-right">{t('about.serviceAreaVal')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
