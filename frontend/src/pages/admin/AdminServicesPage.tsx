import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, Hammer, Layers, Plus, Upload, Trash2, Edit3, Check, 
  ExternalLink, Eye, Star, AlertTriangle, RefreshCw, Sparkles,
  ArrowUp, ArrowDown, Info, Save, X, ChevronRight, FileImage
} from 'lucide-react';
import { servicesApi } from '../../services/api';
import { Service, ServiceImageItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const SERVICE_TABS = [
  {
    key: 'wood-works',
    title: 'Wood Works',
    categoryName: 'Wood Works',
    slug: 'wood-works',
    icon: Hammer,
    accentColor: 'text-amber-500 border-amber-500',
    bgBadge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    description: '100% Solid Wood products only (Zero metal frames or supports).'
  },
  {
    key: 'metal-works',
    title: 'Metal Works',
    categoryName: 'Metal Works',
    slug: 'metal-works',
    icon: Wrench,
    accentColor: 'text-blue-400 border-blue-400',
    bgBadge: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    description: '100% Steel, Iron & Aluminum only (Zero wooden parts).'
  },
  {
    key: 'hybrid-metal-wood',
    title: 'Hybrid Metal + Wood',
    categoryName: 'Hybrid Metal + Wood Construction',
    slug: 'hybrid-metal-wood',
    icon: Layers,
    accentColor: 'text-brand-red border-brand-red',
    bgBadge: 'bg-red-950/60 text-red-300 border-red-800/60',
    description: 'Genuine architectural fusion of structural metal and solid timber.'
  }
];

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wood-works' | 'metal-works' | 'hybrid-metal-wood'>('wood-works');

  // Service editing state
  const [savingService, setSavingService] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    title: '',
    tagline: '',
    short_description: '',
    full_description: '',
    starting_price: '',
    price_unit: 'per project',
    turnaround_time: '1-2 weeks',
    customization_info: '',
  });

  // Image action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; slotNumber: number; caption?: string } | null>(null);
  
  // Lightbox preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<{ url: string; title: string } | null>(null);

  // Hidden file input refs
  const replaceInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const newUploadInputRef = useRef<HTMLInputElement | null>(null);
  const slotDirectUploadRefs = useRef<{ [slotIndex: number]: HTMLInputElement | null }>({});

  // Inline metadata editing
  const [editingImageMetaId, setEditingImageMetaId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await servicesApi.getAll();
      const list: Service[] = res.data?.results || res.data || [];
      setServices(list);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Find active service object
  const currentService = services.find((s) => {
    const slug = (s.slug || '').toLowerCase();
    if (activeTab === 'wood-works') return slug.includes('wood');
    if (activeTab === 'metal-works') return slug.includes('metal') && !slug.includes('hybrid');
    if (activeTab === 'hybrid-metal-wood') return slug.includes('hybrid');
    return false;
  }) || services[0];

  // Sync form data when tab or currentService changes
  useEffect(() => {
    if (currentService) {
      setServiceFormData({
        title: currentService.title || '',
        tagline: currentService.tagline || '',
        short_description: currentService.short_description || '',
        full_description: currentService.full_description || '',
        starting_price: currentService.starting_price ? String(currentService.starting_price) : '',
        price_unit: currentService.price_unit || 'per project',
        turnaround_time: currentService.turnaround_time || '1-2 weeks',
        customization_info: currentService.customization_info || '',
      });
      setSaveSuccessMessage(null);
      setEditingImageMetaId(null);
    }
  }, [currentService?.id, activeTab]);

  const handleSaveServiceDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService) return;
    setSavingService(true);
    setSaveSuccessMessage(null);
    try {
      const payload: any = {
        title: serviceFormData.title,
        tagline: serviceFormData.tagline,
        short_description: serviceFormData.short_description,
        full_description: serviceFormData.full_description,
        turnaround_time: serviceFormData.turnaround_time,
        price_unit: serviceFormData.price_unit,
        customization_info: serviceFormData.customization_info,
      };
      if (serviceFormData.starting_price) {
        payload.starting_price = parseFloat(serviceFormData.starting_price);
      }
      const res = await servicesApi.update(currentService.id, payload);
      setServices((prev) => prev.map((s) => (s.id === currentService.id ? { ...s, ...res.data } : s)));
      setSaveSuccessMessage('Service details updated and published successfully!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update service:', err);
      alert('Failed to save service details: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingService(false);
    }
  };

  // 1. Upload a new image from device (appends to end or fills next available slot)
  const handleUploadFromDevice = async (file: File, targetSlot?: number) => {
    if (!currentService) return;
    setUploadingNew(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const slotNum = targetSlot !== undefined ? targetSlot + 1 : (currentService.gallery_images?.length || 0) + 1;
      formData.append('caption', `${currentService.title} Showcase Image ${slotNum}`);
      formData.append('description', `Crafted at HARA WORKSHOP atelier.`);
      if (targetSlot !== undefined) {
        formData.append('order', String(targetSlot));
      }

      await servicesApi.uploadImage(currentService.id, formData);
      await refreshCurrentService();
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingNew(false);
    }
  };

  // 2. Replace image in-place
  const handleReplaceImage = async (imageId: string, newFile: File) => {
    if (!currentService) return;
    setActionLoadingId(imageId);
    try {
      const formData = new FormData();
      formData.append('image_id', imageId);
      formData.append('image', newFile);

      await servicesApi.replaceImage(currentService.id, formData);
      await refreshCurrentService();
    } catch (err: any) {
      console.error('Failed to replace image:', err);
      alert('Replace failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Confirm & execute Delete image
  const executeDeleteImage = async () => {
    if (!currentService || !deleteConfirmTarget) return;
    const { id } = deleteConfirmTarget;
    setActionLoadingId(id);
    try {
      await servicesApi.deleteImage(currentService.id, id);
      setDeleteConfirmTarget(null);
      await refreshCurrentService();
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Update image metadata (caption & description notes)
  const handleSaveImageMeta = async (imageId: string) => {
    if (!currentService) return;
    setActionLoadingId(imageId);
    try {
      await servicesApi.updateImage(currentService.id, {
        image_id: imageId,
        caption: editCaption,
        description: editDescription,
      });
      setEditingImageMetaId(null);
      await refreshCurrentService();
    } catch (err: any) {
      console.error('Failed to update image metadata:', err);
      alert('Update failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Make primary cover image
  const handleMakePrimary = async (imageId: string) => {
    if (!currentService) return;
    setActionLoadingId(imageId);
    try {
      await servicesApi.updateImage(currentService.id, {
        image_id: imageId,
        is_primary: true,
      });
      await refreshCurrentService();
    } catch (err: any) {
      console.error('Failed to set primary cover:', err);
      alert('Failed to set cover photo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const refreshCurrentService = async () => {
    if (!currentService) return;
    try {
      const res = await servicesApi.getById(currentService.id);
      setServices((prev) => prev.map((s) => (s.id === currentService.id ? res.data : s)));
    } catch (err) {
      console.error('Failed to refresh service:', err);
    }
  };

  const galleryList: ServiceImageItem[] = currentService?.gallery_images || [];
  const currentTabMeta = SERVICE_TABS.find((t) => t.key === activeTab) || SERVICE_TABS[0];

  // Generate slots: at least 10 slots displayed per user request, or more if gallery has >10
  const totalSlotsCount = Math.max(10, galleryList.length);
  const slots = Array.from({ length: totalSlotsCount }, (_, idx) => {
    const existingImg = galleryList[idx] || null;
    return {
      slotNumber: idx + 1,
      imageItem: existingImg,
    };
  });

  if (loading && services.length === 0) {
    return <LoadingSpinner text="Loading workshop services & media manager..." />;
  }

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-metal-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-red/10 border border-brand-red/30 rounded-lg">
              <Layers className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-wider">
                Service & Media Management
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Full Admin control over workshop service photography, individual slot uploads, in-place replace, and descriptions.
              </p>
            </div>
          </div>
        </div>

        {currentService && (
          <div className="flex items-center gap-3">
            <Link
              to={`/services/${currentTabMeta.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-metal-800 hover:bg-metal-700 text-gray-200 text-xs font-semibold border border-metal-700 transition shadow"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>View Live Customer Page</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </Link>

            <button
              onClick={() => newUploadInputRef.current?.click()}
              disabled={uploadingNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-red hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-900/20 disabled:opacity-50"
            >
              {uploadingNew ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Add Image from Device</span>
            </button>
            <input
              ref={newUploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadFromDevice(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </div>
        )}
      </div>

      {/* 3 Main Service Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-metal-900/80 p-1.5 rounded-xl border border-metal-800">
        {SERVICE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const matchingSvc = services.find((s) => {
            const slug = (s.slug || '').toLowerCase();
            if (tab.key === 'wood-works') return slug.includes('wood');
            if (tab.key === 'metal-works') return slug.includes('metal') && !slug.includes('hybrid');
            if (tab.key === 'hybrid-metal-wood') return slug.includes('hybrid');
            return false;
          });
          const imgCount = matchingSvc?.gallery_images?.length || 0;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-start gap-3 p-3.5 rounded-lg text-left transition-all border ${
                isActive
                  ? 'bg-metal-800 border-metal-600 shadow-md ring-1 ring-white/10'
                  : 'bg-transparent border-transparent hover:bg-metal-800/50 hover:border-metal-700/50 text-gray-400'
              }`}
            >
              <div
                className={`p-2 rounded-lg border ${
                  isActive ? tab.bgBadge : 'bg-metal-800/80 border-metal-700 text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {tab.title}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${
                    imgCount > 0 ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' : 'bg-metal-800 text-gray-400 border-metal-700'
                  }`}>
                    {imgCount} / 10+ images
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {currentService && (
        <div className="space-y-8">
          {/* SECTION 1: Service Metadata & Description Editor */}
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-metal-800 pb-4 mb-5">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-brand-red" />
                  Service Overview & Descriptions: {currentService.title}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update customer-facing service headlines, pricing baselines, turnaround timelines, and craftsmanship policies.
                </p>
              </div>

              {saveSuccessMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-lg animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveServiceDetails} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Service Title
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceFormData.title}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, title: e.target.value })}
                    className="w-full bg-metal-800 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Starting Price (ETB)
                  </label>
                  <input
                    type="number"
                    value={serviceFormData.starting_price}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, starting_price: e.target.value })}
                    placeholder="e.g., 25000"
                    className="w-full bg-metal-800 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Turnaround Time
                  </label>
                  <input
                    type="text"
                    value={serviceFormData.turnaround_time}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, turnaround_time: e.target.value })}
                    placeholder="e.g., 1-2 weeks"
                    className="w-full bg-metal-800 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Service Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={serviceFormData.tagline}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, tagline: e.target.value })}
                  placeholder="e.g., Handcrafted Ethiopian timber furniture and architectural woodwork"
                  className="w-full bg-metal-800 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Short Summary (Hero / Catalog Cards)
                  </label>
                  <textarea
                    rows={3}
                    value={serviceFormData.short_description}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, short_description: e.target.value })}
                    className="w-full bg-metal-800 border border-metal-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-red resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Full Description (Service Detail Page)
                  </label>
                  <textarea
                    rows={3}
                    value={serviceFormData.full_description}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, full_description: e.target.value })}
                    className="w-full bg-metal-800 border border-metal-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-red resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingService}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-metal-800 hover:bg-metal-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-metal-600 transition shadow disabled:opacity-50"
                >
                  {savingService ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-brand-red" />
                  )}
                  <span>Save Service Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: Image Management Interface (Slots 1 to 10+) */}
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-metal-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-brand-red" />
                  {currentService.title.toUpperCase()} — Image Management Table
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage individual images one-by-one from device. Replace any image in-place, delete with confirmation, or expand past 10 images.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Total Active Images: <strong className="text-white font-mono">{galleryList.length}</strong>
                </span>
              </div>
            </div>

            {/* Structured Slots Table */}
            <div className="overflow-x-auto border border-metal-800 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-metal-950/80 border-b border-metal-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-24">Slot #</th>
                    <th className="py-3 px-4 w-36">Preview</th>
                    <th className="py-3 px-4">Image Information & Craftsmanship Notes</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                    <th className="py-3 px-4 w-60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-metal-800/60 text-xs">
                  {slots.map(({ slotNumber, imageItem }) => {
                    const isOccupied = !!imageItem;
                    const isPrimary = imageItem?.is_primary;
                    const isLoading = actionLoadingId === imageItem?.id;
                    const isEditing = editingImageMetaId === imageItem?.id;

                    return (
                      <tr
                        key={`slot-${slotNumber}`}
                        className={`transition-colors ${
                          isOccupied ? 'hover:bg-metal-800/30' : 'bg-metal-950/30 text-gray-500'
                        }`}
                      >
                        {/* Slot / Number */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-300 text-xs">
                              Image {slotNumber}
                            </span>
                            {slotNumber > 10 && (
                              <span className="text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded">
                                Extended
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Preview */}
                        <td className="py-3 px-4 align-middle">
                          {isOccupied ? (
                            <div className="relative group w-24 h-16 rounded-md overflow-hidden bg-metal-950 border border-metal-700/80 shadow-sm flex items-center justify-center">
                              <img
                                src={imageItem.image}
                                alt={imageItem.caption || `Image ${slotNumber}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <button
                                onClick={() =>
                                  setPreviewImageUrl({
                                    url: imageItem.image,
                                    title: imageItem.caption || `Image ${slotNumber}`,
                                  })
                                }
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                                title="Click to enlarge"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-16 rounded-md border border-dashed border-metal-700 bg-metal-950/50 flex flex-col items-center justify-center text-gray-500 text-[10px] gap-1">
                              <FileImage className="w-4 h-4 text-metal-600" />
                              <span>Empty Slot</span>
                            </div>
                          )}
                        </td>

                        {/* Information / Notes */}
                        <td className="py-3 px-4 align-middle">
                          {isOccupied ? (
                            isEditing ? (
                              <div className="space-y-2 max-w-md">
                                <div>
                                  <label className="text-[10px] text-gray-400 font-semibold block uppercase">Caption / Title</label>
                                  <input
                                    type="text"
                                    value={editCaption}
                                    onChange={(e) => setEditCaption(e.target.value)}
                                    className="w-full bg-metal-800 border border-metal-600 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-red"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 font-semibold block uppercase">Craftsmanship Notes / Description</label>
                                  <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="e.g. Master carpentry jointing, kiln-dried timber"
                                    className="w-full bg-metal-800 border border-metal-600 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-red"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleSaveImageMeta(imageItem.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-red text-white text-[11px] font-bold rounded hover:bg-red-700"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingImageMetaId(null)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-metal-700 text-gray-300 text-[11px] rounded hover:bg-metal-600"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-white text-xs">
                                    {imageItem.caption || `Image ${slotNumber}`}
                                  </h4>
                                  <button
                                    onClick={() => {
                                      setEditingImageMetaId(imageItem.id);
                                      setEditCaption(imageItem.caption || '');
                                      setEditDescription(imageItem.description || '');
                                    }}
                                    className="text-gray-400 hover:text-brand-red transition p-1"
                                    title="Edit caption and craftsmanship notes"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-gray-400 italic">
                                  {imageItem.description || 'Zero visible fasteners, custom atelier fabrication.'}
                                </p>
                              </div>
                            )
                          ) : (
                            <span className="text-gray-500 italic text-[11px]">
                              Available slot. You can upload an image from your device directly into this slot.
                            </span>
                          )}
                        </td>

                        {/* Status (Cover) */}
                        <td className="py-3 px-4 text-center align-middle">
                          {isOccupied && (
                            isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/70 text-[10px] font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>Cover</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMakePrimary(imageItem.id)}
                                disabled={isLoading}
                                className="text-[11px] text-gray-400 hover:text-white transition underline"
                              >
                                Set Cover
                              </button>
                            )
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right align-middle">
                          {isOccupied ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* Hidden file input for in-place replacement */}
                              <input
                                ref={(el) => (replaceInputRefs.current[imageItem.id] = el)}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleReplaceImage(imageItem.id, e.target.files[0]);
                                    e.target.value = '';
                                  }
                                }}
                              />

                              <button
                                onClick={() => replaceInputRefs.current[imageItem.id]?.click()}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-metal-800 hover:bg-metal-700 text-blue-300 hover:text-blue-200 text-xs font-semibold rounded-lg border border-metal-700 transition disabled:opacity-50"
                                title="Replace this image with a new file from device"
                              >
                                {isLoading ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Upload className="w-3 h-3" />
                                )}
                                <span>Replace</span>
                              </button>

                              <button
                                onClick={() =>
                                  setDeleteConfirmTarget({
                                    id: imageItem.id,
                                    slotNumber,
                                    caption: imageItem.caption || `Image ${slotNumber}`,
                                  })
                                }
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-metal-800 hover:bg-red-950/60 text-gray-400 hover:text-red-400 text-xs font-semibold rounded-lg border border-metal-700 hover:border-red-800 transition disabled:opacity-50"
                                title="Delete this image"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              {/* Direct upload into this slot */}
                              <input
                                ref={(el) => (slotDirectUploadRefs.current[slotNumber - 1] = el)}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadFromDevice(e.target.files[0], slotNumber - 1);
                                    e.target.value = '';
                                  }
                                }}
                              />
                              <button
                                onClick={() => slotDirectUploadRefs.current[slotNumber - 1]?.click()}
                                disabled={uploadingNew}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-metal-800 hover:bg-brand-red hover:text-white text-gray-300 text-xs font-semibold rounded-lg border border-metal-700 transition disabled:opacity-50"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload to Slot</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Add-More Callout */}
            <div className="p-4 bg-metal-950/60 border border-dashed border-metal-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-metal-800 border border-metal-700 text-gray-300">
                  <Upload className="w-4 h-4 text-brand-red" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Need more than 10 photos for {currentService.title}?
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    You can upload unlimited images from your device. Additional slots (11, 12...) are created automatically.
                  </p>
                </div>
              </div>

              <button
                onClick={() => newUploadInputRef.current?.click()}
                disabled={uploadingNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-metal-800 hover:bg-metal-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-metal-600 transition shadow"
              >
                <Plus className="w-3.5 h-3.5 text-brand-red" />
                <span>Add Image Slot ({totalSlotsCount + 1})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-metal-900 border border-metal-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-400 rounded-lg shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirm Image Deletion
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Are you sure you want to delete this image?
                </p>
                <div className="mt-2.5 p-2 bg-metal-950 rounded border border-metal-800 text-xs text-gray-300 font-mono">
                  Image {deleteConfirmTarget.slotNumber}: {deleteConfirmTarget.caption}
                </div>
                <p className="text-[11px] text-amber-400 mt-2">
                  Remaining images will automatically shift up and re-sequence contiguously.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-metal-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-metal-800 hover:bg-metal-700 text-gray-300 text-xs font-semibold rounded-lg border border-metal-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteImage}
                disabled={!!actionLoadingId}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-red-900/40 disabled:opacity-50"
              >
                {actionLoadingId ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Yes, Delete Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-metal-800 bg-metal-950">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                {previewImageUrl.title}
              </h4>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={previewImageUrl.url}
                alt={previewImageUrl.title}
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
