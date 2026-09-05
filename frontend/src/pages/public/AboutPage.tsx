import React from 'react';
import { ShieldCheck, Award, MapPin, Phone, Users, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-red uppercase tracking-widest">About Our Workshop</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
          HARA WORKSHOP
        </h1>
        <p className="text-lg text-gray-300 font-medium">
          Metal and Wood Solution • Bole Arabsa, Addis Ababa
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Founded with a steadfast commitment to structural durability, refined aesthetics, and Ethiopian craftsmanship. We engineer architectural steel structures and handcraft bespoke solid wood furniture for residences, commercial enterprises, and institutions.
        </p>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-metal-900 border border-metal-800 p-8 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase">Our Philosophy</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            No shortcuts on gauge, joints, or finish. We select high-grade structural steel and seasoned local and imported hardwoods to ensure our work lasts generations.
          </p>
        </div>

        <div className="bg-metal-900 border border-metal-800 p-8 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase">Expert Craftsmen</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Our team comprises certified welders, veteran carpenters, architectural draftsmen, and finishing specialists working collaboratively in our Bole Arabsa workshop.
          </p>
        </div>

        <div className="bg-metal-900 border border-metal-800 p-8 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase">10-Stage Quality</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Every order progresses through strict quality checkpoints—from raw material inspection and laser cutting to final coat curing and site installation.
          </p>
        </div>
      </div>

      {/* Workshop Location & Visit Details */}
      <div className="bg-metal-900 border border-metal-800 rounded-2xl p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-left">
            <span className="text-xs font-bold text-brand-red uppercase tracking-wider">Workshop Facilities</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">
              Visit Us in Bole Arabsa
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              We welcome clients, architects, and interior designers to visit our active workshop floor. Review material samples, examine weld beads, and discuss custom designs directly with our fabricators.
            </p>
            <div className="space-y-2.5 pt-2 text-sm text-gray-300">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-brand-red" />
                <span>Bole Arabsa, Near Water Tanker, Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-brand-red" />
                <span>+251 926 629 999</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-brand-red" />
                <span>Monday - Saturday: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
            <div className="pt-4">
              <Link
                to="/request-quote"
                className="inline-flex items-center bg-brand-red hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>

          <div className="bg-metal-950 p-6 rounded-xl border border-metal-800 space-y-4 text-xs text-gray-300">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              Corporate & Compliance Credentials
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-metal-900">
                <span className="text-gray-400">Company Name:</span>
                <span className="font-semibold text-white">HARA WORKSHOP (Metal & Wood Solution)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-metal-900">
                <span className="text-gray-400">Registration:</span>
                <span className="font-semibold text-emerald-400">Fully Licensed in Ethiopia</span>
              </div>
              <div className="flex justify-between py-1 border-b border-metal-900">
                <span className="text-gray-400">Invoicing:</span>
                <span className="font-semibold text-white">Official 15% VAT Invoicing Available</span>
              </div>
              <div className="flex justify-between py-1 border-b border-metal-900">
                <span className="text-gray-400">Payment Channels:</span>
                <span className="font-semibold text-white">Telebirr, CBE Birr, Bank Transfer, Cash</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Service Area:</span>
                <span className="font-semibold text-white">Addis Ababa & Regional Projects</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
