import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { 
  Calculator, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Wrench, 
  Layers, 
  ArrowRight, 
  Upload, 
  FileText, 
  X, 
  FileCode, 
  Image as ImageIcon,
  Check,
  ShieldCheck,
  Calendar,
  MapPin,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { productsApi, quotesApi } from '../../services/api';
import { Product } from '../../types';
import { useLanguageStore } from '../../store/languageStore';
import { useProductOrderStore } from '../../store/productOrderStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';
import { getProductImageUrl, mapServiceCategoryToDropdown } from '../../utils/productUtils';
import { PhoneInputWithCountry } from '../../components/common/PhoneInputWithCountry';
import { validatePhoneNumber } from '../../utils/phoneValidation';

export const RequestQuotePage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguageStore();
  const { selectedProduct: storeProduct, setSelectedProduct, clearSelectedProduct } = useProductOrderStore();

  // 1. URL Query Parameters
  const productIdParam = searchParams.get('productId') || searchParams.get('id') || '';
  const skuParam = searchParams.get('sku') || searchParams.get('code') || '';
  const nameParam = searchParams.get('name') || searchParams.get('product') || '';
  const serviceParam = searchParams.get('service') || '';
  const materialParam = searchParams.get('material') || '';
  const imageParam = searchParams.get('image') || '';

  // Synchronously resolve candidate product from route state, query params, store, or in-memory catalog
  const resolveCandidate = (): Product | null => {
    // A. Route state from <Link state={{ product }}> or navigate(..., { state: { product } })
    const stateProd = (location.state as any)?.product as Product | undefined;
    if (stateProd && stateProd.name) return stateProd;

    // B. Lookup in CATALOG_PRODUCTS by SKU, ID, slug, or Name
    const lookupKey = (skuParam || productIdParam || nameParam).trim().toLowerCase();
    if (lookupKey) {
      const match = CATALOG_PRODUCTS.find(
        (p) =>
          (p.sku && p.sku.toLowerCase() === lookupKey) ||
          (p.id && p.id.toLowerCase() === lookupKey) ||
          (p.slug && p.slug.toLowerCase() === lookupKey) ||
          (p.name && p.name.toLowerCase() === lookupKey)
      );
      if (match) return match;
    }

    // C. Check persistent store (sessionStorage)
    const stored = storeProduct || useProductOrderStore.getState().selectedProduct;
    if (stored) {
      if (!lookupKey) return stored;
      if (
        (stored.sku && stored.sku.toLowerCase() === lookupKey) ||
        (stored.id && stored.id.toLowerCase() === lookupKey) ||
        (stored.name && stored.name.toLowerCase() === lookupKey)
      ) {
        return stored;
      }
    }

    // D. Synthetic fallback if URL has at least name or sku
    if (nameParam || skuParam) {
      return {
        id: productIdParam || 'custom-model',
        name: nameParam || 'Custom Item',
        sku: skuParam || 'CUSTOM',
        category: '',
        category_name: '',
        service_category_display: serviceParam,
        description: '',
        material: materialParam,
        primary_image: imageParam,
        images: imageParam ? [{ id: '1', image: imageParam, is_primary: true }] : [],
      } as unknown as Product;
    }

    return null;
  };

  const initialProd = resolveCandidate();
  const [selectedProduct, setLocalSelectedProduct] = useState<Product | null>(initialProd);
  const [productLoading, setProductLoading] = useState(false);

  // 2. Customer Information (always blank and editable by customer)
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('ET');
  const [email, setEmail] = useState('');

  // 3. Project Specifications (pre-filled from selected product, editable by customer)
  const [projectTitle, setProjectTitle] = useState(initialProd ? initialProd.name : (nameParam || ''));
  const [serviceCategory, setServiceCategory] = useState<string>(
    initialProd
      ? mapServiceCategoryToDropdown(initialProd.service_category, initialProd.service_category_display)
      : mapServiceCategoryToDropdown(serviceParam, serviceParam)
  );
  const [description, setDescription] = useState(
    initialProd
      ? (initialProd.description || initialProd.short_description || `Order request for ${initialProd.name} (${initialProd.sku}).`)
      : ''
  );
  const [materialPreference, setMaterialPreference] = useState(
    initialProd ? (initialProd.material || '') : materialParam
  );
  const [customerNotes, setCustomerNotes] = useState('');

  // 4. Order Quantity (editable by customer, required)
  const [quantity, setQuantity] = useState<number>(1);

  // 5. Architectural Drawings & Reference Files (Section 14)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 6. Delivery & Site Installation (Section 15)
  const [deliveryRequired, setDeliveryRequired] = useState(true);
  const [installationRequired, setInstallationRequired] = useState(false);
  const [siteLocation, setSiteLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');

  // Form Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.dxf', '.dwg', '.webp'];
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

  // Helper to apply product details to state
  const applyProductData = (prod: Product | null) => {
    if (!prod) {
      setLocalSelectedProduct(null);
      setSelectedProduct(null);
      return;
    }
    setLocalSelectedProduct(prod);
    setSelectedProduct(prod);
    setProjectTitle(prod.name);
    setServiceCategory(mapServiceCategoryToDropdown(prod.service_category, prod.service_category_display));
    setDescription(prod.description || prod.short_description || `Order request for ${prod.name} (${prod.sku}).`);
    setMaterialPreference(prod.material || prod.material_am || '');
  };

  // Synchronize on navigation, query parameter changes, or page refresh
  useEffect(() => {
    const candidate = resolveCandidate();
    if (candidate) {
      applyProductData(candidate);
      return;
    }

    // If not found in memory catalog and query parameter exists, fetch from backend API
    const lookupKey = productIdParam || skuParam;
    if (lookupKey && !selectedProduct) {
      setProductLoading(true);
      const apiCall = (lookupKey.length === 36 && productIdParam)
        ? productsApi.getById(productIdParam)
        : productsApi.getAll({ search: skuParam || lookupKey, page_size: 1 });

      apiCall
        .then((res: any) => {
          const list = res.data?.results || (Array.isArray(res.data) ? res.data : [res.data]);
          if (list && list.length > 0 && list[0]?.name) {
            applyProductData(list[0]);
          }
        })
        .catch((err: any) => console.warn('Product pre-fetch warning:', err))
        .finally(() => setProductLoading(false));
    }
  }, [location.state, productIdParam, skuParam, nameParam]);

  // Handle clearing the selected product (allows custom request mode)
  const handleClearSelectedProduct = () => {
    clearSelectedProduct();
    setLocalSelectedProduct(null);
    setSearchParams({});
    setProjectTitle('');
    setDescription('');
    setMaterialPreference('');
  };

  // File handling
  const processFiles = (files: File[]) => {
    setFileError(null);
    const valid: File[] = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(
          language === 'am'
            ? `የፋይል አይነት "${ext}" ተቀባይነት የለውም። እባክዎ PDF, DXF, DWG, PNG, JPG ወይም WEBP ይስቀሉ።`
            : `File type "${ext}" is not supported. Please upload PDF, DXF, DWG, PNG, JPG, or WEBP.`
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          language === 'am'
            ? `ፋይል "${file.name}" ከ25 ሜጋባይት ይበልጣል።`
            : `File "${file.name}" exceeds the 25 MB limit.`
        );
        return;
      }
      valid.push(file);
    }

    setAttachments((prev) => [...prev, ...valid]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Check if order references an existing website product with predefined price
  const hasPredefinedPrice = Boolean(selectedProduct && Number(selectedProduct.starting_price) > 0);
  const unitPrice = hasPredefinedPrice ? Number(selectedProduct!.starting_price) : 0;

  // Baseline Estimation: strictly for products already listed on the website with predefined prices
  // Custom orders submitted by customers are NOT automatically priced
  const calculateBaselineQuote = (): number | null => {
    if (!hasPredefinedPrice) {
      return null;
    }
    const qty = Math.max(Number(quantity) || 1, 1);
    let total = unitPrice * qty;
    if (deliveryRequired) total += 1500;
    if (installationRequired) total += 2500;
    return Math.round(total);
  };

  const baselineQuote = calculateBaselineQuote();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only numeric digits (0–9), up to 12 digits max
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 12);
    setPhoneNumber(digitsOnly);

    if (raw !== digitsOnly) {
      setValidationErrors((prev) => ({
        ...prev,
        phoneNumber: language === 'am' ? 'ቁጥሮች (0–9) ብቻ ይፈቀዳሉ' : 'Allow only numeric digits (0–9)'
      }));
    } else if (digitsOnly.length > 0 && digitsOnly.length !== 10 && digitsOnly.length !== 12) {
      setValidationErrors((prev) => ({
        ...prev,
        phoneNumber: language === 'am'
          ? `ስልክ ቁጥር በትክክል 10 ወይም 12 አሃዞች መሆን አለበት (ያስገቡት: ${digitsOnly.length})`
          : `Phone number must contain exactly 10 or 12 digits (entered: ${digitsOnly.length})`
      }));
    } else {
      setValidationErrors((prev) => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handlePhoneBlur = () => {
    const clean = phoneNumber.trim();
    if (!clean) {
      setValidationErrors((prev) => ({
        ...prev,
        phoneNumber: language === 'am' ? 'ስልክ ቁጥር ማስገባት ግዴታ ነው' : 'Phone Number is required'
      }));
    } else if (clean.length !== 10 && clean.length !== 12) {
      setValidationErrors((prev) => ({
        ...prev,
        phoneNumber: language === 'am'
          ? `ስልክ ቁጥር በትክክል 10 ወይም 12 አሃዞች መሆን አለበት (ያስገቡት: ${clean.length})`
          : `Phone number must contain exactly 10 or 12 digits (entered: ${clean.length})`
      }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = language === 'am' ? 'የደንበኛ ስም ማስገባት ግዴታ ነው' : 'Customer Name is required';
    }

    const phoneRes = validatePhoneNumber(phoneNumber, phoneCountry, language);
    if (!phoneRes.isValid) {
      errors.phoneNumber = phoneRes.error || (language === 'am' ? 'ስልክ ቁጥር ማስገባት ግዴታ ነው' : 'Please enter a valid phone number');
    }

    if (!email.trim() || !email.includes('@')) {
      errors.email = language === 'am' ? 'ትክክለኛ ኢሜይል አድራሻ ያስገቡ' : 'A valid Email address is required';
    }
    if (!projectTitle.trim()) {
      errors.projectTitle = language === 'am' ? 'የፕሮጀክት ርዕስ ማስገባት ግዴታ ነው' : 'Project Title is required';
    }
    if (!description.trim()) {
      errors.description = language === 'am' ? 'የፕሮጀክት ዝርዝር መግለጫ ማስገባት ግዴታ ነው' : 'Project description & requirements are required';
    }
    if (quantity <= 0) {
      errors.quantity = language === 'am' ? 'ብዛት ከዜሮ መብለጥ አለበት' : 'Quantity must be a positive number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customer_name', customerName.trim());
      const phoneRes = validatePhoneNumber(phoneNumber, phoneCountry, language);
      const normalizedPhone = phoneRes.normalized || phoneNumber.trim();
      formData.append('phone_number', normalizedPhone);
      formData.append('customer_phone', normalizedPhone);
      formData.append('email', email.trim());
      formData.append('customer_email', email.trim());
      formData.append('project_title', projectTitle.trim());
      formData.append('service_category', serviceCategory);
      formData.append('service_type', serviceCategory);
      formData.append('description', description.trim());
      if (materialPreference) formData.append('material_preference', materialPreference.trim());
      if (customerNotes) formData.append('customer_notes', customerNotes.trim());

      formData.append('quantity', String(quantity || 1));

      formData.append('delivery_required', String(deliveryRequired));
      formData.append('installation_required', String(installationRequired));
      if (siteLocation) formData.append('site_location', siteLocation.trim());
      if (preferredDate) formData.append('preferred_completion_date', preferredDate);

      if (hasPredefinedPrice && baselineQuote !== null) {
        formData.append('estimated_baseline', String(baselineQuote));
      } else {
        formData.append('estimated_baseline', '0');
      }

      if (selectedProduct) {
        if (selectedProduct.id && selectedProduct.id !== 'custom-model') {
          formData.append('product_id', selectedProduct.id);
          formData.append('product', selectedProduct.id);
        }
        formData.append('product_code', selectedProduct.sku);
        formData.append('product_name', selectedProduct.name);
        formData.append('product_category', selectedProduct.subcategory || selectedProduct.category_name || selectedProduct.product_type || '');
        const pImg = getProductImageUrl(selectedProduct);
        if (pImg) {
          formData.append('product_image_url', pImg);
        }
      }

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await quotesApi.create(formData);
      setSubmittedResult(res.data);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Order submission error:', err);
      const detail = err.response?.data?.error || err.response?.data?.detail;
      setErrorMsg(
        detail ||
        (language === 'am'
          ? 'ጥያቄዎን በአሁኑ ሰዓት ማስተላለፍ አልተቻለም። እባክዎ እንደገና ይሞክሩ ወይም በቀጥታ በቴሌግራም ያግኙን።'
          : "We couldn't complete your request right now. Please try again or contact HARA WORKSHOP directly through Telegram.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // SUBMISSION SUCCESS CONFIRMATION SCREEN
  // =========================================================================
  if (submittedResult) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-stone-900 py-16 px-4 sm:px-6 lg:px-8 select-none text-left">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
              {language === 'am' ? 'ጥያቄው ደርሷል' : 'Request Received'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 uppercase tracking-tight">
              {language === 'am' ? 'ትዕዛዝዎ በተሳካ ሁኔታ ተልኳል' : 'Request Submitted Successfully'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
              {language === 'am'
                ? 'HARA WORKSHOPን ስለመረጡ እናመሰግናለን። የፕሮጀክት ዝርዝር መግለጫዎ እና አባሪ ፋይሎችዎ ለዎርክሾፕ ማናጀራችን ሳሙኤል ተልከዋል።'
                : 'Thank you for choosing HARA WORKSHOP. Your project request has been received by our workshop engineering team and forwarded to Workshop Manager Samuel.'}
            </p>
          </div>

          {/* Structured Order Summary Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block">
                  {language === 'am' ? 'የመከታተያ ቁጥር' : 'Tracking Reference'}
                </span>
                <span className="text-lg font-black text-brand-red font-mono">
                  {submittedResult.quote_number}
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 self-start">
                <Check className="w-4 h-4" />
                <span>{language === 'am' ? 'ለማናጀር ሳሙኤል ተልኳል' : 'Dispatched to Manager Samuel'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-stone-500 uppercase font-semibold text-xs">{language === 'am' ? 'የፕሮጀክት ርዕስ' : 'Project Title'}:</span>
                <p className="text-stone-900 font-bold mt-0.5">{submittedResult.project_title || projectTitle}</p>
              </div>
              <div>
                <span className="text-stone-500 uppercase font-semibold text-xs">{language === 'am' ? 'የአገልግሎት ዘርፍ' : 'Service Category'}:</span>
                <p className="text-stone-900 font-semibold mt-0.5">
                  {submittedResult.service_category || (selectedProduct ? (selectedProduct.service_category_display || selectedProduct.service || selectedProduct.category_name) : serviceCategory)}
                </p>
              </div>
              <div>
                <span className="text-stone-500 uppercase font-semibold text-xs">{language === 'am' ? 'የተመረጠ ምርት' : 'Selected Product'}:</span>
                <p className="text-stone-900 font-semibold mt-0.5">
                  {submittedResult.product_name || (selectedProduct ? selectedProduct.name : (language === 'am' ? 'ብጁ የዕደ-ጥበብ ማዘዣ' : 'Custom Bespoke Fabrication'))}
                </p>
              </div>
              {submittedResult.product_code && (
                <div>
                  <span className="text-stone-500 uppercase font-semibold text-xs">{language === 'am' ? 'የምርት ኮድ' : 'Product Code'}:</span>
                  <p className="text-brand-red font-mono font-bold mt-0.5">{submittedResult.product_code}</p>
                </div>
              )}
              <div>
                <span className="text-stone-500 uppercase font-semibold text-xs">{language === 'am' ? 'ብዛት' : 'Quantity'}:</span>
                <p className="text-stone-900 font-bold mt-0.5">{submittedResult.quantity || quantity || 1}</p>
              </div>
              <div>
                <span className="text-stone-500 uppercase font-semibold text-xs">
                  {submittedResult.has_predefined_price && Number(submittedResult.estimated_baseline) > 0
                    ? (language === 'am' ? 'ግምታዊ ዋጋ' : 'Approximate Baseline')
                    : (language === 'am' ? 'የዋጋ ሁኔታ' : 'Pricing Status')}
                  :
                </span>
                {submittedResult.has_predefined_price && Number(submittedResult.estimated_baseline) > 0 ? (
                  <p className="text-stone-900 font-mono font-bold mt-0.5">
                    {Number(submittedResult.estimated_baseline).toLocaleString()} ETB
                  </p>
                ) : (
                  <p className="text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold mt-1 inline-block">
                    {language === 'am' ? 'ዋጋው ጥያቄዎ ከተገመገመ በኋላ የሚቀርብ ይሆናል።' : 'Price will be provided after reviewing your request.'}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 text-xs text-stone-600 leading-relaxed bg-[#FAF7F2] p-4 rounded-xl">
              <p>
                {language === 'am'
                  ? 'የእጅ ጥበብ ባለሙያዎቻችን የተላኩትን ዝርዝሮች ገምግመው የመጨረሻውን የዋጋ እና የማምረቻ ጊዜ በስልክ ወይም በቴሌግራም ያሳውቁዎታል።'
                  : 'Our master craftsmen will review your specifications, reference drawings, and selected item before confirming your final quotation and fabrication timeline.'}
              </p>
            </div>
          </div>

          {/* Telegram Order Updates Card */}
          <div className="bg-gradient-to-br from-[#229ED9]/10 via-[#229ED9]/5 to-transparent border-2 border-[#229ED9]/30 rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm text-left">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  {language === 'am' ? 'የትዕዛዝ መረጃዎችን በቴሌግራም ይከታተሉ' : 'Get Order Updates on Telegram'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {language === 'am'
                    ? 'የእኛን ይፋዊ ቴሌግራም ቦት (@HaraWorkshopOrdersBot) በማገናኘት ትዕዛዝዎ ሲገመገም፣ ማምረት ሲጀመር እና ዝግጁ ሲሆን ፈጣን ማሳወቂያዎችን በቀጥታ ያግኙ።'
                    : 'Connect our official Telegram bot (@HaraWorkshopOrdersBot) to receive instant confirmation and real-time status updates as your order progresses through fabrication.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={submittedResult.telegram_deep_link || 'https://t.me/HaraWorkshopOrdersBot'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-[#229ED9] hover:bg-[#1b88bd] text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'am' ? 'የትዕዛዝ መረጃዎችን በቴሌግራም ይከታተሉ' : 'Get Order Updates on Telegram'}</span>
              </a>
            </div>

            <p className="text-[11px] sm:text-xs text-stone-500 italic pt-1 border-t border-stone-200/60">
              {language === 'am'
                ? 'ማሳሰቢያ፦ የቴሌግራም ማሳወቂያ አማራጭ ነው። ትዕዛዝዎ በስርዓቱ ውስጥ ሙሉ በሙሉ ተመዝግቧል፣ ማስተናገድም ጀምረናል።'
                : 'Note: Telegram notifications are completely optional. Your order has already been successfully received and will be processed regardless.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="https://t.me/Manager_Samuel_A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all border border-stone-300 w-full sm:w-auto"
            >
              <Send className="w-4 h-4 text-[#229ED9]" />
              <span>{language === 'am' ? 'ማናጀር ሳሙኤልን ያነጋግሩ (@Manager_Samuel_A)' : 'Contact Manager Samuel (@Manager_Samuel_A)'}</span>
            </a>

            <Link
              to="/products"
              className="inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-black text-white font-semibold py-3.5 px-6 rounded-full text-xs transition-colors w-full sm:w-auto"
            >
              <span>{language === 'am' ? 'ተጨማሪ ምርቶችን ይመልከቱ' : 'Browse More Products'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN PUBLIC ORDER FORM
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 select-none text-left">
      {/* Top Banner Header */}
      <div className="bg-[#FAF7F2] border-b border-stone-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center space-x-2 bg-brand-red/10 border border-brand-red/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-red uppercase tracking-wider">
            {language === 'am' ? 'የማምረቻ ትዕዛዝ እና የዋጋ መጠየቂያ' : 'Direct Order Request & Estimation'}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 uppercase tracking-tight">
            {language === 'am' ? 'የፕሮጀክት ማዘዣ ቅጽ' : 'Bespoke Order Request'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
            {language === 'am'
              ? 'ያለምንም ምዝገባ የፈለጉትን የብረት፣ የእንጨት ወይም የቅይጥ ስራ እዚህ ይዘርዘሩ። ቅጹን እንዳስገቡ በቀጥታ ወደ ዎርክሾፕ ማናጀራችን ሳሙኤል ቴሌግራም ይደርሳል።'
              : 'Specify your metal, wood, or hybrid requirements below without creating an account. Your request, dimensions, and reference files are delivered directly to Workshop Manager Samuel.'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        
        {/* Top Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs shadow-xs">
            <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-stone-900 mb-1">{language === 'am' ? 'ስህተት ተከስቷል' : 'Submission Notice'}</p>
              <p>{errorMsg}</p>
              <div className="mt-2">
                <a
                  href="https://t.me/Manager_Samuel_A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#229ED9] hover:underline font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'በቀጥታ በቴሌግራም ያግኙን፦ @Manager_Samuel_A' : 'Contact on Telegram: @Manager_Samuel_A'}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 17: SELECTED PRODUCT CARD (If selected from catalog) */}
        {selectedProduct && (
          <div className="bg-white border-2 border-brand-red/30 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <span className="text-xs font-bold text-brand-red uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{language === 'am' ? 'የተመረጠ ምርት (በትዕዛዝ)' : 'Selected Product for Ordering'}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearSelectedProduct}
                  className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md border border-stone-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'አስወግድ' : 'Clear Selection'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="relative h-44 md:h-36 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
                <img
                  src={getProductImageUrl(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('hara-official-logo')) {
                      target.src = '/hara-official-logo.png';
                    }
                  }}
                />
                <div className="absolute top-2 right-2 z-10 bg-brand-red text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm tracking-wider select-none">
                  {selectedProduct.sku}
                </div>
              </div>

              <div className="md:col-span-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded">
                    {selectedProduct.sku}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold uppercase">
                    {selectedProduct.subcategory || selectedProduct.category_name}
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    ✓ {language === 'am' ? 'ዝርዝሮች በቅጹ ላይ ተሞልተዋል' : 'Specifications auto-filled in form'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 uppercase tracking-wide">
                  {language === 'am' && selectedProduct.name_am ? selectedProduct.name_am : selectedProduct.name}
                </h3>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {selectedProduct.short_description || selectedProduct.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-stone-600">
                  {selectedProduct.material && (
                    <span><strong className="text-stone-900">{language === 'am' ? 'ቁሳቁስ' : 'Material'}:</strong> {selectedProduct.material}</span>
                  )}
                  {Number(selectedProduct.starting_price) > 0 && (
                    <span>
                      <strong className="text-stone-900">{language === 'am' ? 'መነሻ ዋጋ' : 'Baseline'}:</strong>{' '}
                      <span className="font-bold text-stone-900 font-mono">{Number(selectedProduct.starting_price).toLocaleString()} ETB</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form & Quote Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Sections (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION 1: CUSTOMER INFORMATION */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-base font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-red text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>{language === 'am' ? 'የደንበኛ መረጃ' : 'Customer Information'}</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  {language === 'am' ? 'የእርስዎን ስም፣ ስልክ እና ኢሜይል ያስገቡ። መለያ መፍጠር አያስፈልግዎትም።' : 'Contact details for quotation confirmation and delivery updates.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የደንበኛ ሙሉ ስም *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (validationErrors.customerName) setValidationErrors(prev => ({ ...prev, customerName: '' }));
                    }}
                    placeholder={language === 'am' ? 'ለምሳሌ፡ አበበ ከበደ' : 'e.g. Abebe Kebede'}
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red placeholder-stone-400 transition shadow-xs ${
                      validationErrors.customerName ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                    }`}
                  />
                  {validationErrors.customerName && (
                    <p className="text-[11px] text-red-500 mt-1">{validationErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <PhoneInputWithCountry
                    value={phoneNumber}
                    onChange={(phone, isValid, countryCode) => {
                      setPhoneNumber(phone);
                      setPhoneCountry(countryCode);
                      if (validationErrors.phoneNumber) {
                        const res = validatePhoneNumber(phone, countryCode, language);
                        if (res.isValid) {
                          setValidationErrors((prev) => ({ ...prev, phoneNumber: '' }));
                        }
                      }
                    }}
                    onBlur={() => {
                      const res = validatePhoneNumber(phoneNumber, phoneCountry, language);
                      if (!res.isValid && phoneNumber.trim()) {
                        setValidationErrors((prev) => ({ ...prev, phoneNumber: res.error || '' }));
                      }
                    }}
                    error={validationErrors.phoneNumber}
                    label={language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'ኢሜይል *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@example.com"
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red placeholder-stone-400 transition shadow-xs ${
                      validationErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-[11px] text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: PROJECT SPECIFICATIONS */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-base font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-red text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>{language === 'am' ? 'የፕሮጀክት ዝርዝር መግለጫ' : 'Project Specifications'}</span>
                </h2>
              </div>

              <div className="space-y-4">
                {selectedProduct && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                        {language === 'am' ? 'የተመረጠ የምርት ኮድ (Product Code)' : 'Selected Product Code / SKU'}
                      </span>
                      <span className="text-sm font-mono font-bold text-brand-red">
                        {selectedProduct.sku}
                      </span>
                      <span className="text-xs text-stone-600 ml-2">
                        — {language === 'am' && selectedProduct.name_am ? selectedProduct.name_am : selectedProduct.name}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
                      ✓ {language === 'am' ? 'ከካታሎግ በራስ-ሰር የተሞላ' : 'Auto-filled from Catalog'}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የፕሮጀክት ርዕስ *' : 'Project Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => {
                      setProjectTitle(e.target.value);
                      if (validationErrors.projectTitle) setValidationErrors(prev => ({ ...prev, projectTitle: '' }));
                    }}
                    placeholder={language === 'am' ? 'ለምሳሌ፡ የተመረጠ ዘመናዊ የብረት እና እንጨት ጠረጴዛ' : 'e.g. Modern Steel & Hardwood Dining Table'}
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red placeholder-stone-400 transition shadow-xs ${
                      validationErrors.projectTitle ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                    }`}
                  />
                  {validationErrors.projectTitle && (
                    <p className="text-[11px] text-red-500 mt-1">{validationErrors.projectTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የአገልግሎት ዘርፍ *' : 'Service Category *'}
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red transition shadow-xs"
                  >
                    <option value="Metal Works (Fabrication & Welding)">
                      {language === 'am' ? 'የብረት ስራዎች (Fabrication & Welding)' : 'Metal Works (Fabrication & Welding)'}
                    </option>
                    <option value="Wood Works (Carpentry & Custom Furniture)">
                      {language === 'am' ? 'የእንጨት ስራዎች (Carpentry & Custom Furniture)' : 'Wood Works (Carpentry & Custom Furniture)'}
                    </option>
                    <option value="Hybrid Metal + Wood Construction">
                      {language === 'am' ? 'ቅይጥ የብረት እና እንጨት ስራዎች (Hybrid Construction)' : 'Hybrid Metal + Wood Construction'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የፕሮጀክት ዝርዝር መግለጫ እና ልዩ መስፈርቶች *' : 'Project Description & Specific Requirements *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
                    }}
                    placeholder={
                      language === 'am'
                        ? 'የሚፈልጉትን ስራ፣ ተመራጭ ቁሳቁስ፣ የዲዛይን ምርጫ እና ማንኛውንም አስፈላጊ መስፈርት እዚህ በዝርዝር ያብራሩ...'
                        : 'Explain what you want built, preferred materials, design aesthetics, finish options, customization requirements, and any critical details...'
                    }
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red placeholder-stone-400 transition shadow-xs ${
                      validationErrors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                    }`}
                  />
                  {validationErrors.description && (
                    <p className="text-[11px] text-red-500 mt-1">{validationErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'ተመራጭ ቁሳቁስ (አማራጭ)' : 'Material Preference (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={materialPreference}
                      onChange={(e) => setMaterialPreference(e.target.value)}
                      placeholder={language === 'am' ? 'ለምሳሌ፡ ጥቁር እንጨት፣ ዋንዛ፣ አይረን ወይም ስቴይንለስ ስቲል' : 'e.g. Mild Steel & Solid Teak / Mahogany'}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red placeholder-stone-400 transition shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'የምርት ኮድ / ሞዴል (አማራጭ)' : 'Product Code / Model SKU'}
                    </label>
                    <input
                      type="text"
                      readOnly={Boolean(selectedProduct?.sku)}
                      value={selectedProduct?.sku || ''}
                      placeholder={language === 'am' ? 'ለምሳሌ፡ CHR-001 ወይም ብጁ' : 'e.g. CHR-001 (or Custom)'}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 font-mono transition shadow-xs ${
                        selectedProduct?.sku ? 'bg-stone-50 border-stone-300 font-bold' : 'bg-white border-stone-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'ተጨማሪ የደንበኛ ማስታወሻ ወይም ማሻሻያ (አማራጭ)' : 'Customization Requests & Specific Notes (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder={
                      language === 'am'
                        ? 'ለምሳሌ፡ የቀለም ምርጫ፣ ተጨማሪ ዝርዝር፣ ወይም ማንኛውም ማስተካከያ ካለዎት እዚህ ይግለጹ...'
                        : 'e.g. Specific finish color (dark stain, natural oil, matte black powder-coat), edge detailing, or tailored modifications...'
                    }
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red placeholder-stone-400 transition shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: ORDER QUANTITY */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-base font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-red text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>{language === 'am' ? 'የትዕዛዝ ብዛት' : 'Order Quantity'}</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  {language === 'am' ? 'የሚፈልጉትን የእቃ ብዛት ያስገቡ።' : 'Specify the number of units required for this order.'}
                </p>
              </div>

              <div className="max-w-xs">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {language === 'am' ? 'ብዛት *' : 'Quantity *'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                      if (validationErrors.quantity) setValidationErrors(prev => ({ ...prev, quantity: '' }));
                    }}
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 font-mono font-bold focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition shadow-xs ${
                      validationErrors.quantity ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-300'
                    }`}
                  />
                  <span className="absolute right-3.5 text-xs font-semibold text-stone-400 select-none">
                    {language === 'am' ? 'ፍሬ' : 'unit(s)'}
                  </span>
                </div>
                {validationErrors.quantity && (
                  <p className="text-[11px] text-red-500 mt-1">{validationErrors.quantity}</p>
                )}
              </div>
            </div>

            {/* SECTION 4: ARCHITECTURAL DRAWINGS & REFERENCE FILES */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-base font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-red text-white text-xs flex items-center justify-center font-bold">4</span>
                  <span>{language === 'am' ? 'አርክቴክቸራል ንድፍ እና ማጣቀሻ ፋይሎች (አማራጭ)' : 'Architectural Drawings & Reference Files (Optional)'}</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  {language === 'am'
                    ? 'CAD ዲዛይን፣ ብሉፕሪንት፣ ንድፎች ወይም የማጣቀሻ ፎቶዎችን ማያያዝ ይችላሉ። የተፈቀዱ ቅርጸቶች፦ PDF, DXF, DWG, PNG, JPG, WEBP (እስከ 25 MB)'
                    : 'Upload CAD drawings, architectural blueprints, sketches, reference photos, or specification documents. Supported: PDF, DXF, DWG, PNG, JPG, WEBP (Max 25 MB per file).'}
                </p>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-brand-red bg-red-50/50'
                    : 'border-stone-300 bg-stone-50 hover:border-brand-red hover:bg-stone-100/60'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.dxf,.dwg,.webp"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  {language === 'am' ? 'ፋይሎችን እዚህ ይጎትቱ ወይም ለመምረጥ ይጫኑ' : 'Click to browse or drag and drop files here'}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  PDF, DXF, DWG, PNG, JPG, WEBP • Max 25 MB per file
                </p>
              </div>

              {fileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-red flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* List of Attached Files */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                    {language === 'am' ? `የተመረጡ ፋይሎች (${attachments.length})` : `Selected Files (${attachments.length})`}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((file, idx) => {
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      const isCad = ext === 'dxf' || ext === 'dwg';
                      const isImg = ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp';
                      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            {isCad ? (
                              <FileCode className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            ) : isImg ? (
                              <ImageIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <FileText className="w-5 h-5 text-sky-600 flex-shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="text-stone-900 font-medium truncate">{file.name}</p>
                              <p className="text-[10px] text-stone-500">{sizeMb} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-brand-red transition"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: DELIVERY & SITE INSTALLATION */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-base font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-red text-white text-xs flex items-center justify-center font-bold">5</span>
                  <span>{language === 'am' ? 'የትራንስፖርት እና የተከላ አገልግሎት' : 'Delivery & Site Installation'}</span>
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-brand-red/40 transition">
                  <input
                    type="checkbox"
                    checked={deliveryRequired}
                    onChange={(e) => setDeliveryRequired(e.target.checked)}
                    className="mt-0.5 rounded text-brand-red focus:ring-brand-red border-stone-300 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-brand-red" />
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        {language === 'am' ? 'ትራንስፖርት እና ማድረስ (አዲስ አበባ)' : 'Add Transport & Delivery (Addis Ababa)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {language === 'am' ? 'ከዎርክሾፓችን በቀጥታ ወደሚፈልጉት ቦታ በጥንቃቄ ማድረስ።' : 'Secure vehicle transport from Bole Arabsa facility to your specified site.'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-brand-red/40 transition">
                  <input
                    type="checkbox"
                    checked={installationRequired}
                    onChange={(e) => setInstallationRequired(e.target.checked)}
                    className="mt-0.5 rounded text-brand-red focus:ring-brand-red border-stone-300 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-brand-red" />
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        {language === 'am' ? 'በቦታው ላይ ተከላ እና ማሰር' : 'Add On-Site Structural Anchoring & Installation'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {language === 'am' ? 'በሰለጠኑ የዎርክሾፕ ባለሙያዎች በቦታው ላይ የሚደረግ ትክክለኛ ተከላ።' : 'Structural welding, bolting, and professional fitment by our master technicians.'}
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-red" />
                    <span>{language === 'am' ? 'የተከላ ወይም የማድረሻ ቦታ' : 'Site Installation / Delivery Location'}</span>
                  </label>
                  <input
                    type="text"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder={language === 'am' ? 'ለምሳሌ፡ ቦሌ፣ መገናኛ፣ ወይም የተለየ አድራሻ' : 'e.g. Bole Medhanialem, Kazanchis, CMC, or site coordinates'}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red placeholder-stone-400 transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-red" />
                    <span>{language === 'am' ? 'የሚፈለግበት የመጨረሻ ቀን (አማራጭ)' : 'Preferred Target Completion Date (Optional)'}</span>
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-brand-red transition shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Estimated Fabrication Quote & Submit Button (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* SECTION 6: QUOTE SUMMARY / ESTIMATE CARD */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center space-x-2">
                    {hasPredefinedPrice ? (
                      <Calculator className="w-5 h-5 text-brand-red" />
                    ) : (
                      <FileText className="w-5 h-5 text-amber-600" />
                    )}
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      {hasPredefinedPrice
                        ? (language === 'am' ? 'ግምታዊ የማምረቻ ዋጋ' : 'Estimated Fabrication Quote')
                        : (language === 'am' ? 'የብጁ ትዕዛዝ ማጠቃለያ' : 'Custom Order Request')}
                    </h3>
                  </div>
                  {!hasPredefinedPrice && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                      {language === 'am' ? 'ብጁ ትዕዛዝ' : 'Custom Request'}
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 text-xs">
                  {hasPredefinedPrice && selectedProduct && (
                    <div className="pb-2.5 border-b border-stone-100 space-y-1">
                      <div className="flex justify-between items-start text-stone-600">
                        <span className="text-stone-500">{language === 'am' ? 'የምርት ዋጋ' : 'Catalog Price'}:</span>
                        <span className="font-mono font-bold text-stone-900 text-xs text-right">
                          {unitPrice.toLocaleString()} ETB / unit
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {selectedProduct.sku ? `[${selectedProduct.sku}] ` : ''}{selectedProduct.name}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-stone-600">
                    <span>{language === 'am' ? 'ብዛት' : 'Quantity'}:</span>
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {quantity} unit(s)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-stone-600">
                    <span>{language === 'am' ? 'ትራንስፖርት' : 'Workshop Delivery'}:</span>
                    <span className={`font-semibold ${deliveryRequired ? 'text-emerald-700' : 'text-stone-400'}`}>
                      {deliveryRequired
                        ? (hasPredefinedPrice ? '+1,500 ETB' : (language === 'am' ? 'ተካቷል (Included)' : 'Included'))
                        : (language === 'am' ? 'አልተካተተም' : 'Not Included')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-stone-600">
                    <span>{language === 'am' ? 'የቦታው ተከላ' : 'On-Site Fitting'}:</span>
                    <span className={`font-semibold ${installationRequired ? 'text-emerald-700' : 'text-stone-400'}`}>
                      {installationRequired
                        ? (hasPredefinedPrice ? '+2,500 ETB' : (language === 'am' ? 'ተካቷል (Included)' : 'Included'))
                        : (language === 'am' ? 'አልተካተተም' : 'Not Included')}
                    </span>
                  </div>

                  {hasPredefinedPrice && baselineQuote !== null ? (
                    <div className="pt-3 border-t border-stone-200 space-y-1">
                      <span className="text-[11px] font-bold text-stone-500 uppercase block">
                        {language === 'am' ? 'ግምታዊ የዎርክሾፕ መነሻ ዋጋ' : 'Approximate Workshop Baseline'}
                      </span>
                      <div className="text-2xl font-black text-stone-900 font-mono flex items-baseline gap-1.5">
                        <span>{baselineQuote.toLocaleString()}</span>
                        <span className="text-sm font-sans font-bold text-brand-red">ETB</span>
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight pt-1">
                        {language === 'am'
                          ? '* ይህ በድረ-ገጹ ላይ በተዘረዘረው የምርት መነሻ ዋጋ ላይ የተመሰረተ ግምታዊ ዋጋ ነው። የመጨረሻው ትክክለኛ ዋጋ የዎርክሾፕ ቡድናችን የፕሮጀክቱን ዝርዝር መረጃ ከመረመረ በኋላ የሚወሰን ይሆናል።'
                          : '* Approximate baseline estimate based on catalog starting price. The final binding quotation is confirmed by HARA WORKSHOP after reviewing your architectural drawings and specifications.'}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-stone-200">
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 leading-snug">
                              {language === 'am'
                                ? 'ዋጋው ጥያቄዎ ከተገመገመ በኋላ የሚቀርብ ይሆናል።'
                                : 'Price will be provided after reviewing your request.'}
                            </p>
                            <p className="text-[11px] text-amber-800/90 leading-relaxed mt-1">
                              {language === 'am'
                                ? 'የዎርክሾፕ ማናጀሩ የእርስዎን ብጁ መስፈርቶች፣ ዲዛይን እና ልኬቶች ገምግመው ተገቢውን የዋጋ ዝርዝር ለብቻው ያዘጋጃሉ።'
                                : 'The workshop manager will review your custom request and provide a quotation separately.'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight pt-2">
                        {language === 'am'
                          ? '* ለብጁ ወይም በድረ-ገጹ ላልተዘረዘሩ የዕደ-ጥበብ ስራዎች በቅድሚያ አውቶማቲክ ዋጋ አይሰላም።'
                          : '* Custom and bespoke fabrication orders are quoted individually without automated estimates.'}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 disabled:bg-stone-300 text-white font-bold py-4 px-6 rounded-full text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? (
                    <span>{language === 'am' ? 'እየተላከ ነው...' : 'Submitting to Workshop...'}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{language === 'am' ? 'ትዕዛዝ አስገባ' : 'Submit Order Request'}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'am' ? 'ቀጥታ ለዎርክሾፕ ማናጀር ሳሙኤል ይላካል' : 'Direct Dispatch to Manager Samuel'}</span>
                </div>
              </div>

              {/* Direct Telegram Assist Box */}
              <div className="bg-[#F0F8FF] border border-[#BCE0FD] rounded-2xl p-5 space-y-3 text-xs text-left text-stone-700 shadow-xs">
                <div className="flex items-center space-x-2 text-[#229ED9] font-bold uppercase tracking-wider">
                  <Send className="w-4 h-4" />
                  <span>{language === 'am' ? 'ጥያቄ አለዎት?' : 'Have Questions?'}</span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {language === 'am'
                    ? 'የዎርክሾፕ ማናጀራችንን ሳሙኤልን በቴሌግራም በማነጋገር ፈጣን መልስ ማግኘት ይችላሉ።'
                    : 'Contact Workshop Manager Samuel directly on Telegram for real-time guidance on dimensions or custom designs.'}
                </p>
                <a
                  href="https://t.me/Manager_Samuel_A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 w-full bg-[#229ED9] hover:bg-[#1a8dc4] text-white font-bold py-2.5 px-3 rounded-full text-xs shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>@Manager_Samuel_A</span>
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
