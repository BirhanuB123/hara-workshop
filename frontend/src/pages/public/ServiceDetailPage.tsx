import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, Hammer, Layers, ShieldCheck, Clock, CheckCircle2, 
  ChevronRight, ChevronLeft, X, ArrowLeft, ArrowRight, Sparkles, 
  Building, ZoomIn, Phone, Search, 
  PlusCircle, Eye, Box, ArrowUpRight, ChevronUp, FolderOpen
} from 'lucide-react';
import { servicesApi, productsApi, extractResults } from '../../services/api';
import { Service, Product } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useLanguageStore } from '../../store/languageStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';
import { getProductImageUrl, getServiceImageUrl, resolveProductImagePath } from '../../utils/productUtils';
import { useProductOrderStore } from '../../store/productOrderStore';

export interface CategoryCardDef {
  name: string;
  nameAm: string;
  slug: string;
  coverImage: string;
  description: string;
  descriptionAm: string;
  productCount: number;
  skuPrefix: string;
}

export const APPROVED_SERVICE_CATEGORIES: Record<string, CategoryCardDef[]> = {
  'wood-works': [
    {
      name: 'Chairs',
      nameAm: 'ወንበሮች',
      slug: 'chairs',
      coverImage: '/images/categories/cover-chairs.jpg',
      description: 'Handcrafted solid wood dining, lounge, and accent chairs built with precision joinery.',
      descriptionAm: 'በጥንቃቄ የእንጨት መገጣጠሚያ የተሰሩ ጠንካራ የእንጨት የመመገቢያ፣ የሳሎን እና ልዩ ወንበሮች።',
      productCount: 5,
      skuPrefix: 'CHR',
    },
    {
      name: 'Tables',
      nameAm: 'ጠረጴዛዎች',
      slug: 'tables',
      coverImage: '/images/categories/cover-tables.jpg',
      description: 'Custom solid timber dining, coffee, and conference tables crafted from seasoned hardwoods.',
      descriptionAm: 'ከደረቀ ጠንካራ እንጨት የተሰሩ የመመገቢያ፣ የቡና እና የስብሰባ ጠረጴዛዎች።',
      productCount: 5,
      skuPrefix: 'TBL',
    },
    {
      name: 'Beds',
      nameAm: 'አልጋዎች',
      slug: 'beds',
      coverImage: '/images/categories/cover-beds.jpg',
      description: 'Modern timber platform beds, floating bedframes, and bespoke master bedroom suites.',
      descriptionAm: 'ዘመናዊ የእንጨት ፕላትፎርም አልጋዎች፣ ተንሳፋፊ አልጋዎች እና ምቹ የመኝታ ክፍሎች።',
      productCount: 5,
      skuPrefix: 'BED',
    },
    {
      name: 'Wardrobes',
      nameAm: 'ቁም ሳጥኖች',
      slug: 'wardrobes',
      coverImage: '/images/categories/cover-wardrobes.jpg',
      description: 'Full-height solid wood wardrobes, built-in closets, and modular timber armoires.',
      descriptionAm: 'ሙሉ ቁመት ያላቸው ጠንካራ የእንጨት ቁም ሳጥኖች እና የልብስ ማስቀመጫዎች።',
      productCount: 5,
      skuPrefix: 'WRD',
    },
    {
      name: 'Wooden Doors',
      nameAm: 'የእንጨት በሮች',
      slug: 'wooden-doors',
      coverImage: '/images/categories/cover-wooden-doors.jpg',
      description: 'Bespoke solid hardwood entrance and interior doors engineered for security and timeless elegance.',
      descriptionAm: 'ለደህንነት እና ለዘላቂ ውበት በጥራት የተሰሩ ጠንካራ የእንጨት ዋና መግቢያ እና የውስጥ በሮች።',
      productCount: 5,
      skuPrefix: 'WDR',
    },
    {
      name: 'Wooden Kitchens',
      nameAm: 'የእንጨት ማብሰያ ክፍሎች (ኪችን)',
      slug: 'wooden-kitchens',
      coverImage: '/images/categories/cover-wooden-kitchens.jpg',
      description: 'Complete custom solid timber kitchen suites, cabinet sets, and architectural pantry installations.',
      descriptionAm: 'ሙሉ የእንጨት ኪችን ካቢኔቶች እና ዘመናዊ የማብሰያ ክፍል እቃዎች።',
      productCount: 5,
      skuPrefix: 'WKT',
    },
    {
      name: 'Office Desks',
      nameAm: 'የቢሮ ጠረጴዛዎች',
      slug: 'office-desks',
      coverImage: '/images/categories/cover-office-desks.jpg',
      description: 'Executive solid wood desks, study workstations, and computer desks tailored for productivity.',
      descriptionAm: 'የስራ መሪ ቢሮ ጠረጴዛዎች፣ የጥናት እና የኮምፒውተር ጠረጴዛዎች።',
      productCount: 5,
      skuPrefix: 'ODS',
    },
    {
      name: 'TV Stands',
      nameAm: 'የቲቪ ማስቀመጫዎች',
      slug: 'tv-stands',
      coverImage: '/images/categories/cover-tv-stands.jpg',
      description: 'Contemporary solid wood entertainment centers, media credenzas, and lowline TV consoles.',
      descriptionAm: 'ዘመናዊ የእንጨት ቲቪ ማስቀመጫዎች እና የሚዲያ ኮንሶሎች።',
      productCount: 5,
      skuPrefix: 'TVS',
    },
    {
      name: 'Wooden Cabinets',
      nameAm: 'የእንጨት ካቢኔቶች',
      slug: 'wooden-cabinets',
      coverImage: '/images/categories/cover-wooden-cabinets.jpg',
      description: 'Handcrafted timber credenzas, dining sideboards, storage units, and accent display cabinets.',
      descriptionAm: 'በእጅ የተሰሩ የእንጨት ካቢኔቶች፣ ሳይድቦርዶች እና የእቃዎች ማስቀመጫዎች።',
      productCount: 5,
      skuPrefix: 'WCB',
    },
    {
      name: 'Other Wood Products',
      nameAm: 'ሌሎች የእንጨት ውጤቶች',
      slug: 'other-wood-products',
      coverImage: '/images/categories/cover-other-wood-products.jpg',
      description: 'Custom architectural wood wall cladding, floating shelves, divider screens, and bespoke woodwork.',
      descriptionAm: 'የእንጨት ግድግዳ ማሸፈኛዎች፣ ተንሳፋፊ መደርደሪያዎች፣ ክፍል ከፋዮች እና ሌሎች የእንጨት ውጤቶች።',
      productCount: 5,
      skuPrefix: 'OWP',
    },
  ],
  'metal-works': [
    {
      name: 'Metal Gates',
      nameAm: 'የብረት ግቢ በሮች',
      slug: 'metal-gates',
      coverImage: '/images/categories/cover-metal-gates.jpg',
      description: 'Heavy-duty driveway gates, perimeter compound gates, and laser-cut security entrance systems.',
      descriptionAm: 'ጠንካራ የብረት ግቢ በሮች፣ የሌዘር ቅርጽ በሮች እና አስተማማኝ የጥበቃ መግቢያዎች።',
      productCount: 5,
      skuPrefix: 'MGT',
    },
    {
      name: 'Metal Windows',
      nameAm: 'የብረት መስኮቶች',
      slug: 'metal-windows',
      coverImage: '/images/categories/cover-metal-windows.jpg',
      description: 'Architectural steel frame windows, security grille systems, and contemporary casement fixtures.',
      descriptionAm: 'ዘመናዊ የብረት ፍሬም መስኮቶች፣ የጥበቃ ግሪሎች እና የብረት የመስታወት መስኮቶች።',
      productCount: 5,
      skuPrefix: 'MWN',
    },
    {
      name: 'Metal Handrails',
      nameAm: 'የብረት የእጅ መደገፊያዎች',
      slug: 'metal-handrails',
      coverImage: '/images/categories/cover-metal-handrails.jpg',
      description: 'Architectural steel handrails, balustrades, staircase safety railings, and commercial guardrails.',
      descriptionAm: 'የደረጃ እና የረንዳ የብረት የእጅ መደገፊያዎች፣ የጥበቃ አጥሮች እና ዘመናዊ የደህንነት ባሉስትሬዶች።',
      productCount: 5,
      skuPrefix: 'MHR',
    },
  ],
  'hybrid-metal-wood': [
    {
      name: 'Hybrid Chairs',
      nameAm: 'የእንጨት እና ብረት ወንበሮች',
      slug: 'hybrid-chairs',
      coverImage: '/images/categories/cover-hybrid-chairs.jpg',
      description: 'Contemporary industrial seating marrying heavy-gauge welded steel frames with contoured solid timber.',
      descriptionAm: 'ጠንካራ የብረት ፍሬም እና ውብ የእንጨት መቀመጫ ያላቸው ዘመናዊ የኢንዱስትሪ ዲዛይን ወንበሮች።',
      productCount: 5,
      skuPrefix: 'HCH',
    },
    {
      name: 'Hybrid Tables',
      nameAm: 'የእንጨት እና ብረት ጠረጴዛዎች',
      slug: 'hybrid-tables',
      coverImage: '/images/categories/cover-hybrid-tables.jpg',
      description: 'Live-edge and solid hardwood slab dining and conference tables with structural welded steel bases.',
      descriptionAm: 'በጠንካራ የብረት እግሮች የተደገፉ ውብ የተፈጥሮ እንጨት የመመገቢያ እና የስብሰባ ጠረጴዛዎች።',
      productCount: 5,
      skuPrefix: 'HTB',
    },
    {
      name: 'Hybrid Beds',
      nameAm: 'የእንጨት እና ብረት አልጋዎች',
      slug: 'hybrid-beds',
      coverImage: '/images/categories/cover-hybrid-beds.jpg',
      description: 'Architectural platform beds, canopy frames, and lofts built with steel structure and warm timber elements.',
      descriptionAm: 'የብረት እና የእንጨት ውህደት ያላቸው ዘመናዊ ፕላትፎርም፣ ካኖፒ እና ሎፍት አልጋዎች።',
      productCount: 5,
      skuPrefix: 'HBD',
    },
    {
      name: 'Hybrid Shelving',
      nameAm: 'የእንጨት እና ብረት መደርደሪያዎች',
      slug: 'hybrid-shelving',
      coverImage: '/images/categories/cover-hybrid-shelving.jpg',
      description: 'Industrial modular wall units, bookcases, and heavy-duty display shelving combining steel and timber.',
      descriptionAm: 'የብረት ፍሬም እና ጠንካራ የእንጨት ሰሌዳ ያላቸው ሞዱላር የመጻሕፍት እና የእቃ መደርደሪያዎች።',
      productCount: 5,
      skuPrefix: 'HSH',
    },
    {
      name: 'Hybrid Wardrobes & Cabinets',
      nameAm: 'የእንጨት እና ብረት ቁም ሳጥኖች እና ካቢኔቶች',
      slug: 'hybrid-wardrobes-cabinets',
      coverImage: '/images/categories/cover-hybrid-wardrobes.jpg',
      description: 'Industrial mesh-front wardrobes, steel-framed credenzas, and contemporary timber armoires.',
      descriptionAm: 'ጠንካራ የብረት መዋቅር እና ውብ የእንጨት ፊት ለፊት ያላቸው ቁም ሳጥኖች፣ ካቢኔቶች እና ሳይድቦርዶች።',
      productCount: 5,
      skuPrefix: 'HWC',
    },
  ],
};

const SERVICE_HERO_ASSETS: Record<string, string> = {
  'wood-works': '/images/services/service-wood-works.jpg',
  'metal-works': '/images/services/service-metal-works.jpg',
  'hybrid-metal-wood': '/images/services/service-hybrid-works.jpg',
  'hybrid-metal-wood-construction': '/images/services/service-hybrid-works.jpg',
};

const SERVICE_META: Record<string, {
  title: string;
  subtitle: string;
  category: string;
  materialStandard: string;
  materialPurityRule: string;
}> = {
  'wood-works': {
    title: 'Wood Works',
    subtitle: 'Custom woodworking, fine carpentry, solid timber furniture, doors, cabinetry, and handcrafted wood products.',
    category: 'WOOD_WORKS',
    materialStandard: '100% Solid Wood Only',
    materialPurityRule: 'STRICT MATERIAL STANDARD: Every product in this section is crafted exclusively from solid timber. Zero visible metal frames, zero steel legs, zero mixed materials.',
  },
  'metal-works': {
    title: 'Metal Works',
    subtitle: 'Custom structural steel fabrication, architectural gates, doors, railings, staircases, and heavy-duty metal engineering.',
    category: 'METAL_WORKS',
    materialStandard: '100% Structural Metal Only',
    materialPurityRule: 'STRICT MATERIAL STANDARD: Every product in this section is built entirely from heavy-duty structural steel, aluminum, or wrought iron. Zero wooden tops, zero timber steps, zero mixed materials.',
  },
  'hybrid-metal-wood': {
    title: 'Hybrid Metal + Wood Construction',
    subtitle: 'Modern architectural and interior solutions combining the strength of structural steel with the warmth and character of solid wood.',
    category: 'HYBRID_METAL_WOOD',
    materialStandard: 'Genuine Metal + Wood Fusion',
    materialPurityRule: 'ARCHITECTURAL FUSION: Every product visibly and genuinely combines both heavy-gauge structural steel and seasoned natural hardwood.',
  },
  'hybrid-metal-wood-construction': {
    title: 'Hybrid Metal + Wood Construction',
    subtitle: 'Modern architectural and interior solutions combining the strength of structural steel with the warmth and character of solid wood.',
    category: 'HYBRID_METAL_WOOD',
    materialStandard: 'Genuine Metal + Wood Fusion',
    materialPurityRule: 'ARCHITECTURAL FUSION: Every product visibly and genuinely combines both heavy-gauge structural steel and seasoned natural hardwood.',
  },
};

export const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language, localize } = useLanguageStore();

  // Active expanded category: defaults to the first category so products reveal immediately (non-hybrid only)
  const normalizedSlug = (slug || 'wood-works').toLowerCase();
  const isHybrid = normalizedSlug === 'hybrid-metal-wood' || 
                   normalizedSlug === 'hybrid-metal-wood-construction' || 
                   normalizedSlug.includes('hybrid') ||
                   (normalizedSlug.includes('metal') && normalizedSlug.includes('wood')) ||
                   normalizedSlug.includes('ቅይጥ');
  const resolvedSlug = isHybrid 
    ? 'hybrid-metal-wood' 
    : (normalizedSlug.includes('metal') || normalizedSlug.includes('ብረት')) 
    ? 'metal-works' 
    : 'wood-works';

  const approvedCategories = APPROVED_SERVICE_CATEGORIES[resolvedSlug] || APPROVED_SERVICE_CATEGORIES['wood-works'];

  const baseMeta = (resolvedSlug && SERVICE_META[resolvedSlug]) || (slug && SERVICE_META[slug.toLowerCase()]) || {
    title: isHybrid ? 'Hybrid Metal + Wood Construction' : 'Workshop Capability',
    subtitle: isHybrid ? 'Modern architectural and interior solutions combining the strength of structural steel with the warmth and character of solid wood.' : 'Custom engineering, manufacturing, and architectural solutions.',
    category: isHybrid ? 'HYBRID_METAL_WOOD' : 'WOOD_WORKS',
    materialStandard: isHybrid ? 'Genuine Metal + Wood Fusion' : 'Precision Workshop Fabrication',
    materialPurityRule: isHybrid ? 'ARCHITECTURAL FUSION: Every product visibly and genuinely combines both heavy-gauge structural steel and seasoned natural hardwood.' : 'Strict material quality assurance and bespoke craftsmanship.',
  };

  const fallbackService: Service | null = useMemo(() => {
    if (!resolvedSlug || !baseMeta) return null;
    return {
      id: resolvedSlug,
      title: baseMeta.title,
      title_am: language === 'am' ? (
        resolvedSlug === 'metal-works' ? 'የብረት ስራዎች' :
        resolvedSlug === 'wood-works' ? 'የእንጨት ስራዎች' : 'ቅይጥ የብረት + እንጨት ስራዎች'
      ) : undefined,
      category: baseMeta.category,
      category_name: baseMeta.title,
      slug: resolvedSlug,
      tagline: baseMeta.subtitle,
      short_description: baseMeta.subtitle,
      full_description: baseMeta.subtitle,
      starting_price: resolvedSlug === 'wood-works' ? 45000 : resolvedSlug === 'metal-works' ? 35000 : 95000,
      price_unit: 'per project',
      turnaround_time: '1-3 weeks',
      is_active: true,
      image: getServiceImageUrl(resolvedSlug),
      primary_image: getServiceImageUrl(resolvedSlug),
      offerings: [],
      applications: [],
      materials: [],
      benefits: [],
      process_steps: [],
      gallery_images: [],
      created_at: new Date().toISOString(),
    } as Service;
  }, [baseMeta, resolvedSlug, language]);

  const [service, setService] = useState<Service | null>(fallbackService);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!fallbackService);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    !isHybrid && approvedCategories.length > 0 ? approvedCategories[0].name : null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox State
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Ref to smooth scroll down to product grid upon expansion
  const productsSectionRef = useRef<HTMLDivElement>(null);

  const meta = useMemo(() => {
    if (language !== 'am') return baseMeta;
    if (isHybrid || baseMeta.category === 'HYBRID_METAL_WOOD') {
      return {
        ...baseMeta,
        title: 'ቅይጥ የብረት + እንጨት ስራዎች',
        subtitle: t('services.hybridSubtitle'),
        materialStandard: t('services.hybridBadge'),
        materialPurityRule: t('services.hybridPurity'),
      };
    }
    const isWood = baseMeta.category === 'WOOD_WORKS' || resolvedSlug === 'wood-works';
    const isMetal = baseMeta.category === 'METAL_WORKS' || resolvedSlug === 'metal-works';
    if (isWood) {
      return {
        ...baseMeta,
        title: 'የእንጨት ስራዎች',
        subtitle: t('services.woodWorksSubtitle'),
        materialStandard: t('services.woodWorksBadge'),
        materialPurityRule: t('services.woodWorksPurity'),
      };
    }
    if (isMetal) {
      return {
        ...baseMeta,
        title: 'የብረት ስራዎች',
        subtitle: t('services.metalWorksSubtitle'),
        materialStandard: t('services.metalWorksBadge'),
        materialPurityRule: t('services.metalWorksPurity'),
      };
    }
    return {
      ...baseMeta,
      title: 'ቅይጥ የብረት + እንጨት ስራዎች',
      subtitle: t('services.hybridSubtitle'),
      materialStandard: t('services.hybridBadge'),
      materialPurityRule: t('services.hybridPurity'),
    };
  }, [language, baseMeta, resolvedSlug, isHybrid, t]);

  // Fetch Service & Products
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    // 1. Fetch Service metadata
    servicesApi.getById(resolvedSlug || slug)
      .then((res) => {
        setService(res.data);
      })
      .catch((err) => {
        console.warn('Failed to load live service details from API, using catalog definitions:', err);
        if (fallbackService) {
          setService(fallbackService);
        } else {
          setError('Service details could not be found.');
        }
      })
      .finally(() => setLoading(false));

    // 2. Fetch Products for this category
    const catCode = baseMeta.category;
    productsApi.getAll({ service_category: catCode, page_size: 200 })
      .then((res) => {
        const list: Product[] = extractResults<Product>(res.data);
        if (list.length > 0) {
          setProducts(list);
        } else {
          const fallback = CATALOG_PRODUCTS.filter(p => p.service_category === catCode);
          setProducts(fallback);
        }
      })
      .catch((err) => {
        console.error('Failed to load service products:', err);
      })
      .finally(() => setProductsLoading(false));
  }, [slug, resolvedSlug, baseMeta.category]);

  // Keep expanded category synced when changing services
  useEffect(() => {
    if (!isHybrid && approvedCategories.length > 0) {
      setExpandedCategory(approvedCategories[0].name);
    } else {
      setExpandedCategory(null);
    }
    setSearchQuery('');
  }, [slug, isHybrid]);

  // Handle category card click (Crucial click behavior: expands/reveals products directly BELOW cards, collapses if active)
  const handleCategoryCardClick = (catName: string) => {
    if (expandedCategory === catName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(catName);
      setTimeout(() => {
        if (productsSectionRef.current) {
          productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    }
  };

  const safeProducts = useMemo(() => (
    Array.isArray(products) && products.length > 0
      ? products
      : CATALOG_PRODUCTS.filter(p => p.service_category === baseMeta.category)
  ), [products, baseMeta.category]);

  const getCategoryProducts = useMemo(() => (catDef?: CategoryCardDef | null, catName?: string): Product[] => {
    const targetName = (catDef?.name || catName || '').toLowerCase();
    if (!targetName) return [];
    return safeProducts.filter((p) => {
      if (catDef && p.sku && p.sku.toUpperCase().startsWith(`${catDef.skuPrefix}-`)) {
        return true;
      }
      const sub = (p.subcategory || '').toLowerCase();
      const cat = (p.category_name || '').toLowerCase();
      const ptype = (p.product_type || '').toLowerCase();
      return sub === targetName || cat === targetName || ptype === targetName ||
             sub.includes(targetName) || cat.includes(targetName);
    });
  }, [safeProducts]);

  const hybridProducts = useMemo(() => {
    if (!isHybrid) return [];
    const pool = safeProducts.filter(p => p.service_category === 'HYBRID_METAL_WOOD');
    const source = pool.length > 0 ? pool : CATALOG_PRODUCTS.filter(p => p.service_category === 'HYBRID_METAL_WOOD');
    return source.map((base) => {
      const exactImage = getProductImageUrl(base);
      return {
        ...base,
        primary_image: exactImage,
        images: base.images && base.images.length > 0
          ? base.images.map(img => ({ ...img, image: resolveProductImagePath(img.image) || exactImage }))
          : [{ id: `img-${base.sku || base.id}`, image: exactImage, is_primary: true, caption: `${base.name} (${base.sku})` }]
      } as Product;
    });
  }, [isHybrid, safeProducts]);

  // Filtered hybrid products when searching
  const displayedHybridProducts = useMemo(() => {
    if (!isHybrid) return [];
    if (!searchQuery.trim()) return hybridProducts;
    const q = searchQuery.toLowerCase().trim();
    return hybridProducts.filter((p) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.name_am && p.name_am.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.short_description && p.short_description.toLowerCase().includes(q))
      );
    });
  }, [isHybrid, searchQuery, hybridProducts]);

  // Get products for the currently expanded category (non-hybrid)
  const categoryProducts = useMemo(() => {
    if (!expandedCategory) return [];
    const catDef = approvedCategories.find(c => c.name.toLowerCase() === expandedCategory.toLowerCase());
    return getCategoryProducts(catDef, expandedCategory);
  }, [expandedCategory, approvedCategories, getCategoryProducts]);

  // Filter products when user enters a search query across the service (non-hybrid)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return safeProducts.filter((p) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.name_am && p.name_am.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.product_type && p.product_type.toLowerCase().includes(q))
      );
    });
  }, [safeProducts, searchQuery]);

  // Navigate to quote request with prefilled product
  const handleRequestQuoteClick = (e: React.MouseEvent, prodOrName?: Product | string) => {
    e.stopPropagation();
    const serviceTitle = meta.title;
    if (typeof prodOrName === 'object' && prodOrName !== null) {
      const p = prodOrName as Product;
      useProductOrderStore.getState().setSelectedProduct(p);
      const params = new URLSearchParams();
      if (p.id) params.set('productId', String(p.id));
      if (p.sku) params.set('sku', p.sku);
      if (p.name) params.set('name', p.name);
      params.set('service', serviceTitle);
      if (p.material) params.set('material', p.material);
      const exactImage = getProductImageUrl(p);
      if (exactImage) params.set('image', exactImage);
      navigate(`/request-quote?${params.toString()}`, { state: { product: p } });
    } else if (typeof prodOrName === 'string') {
      navigate(`/request-quote?service=${encodeURIComponent(serviceTitle)}&product=${encodeURIComponent(prodOrName)}`);
    } else {
      navigate(`/request-quote?service=${encodeURIComponent(serviceTitle)}`);
    }
  };

  const galleryLength =
    service?.gallery_images && service.gallery_images.length > 0
      ? service.gallery_images.length
      : service?.image
      ? 1
      : 0;

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeImageIndex === null || galleryLength === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev + 1) % galleryLength : null
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev - 1 + galleryLength) % galleryLength : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, galleryLength]);

  if (loading) return <LoadingSpinner text={t('common.loading')} />;

  if (error || !service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900 uppercase">
          {language === 'am' ? 'አገልግሎቱ አልተገኘም' : 'Service Not Found'}
        </h2>
        <p className="text-sm text-stone-600">
          {language === 'am'
            ? 'የጠየቁት የዎርክሾፕ አገልግሎት አልተገኘም ወይም ወደ ሌላ ቦታ ተዛውሯል።'
            : 'The requested workshop capability does not exist or has been relocated.'}
        </p>
        <Link 
          to="/services" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.backToServices')}
        </Link>
      </div>
    );
  }

  const ServiceIcon = isHybrid || baseMeta.category === 'HYBRID_METAL_WOOD'
    ? Layers 
    : (resolvedSlug === 'metal-works' || meta.title.includes('Metal') || meta.title.includes('ብረት')) 
    ? Wrench 
    : Hammer;

  const gallery = service.gallery_images && service.gallery_images.length > 0 
    ? service.gallery_images 
    : (service.image ? [{ id: 'hero', image: service.image, caption: service.title }] : []);

  const activeCategoryDef = approvedCategories.find(c => c.name.toLowerCase() === (expandedCategory || '').toLowerCase());

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-left text-stone-900 pb-20 space-y-16">
      
      {/* 1. DEDICATED HERO HEADER */}
      <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-stone-200">
        <div className="absolute inset-0 z-0">
          <img
            src={getServiceImageUrl(service || resolvedSlug)}
            alt={meta.title}
            className="w-full h-full object-cover object-center opacity-15 filter blur-[1px] scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const fallback = SERVICE_HERO_ASSETS[resolvedSlug] || getServiceImageUrl(resolvedSlug);
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <div className="max-w-4xl space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('services.allCapabilities')}</span>
              </Link>
              <span className="text-stone-300">/</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-red/10 text-brand-red border border-brand-red/20">
                <ServiceIcon className="w-3.5 h-3.5" />
                {meta.title}
              </span>
              <span className="text-xs text-stone-600 uppercase font-mono tracking-wider bg-white px-2.5 py-1 rounded border border-stone-200 shadow-xs">
                {t('home.boleArabsaFacility')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 uppercase tracking-tight leading-none">
              {meta.title}
            </h1>

            <p className="text-lg sm:text-xl font-medium text-stone-600 border-l-2 border-brand-red pl-4 max-w-3xl leading-relaxed">
              {meta.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-2">
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3.5 py-2 rounded-lg text-stone-800 shadow-xs">
                <Box className="w-4 h-4 text-brand-red" />
                <span>{t('services.productCatalog')}: <strong className="text-brand-red">{isHybrid ? displayedHybridProducts.length : safeProducts.length} {t('common.available')}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3.5 py-2 rounded-lg text-stone-800 shadow-xs">
                <Clock className="w-4 h-4 text-brand-red" />
                <span>{t('common.turnaround')}: <strong className="text-stone-900">{service.turnaround_time || '1–3 Weeks'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3.5 py-2 rounded-lg text-emerald-700 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('common.inHouse')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={(e) => handleRequestQuoteClick(e)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-red hover:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-900/10 hover:scale-[1.02]"
              >
                <span>{t('home.heroCtaQuote')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <a
                href="tel:+251926629999"
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 shadow-xs transition"
              >
                <Phone className="w-4 h-4 text-brand-red" />
                <span>{t('common.callEngineer')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY COVERS & EXPANDABLE PRODUCT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header with Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.showroomCollection')}</span>
              <span className="text-stone-300">•</span>
              <span className="text-xs font-mono font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-xs">
                {`${approvedCategories.length} ${language === 'am' ? 'ምድቦች' : 'Categories'} • ${isHybrid ? hybridProducts.length : safeProducts.length} ${t('common.available')}`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide">
              {meta.title} {t('services.productCatalog')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              {isHybrid
                ? (language === 'am' 
                    ? 'በምድብ ለመለየት ከታች ያሉትን ካርዶች ይጫኑ ወይም ሁሉንም 25 የቅይጥ ምርቶች በቀጥታ ይመልከቱ።' 
                    : 'Filter by any of the 5 hybrid categories below or browse all 25 structural steel & timber fusion models underneath.')
                : (language === 'am' 
                    ? 'ምርቶችን ለማየት ከዚህ በታች ያሉትን የምድብ ካርዶች ይጫኑ። ምርቶቹ በቀጥታ ከካርዶቹ ስር ይዘረጋሉ።' 
                    : 'Click any category cover card below to expand and view its handcrafted products directly underneath.')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'am' ? 'በስም ወይም በኮድ ፈልግ...' : 'Search by name, SKU (e.g. CHR-001)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-red shadow-xs transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Material Quality Assurance Banner */}
        {meta.materialPurityRule && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-stone-200 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-white text-brand-red border border-stone-200 shrink-0 mt-0.5 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-900 block">
                {meta.materialStandard}
              </span>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {meta.materialPurityRule}
              </p>
            </div>
          </div>
        )}

        {/* CATEGORY COVER CARDS GRID (10 cards for Wood Works, 3 cards for Metal Works, 5 cards for Hybrid) */}
        {approvedCategories.length > 0 && (
          <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-stone-600 px-1">
            <span className="flex items-center gap-1.5 text-stone-900">
              <FolderOpen className="w-4 h-4 text-brand-red" />
              {language === 'am' ? 'የተፈቀዱ የምርት ምድቦች' : 'Select a Category to Reveal Products:'}
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {expandedCategory
                ? (language === 'am' ? `የተመረጠ: ${activeCategoryDef?.nameAm || expandedCategory}` : `Open: ${expandedCategory}`)
                : isHybrid
                ? (language === 'am' ? 'ሁሉም (25)' : 'Showing All (25)')
                : (language === 'am' ? 'ምንም አልተመረጠም' : 'None Expanded')}
            </span>
          </div>

          <div className={`grid gap-6 ${
            approvedCategories.length <= 3
              ? 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
          }`}>
            {approvedCategories.map((cat) => {
              const isSelected = expandedCategory?.toLowerCase() === cat.name.toLowerCase();
              const catTitle = language === 'am' ? cat.nameAm : cat.name;
              const catDesc = language === 'am' ? cat.descriptionAm : cat.description;

              return (
                <div
                  key={cat.name}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSelected}
                  aria-label={catTitle}
                  onClick={() => handleCategoryCardClick(cat.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategoryCardClick(cat.name);
                    }
                  }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 border shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red ${
                    isSelected
                      ? 'bg-red-50/40 border-2 border-brand-red ring-2 ring-brand-red/20 shadow-md -translate-y-1'
                      : 'bg-white border-stone-200/90 hover:border-brand-red/50 hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  {/* Category Cover Image with Overlay Badges */}
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-stone-100">
                    <img
                      src={cat.coverImage}
                      alt={catTitle}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = SERVICE_HERO_ASSETS[resolvedSlug] || '/hara-official-logo.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-75" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur text-stone-800 border border-stone-200 shadow-xs">
                        {getCategoryProducts(cat).length} {language === 'am' ? 'ምርቶች' : 'Products'}
                      </span>

                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-red text-white flex items-center gap-1 shadow-sm ring-1 ring-white/30 animate-pulse">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'am' ? 'የተከፈተ' : 'Revealed'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-base font-black tracking-wide uppercase transition-colors line-clamp-1 ${
                          isSelected ? 'text-brand-red' : 'text-stone-900 group-hover:text-brand-red'
                        }`}>
                          {catTitle}
                        </h3>
                        {language !== 'am' && (
                          <span className="text-[10px] text-stone-500 font-normal">
                            {cat.nameAm}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {catDesc}
                      </p>
                    </div>

                    {/* Card Action Button */}
                    <div className="pt-2">
                      {isSelected ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-brand-red text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs">
                          <span>{language === 'am' ? 'ምድብ ዝጋ' : 'Collapse Category'}</span>
                          <ChevronUp className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 group-hover:bg-brand-red group-hover:text-white group-hover:border-brand-red text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                          <span>{language === 'am' ? 'ምርቶችን እይ' : 'Explore Category'}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* PRODUCTS SECTION (Directly BELOW Category Cover Cards) */}
        <div ref={productsSectionRef} className="pt-4 scroll-mt-24 space-y-6">

          {searchQuery.trim() !== '' ? (
            (() => {
              const activeSearchList = isHybrid ? displayedHybridProducts : searchResults;
              return (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-brand-red" />
                      <h3 className="text-lg font-bold text-stone-900 uppercase">
                        {language === 'am' ? 'የፍለጋ ውጤቶች' : 'Search Results'} ({activeSearchList.length})
                      </h3>
                      <span className="text-xs text-stone-500">
                        {language === 'am' ? `ለ "${searchQuery}"` : `for "${searchQuery}"`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-brand-red hover:underline flex items-center gap-1 font-semibold"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ፍለጋ አጽዳ' : 'Clear Search'}</span>
                    </button>
                  </div>

                  {activeSearchList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {activeSearchList.map((prod) => renderProductCard(prod))}
                    </div>
                  ) : (
                    <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl p-12 text-center space-y-3">
                      <Box className="w-12 h-12 mx-auto text-stone-400" />
                      <h4 className="text-base font-bold text-stone-900 uppercase">{t('common.noProductsFound')}</h4>
                      <p className="text-xs text-stone-600 max-w-md mx-auto">
                        {t('common.noProductsMatch')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 bg-brand-red text-white text-xs font-bold uppercase rounded-lg hover:bg-red-700 transition shadow-xs"
                      >
                        {t('common.resetFilters')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : expandedCategory && activeCategoryDef ? (
            /* CATEGORY EXPANDED VIEW: Revealed Products directly below cards */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Category Reveal Header Banner */}
              <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-red text-white">
                      {language === 'am' ? 'የተዘረጋ ምድብ' : 'Revealed Category'}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {categoryProducts.length} {language === 'am' ? 'ምርቶች' : 'Products Available'}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
                    <span>{language === 'am' ? activeCategoryDef.nameAm : activeCategoryDef.name}</span>
                    <span className="text-brand-red text-lg font-normal">
                      ({language === 'am' ? activeCategoryDef.name : activeCategoryDef.nameAm})
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                    {language === 'am' ? activeCategoryDef.descriptionAm : activeCategoryDef.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedCategory(null)}
                  className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-xs"
                >
                  <X className="w-3.5 h-3.5 text-brand-red" />
                  <span>
                    {isHybrid
                      ? (language === 'am' ? 'ሁሉንም 25 ምርቶች አሳይ' : 'Show All 25 Models')
                      : (language === 'am' ? 'ምድብ ዝጋ' : 'Collapse Category')}
                  </span>
                </button>
              </div>

              {/* 5 Products Grid */}
              {productsLoading ? (
                <div className="py-16 text-center">
                  <LoadingSpinner text={t('common.loading')} />
                </div>
              ) : categoryProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {categoryProducts.map((prod) => renderProductCard(prod))}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl p-12 text-center space-y-3">
                  <Box className="w-12 h-12 mx-auto text-stone-400" />
                  <h4 className="text-base font-bold text-stone-900 uppercase">{t('common.noProductsFound')}</h4>
                  <p className="text-xs text-stone-600">{t('common.loading')}</p>
                </div>
              )}
            </div>
          ) : isHybrid ? (
            /* HYBRID DEFAULT VIEW: Displays all 25 Hybrid Metal+Wood products when no single category filter is active */
            <div className="space-y-6 animate-fadeIn">
              {displayedHybridProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {displayedHybridProducts.map((prod) => renderProductCard(prod))}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl p-12 text-center space-y-3">
                  <Box className="w-12 h-12 mx-auto text-stone-400" />
                  <h4 className="text-base font-bold text-stone-900 uppercase">{t('common.noProductsFound')}</h4>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    {t('common.noProductsMatch')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* No Category Open Prompt */
            <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2] p-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-brand-red mx-auto" />
              <h4 className="text-base font-bold text-stone-900 uppercase">
                {language === 'am' ? 'የሚፈልጉትን ምድብ ይምረጡ' : 'Select Any Category Above to Reveal Products'}
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                {language === 'am'
                  ? 'ከላይ ከሚገኙት የምድብ ካርዶች አንዱን በመጫን ዝርዝር ምርቶችን በቀጥታ እዚህ ይመልከቱ።'
                  : 'Click any of the category cover cards above to instantly reveal all 5 handcrafted products.'}
              </p>
            </div>
          )}

        </div>
      </section>

      {/* 3. SERVICE IMAGE GALLERY WITH LIGHTBOX */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.visualPortfolio')}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
                {meta.title} {t('services.galleryCraft')}
              </h2>
            </div>
            <span className="text-xs text-stone-500">
              {t('services.portfolioDesc')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gallery.map((item, index) => (
              <div
                key={item.id || index}
                role="button"
                tabIndex={0}
                aria-label={item.caption || `${meta.title} ${t('common.preview')} ${index + 1}`}
                onClick={() => setActiveImageIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveImageIndex(index);
                  }
                }}
                className="relative h-64 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 cursor-pointer group shadow-xs hover:border-brand-red/60 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              >
                <img
                  src={item.image}
                  alt={item.caption || `${meta.title} Gallery ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = SERVICE_HERO_ASSETS[resolvedSlug] || '/hara-official-logo.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-lg text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <ZoomIn className="w-4 h-4 text-brand-red" />
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[10px] font-mono font-bold text-brand-red uppercase block">0{index + 1}</span>
                  <p className="text-xs font-bold text-white line-clamp-1">
                    {item.caption || `${meta.title} Precision Build`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LIGHTBOX MODAL */}
      {activeImageIndex !== null && gallery[activeImageIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={meta.title}
          onClick={() => setActiveImageIndex(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between text-xs text-stone-300 py-2 border-b border-stone-800"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase">{meta.title}</span>
              <span>•</span>
              <span className="font-mono">{t('common.preview')} {activeImageIndex + 1} {t('common.of')} {gallery.length}</span>
            </div>
            
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg border border-stone-700 transition"
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              onClick={(e) => e.stopPropagation()}
              src={gallery[activeImageIndex].image}
              alt={gallery[activeImageIndex].caption || meta.title}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all"
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev! - 1 + gallery.length) % gallery.length);
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
                    setActiveImageIndex((prev) => (prev! + 1) % gallery.length);
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

          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl text-center py-2">
            <p className="text-sm font-semibold text-white">
              {gallery[activeImageIndex].caption || meta.title}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {t('services.lightboxHint')}
            </p>
          </div>
        </div>
      )}

      {/* 4. WORKSHOP PHILOSOPHY & RIGOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xs">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.philosophyBadge')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide">
              {t('services.aboutPractice')} - {meta.title}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed whitespace-pre-line">
              {localize(service, 'full_description') || service.full_description}
            </p>
          </div>
        </div>
      </section>

      {/* 5. CORE CAPABILITIES (WHAT WE OFFER) */}
      {service.offerings && service.offerings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.offeringsBadge')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
              {t('services.offeringsTitle')} {meta.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.offerings.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-3 hover:border-stone-300 shadow-xs transition"
              >
                <div className="p-1.5 rounded-lg bg-brand-red/10 border border-brand-red/20 text-brand-red mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block">{item}</span>
                  <span className="text-[11px] text-stone-500">{t('common.inHouse')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. APPLICATIONS & USE CASES */}
      {service.applications && service.applications.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.applicationsBadge')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
              {t('services.applicationsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.applications.map((app, idx) => (
              <div 
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-2 hover:border-stone-300 shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center mb-3">
                    <Building className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">{app.title}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. ENGINEERED MATERIALS & SPECIFICATIONS */}
      {service.materials && service.materials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.materialsBadge')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
              {t('services.materialsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.materials.map((mat, idx) => (
              <div 
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-1.5 hover:border-stone-300 shadow-xs transition"
              >
                <span className="text-xs font-bold text-brand-red uppercase tracking-wider block">
                  {mat.name}
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {mat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. 8-STEP WORKSHOP PROCESS */}
      {service.process_steps && service.process_steps.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('services.processBadge')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
              {t('services.processTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {service.process_steps.map((p, idx) => (
              <div 
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-2 relative overflow-hidden group hover:border-brand-red/40 shadow-xs transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-brand-red font-mono">
                    {p.step}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-stone-400">{language === 'am' ? `ደረጃ ${idx + 1}` : `Stage ${idx + 1}`}</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{p.title}</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. BUILT-IN ADVANTAGES */}
      {service.benefits && service.benefits.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">{t('home.workflowBadge')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide mt-1">
              {t('home.workflowTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.benefits.map((b, idx) => (
              <div 
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-3 hover:border-stone-300 shadow-xs transition"
              >
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-stone-900">{b}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. PRIMARY CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl p-8 sm:p-12 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-brand-red uppercase tracking-widest">
                {t('home.capabilitiesBadge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-wide">
                {t('services.consultationBannerTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {t('services.consultationBannerDesc')}
              </p>

              <div className="pt-2 flex items-center gap-3 text-xs text-stone-600">
                <Clock className="w-4 h-4 text-brand-red" />
                <span>{t('common.turnaround')}: <strong className="text-stone-900">{service.turnaround_time}</strong></span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-200 text-center space-y-4 shadow-xs">
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-wider block">{t('common.needQuote')}</span>
                <h3 className="text-xl font-bold text-stone-900 mt-1">{t('quote.submitButton')}</h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  {t('services.consultationBannerDesc')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={(e) => handleRequestQuoteClick(e)}
                  className="px-6 py-3 bg-brand-red hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
                >
                  {t('common.requestQuote')}
                </button>
                <a
                  href="tel:+251926629999"
                  className="px-6 py-3 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 shadow-xs transition"
                >
                  {t('common.callWorkshop')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Helper render function for each product card
  function renderProductCard(prod: Product) {
    const productDetailUrl = `/services/${resolvedSlug}/products/${prod.slug || prod.sku || prod.id}`;
    const prodImage = getProductImageUrl(prod);
    const prodName = localize(prod, 'name');
    const prodDesc = localize(prod, 'short_description') || localize(prod, 'description');
    const prodMaterial = localize(prod, 'material');
    const prodSub = localize(prod, 'subcategory') || prod.product_type;

    return (
      <div
        key={prod.id || prod.sku}
        role="button"
        tabIndex={0}
        aria-label={prodName}
        onClick={() => navigate(productDetailUrl)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(productDetailUrl);
          }
        }}
        className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-brand-red/60 hover:shadow-lg transition-all duration-300 group cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
      >
        {/* Product Card Image Container */}
        <div className="relative h-56 bg-stone-100 overflow-hidden">
          <img
            src={prodImage}
            alt={prodName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/hara-official-logo.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-75 transition-opacity" />

          {/* Dynamic Product Code / SKU Overlay Badge */}
          {prod.sku && (
            <span className="absolute top-3 right-3 z-10 bg-brand-red text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm tracking-wider border border-white/20">
              {prod.sku}
            </span>
          )}

          {/* Material Badge */}
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-stone-800 border border-stone-200 shadow-xs">
            {prodMaterial || (isHybrid
              ? (language === 'am' ? 'የብረት + እንጨት ውህደት' : 'Steel + Wood Fusion')
              : resolvedSlug === 'metal-works'
              ? (language === 'am' ? 'ጠንካራ ብረት' : 'Structural Steel')
              : (language === 'am' ? 'ጠንካራ እንጨት' : 'Solid Wood'))}
          </span>

          {/* Production Time Badge */}
          {prod.estimated_production_time && (
            <span className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/95 backdrop-blur-md text-stone-800 border border-stone-200 flex items-center gap-1 shadow-xs">
              <Clock className="w-3 h-3 text-brand-red" />
              <span>{prod.estimated_production_time}</span>
            </span>
          )}

          {/* Quick View Details Icon on Hover */}
          <div className="absolute bottom-3 right-3 bg-brand-red text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-md">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Product Content */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span className="font-mono text-stone-600 font-bold">{prod.sku}</span>
              {prodSub && (
                <span className="text-[10px] font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                  {prodSub}
                </span>
              )}
              {prod.starting_price > 0 && (
                <span className="font-bold text-stone-900 font-mono">
                  {t('common.from')} {Number(prod.starting_price).toLocaleString()} {t('common.etb')}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-stone-900 group-hover:text-brand-red transition-colors line-clamp-1">
              {prodName}
            </h3>

            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {prodDesc || (language === 'am' ? 'በጥራት የተሰራ የዎርክሾፕ ውጤት።' : 'Precision engineered workshop item.')}
            </p>

            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-0.5">
              <span>{t('quote.materialPreference')}:</span>
              <span className="text-stone-800 font-medium truncate">{prodMaterial}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 grid grid-cols-2 gap-2">
            <Link
              to={productDetailUrl}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition border border-stone-200"
            >
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              <span>{t('common.viewDetails')}</span>
            </Link>

            <button
              onClick={(e) => handleRequestQuoteClick(e, prod)}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('common.requestQuote')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
};
