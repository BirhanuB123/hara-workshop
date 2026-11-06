import React, { useEffect, useState } from 'react';
import { 
  Package, PlusCircle, Search, Eye, Edit3, Trash2, Camera, Star, X, Check, 
  Filter, Wrench, Hammer, Layers, Clock, ShieldCheck
} from 'lucide-react';
import { productsApi, categoriesApi } from '../../services/api';
import { Product, Category } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CameraImageUploader, UploadedImageItem } from '../../components/common/CameraImageUploader';

const SERVICE_CATEGORIES = [
  { value: 'METAL_WORKS', label: 'Metal Works', icon: Wrench, color: 'text-brand-red bg-brand-red/10 border-brand-red/20' },
  { value: 'WOOD_WORKS', label: 'Wood Works', icon: Hammer, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'HYBRID_METAL_WOOD', label: 'Hybrid Metal + Wood Construction', icon: Layers, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
];

const SUBCATEGORIES_BY_SERVICE: Record<string, string[]> = {
  WOOD_WORKS: [
    'Chairs', 'Tables', 'Beds', 'Kitchen Cabinets', 'Wardrobes', 'Doors',
    'Cabinets', 'Bookshelves', 'TV Stands', 'Office Desks', 'Dining Furniture',
    'Shelves', 'Benches', 'Other Wood Products'
  ],
  METAL_WORKS: [
    'Gates', 'Doors', 'Windows', 'Railings', 'Staircases', 'Fences',
    'Metal Shelves', 'Metal Cabinets', 'Security Grilles', 'Canopies',
    'Steel Structures', 'Metal Furniture', 'Other Metal Products'
  ],
  HYBRID_METAL_WOOD: [
    'Chairs', 'Tables', 'Beds', 'Kitchen Cabinets', 'Wardrobes', 'Staircases',
    'Shelving Units', 'TV Stands', 'Office Desks', 'Dining Furniture',
    'Benches', 'Partitions', 'Reception Desks', 'Custom Furniture', 'Other Hybrid Products'
  ],
};

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [serviceCategory, setServiceCategory] = useState<'METAL_WORKS' | 'WOOD_WORKS' | 'HYBRID_METAL_WOOD'>('METAL_WORKS');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [metalMaterials, setMetalMaterials] = useState('');
  const [woodMaterials, setWoodMaterials] = useState('');
  const [finishOptions, setFinishOptions] = useState('');
  const [applications, setApplications] = useState('');
  const [customizationOptions, setCustomizationOptions] = useState('');
  const [estimatedProductionTime, setEstimatedProductionTime] = useState('7–14 Business Days');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('SET');
  const [stockStatus, setStockStatus] = useState<'IN_STOCK' | 'MADE_TO_ORDER' | 'OUT_OF_STOCK'>('MADE_TO_ORDER');
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productsApi.getAll({ page_size: 100 }),
        categoriesApi.getAll()
      ]);
      setProducts(pRes.data.results || pRes.data || []);
      const cats = cRes.data.results || cRes.data || [];
      setCategories(cats);
      if (cats.length > 0 && !category) setCategory(cats[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`HW-${Date.now().toString().slice(-4)}`);
    setServiceCategory('METAL_WORKS');
    setProductType('');
    if (categories.length > 0) setCategory(categories[0].id);
    setShortDescription('');
    setDescription('');
    setDetailedDescription('');
    setMaterial('Structural Steel');
    setMetalMaterials('Hollow Structural Box Section & Solid Round Pickets');
    setWoodMaterials('N/A (All-Metal Fabrication)');
    setFinishOptions('Anti-Rust Zinc Primer + Electrostatic Powder Coating');
    setApplications('Residential Villas, Compound Gates, Commercial Buildings');
    setCustomizationOptions('Dimensions, Picket density, Locking mechanisms, Varnish stain');
    setEstimatedProductionTime('7–14 Business Days');
    setPrice('');
    setUnit('unit');
    setStockStatus('MADE_TO_ORDER');
    setIsFeatured(false);
    setImages([]);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setServiceCategory((p.service_category as any) || 'METAL_WORKS');
    setProductType(p.product_type || '');
    setCategory(typeof p.category === 'object' ? (p.category as any)?.id : p.category);
    setShortDescription(p.short_description || '');
    setDescription(p.description || '');
    setDetailedDescription(p.detailed_description || '');
    setMaterial(p.material || '');
    setMetalMaterials(p.metal_materials || '');
    setWoodMaterials(p.wood_materials || '');
    setFinishOptions(p.finish_options || '');
    setApplications(p.applications || '');
    setCustomizationOptions(p.customization_options || '');
    setEstimatedProductionTime(p.estimated_production_time || '7–14 Business Days');
    setPrice(String(p.starting_price || ''));
    setUnit(p.unit || 'unit');
    setStockStatus(p.stock_status || 'MADE_TO_ORDER');
    setIsFeatured(p.is_featured || false);

    const existingImages: UploadedImageItem[] = (p.images || []).map((img) => ({
      id: img.id,
      preview: img.image,
      isPrimary: img.is_primary,
      caption: img.caption || '',
    }));
    setImages(existingImages);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('sku', sku);
      formData.append('service_category', serviceCategory);
      if (productType) {
        formData.append('product_type', productType);
        formData.append('subcategory', productType);
      }
      if (category) formData.append('category', category);
      formData.append('short_description', shortDescription || description.slice(0, 140));
      formData.append('description', description);
      formData.append('detailed_description', detailedDescription || description);
      formData.append('material', material);
      formData.append('metal_materials', metalMaterials);
      formData.append('wood_materials', woodMaterials);
      formData.append('finish_options', finishOptions);
      formData.append('applications', applications);
      formData.append('customization_options', customizationOptions);
      formData.append('estimated_production_time', estimatedProductionTime);
      formData.append('starting_price', price);
      formData.append('unit', unit);
      formData.append('stock_status', stockStatus);
      formData.append('is_featured', String(isFeatured));
      formData.append('is_customizable', 'true');

      // Append image files
      const newFiles: File[] = [];
      let primaryIndex = 0;
      images.forEach((img) => {
        if (img.file) {
          if (img.isPrimary) {
            primaryIndex = newFiles.length;
          }
          newFiles.push(img.file);
          formData.append('images', img.file);
        }
      });
      formData.append('primary_image_index', String(primaryIndex));

      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
      } else {
        await productsApi.create(formData);
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(
        err.response?.data?.detail || 
        err.response?.data?.sku?.[0] || 
        err.response?.data?.name?.[0] || 
        'Failed to save product. Please check the fields and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;
    try {
      await productsApi.delete(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product.');
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.material && p.material.toLowerCase().includes(search.toLowerCase())) ||
      (p.product_type && p.product_type.toLowerCase().includes(search.toLowerCase()));

    const matchesService = serviceFilter === 'ALL' || p.service_category === serviceFilter;
    return matchesSearch && matchesService;
  });

  if (loading) return <LoadingSpinner text="Loading products catalog..." />;

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-red" />
            Showroom & Products Catalog
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage catalog products across Metal Works, Wood Works, and Hybrid Metal + Wood Construction. Capture live photos via camera or file upload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Service Category Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-metal-900 border border-metal-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-metal-950">All Services ({products.length})</option>
              <option value="METAL_WORKS" className="bg-metal-950">Metal Works</option>
              <option value="WOOD_WORKS" className="bg-metal-950">Wood Works</option>
              <option value="HYBRID_METAL_WOOD" className="bg-metal-950">Hybrid Metal + Wood</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU, name, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-metal-900 border border-metal-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red w-52"
            />
          </div>

          {/* Add Product CTA */}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Service Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Base Price (ETB)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {filtered.map((p) => {
                const serviceInfo = SERVICE_CATEGORIES.find(c => c.value === p.service_category) || SERVICE_CATEGORIES[0];
                const ServiceIconComp = serviceInfo.icon;

                return (
                  <tr key={p.id} className="hover:bg-metal-850/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="w-10 h-10 rounded-lg bg-metal-950 border border-metal-800 overflow-hidden flex items-center justify-center">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-metal-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{p.sku}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {p.name}
                      {p.is_featured && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${serviceInfo.color}`}>
                        <ServiceIconComp className="w-3 h-3" />
                        <span>{p.service_category_display || serviceInfo.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-300">
                      {p.product_type || 'General'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 truncate max-w-[140px]">{p.material}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.stock_status} /></td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">
                      {p.starting_price > 0 ? `${Number(p.starting_price).toLocaleString()} ETB` : 'Bespoke'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-white bg-metal-800 hover:bg-metal-700 transition"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No products found matching your search or service category filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-metal-900 border border-metal-700 rounded-2xl max-w-3xl w-full p-6 text-left shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !submitting && setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-metal-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-metal-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-red" />
                {editingProduct ? 'Edit Workshop Catalog Product' : 'Register New Showroom Product'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Assign to one of the 3 primary services, specify technical materials, and upload high-res photos or snap via device camera.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* SECTION A: SERVICE & CLASSIFICATION */}
              <div className="bg-metal-950/60 border border-metal-800 rounded-xl p-4 space-y-4">
                <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block border-b border-metal-800/80 pb-1">
                  1. Service Assignment & Identity
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Assigned Service Category *
                    </label>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value as any)}
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-semibold"
                    >
                      <option value="METAL_WORKS">Metal Works</option>
                      <option value="WOOD_WORKS">Wood Works</option>
                      <option value="HYBRID_METAL_WOOD">Hybrid Metal + Wood Construction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Subcategory / Classification *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={SUBCATEGORIES_BY_SERVICE[serviceCategory]?.includes(productType) ? productType : '__CUSTOM__'}
                        onChange={(e) => {
                          if (e.target.value !== '__CUSTOM__') {
                            setProductType(e.target.value);
                          }
                        }}
                        className="w-1/2 bg-metal-900 border border-metal-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-semibold"
                      >
                        <option value="__CUSTOM__">Choose Subcategory...</option>
                        {SUBCATEGORIES_BY_SERVICE[serviceCategory]?.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        placeholder="Subcategory name"
                        className="w-1/2 bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Choose from canonical service subcategories or type a custom name.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Product SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. MET-GAT-005"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Showroom Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Custom Laser-Cut Bi-Folding Steel Gate"
                    className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* SECTION B: DESCRIPTIONS */}
              <div className="bg-metal-950/60 border border-metal-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block border-b border-metal-800/80 pb-1">
                  2. Product Descriptions
                </span>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Short Description (Shown on Cards) *
                  </label>
                  <input
                    type="text"
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Concise 1-2 sentence overview for catalog cards..."
                    className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Full Description & Specs *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive description of structure, hardware, and aesthetics..."
                    className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Detailed Engineering Notes
                  </label>
                  <textarea
                    rows={2}
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="Deep technical details, wall thickness, weld penetration, tolerance limits..."
                    className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* SECTION C: MATERIALS & FINISHES */}
              <div className="bg-metal-950/60 border border-metal-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block border-b border-metal-800/80 pb-1">
                  3. Materiality & Technical Specifications
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Primary Material Badge *
                    </label>
                    <input
                      type="text"
                      required
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g. Mild Steel & Teak"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Finish Coating Options *
                    </label>
                    <input
                      type="text"
                      required
                      value={finishOptions}
                      onChange={(e) => setFinishOptions(e.target.value)}
                      placeholder="e.g. Matte Black Powder Coat, Clear Polyurethane"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Metal Materials & Sections
                    </label>
                    <input
                      type="text"
                      value={metalMaterials}
                      onChange={(e) => setMetalMaterials(e.target.value)}
                      placeholder="e.g. 80x80 RHS Structural Box Section, 2.5mm Wall"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Wood Materials & Species
                    </label>
                    <input
                      type="text"
                      value={woodMaterials}
                      onChange={(e) => setWoodMaterials(e.target.value)}
                      placeholder="e.g. Kiln-Dried Ethiopian Wanza / Tikur Inchet"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: APPLICATIONS, CUSTOMIZATION & PRODUCTION TIME */}
              <div className="bg-metal-950/60 border border-metal-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block border-b border-metal-800/80 pb-1">
                  4. Deployments, Customization & Production
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Typical Applications
                    </label>
                    <input
                      type="text"
                      value={applications}
                      onChange={(e) => setApplications(e.target.value)}
                      placeholder="e.g. Residential Villas, Corporate Offices, Hospitality"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Estimated Production Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={estimatedProductionTime}
                      onChange={(e) => setEstimatedProductionTime(e.target.value)}
                      placeholder="e.g. 5–10 Days, 2–3 Weeks"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Customization Options Available
                  </label>
                  <input
                    type="text"
                    value={customizationOptions}
                    onChange={(e) => setCustomizationOptions(e.target.value)}
                    placeholder="e.g. Bespoke dimensions, steel gauge, wood stain, automated motors"
                    className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* SECTION E: PRICING & STOCK */}
              <div className="bg-metal-950/60 border border-metal-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block border-b border-metal-800/80 pb-1">
                  5. Pricing & Availability
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Starting Price (ETB) *
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="unit, set, m2, linear meter"
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Availability
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value as any)}
                      className="w-full bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                    >
                      <option value="MADE_TO_ORDER">Made to Order</option>
                      <option value="IN_STOCK">In Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-red focus:ring-brand-red bg-metal-950 border-metal-700"
                    />
                    <span className="text-xs font-semibold text-gray-300">Feature this product in Showcase</span>
                  </label>
                </div>
              </div>

              {/* SECTION F: PHOTOGRAPHS & CAMERA UPLOADER */}
              <div className="bg-metal-950/60 border border-metal-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block border-b border-metal-800/80 pb-1">
                  6. Product Photographs & Device Camera
                </span>

                <CameraImageUploader
                  images={images}
                  onChange={setImages}
                  multiple={true}
                  maxImages={8}
                  label="Product Photographs (File Upload or Camera Capture)"
                  helperText="Photograph finished fabrication in the Bole Arabsa workshop or select from device files. Click the star icon to designate the primary thumbnail."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-metal-800 sticky bottom-0 bg-metal-900 py-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-metal-800 hover:bg-metal-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingProduct ? 'Update Product' : 'Add to Catalog'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
