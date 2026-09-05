import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Connect With Us</span>
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Visit Our Workshop in Addis Ababa
        </h1>
        <p className="text-sm text-gray-400">
          Located in Bole Arabsa near the Water Tanker. We invite clients, project managers, and interior designers to discuss custom fabrication directly with our master fabricators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info & Hours */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-6 text-left">
            <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              Workshop Contact Details
            </h3>

            <div className="space-y-4 text-xs text-gray-300">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Workshop Address</p>
                  <p className="text-gray-400">Bole Arabsa, Near Water Tanker</p>
                  <p className="text-gray-400">ቦሌ አረብሳ፣ የውሃ ታንከር አጠገብ</p>
                  <p className="text-gray-400">Addis Ababa, Ethiopia</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Telephone & Direct Inquiries</p>
                  <a href="tel:+251926629999" className="text-brand-red hover:underline font-semibold block text-sm">
                    +251 926 629 999
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Send className="w-5 h-5 text-[#229ED9] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Telegram Channel & Chat</p>
                  <a 
                    href="https://t.me/haraworkshop" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#229ED9] hover:underline block"
                  >
                    @haraworkshop
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Email</p>
                  <a href="mailto:info@haraworkshop.com" className="text-gray-300 hover:text-white">
                    info@haraworkshop.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Operating Hours</p>
                  <p className="text-gray-400">Monday - Saturday: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-400">Sunday: Closed (Emergency consultations on call)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 sm:p-8 text-left">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">
              Send Direct Message
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Have a question regarding dimensions, custom materials, or visiting our floor? Drop us a note.
            </p>

            {sent ? (
              <div className="p-6 bg-emerald-900/20 border border-emerald-700/40 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Thank You for Your Message!</h4>
                <p className="text-xs text-gray-300">
                  Our workshop manager will review your inquiry and reach out to you within a few business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dawit Tadesse"
                      className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number (+251) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0911234567"
                      className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="dawit@example.com"
                    className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Message / Inquiry *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can our workshop help with your metal or woodworking needs?"
                    className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
