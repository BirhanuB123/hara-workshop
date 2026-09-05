import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calculator, 
  Send, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  Truck, 
  Wrench,
  Layers,
  ArrowRight
} from 'lucide-react';
import { quotesApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const RequestQuotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const serviceParam = searchParams.get('service') || '';
  const initialServiceType = serviceParam.toLowerCase().includes('metal + wood') || serviceParam.toLowerCase().includes('hybrid')
    ? 'HYBRID'
    : serviceParam.toLowerCase().includes('wood')
    ? 'WOOD'
    : serviceParam.toLowerCase().includes('metal')
    ? 'METAL'
    : 'HYBRID';

  const [projectTitle, setProjectTitle] = useState(
    serviceParam || searchParams.get('product') || searchParams.get('reference') || ''
  );
  const [serviceType, setServiceType] = useState(initialServiceType);
  const [materialPreference, setMaterialPreference] = useState('Mild Steel & Solid Hardwood');
  const [description, setDescription] = useState('');
  
  // Dimensions in cm
  const [lengthCm, setLengthCm] = useState<number>(200);
  const [widthCm, setWidthCm] = useState<number>(100);
  const [heightCm, setHeightCm] = useState<number>(80);
  const [quantity, setQuantity] = useState<number>(1);

  // Logistics
  const [deliveryRequired, setDeliveryRequired] = useState(true);
  const [installationRequired, setInstallationRequired] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.customer_profile?.address || '');
  const [preferredDate, setPreferredDate] = useState('');

  // Contact details if guest
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // State
  const [submitting, setSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Instant Cost Estimator (Formula-based rough preview in ETB)
  const calculateEstimate = () => {
    const volumeM3 = ((lengthCm || 1) * (widthCm || 1) * (heightCm || 1)) / 1000000;
    const baseRate = serviceType === 'METAL' ? 18000 : serviceType === 'WOOD' ? 24000 : 21000;
    let est = volumeM3 * baseRate * (quantity || 1);
    if (est < 4500) est = 4500; // minimum fabrication batch baseline
    if (deliveryRequired) est += 1500;
    if (installationRequired) est += 2000;
    return Math.round(est);
  };

  const estimatedTotal = calculateEstimate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload: any = {
        project_title: projectTitle || 'Custom Workshop Project',
        service_type: serviceType,
        material_preference: materialPreference,
        description: description || 'Custom specifications as detailed in dimensions.',
        length_cm: lengthCm ? Number(lengthCm) : null,
        width_cm: widthCm ? Number(widthCm) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        quantity: Number(quantity) || 1,
        delivery_required: deliveryRequired,
        installation_required: installationRequired,
        delivery_address: deliveryAddress,
        preferred_completion_date: preferredDate || null,
      };

      // If user is not logged in, pass contact info in description / customer notes
      if (!isAuthenticated) {
        payload.customer_notes = `Guest Contact Info - Name: ${guestName} | Email: ${guestEmail} | Phone: ${guestPhone}`;
      }

      const res = await quotesApi.create(payload);
      setSubmittedQuote(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        'Failed to submit quote request. Please ensure you are logged in or provide valid details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedQuote) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase">Quotation Request Submitted!</h2>
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-metal-800 pb-3">
            <span className="text-xs text-gray-400">Quote Tracking Number:</span>
            <span className="text-base font-black text-brand-red font-mono">{submittedQuote.quote_number}</span>
          </div>
          <p className="text-xs text-gray-300">
            Our engineering team at Bole Arabsa workshop has received your request. We will calculate the precise material requirements, labor hours, and issue an itemized proposal with CAD drawings within 24-48 hours.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link
              to="/portal/quotes"
              className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider"
            >
              <span>View Quote in Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider"
            >
              <span>Sign In / Create Account to Track</span>
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-metal-800 hover:bg-metal-700 text-white font-semibold py-3 px-6 rounded-lg text-xs"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Interactive Estimation Engine</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Request a Custom Workshop Quotation
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Provide your project dimensions, material preferences, and delivery specifications for an itemized proposal.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-700/50 flex items-center space-x-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Project Details */}
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              1. Project Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Project Title / Name *</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Modern Steel Gate or Executive Desk"
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Service Type *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="METAL">Metal Works (Fabrication & Welding)</option>
                  <option value="WOOD">Wood Works (Carpentry & Custom Furniture)</option>
                  <option value="HYBRID">Hybrid Metal + Wood Construction</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Material Preference</label>
              <input
                type="text"
                value={materialPreference}
                onChange={(e) => setMaterialPreference(e.target.value)}
                placeholder="e.g. Mild steel hollow sections, Mahogany hardwood, tempered glass"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Detailed Requirements & Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify design details, paint/powder-coat colors, lock specifications, site constraints..."
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Dimension Calculator */}
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              2. Dimensions & Quantity (Centimeters)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="10"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Width (cm)</label>
                <input
                  type="number"
                  min="10"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="10"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
            </div>
          </div>

          {/* Logistics & Site Installation */}
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              3. Delivery & Site Installation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 bg-metal-950 border border-metal-800 p-3 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryRequired}
                  onChange={(e) => setDeliveryRequired(e.target.checked)}
                  className="rounded text-brand-red focus:ring-0"
                />
                <span className="text-xs font-semibold text-white">Workshop Delivery Required</span>
              </label>

              <label className="flex items-center space-x-3 bg-metal-950 border border-metal-800 p-3 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={installationRequired}
                  onChange={(e) => setInstallationRequired(e.target.checked)}
                  className="rounded text-brand-red focus:ring-0"
                />
                <span className="text-xs font-semibold text-white">On-Site Installation Service</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Addis Ababa Site / Delivery Address</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. Bole Atlas, Kazanchis, CMC, or Bole Arabsa site"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Guest Contact fields if not authenticated */}
          {!isAuthenticated && (
            <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
                4. Your Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Abebe Kebede"
                    className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="abebe@example.com"
                    className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number (+251) *</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="0911234567"
                    className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Estimation Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 sticky top-24 space-y-4">
            <div className="flex items-center space-x-2 text-brand-red">
              <Calculator className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Live Cost Baseline
              </h3>
            </div>

            <div className="p-4 bg-metal-950 border border-metal-800 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Calculated Volume:</span>
                <span className="font-mono text-white">
                  {(((lengthCm || 1) * (widthCm || 1) * (heightCm || 1)) / 1000000).toFixed(2)} m³
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Quantity:</span>
                <span className="font-mono text-white">{quantity} unit(s)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Workshop Delivery:</span>
                <span className="font-mono text-white">{deliveryRequired ? 'Included' : 'Customer Pickup'}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>On-Site Fitting:</span>
                <span className="font-mono text-white">{installationRequired ? 'Included' : 'Self-Install'}</span>
              </div>
              <div className="pt-3 border-t border-metal-800 flex justify-between items-baseline">
                <span className="font-bold text-white uppercase">Est. Baseline:</span>
                <span className="text-xl font-black text-brand-red">
                  {estimatedTotal.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-snug">
              * Note: Exact final quotation with itemized material cost and labor schedule will be prepared by our senior engineers upon blueprint review.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Quotation Request</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-metal-500">
              <span>Bole Arabsa Workshop • +251 926 629 999</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
