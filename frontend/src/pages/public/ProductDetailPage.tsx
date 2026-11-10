import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Truck, Wrench, Layers, PlusCircle, 
  Clock, Phone, CheckCircle2, ChevronRight, ChevronLeft, X, ZoomIn, 
  Hammer, Ruler, Palette, FileText
} from 'lucide-react';
import { productsApi, extractResults } from '../../services/api';
import { Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useLanguageStore } from '../../store/languageStore';
import { useProductOrderStore } from '../../store/productOrderStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';
import { getProductImageUrl, resolveProductImagePath } from '../../utils/productUtils';

export const ProductDetailPage: React.FC = () => {
  const { serviceSlug, productSlug, id } = useParams<{ 
    serviceSlug?: string; 
    productSlug?: string; 
    id?: string;
  }>();
  const lookupKey = productSlug || id;
  const navigate = useNavigate();
  const { t, localize, language } = useLanguageStore();

  // Find initial fallback product from static catalog
  const initialFallback = React.useMemo(() => {
    if (!lookupKey) return null;
    return CATALOG_PRODUCTS.find(p => 
      p.sku?.toLowerCase() === lookupKey.toLowerCase() || 
      p.slug?.toLowerCase() === lookupKey.toLowerCase() || 
      p.id === lookupKey
    ) || null;
  }, [lookupKey]);

  const [product, setProduct] = useState<Product | null>(initialFallback);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialFallback ? (initialFallback.primary_image || initialFallback.images?.[0]?.image || null) : null
  );
  const [loading, setLoading] = useState(!initialFallback);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!lookupKey) return;
    if (initialFallback) {
      setProduct(initialFallback);
      setSelectedImage(initialFallback.primary_image || initialFallback.images?.[0]?.image || null);
      setLoading(false);
    } else {
      setProduct(null);
      setSelectedImage(null);
      setLoading(true);
    }

    productsApi.getById(lookupKey)
      .then((res) => {
        const prod: Product = res.data;
        const resolvedMainImg = getProductImageUrl(prod);
        prod.primary_image = resolvedMainImg;
        if (!prod.images || prod.images.length === 0) {
          prod.images = [
            {
              id: `img-${prod.sku || prod.id}`,
              image: resolvedMainImg,
              is_primary: true,
              caption: `${prod.name} (${prod.sku || ''})`
            }
          ];
        } else {
          prod.images = prod.images.map(img => ({
            ...img,
            image: resolveProductImagePath(img.image) || resolvedMainImg
          }));
        }
        setProduct(prod);
        setSelectedImage(resolvedMainImg);

        // Fetch related products from same service category
        const serviceCategoryParam = prod.service_category || (
          serviceSlug?.includes('metal') ? 'METAL_WORKS' :
          serviceSlug?.includes('wood') ? 'WOOD_WORKS' : 'HYBRID_METAL_WOOD'
        );

        productsApi.getAll({ service_category: serviceCategoryParam, page_size: 8 })
          .then((relRes) => {
            const relList: Product[] = extractResults<Product>(relRes.data);
            const filtered = relList.filter(p => p.id !== prod.id && p.sku !== prod.sku).slice(0, 4);
            if (filtered.length > 0) {
              setRelatedProducts(filtered);
            } else {
              const fallbackRel = CATALOG_PRODUCTS.filter(
                p => p.service_category === serviceCategoryParam && p.id !== prod.id && p.sku !== prod.sku
              ).slice(0, 4);
              setRelatedProducts(fallbackRel);
            }
          })
          .catch((relErr) => {
            console.error(relErr);
            const fallbackRel = CATALOG_PRODUCTS.filter(
              p => p.service_category === serviceCategoryParam && p.id !== prod.id && p.sku !== prod.sku
            ).slice(0, 4);
            setRelatedProducts(fallbackRel);
          });
      })
      .catch((err) => {
        console.warn('Failed to load live product details, checking catalog fallback:', err);
        if (initialFallback) {
          setProduct(initialFallback);
          setSelectedImage(initialFallback.primary_image || (initialFallback.images && initialFallback.images[0]?.image) || null);
          const relList = CATALOG_PRODUCTS.filter(p => 
            p.service_category === initialFallback.service_category && p.id !== initialFallback.id
          ).slice(0, 4);
          setRelatedProducts(relList);
        }
      })
      .finally(() => setLoading(false));
  }, [lookupKey, serviceSlug, initialFallback]);

  // Gallery images array
  const galleryImages = React.useMemo(() => {
    if (!product) return [];
    const list: { id: string; image: string; caption?: string }[] = [];
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => list.push({ id: img.id, image: img.image, caption: img.caption }));
    } else if (product.primary_image) {
      list.push({ id: 'primary', image: product.primary_image, caption: product.name });
    }
    return list;
  }, [product]);

  // Lightbox Keyboard Navigation
  useEffect(() => {
    if (!isLightboxOpen || galleryImages.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, galleryImages]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;

    const serviceName = product.service_category_display || 
      (product.service_category === 'METAL_WORKS' ? 'Metal Works' :
       product.service_category === 'WOOD_WORKS' ? 'Wood Works' : 'Hybrid Metal + Wood Construction');

    const params = new URLSearchParams();
    if (product.id) params.set('productId', String(product.id));
    if (product.sku) params.set('sku', product.sku);
    if (product.name) params.set('name', product.name);
    if (serviceName) params.set('service', serviceName);
    if (product.material) params.set('material', product.material);
    if (product.primary_image) params.set('image', product.primary_image);

    useProductOrderStore.getState().setSelectedProduct(product);
    navigate(`/request-quote?${params.toString()}`, { state: { product } });
  };

  if (loading) return <LoadingSpinner text={t('common.loading')} />;

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900 uppercase">{t('products.productNotFound')}</h2>
        <p className="text-sm text-stone-600">{t('products.productNotFoundDesc')}</p>
        <Link 
          to="/services" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.backToServices')}
        </Link>
      </div>
    );
  }

  // Determine service slug for breadcrumbs
  const currentServiceSlug = serviceSlug || (
    product.service_category === 'METAL_WORKS' ? 'metal-works' :
    product.service_category === 'WOOD_WORKS' ? 'wood-works' : 'hybrid-metal-wood'
  );

  const serviceTitle = language === 'am'
    ? (product.service_category === 'METAL_WORKS' ? 'የብረት ስራዎች' :
       product.service_category === 'WOOD_WORKS' ? 'የእንጨት ስራዎች' : 'ቅይጥ የብረት + እንጨት ስራዎች')
    : (product.service_category_display || (
       product.service_category === 'METAL_WORKS' ? 'Metal Works' :
       product.service_category === 'WOOD_WORKS' ? 'Wood Works' : 'Hybrid Metal + Wood Construction'
      ));

  const subcategoryDisplay = (language === 'am' && product.subcategory_am)
    ? product.subcategory_am
    : (product.subcategory || product.product_type);

  const prodName = localize(product, 'name');
  const prodDesc = localize(product, 'description');
  const prodShortDesc = localize(product, 'short_description') || prodDesc;
  const prodMaterial = localize(product, 'material');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-left text-stone-900 pb-20 space-y-16">
      
      {/* 1. BREADCRUMBS & HERO SECTION */}
      <section className="relative bg-[#FAF7F2] border-b border-stone-200 pt-8 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <Link to="/" className="hover:text-stone-900 transition-colors">{t('navigation.home')}</Link>
            <span className="text-stone-300">/</span>
            <Link to="/services" className="hover:text-stone-900 transition-colors">{t('navigation.services')}</Link>
            <span className="text-stone-300">/</span>
            <Link to={`/services/${currentServiceSlug}`} className="text-brand-red hover:underline transition-colors">
              {serviceTitle}
            </Link>
            {subcategoryDisplay && (
              <>
                <span className="text-stone-300">/</span>
                <span className="text-stone-600 font-medium">{subcategoryDisplay}</span>
              </>
            )}
            <span className="text-stone-300">/</span>
            <span className="text-stone-900 font-semibold truncate max-w-[200px] sm:max-w-none">{prodName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Interactive Image Gallery */}
            <div className="lg:col-span-7 space-y-4">
              <div
                role="button"
                tabIndex={0}
                aria-label={t('products.expandLightbox')}
                onClick={() => {
                  const activeIdx = Math.max(0, galleryImages.findIndex((img) => img.image === selectedImage));
                  openLightbox(activeIdx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const activeIdx = Math.max(0, galleryImages.findIndex((img) => img.image === selectedImage));
                    openLightbox(activeIdx);
                  }
                }}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden h-[400px] sm:h-[480px] relative flex items-center justify-center group shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={prodName}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hara-official-logo.png';
                    }}
                  />
                ) : (
                  <div className="text-center text-stone-400">
                    <Layers className="w-16 h-16 mx-auto mb-2" />
                    <span className="text-xs uppercase font-bold">{language === 'am' ? 'የሐራ ወርክሾፕ ምርት' : 'Hara Workshop Product'}</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />

                {/* Dynamic Product Code / SKU Overlay Badge */}
                {product.sku && (
                  <div className="absolute top-4 right-4 z-20 bg-brand-red text-white text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-md shadow-sm tracking-wider border border-white/20 flex items-center gap-1.5">
                    <span>{product.sku}</span>
                  </div>
                )}

                {/* Lightbox Zoom Icon Indicator */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs z-10 shadow-sm">
                  <ZoomIn className="w-3.5 h-3.5 text-brand-red" />
                  <span>{t('products.expandLightbox')}</span>
                </div>

                {/* Service Category Badge on Hero Image */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-stone-800 border border-stone-200 shadow-xs">
                    {serviceTitle}
                  </span>
                </div>
              </div>

              {/* Thumbnails strip */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImage(img.image)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImage === img.image 
                          ? 'border-brand-red scale-105 shadow-sm' 
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image} alt={img.caption || product.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Hero Information */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-brand-red uppercase tracking-wider bg-brand-red/10 px-2.5 py-1 rounded border border-brand-red/20">
                    {subcategoryDisplay || (language === 'am' ? 'ልዩ ስራ' : 'Custom Work')}
                  </span>
                  <StatusBadge status={product.stock_status} />
                  <span className="text-xs text-stone-500 font-mono">SKU: {product.sku}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-stone-900 uppercase tracking-tight leading-tight">
                  {prodName}
                </h1>

                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                  {prodShortDesc}
                </p>
              </div>

              {/* Pricing & Production Highlights */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 grid grid-cols-2 gap-4 shadow-xs">
                <div>
                  <span className="text-[11px] text-stone-500 block uppercase font-bold">{t('products.baseRate')}</span>
                  <span className="text-2xl font-black text-stone-900 font-mono">
                    {product.starting_price > 0 
                      ? `${Number(product.starting_price).toLocaleString()} ${t('common.etb')}` 
                      : t('products.bySpecification')}
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {language === 'am' ? `በ${product.unit || 'እቃ'}` : `per ${product.unit || 'unit'}`}
                  </span>
                </div>

                <div className="border-l border-stone-200 pl-4">
                  <span className="text-[11px] text-stone-500 block uppercase font-bold">{t('products.leadTime')}</span>
                  <div className="flex items-center gap-1.5 mt-1 text-stone-900 font-bold text-base">
                    <Clock className="w-4 h-4 text-brand-red shrink-0" />
                    <span>{product.estimated_production_time || (language === 'am' ? 'ከ7–14 የስራ ቀናት' : '7–14 Business Days')}</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">{t('products.boleWorkshop')}</span>
                </div>
              </div>

              {/* Quick Feature Points */}
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('products.bespokePoint')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('products.coatingPoint')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('products.installPoint')}</span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRequestQuote}
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('products.requestQuoteProduct')}</span>
                </button>
                <a
                  href="tel:+251926629999"
                  className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-stone-50 text-stone-800 font-semibold py-3.5 px-5 rounded-xl text-xs border border-stone-300 shadow-xs transition"
                >
                  <Phone className="w-4 h-4 text-brand-red" />
                  <span>{t('common.callWorkshop')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIGHTBOX / FULLSCREEN VIEWER MODAL */}
      {isLightboxOpen && galleryImages[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={prodName}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fadeIn"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between text-xs text-stone-300 py-2 border-b border-stone-800"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase">{prodName}</span>
              <span>•</span>
              <span className="font-mono">
                {language === 'am' ? `ምስል ${lightboxIndex + 1} ከ ${galleryImages.length}` : `Image ${lightboxIndex + 1} of ${galleryImages.length}`}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg border border-stone-700 transition"
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image */}
          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              onClick={(e) => e.stopPropagation()}
              src={galleryImages[lightboxIndex].image}
              alt={galleryImages[lightboxIndex].caption || prodName}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
                  }}
                  className="absolute left-2 sm:left-4 p-3 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-md border border-stone-700 transition"
                  title={t('common.previous')}
                  aria-label={t('common.previous')}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
                  }}
                  className="absolute right-2 sm:right-4 p-3 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-md border border-stone-700 transition"
                  title={t('common.next')}
                  aria-label={t('common.next')}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Caption & Controls Footer */}
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl text-center py-2">
            <p className="text-sm font-semibold text-white">
              {galleryImages[lightboxIndex].caption || prodName}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {t('products.lightboxNavHint')}
            </p>
          </div>
        </div>
      )}

      {/* 3. PRODUCT SPECIFICATIONS TABLE & DETAILED DESCRIPTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Detailed Description */}
          <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <FileText className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">
                {t('products.techOverview')}
              </h3>
            </div>
            
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {prodDesc}
            </p>

            <div className="pt-4 border-t border-stone-200 flex flex-wrap gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-red" />
                <span>{t('products.siteDelivery')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-red" />
                <span>{t('products.anchoringFitout')}</span>
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <Ruler className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">
                {t('products.specsTitle')}
              </h3>
            </div>

            <div className="divide-y divide-stone-200 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('quote.serviceCategory')}</span>
                <span className="font-bold text-stone-900 uppercase">{serviceTitle}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.subcategory')}</span>
                <span className="font-semibold text-stone-900">{subcategoryDisplay || (language === 'am' ? 'የስነ-ህንፃ አካል' : 'Architectural Component')}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.primaryMaterial')}</span>
                <span className="font-semibold text-stone-900">{prodMaterial}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.dimensionsLWH')}</span>
                <span className="font-semibold text-stone-900">
                  {product.dimensions_length || product.dimensions_width || product.dimensions_height ? (
                    `${product.dimensions_length || '-'} × ${product.dimensions_width || '-'} × ${product.dimensions_height || '-'} ${product.dimensions_unit || 'cm'}`
                  ) : (
                    t('products.customMadeToMeasure')
                  )}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.finishCoating')}</span>
                <span className="font-semibold text-stone-900 truncate max-w-[200px] text-right">
                  {product.finish_options || (language === 'am' ? 'ፓውደር ኮቲንግ / ፖሊዩሪቴን' : 'Powder Coated / Polyurethane')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.productionTime')}</span>
                <span className="font-semibold text-brand-red">
                  {product.estimated_production_time || (language === 'am' ? 'ከ7–14 የስራ ቀናት' : '7–14 Business Days')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.customization')}</span>
                <span className="font-semibold text-emerald-700">{t('products.bespokeSizing')}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-500">{t('products.installation')}</span>
                <span className="font-semibold text-stone-900">{t('products.onSiteFitting')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MATERIALS & CRAFTSMANSHIP EXPLANATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">
            {language === 'am' ? 'የምህንድስና ጥራት' : 'Engineering Integrity'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
            {t('products.craftsmanshipStandards')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metal Standards */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-3 hover:border-stone-300 transition shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{t('products.metalStructuralSteel')}</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {product.metal_materials || (language === 'am' ? 'የመጀመሪያ ደረጃ መዋቅራዊ ብረት፣ የክብ እና የካሬ ቱቦዎች፣ እና በሌዘር የተቆረጡ ጠንካራ ፕሌቶች። እያንዳንዱ መገጣጠሚያ በTIG/MIG ብየዳ በጥልቀት ተበይዶ ያለምንም ክፍተት ይሞረዳል/ይጸዳል።' : 'Prime structural mild steel, hollow section framing (RHS/SHS), solid wrought pickets, and precision laser-cut sheet plates. Every joint is MIG/TIG welded with deep penetration and ground seamless.')}
            </p>
            <div className="text-[11px] text-stone-500 border-t border-stone-100 pt-2 font-mono">
              {language === 'am' ? 'ጥበቃ፡ ከዝገት መከላከያ ፕራይመር + የኤሌክትሮስታቲክ ፓውደር ኮት ቀለም።' : 'Protection: Zinc-phosphate anti-rust primer + electrostatic powder coat.'}
            </div>
          </div>

          {/* Wood Standards */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-3 hover:border-stone-300 transition shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Hammer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{t('products.hardwoodJoinery')}</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {product.wood_materials || (language === 'am' ? 'በእቶን የደረቁ የሀገር ውስጥ እና የውጭ ጠንካራ እንጨቶች (ጥቁር እንጨት፣ ዋንዛ፣ ማሆጋኒ፣ እና ቲክ) እንዳይጣመሙ ከ12% በታች የውሃ ይዘት የተጠበቁ። በባህላዊና ዘመናዊ የእንጨት ማያያዣዎች በጥንቃቄ የተገጣጠሙ።' : 'Kiln-dried Ethiopian hardwoods (Tikur Inchet, Wanza / Cordia Africana, Mahogany, and Solid Teak) conditioned under 12% moisture to prevent warping. Hand-fitted with mortise-and-tenon or biscuit joints.')}
            </p>
            <div className="text-[11px] text-stone-500 border-t border-stone-100 pt-2 font-mono">
              {language === 'am' ? 'አጨራረስ፡ እርጥበት መቋቋም የሚችል የፖሊዩሪቴን ቫርኒሽ እና የተፈጥሮ ቲክ ዘይት።' : 'Finishing: Multi-coat moisture-resistant polyurethane & natural teak oil.'}
            </div>
          </div>

          {/* Hybrid Integration */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-3 hover:border-stone-300 transition shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{t('products.hybridIntegration')}</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {language === 'am' ? 'የተፈጥሮ እንጨት ከአየር ንብረት ጋር ሲሰፋና ሲኮማተር ከብረቱ ጋር እንዳይጋጭ ታስቦ በተሰሩ ልዩ ማያያዣዎች የተገነባ። ድብቅ ጠንካራ ብሎኖች የመዋቅር ጥንካሬንና ዘመናዊ ውበትን ይጠብቃሉ።' : 'Engineered with expansion-relief mounting brackets to accommodate natural wood breathing against rigid steel chassis. Concealed heavy-duty fasteners maintain structural rigidity and clean architectural aesthetics.'}
            </p>
            <div className="text-[11px] text-stone-500 border-t border-stone-100 pt-2 font-mono">
              {language === 'am' ? 'ምርመራ፡ ለከባድ የንግድ እና የመኖሪያ አገልግሎት ክብደት የተፈተነ።' : 'Testing: Load-tested for heavy domestic and commercial duty.'}
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMIZATION OPTIONS & APPLICATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Customization Options */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <Palette className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">
                {t('products.customizationTitle')}
              </h3>
            </div>

            <p className="text-xs text-stone-500">
              {t('products.customizationSubtitle')}
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl">
                <span className="text-xs font-bold text-brand-red block uppercase">{t('products.dimScaling')}</span>
                <span className="text-xs text-stone-700 mt-0.5 block">
                  {product.customization_options || (language === 'am' ? 'የቦታዎን ስፋት የሚያሟላ ብጁ ርዝመት፣ ወርድ እና ቁመት።' : 'Custom length, width, and height to match your space constraints.')}
                </span>
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl">
                <span className="text-xs font-bold text-brand-red block uppercase">{t('products.colorPalette')}</span>
                <span className="text-xs text-stone-700 mt-0.5 block">
                  {product.finish_options || (language === 'am' ? 'ጥቁር ማት፣ የነሐስ ቀለም፣ ክሊር ኮት ያለው ተፈጥሯዊ ብረት፣ የዎልነት ወይም የኦክ እንጨት ቀለም።' : 'Matte black, bronze patina, industrial raw steel with clear coat, walnut or golden oak stains.')}
                </span>
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl">
                <span className="text-xs font-bold text-brand-red block uppercase">{t('products.optionalAddons')}</span>
                <span className="text-xs text-stone-700 mt-0.5 block">
                  {language === 'am' ? 'አብሮ የተሰራ ሞቃት የLED ብርሃን መስመር፣ ለስላሳ ዝጊ ብሉም (Blum) እቃዎች፣ አስተማማኝ ቁልፎች፣ ወይም በሌዘር የተሰሩ የጌጣጌጥ ቅርጾች።' : 'Integrated LED warm lighting channels, soft-close Blum hardware, security multipoint locks, or decorative laser filigree.'}
                </span>
              </div>
            </div>
          </div>

          {/* Typical Applications */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <ShieldCheck className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">
                {t('products.applicationsTitle')}
              </h3>
            </div>

            <p className="text-xs text-stone-500">
              {t('products.applicationsSubtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-stone-900 block uppercase">{t('products.resVillas')}</span>
                <p className="text-[11px] text-stone-600">{t('products.resVillasDesc')}</p>
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-stone-900 block uppercase">{t('products.commOffices')}</span>
                <p className="text-[11px] text-stone-600">{t('products.commOfficesDesc')}</p>
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-stone-900 block uppercase">{t('products.hospDining')}</span>
                <p className="text-[11px] text-stone-600">{t('products.hospDiningDesc')}</p>
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-stone-900 block uppercase">{t('products.indPublic')}</span>
                <p className="text-[11px] text-stone-600">{t('products.indPublicDesc')}</p>
              </div>
            </div>

            {product.applications && (
              <div className="p-3 bg-brand-red/5 border border-brand-red/20 rounded-xl text-xs text-stone-700">
                <strong className="text-brand-red uppercase">{t('products.verifiedEnvironments')} </strong>
                {product.applications}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. RELATED PRODUCTS FROM SAME SERVICE */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('products.moreFromCategory')}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
                {t('products.relatedTitle')}
              </h2>
            </div>
            <Link
              to={`/services/${currentServiceSlug}`}
              className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1"
            >
              <span>{t('products.exploreAllCategory', { category: serviceTitle })}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => {
              const relUrl = `/services/${currentServiceSlug}/products/${rel.slug || rel.sku || rel.id}`;
              const relImage = getProductImageUrl(rel);
              const relName = localize(rel, 'name');
              const relDesc = localize(rel, 'short_description') || localize(rel, 'description');
              const relMaterial = localize(rel, 'material');

              return (
                <div
                  key={rel.id}
                  role="button"
                  tabIndex={0}
                  aria-label={relName}
                  onClick={() => navigate(relUrl)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(relUrl);
                    }
                  }}
                  className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-brand-red/60 hover:shadow-lg transition-all duration-300 group cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                >
                  <div className="h-44 bg-stone-100 relative overflow-hidden">
                    <img
                      src={relImage}
                      alt={relName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/hara-official-logo.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent opacity-60" />
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/95 text-stone-800 border border-stone-200 shadow-xs">
                      {relMaterial || (language === 'am' ? 'ልዩ ስራ' : 'Custom')}
                    </span>
                    {/* Dynamic Product Code / SKU Overlay Badge */}
                    {rel.sku && (
                      <span className="absolute top-2 right-2 z-10 bg-brand-red text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm tracking-wider border border-white/20">
                        {rel.sku}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 group-hover:text-brand-red transition-colors line-clamp-1">
                        {relName}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                        {relDesc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-900 font-mono font-bold">
                        {rel.starting_price > 0 ? `${Number(rel.starting_price).toLocaleString()} ${t('common.etb')}` : t('products.bySpecification')}
                      </span>
                      <span className="text-brand-red font-semibold flex items-center gap-0.5">
                        <span>{t('products.viewDetails')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. CALL TO ACTION: REQUEST QUOTE FOR THIS PRODUCT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-stone-200 bg-[#FAF7F2] p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-bold text-brand-red uppercase tracking-widest">
                {t('products.directCommission')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-tight">
                {t('products.readyToCommission', { name: prodName })}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
                {t('products.commissionDesc')}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                onClick={handleRequestQuote}
                className="w-full inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('products.requestQuoteItem')}</span>
              </button>
              <a
                href="tel:+251926629999"
                className="w-full inline-flex items-center justify-center space-x-2 bg-white hover:bg-stone-50 text-stone-800 font-semibold py-3 px-5 rounded-xl text-xs border border-stone-300 shadow-xs transition"
              >
                <Phone className="w-4 h-4 text-brand-red" />
                <span>{t('products.callWorkshopEngineer')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
