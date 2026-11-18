import React from 'react';
import { ShieldCheck, Award, MapPin, Phone, Users, Clock } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

export const AboutPage: React.FC = () => {
  const { t } = useLanguageStore();

  return (
    <div className="min-h-screen bg-lime text-forge text-left">
      {/* Top Banner Header */}
      <div className="bg-brushed-steel text-white border-b-4 border-brand-red py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <h1 className="text-4xl sm:text-5xl font-medium text-white">
            {t('about.title')}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-white font-display">
            {t('about.subtitle')}
          </p>
          <p className="text-sm sm:text-base text-forge-200 leading-relaxed max-w-2xl">
            {t('about.desc')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* 3 Grid Highlights (Philosophy, Craftsmen, Quality) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Philosophy */}
          <div className="border-t-2 border-forge pt-6 space-y-4">
            <div className="w-10 h-10 flex items-center justify-center text-brand-red">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-forge  tracking-tight">
              {t('about.philosophy')}
            </h3>
            <p className="text-xs sm:text-sm text-forge-700 leading-relaxed">
              {t('about.philosophyDesc')}
            </p>
          </div>

          {/* Card 2: Craftsmen */}
          <div className="border-t-2 border-forge pt-6 space-y-4">
            <div className="w-10 h-10 flex items-center justify-center text-brand-red">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-forge  tracking-tight">
              {t('about.expert')}
            </h3>
            <p className="text-xs sm:text-sm text-forge-700 leading-relaxed">
              {t('about.expertDesc')}
            </p>
          </div>

          {/* Card 3: Quality */}
          <div className="border-t-2 border-forge pt-6 space-y-4">
            <div className="w-10 h-10 flex items-center justify-center text-brand-red">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-forge  tracking-tight">
              {t('about.quality')}
            </h3>
            <p className="text-xs sm:text-sm text-forge-700 leading-relaxed">
              {t('about.qualityDesc')}
            </p>
          </div>
        </div>

        {/* Workshop Location & Credentials Container */}
        <div className="rounded-sm border border-lime-300 bg-lime-50 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Visit Details */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-medium text-forge  tracking-tight">
                {t('about.visitUs')}
              </h2>
              <p className="text-xs sm:text-sm text-forge-700 leading-relaxed">
                {t('about.visitDesc')}
              </p>
              
              <div className="space-y-3 pt-2 text-xs sm:text-sm text-forge-700">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <span className="font-medium">{t('contact.addressVal')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <a href="tel:+251926629999" className="hover:text-brand-red font-semibold text-forge transition-colors">
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
            <div className="bg-white p-6 sm:p-8 rounded-sm border border-lime-300 space-y-4 text-xs text-forge-700 shadow-xs">
              <h4 className="text-sm font-bold text-forge   border-b border-lime-300 pb-3">
                {t('about.credentialsTitle')}
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-lime-300">
                  <span className="text-forge-500">{t('about.companyName')}</span>
                  <span className="font-bold text-forge text-right">{t('about.companyNameVal')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-lime-300">
                  <span className="text-forge-500">{t('about.registration')}</span>
                  <span className="font-bold text-timber">{t('about.registrationVal')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-lime-300">
                  <span className="text-forge-500">{t('about.facility')}</span>
                  <span className="font-bold text-forge text-right">{t('about.facilityVal')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-lime-300">
                  <span className="text-forge-500">{t('about.qualityAssurance')}</span>
                  <span className="font-bold text-forge text-right">{t('about.qualityAssuranceVal')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-forge-500">{t('about.serviceArea')}</span>
                  <span className="font-bold text-forge text-right">{t('about.serviceAreaVal')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
