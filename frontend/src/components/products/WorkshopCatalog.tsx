import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  X, 
  Sparkles, 
  Hammer, 
  Wrench, 
  Layers, 
  Eye, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Product } from '../../types';
import { useLanguageStore } from '../../store/languageStore';
import { useProductOrderStore } from '../../store/productOrderStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';
import { productsApi, extractResults } from '../../services/api';
import { getProductImageUrl } from '../../utils/productUtils';

interface CategoryConfig {
  id: string;
  name: string;
  nameAm: string;
  slug: string;
  prefix: string;
  cover: string;
  description: string;
  descriptionAm: string;
}


// 1. WOOD WORKS CATEGORIES (10)
const WOOD_CATEGORIES: CategoryConfig[] = [
  {
    id: 'chairs',
    name: 'Chairs',
    nameAm: 'ወንበሮች',
    slug: 'chairs',
    prefix: 'CHR',
    cover: 'cover-chairs.jpg',
    description: 'Solid hardwood dining, lounge, and ergonomic study chairs crafted with precision mortise-and-tenon joinery.',
    descriptionAm: 'በጥንቃቄ የተሰሩ ጠንካራ የእንጨት የመመገቢያ፣ የሳሎን እና የቢሮ ወንበሮች።',
  },
  {
    id: 'tables',
    name: 'Tables',
    nameAm: 'ጠረጴዛዎች',
    slug: 'tables',
    prefix: 'TBL',
    cover: 'cover-tables.jpg',
    description: 'Handcrafted solid timber dining, coffee, and executive conference tables from seasoned hardwoods.',
    descriptionAm: 'ከደረቀ ጠንካራ እንጨት የተሰሩ የመመገቢያ፣ የቡና እና የስብሰባ ጠረጴዛዎች።',
  },
  {
    id: 'beds',
    name: 'Beds',
    nameAm: 'አልጋዎች',
    slug: 'beds',
    prefix: 'BED',
    cover: 'cover-beds.jpg',
    description: 'Architectural platform beds, floating bedframes, and bespoke master bedroom timber suites.',
    descriptionAm: 'ዘመናዊ የእንጨት ፕላትፎርም አልጋዎች፣ ተንሳፋፊ አልጋዎች እና ምቹ የመኝታ ክፍሎች።',
  },
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    nameAm: 'ቁም ሳጥኖች',
    slug: 'wardrobes',
    prefix: 'WRD',
    cover: 'cover-wardrobes.jpg',
    description: 'Full-height solid wood wardrobes, built-in closets, and modular timber storage armoires.',
    descriptionAm: 'ሙሉ ቁመት ያላቸው ጠንካራ የእንጨት ቁም ሳጥኖች እና የልብስ ማስቀመጫዎች።',
  },
  {
    id: 'wooden-doors',
    name: 'Wooden Doors',
    nameAm: 'የእንጨት በሮች',
    slug: 'wooden-doors',
    prefix: 'WDR',
    cover: 'cover-wooden-doors.jpg',
    description: 'Bespoke solid hardwood entrance and interior passage doors engineered for security and timeless beauty.',
    descriptionAm: 'ለደህንነት እና ለዘላቂ ውበት በጥራት የተሰሩ ጠንካራ የእንጨት ዋና መግቢያ እና የውስጥ በሮች።',
  },
  {
    id: 'wooden-kitchens',
    name: 'Wooden Kitchens',
    nameAm: 'የእንጨት ማብሰያ ክፍሎች (ኪችን)',
    slug: 'wooden-kitchens',
    prefix: 'WKT',
    cover: 'cover-wooden-kitchens.jpg',
    description: 'Complete custom solid timber kitchen suites, cabinet arrays, and architectural pantry installations.',
    descriptionAm: 'ሙሉ የእንጨት ኪችን ካቢኔቶች እና ዘመናዊ የማብሰያ ክፍል እቃዎች።',
  },
  {
    id: 'office-desks',
    name: 'Office Desks',
    nameAm: 'የቢሮ ጠረጴዛዎች',
    slug: 'office-desks',
    prefix: 'ODS',
    cover: 'cover-office-desks.jpg',
    description: 'Executive solid wood desks, study workstations, and commercial computer tables built for productivity.',
    descriptionAm: 'የስራ መሪ ቢሮ ጠረጴዛዎች፣ የጥናት እና የኮምፒውተር ጠረጴዛዎች።',
  },
  {
    id: 'tv-stands',
    name: 'TV Stands',
    nameAm: 'የቲቪ ማስቀመጫዎች',
    slug: 'tv-stands',
    prefix: 'TVS',
    cover: 'cover-tv-stands.jpg',
    description: 'Contemporary solid wood entertainment centers, media credenzas, and lowline TV consoles.',
    descriptionAm: 'ዘመናዊ የእንጨት ቲቪ ማስቀመጫዎች እና የሚዲያ ኮንሶሎች።',
  },
  {
    id: 'wooden-cabinets',
    name: 'Wooden Cabinets',
    nameAm: 'የእንጨት ካቢኔቶች',
    slug: 'wooden-cabinets',
    prefix: 'WCB',
    cover: 'cover-wooden-cabinets.jpg',
    description: 'Handcrafted timber credenzas, dining sideboards, storage units, and accent display cabinets.',
    descriptionAm: 'በእጅ የተሰሩ የእንጨት ካቢኔቶች፣ ሳይድቦርዶች እና የእቃዎች ማስቀመጫዎች።',
  },
  {
    id: 'other-wood-products',
    name: 'Other Wood Products',
    nameAm: 'ሌሎች የእንጨት ውጤቶች',
    slug: 'other-wood-products',
    prefix: 'OWP',
    cover: 'cover-other-wood-products.jpg',
    description: 'Custom architectural wood wall cladding, floating shelves, divider screens, and bespoke joinery.',
    descriptionAm: 'የእንጨት ግድግዳ ማሸፈኛዎች፣ ተንሳፋፊ መደርደሪያዎች፣ ክፍል ከፋዮች እና ሌሎች የእንጨት ውጤቶች።',
  },
];

// 2. METAL WORKS CATEGORIES (3)
const METAL_CATEGORIES: CategoryConfig[] = [
  {
    id: 'metal-gates',
    name: 'Metal Gates',
    nameAm: 'የብረት ግቢ በሮች',
    slug: 'metal-gates',
    prefix: 'MGT',
    cover: 'cover-metal-gates.jpg',
    description: 'Heavy-duty driveway gates, perimeter compound gates, and laser-cut security entrance systems.',
    descriptionAm: 'ጠንካራ የብረት ግቢ በሮች፣ የሌዘር ቅርጽ በሮች እና አስተማማኝ የጥበቃ መግቢያዎች።',
  },
  {
    id: 'metal-handrails',
    name: 'Metal Handrails',
    nameAm: 'የብረት የእጅ መደገፊያዎች',
    slug: 'metal-handrails',
    prefix: 'MHR',
    cover: 'cover-metal-handrails.jpg',
    description: 'Architectural steel handrails, balustrades, staircase safety railings, and commercial guardrails.',
    descriptionAm: 'የደረጃ እና የረንዳ የብረት የእጅ መደገፊያዎች፣ የጥበቃ አጥሮች እና ዘመናዊ የደህንነት ባሉስትሬዶች።',
  },
  {
    id: 'metal-windows',
    name: 'Metal Windows',
    nameAm: 'የብረት መስኮቶች',
    slug: 'metal-windows',
    prefix: 'MWN',
    cover: 'cover-metal-windows.jpg',
    description: 'Architectural steel frame windows, security grille systems, and contemporary casement fixtures.',
    descriptionAm: 'ዘመናዊ የብረት ፍሬም መስኮቶች፣ የጥበቃ ግሪሎች እና የብረት የመስታወት መስኮቶች።',
  },
];

// 3. HYBRID WORKS CATEGORIES (5)
const HYBRID_CATEGORIES: CategoryConfig[] = [
  {
    id: 'hybrid-chairs',
    name: 'Hybrid Chairs',
    nameAm: 'የእንጨት እና ብረት ወንበሮች',
    slug: 'hybrid-chairs',
    prefix: 'HCH',
    cover: 'cover-hybrid-chairs.jpg',
    description: 'Contemporary industrial seating marrying heavy-gauge welded steel frames with contoured solid timber.',
    descriptionAm: 'ጠንካራ የብረት ፍሬም እና ውብ የእንጨት መቀመጫ ያላቸው ዘመናዊ የኢንዱስትሪ ዲዛይን ወንበሮች።',
  },
  {
    id: 'hybrid-tables',
    name: 'Hybrid Tables',
    nameAm: 'የእንጨት እና ብረት ጠረጴዛዎች',
    slug: 'hybrid-tables',
    prefix: 'HTB',
    cover: 'cover-hybrid-tables.jpg',
    description: 'Live-edge and solid hardwood slab dining and conference tables with structural welded steel bases.',
    descriptionAm: 'በጠንካራ የብረት እግሮች የተደገፉ ውብ የተፈጥሮ እንጨት የመመገቢያ እና የስብሰባ ጠረጴዛዎች።',
  },
  {
    id: 'hybrid-beds',
    name: 'Hybrid Beds',
    nameAm: 'የእንጨት እና ብረት አልጋዎች',
    slug: 'hybrid-beds',
    prefix: 'HBD',
    cover: 'cover-hybrid-beds.jpg',
    description: 'Architectural platform beds, canopy frames, and lofts built with steel structure and warm timber elements.',
    descriptionAm: 'የብረት እና የእንጨት ውህደት ያላቸው ዘመናዊ ፕላትፎርም፣ ካኖፒ እና ሎፍት አልጋዎች።',
  },
  {
    id: 'hybrid-shelving',
    name: 'Hybrid Shelving',
    nameAm: 'የእንጨት እና ብረት መደርደሪያዎች',
    slug: 'hybrid-shelving',
    prefix: 'HSH',
    cover: 'cover-hybrid-shelving.jpg',
    description: 'Industrial modular wall units, bookcases, and heavy-duty display shelving combining steel and timber.',
    descriptionAm: 'የብረት ፍሬም እና ጠንካራ የእንጨት ሰሌዳ ያላቸው ሞዱላር የመጻሕፍት እና የእቃ መደርደሪያዎች።',
  },
  {
    id: 'hybrid-wardrobes-cabinets',
    name: 'Hybrid Wardrobes & Cabinets',
    nameAm: 'የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች',
    slug: 'hybrid-wardrobes-cabinets',
    prefix: 'HWC',
    cover: 'cover-hybrid-wardrobes.jpg',
    description: 'Industrial mesh-front wardrobes, steel-framed credenzas, and contemporary timber armoires.',
    descriptionAm: 'ጠንካራ የብረት መዋቅር እና ውብ የእንጨት ፊት ለፊት ያላቸው ቁም ሳጥኖች፣ ካቢኔቶች እና ሳይድቦርዶች።',
  },
];

interface WorkshopCatalogProps {
  products?: Product[];
}

export const WorkshopCatalog: React.FC<WorkshopCatalogProps> = ({ products: propProducts }) => {
  const { language, localize } = useLanguageStore();

  // Ensure products are always populated with all 90 items even before API loads or on network issues
  const [products, setProducts] = useState<Product[]>(() => {
    return (Array.isArray(propProducts) && propProducts.length > 0) ? propProducts : CATALOG_PRODUCTS;
  });

  React.useEffect(() => {
    if (Array.isArray(propProducts) && propProducts.length > 0) {
      setProducts(propProducts);
    } else {
      productsApi.getAll({ page_size: 100 })
        .then(res => {
          const list = extractResults<Product>(res.data);
          if (list.length > 0) {
            setProducts(list);
          }
        })
        .catch(err => {
          console.warn('Using embedded catalog products:', err);
        });
    }
  }, [propProducts]);

  // Safe products accessor guaranteeing an array is always used
  const safeProducts = Array.isArray(products) && products.length > 0 ? products : CATALOG_PRODUCTS;

  // Active expanded category for each section
  const [activeWoodCat, setActiveWoodCat] = useState<string | null>(null);
  const [activeMetalCat, setActiveMetalCat] = useState<string | null>(null);
  const [activeHybridCat, setActiveHybridCat] = useState<string | null>(null);

  // Helper to resolve product image reliably
  const getProductImage = (prod?: Product | null): string => {
    if (!prod) return '/hara-official-logo.png';
    if (prod.primary_image) {
      if (prod.primary_image.startsWith('http://') || prod.primary_image.startsWith('https://')) {
        return prod.primary_image;
      }
      if (prod.primary_image.startsWith('/')) return prod.primary_image;
      return `/${prod.primary_image}`;
    }
    if (prod.images && prod.images.length > 0 && prod.images[0].image) {
      const img = prod.images[0].image;
      return img.startsWith('/') ? img : `/${img}`;
    }
    // Fallback to SKU image path
    if (prod.sku) {
      const ext = prod.sku === 'WDR-004' ? 'png' : ['WKT-002', 'WKT-003', 'WKT-005'].includes(prod.sku) ? 'webp' : 'jpg';
      return `/images/services/${prod.sku}.${ext}`;
    }
    return '/hara-official-logo.png';
  };

  // Filter products by SKU prefix
  const getProductsByPrefix = (prefix: string): Product[] => {
    return safeProducts
      .filter((p) => p && p.sku && p.sku.startsWith(`${prefix}-`))
      .sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
  };

  // Curated Featured Products for each section
  const featuredWoodProducts = React.useMemo(() => {
    const targetSkus = ['CHR-001', 'TBL-001', 'BED-001', 'WRD-001', 'WDR-001'];
    return targetSkus
      .map(sku => safeProducts.find(p => p && p.sku === sku) || CATALOG_PRODUCTS.find(p => p.sku === sku))
      .filter((p): p is Product => !!p);
  }, [safeProducts]);

  const featuredMetalProducts = React.useMemo(() => {
    const targetSkus = ['MGT-001', 'MGT-002', 'MHR-001', 'MWN-001', 'MWN-002'];
    return targetSkus
      .map(sku => safeProducts.find(p => p && p.sku === sku) || CATALOG_PRODUCTS.find(p => p.sku === sku))
      .filter((p): p is Product => !!p);
  }, [safeProducts]);

  const featuredHybridProducts = React.useMemo(() => {
    const targetSkus = ['HCH-001', 'HTB-001', 'HBD-001', 'HSH-001', 'HWC-001'];
    return targetSkus
      .map(sku => safeProducts.find(p => p && p.sku === sku) || CATALOG_PRODUCTS.find(p => p.sku === sku))
      .filter((p): p is Product => !!p);
  }, [safeProducts]);

  // Product Card Renderer matching reference design
  const renderProductCard = (product: Product) => {
    const title = language === 'am' && product.name_am ? product.name_am : product.name;
    const material = language === 'am' && product.material_am ? product.material_am : product.material;
    const imageUrl = getProductImageUrl(product);

    const serviceName = product.service_category_display || (
      product.service_category === 'WOOD_WORKS' ? 'Wood Works' :
      product.service_category === 'METAL_WORKS' ? 'Metal Works' : 'Hybrid Metal + Wood Construction'
    );

    const params = new URLSearchParams();
    if (product.id) params.set('productId', product.id);
    if (product.sku) params.set('sku', product.sku);
    if (product.name) params.set('name', product.name);
    if (serviceName) params.set('service', serviceName);
    if (product.material) params.set('material', product.material);
    if (imageUrl) params.set('image', imageUrl);

    const orderUrl = `/request-quote?${params.toString()}`;

    return (
      <div 
        key={product.sku || product.id}
        className="bg-white rounded-xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group text-left"
      >
        <div className="relative">
          {/* Product Image */}
          <div className="h-48 sm:h-52 w-full bg-stone-100 overflow-hidden relative">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('hara-official-logo')) {
                  target.src = '/hara-official-logo.png';
                }
              }}
            />
            {/* SKU Badge */}
            <div className="absolute top-2.5 left-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
              {product.sku}
            </div>
            {/* Stock status indicator */}
            <div className="absolute top-2.5 right-2.5 bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">
              {language === 'am' ? 'በትዕዛዝ' : 'Custom'}
            </div>
          </div>

          {/* Details Content */}
          <div className="p-4 space-y-2">
            <h4 className="text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-brand-red transition-colors">
              {title}
            </h4>
            {material && (
              <p className="text-xs text-stone-500 line-clamp-1">
                {material}
              </p>
            )}
            <div className="pt-1 flex items-baseline justify-between">
              <span className="text-[11px] text-stone-400 font-medium">
                {language === 'am' ? 'መነሻ ዋጋ' : 'Starting from'}
              </span>
              <span className="text-sm font-bold text-stone-900">
                {product.starting_price ? `${Number(product.starting_price).toLocaleString()} ETB` : 'By Quote'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-stone-100 mt-2">
          <Link
            to={`/products/${product.sku || product.id}`}
            className="inline-flex items-center justify-center space-x-1 py-2 px-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'ዝርዝር' : 'Details'}</span>
          </Link>
          <Link
            to={orderUrl}
            state={{ product }}
            onClick={() => useProductOrderStore.getState().setSelectedProduct(product)}
            className="inline-flex items-center justify-center space-x-1 py-2 px-2.5 rounded-lg bg-brand-red hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'እዘዝ' : 'Order'}</span>
          </Link>
        </div>
      </div>
    );
  };

  // Category Card Renderer with Circular Red Arrow
  const renderCategoryCard = (
    cat: CategoryConfig, 
    activeCatId: string | null, 
    onToggle: (id: string) => void
  ) => {
    const isExpanded = activeCatId === cat.id;
    const catTitle = language === 'am' ? cat.nameAm : cat.name;
    const catProducts = getProductsByPrefix(cat.prefix);
    const count = catProducts.length || 5;

    return (
      <div
        key={cat.id}
        onClick={() => onToggle(cat.id)}
        className={`bg-white rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 flex flex-col group select-none ${
          isExpanded 
            ? 'border-brand-red ring-2 ring-brand-red/20 shadow-md scale-[1.02]' 
            : 'border-stone-200/90 shadow-xs hover:shadow-md hover:border-stone-300'
        }`}
      >
        {/* Cover Photo */}
        <div className="h-36 sm:h-40 w-full bg-stone-100 overflow-hidden relative">
          <img
            src={`/images/categories/${cat.cover}`}
            alt={catTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/hara-official-logo.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-3 text-white text-[11px] font-semibold drop-shadow-sm">
            {count} {language === 'am' ? 'እቃዎች' : 'Products'}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 flex items-center justify-between text-left">
          <div className="pr-2">
            <h3 className="text-sm font-bold text-stone-900 group-hover:text-brand-red transition-colors">
              {catTitle}
            </h3>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5">
              Code: {cat.prefix}
            </p>
          </div>

          {/* Circular Red Arrow Button */}
          <button
            type="button"
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform flex-shrink-0 shadow-sm ${
              isExpanded 
                ? 'bg-stone-900 rotate-90' 
                : 'bg-brand-red group-hover:scale-110'
            }`}
            aria-label={`Toggle ${catTitle}`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Category Products Accordion Panel
  const renderAccordionPanel = (
    cat: CategoryConfig, 
    onClose: () => void
  ) => {
    const catProducts = getProductsByPrefix(cat.prefix);
    const catTitle = language === 'am' ? cat.nameAm : cat.name;
    const catDesc = language === 'am' ? cat.descriptionAm : cat.description;

    return (
      <div className="mt-6 p-6 sm:p-8 bg-stone-50 rounded-2xl border border-stone-200/90 shadow-inner animate-fadeIn text-left">
        {/* Accordion Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded">
                Prefix: {cat.prefix}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                {catTitle} ({catProducts.length} {language === 'am' ? 'እቃዎች' : 'Models'})
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
              {catDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 hover:border-stone-400 px-3.5 py-2 rounded-lg transition-colors self-start sm:self-center shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>{language === 'am' ? 'ዝጋ' : 'Close Category View'}</span>
          </button>
        </div>

        {/* 5 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
          {catProducts.map((p) => renderProductCard(p))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-16 py-6" id="products-catalog">

      {/* ============================================================== */}
      {/* 1. WOOD WORKS SECTION (Warm Ivory / Off-White #FBF8F3)          */}
      {/* ============================================================== */}
      <section className="bg-[#FBF8F3] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-stone-200/70 text-left">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Section Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Hammer className="w-3.5 h-3.5 text-brand-red" />
              <span>{language === 'am' ? 'የእንጨት ስራዎች' : 'WOOD WORKS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">
              {language === 'am' 
                ? 'በጥራት የተሰሩ ጠንካራ የእንጨት ውጤቶች እና አርክቴክቸር' 
                : 'Mastercrafted Solid Wood & Timber Architecture'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              {language === 'am'
                ? 'በጥንቃቄ የተሰሩ የእንጨት መገጣጠሚያዎች፣ የደረቀ ጠንካራ እንጨት እና ለትውልድ የሚቆዩ ውብ የእጅ ጥበብ ውጤቶች። 10 ይፋዊ ክፍሎች።'
                : 'Precision mortise-and-tenon craftsmanship, kiln-dried hardwoods, and bespoke joinery built to endure for generations across 10 official categories.'}
            </p>
          </div>

          {/* 10 Category Cards in 2 Rows of 5 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {WOOD_CATEGORIES.map((cat) =>
              renderCategoryCard(cat, activeWoodCat, (id) =>
                setActiveWoodCat(activeWoodCat === id ? null : id)
              )
            )}
          </div>

          {/* Accordion Expandable Products Container */}
          {activeWoodCat && (() => {
            const selectedCat = WOOD_CATEGORIES.find(c => c.id === activeWoodCat);
            return selectedCat ? renderAccordionPanel(selectedCat, () => setActiveWoodCat(null)) : null;
          })()}

          {/* Curated Row: Featured Wood Works Products */}
          <div className="pt-8 border-t border-stone-200/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                  {language === 'am' ? 'ተመራጭ የእንጨት ስራዎች' : 'Featured Wood Works Products'}
                </h3>
                <p className="text-xs text-stone-500">
                  {language === 'am' ? 'በእጅ የተሰሩ ምርጥ የእንጨት ሞዴሎች' : 'Handpicked mastercrafted models'}
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-red">
                5 {language === 'am' ? 'ተመራጭ' : 'Curated'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredWoodProducts.map((p) => renderProductCard(p))}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. METAL WORKS SECTION (Subtle Light Blue-Gray #EDF2F7)         */}
      {/* ============================================================== */}
      <section className="bg-[#EDF2F7] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200 text-left">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Section Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-brand-red" />
              <span>{language === 'am' ? 'የብረት ስራዎች' : 'METAL WORKS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {language === 'am' 
                ? 'ጠንካራ የመዋቅር እና የአርክቴክቸራል ብረት ውጤቶች' 
                : 'Heavy-Gauge Structural & Architectural Metal Solutions'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {language === 'am'
                ? 'አስተማማኝ ብየዳ፣ ከዝገት መከላከያ ቀለም እና ለደህንነት እና ለጥንካሬ የተሰሩ ዘመናዊ የሌዘር ቅርጾች። 3 ይፋዊ ክፍሎች።'
                : 'MIG/TIG welded steel, rust-inhibiting finishes, and precision laser profiles engineered for security and endurance across 3 approved categories.'}
            </p>
          </div>

          {/* 3 Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl">
            {METAL_CATEGORIES.map((cat) =>
              renderCategoryCard(cat, activeMetalCat, (id) =>
                setActiveMetalCat(activeMetalCat === id ? null : id)
              )
            )}
          </div>

          {/* Accordion Expandable Products Container */}
          {activeMetalCat && (() => {
            const selectedCat = METAL_CATEGORIES.find(c => c.id === activeMetalCat);
            return selectedCat ? renderAccordionPanel(selectedCat, () => setActiveMetalCat(null)) : null;
          })()}

          {/* Curated Row: Featured Metal Works Products */}
          <div className="pt-8 border-t border-slate-300/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {language === 'am' ? 'ተመራጭ የብረት ስራዎች' : 'Featured Metal Works Products'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'am' ? 'አስተማማኝ የብረት ሞዴሎች' : 'High-security architectural models'}
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-red">
                5 {language === 'am' ? 'ተመራጭ' : 'Curated'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredMetalProducts.map((p) => renderProductCard(p))}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. HYBRID WORKS SECTION (Warm Ivory / Off-White #FBF8F3)        */}
      {/* ============================================================== */}
      <section className="bg-[#FBF8F3] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-stone-200/70 text-left">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Section Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-brand-red" />
              <span>{language === 'am' ? 'የእንጨት እና ብረት ቅይጥ ስራዎች' : 'HYBRID METAL + WOOD'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">
              {language === 'am' 
                ? 'የጠንካራ ብረት እና የተፈጥሮ እንጨት ድንቅ ውህደት' 
                : 'Harmonious Union of Structural Steel & Warm Timber'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              {language === 'am'
                ? 'የኢንዱስትሪ ጥንካሬ ያለው የብረት መዋቅር ከተፈጥሮ ቅርጽ እና ጠንካራ የእንጨት ገጽታ ጋር ተጣምሮ የተሰራ። 5 ይፋዊ ክፍሎች።'
                : 'Industrial strength welded steel frames merged with live-edge and contoured solid timber surfaces across 5 approved categories.'}
            </p>
          </div>

          {/* 5 Category Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
            {HYBRID_CATEGORIES.map((cat) =>
              renderCategoryCard(cat, activeHybridCat, (id) =>
                setActiveHybridCat(activeHybridCat === id ? null : id)
              )
            )}
          </div>

          {/* Accordion Expandable Products Container */}
          {activeHybridCat && (() => {
            const selectedCat = HYBRID_CATEGORIES.find(c => c.id === activeHybridCat);
            return selectedCat ? renderAccordionPanel(selectedCat, () => setActiveHybridCat(null)) : null;
          })()}

          {/* Curated Row: Featured Hybrid Works Products */}
          <div className="pt-8 border-t border-stone-200/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                  {language === 'am' ? 'ተመራጭ የቅይጥ ስራዎች' : 'Featured Hybrid Works Products'}
                </h3>
                <p className="text-xs text-stone-500">
                  {language === 'am' ? 'የብረትና እንጨት ውህደት ውጤቶች' : 'Integrated structural timber models'}
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-red">
                5 {language === 'am' ? 'ተመራጭ' : 'Curated'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredHybridProducts.map((p) => renderProductCard(p))}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CUSTOM PROJECT ORDER BANNER                                   */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
        <div className="bg-stone-900 text-white rounded-2xl p-8 sm:p-12 border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">
              {language === 'am' ? 'ልዩ ትዕዛዝ' : 'Custom Project'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {language === 'am'
                ? 'የራስዎን ዲዛይን ወይም ልዩ ልኬት ማዘዝ ይፈልጋሉ?'
                : 'Need a custom size, architectural drawing, or unique design?'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {language === 'am'
                ? 'ያለዎትን ፕላን፣ ስኬች ወይም ልኬት ያስገቡ። ወርክሾፓችን በቀጥታ በቴሌግራም ወይም በስልክ ምላሽ ይሰጥዎታል።'
                : 'Submit your architectural blueprints, sketch, or measurements directly. No account required — our workshop manager will calculate the material quote.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/request-quote"
              className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'am' ? 'ትዕዛዝ ይጠይቁ' : 'Request a Project'}</span>
            </Link>
            <a
              href="https://t.me/Manager_Samuel_A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold py-3.5 px-6 rounded-full text-xs border border-stone-700 transition-colors"
            >
              <span>{language === 'am' ? 'ቴሌግራም፦ @Manager_Samuel_A' : 'Telegram: @Manager_Samuel_A'}</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
