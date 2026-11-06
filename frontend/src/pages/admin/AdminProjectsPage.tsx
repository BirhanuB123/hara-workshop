import React, { useEffect, useState } from 'react';
import { 
  FolderGit2, PlusCircle, Trash2, Edit3, Eye, EyeOff, Star, 
  Calendar, Layers, Building, Filter, X, Check, Camera
} from 'lucide-react';
import { projectsApi } from '../../services/api';
import { Project } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CameraImageUploader, UploadedImageItem } from '../../components/common/CameraImageUploader';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'METAL' | 'WOOD' | 'CUSTOM' | 'DOORS' | 'WINDOWS' | 'FURNITURE'>('METAL');
  const [clientType, setClientType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'OFFICE' | 'SPECIAL'>('RESIDENTIAL');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await projectsApi.getAll();
      setProjects(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setCategory('METAL');
    setClientType('RESIDENTIAL');
    setMaterialsUsed('');
    setCompletionDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setIsFeatured(false);
    setIsPublished(true);
    setImages([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setTitle(p.title);
    setCategory(p.category as any);
    setClientType(p.client_type as any);
    setMaterialsUsed(p.materials_used || '');
    setCompletionDate(p.completion_date || '');
    setDescription(p.description || '');
    setIsFeatured(p.is_featured);
    setIsPublished(p.is_published);
    
    // Existing project images converted to items
    const existingImages: UploadedImageItem[] = (p.images || []).map((img, idx) => ({
      id: img.id,
      preview: img.image,
      isPrimary: idx === 0,
      caption: img.caption || '',
    }));
    setImages(existingImages);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Project title is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('client_type', clientType);
      formData.append('materials_used', materialsUsed);
      if (completionDate) formData.append('completion_date', completionDate);
      formData.append('description', description);
      formData.append('is_featured', String(isFeatured));
      formData.append('is_published', String(isPublished));

      // Append new files captured via camera or selected from file picker
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

      if (editingProject) {
        await projectsApi.update(editingProject.id, formData);
      } else {
        await projectsApi.create(formData);
      }

      setIsModalOpen(false);
      await fetchProjects();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setFormError(err.response?.data?.detail || err.response?.data?.title?.[0] || 'Failed to save project. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await projectsApi.togglePublish(id);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleDelete = async (id: string, projectTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      await projectsApi.delete(id);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project.');
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (statusFilter === 'PUBLISHED' && !p.is_published) return false;
    if (statusFilter === 'HIDDEN' && p.is_published) return false;
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading workshop projects & showcase portfolio..." />;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-red" />
            Projects & Showcase Portfolio
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Document finished workshop pieces, capture job-site photos with device camera, and manage public showcase.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-red-900/20"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Project
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-metal-900/80 p-3 rounded-xl border border-metal-800 text-xs">
        <div className="flex items-center gap-2 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
          <Filter className="w-3.5 h-3.5 text-brand-red" />
          Filters:
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-metal-950 border border-metal-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand-red"
        >
          <option value="ALL">All Categories</option>
          <option value="METAL">Metal Works</option>
          <option value="WOOD">Wood Works</option>
          <option value="CUSTOM">Custom / Hybrid</option>
          <option value="DOORS">Doors</option>
          <option value="WINDOWS">Windows</option>
          <option value="FURNITURE">Furniture</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-metal-950 border border-metal-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand-red"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published Only</option>
          <option value="HIDDEN">Hidden / Draft</option>
        </select>

        <span className="ml-auto text-[11px] text-gray-400">
          Showing {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-metal-900/40 border border-metal-800 rounded-xl p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-metal-600 mx-auto mb-3" />
          <p className="text-gray-300 font-semibold text-sm">No projects found</p>
          <p className="text-gray-500 text-xs mt-1">
            Click "Add New Project" above to create a project and capture photos using your camera.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div 
              key={p.id} 
              className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden flex flex-col shadow-lg transition hover:border-metal-700"
            >
              {/* Image Cover */}
              <div className="h-48 bg-metal-950 relative flex items-center justify-center overflow-hidden group">
                {p.primary_image ? (
                  <img src={p.primary_image} alt={p.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="text-center text-metal-600">
                    <FolderGit2 className="w-10 h-10 mx-auto mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No Photo</span>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    p.is_published ? 'bg-emerald-600/90 text-white' : 'bg-metal-800/90 text-gray-300'
                  }`}>
                    {p.is_published ? 'Published' : 'Hidden'}
                  </span>
                  {p.is_featured && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-black flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-black" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 bg-metal-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-gray-300">
                  {p.images?.length || 0} Photos
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-semibold mb-1">
                    <span className="text-brand-red font-bold">{p.category}</span>
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {p.client_type}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description || 'No description provided.'}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-metal-800/80 text-[11px] text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Materials:</span>
                    <span className="text-gray-300 truncate max-w-[180px]">{p.materials_used || 'Standard'}</span>
                  </div>
                  {p.completion_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Completed:</span>
                      <span className="text-gray-300">{p.completion_date}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-metal-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePublish(p.id)}
                    title={p.is_published ? 'Hide from Gallery' : 'Publish to Gallery'}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      p.is_published 
                        ? 'text-gray-400 hover:text-white bg-metal-800 hover:bg-metal-700' 
                        : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/50'
                    }`}
                  >
                    {p.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="text-[10px] uppercase font-bold">{p.is_published ? 'Hide' : 'Publish'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-lg text-gray-300 hover:text-white bg-metal-800 hover:bg-metal-700 transition"
                      title="Edit Project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-metal-900 border border-metal-700 rounded-2xl max-w-2xl w-full p-6 text-left shadow-2xl my-8 relative">
            <button
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-metal-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-metal-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-brand-red" />
                {editingProject ? 'Edit Showcase Project' : 'Add New Showcase Project'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Provide workshop details and photograph the project using device camera or file uploader.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Industrial Metal & Teak Staircase"
                  className="w-full bg-metal-950 border border-metal-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-metal-950 border border-metal-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  >
                    <option value="METAL">Metal Works</option>
                    <option value="WOOD">Wood Works</option>
                    <option value="CUSTOM">Custom / Hybrid Construction</option>
                    <option value="DOORS">Doors</option>
                    <option value="WINDOWS">Windows</option>
                    <option value="FURNITURE">Furniture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Client Type
                  </label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as any)}
                    className="w-full bg-metal-950 border border-metal-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="OFFICE">Office</option>
                    <option value="SPECIAL">Special / Custom Project</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Materials Used
                  </label>
                  <input
                    type="text"
                    value={materialsUsed}
                    onChange={(e) => setMaterialsUsed(e.target.value)}
                    placeholder="e.g. Mild Steel, Solid Teak Wood, Powder Coat"
                    className="w-full bg-metal-950 border border-metal-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full bg-metal-950 border border-metal-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the client requirements, workshop fabrication process, and finish details..."
                  className="w-full bg-metal-950 border border-metal-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="flex items-center gap-6 py-2 border-y border-metal-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red bg-metal-950 border-metal-700"
                  />
                  <span className="text-xs font-semibold text-gray-300">Publish to Public Portfolio</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-red focus:ring-brand-red bg-metal-950 border-metal-700"
                  />
                  <span className="text-xs font-semibold text-gray-300">Feature on Homepage</span>
                </label>
              </div>

              {/* Camera & Image Uploader Integration */}
              <div>
                <CameraImageUploader
                  images={images}
                  onChange={setImages}
                  multiple={true}
                  maxImages={10}
                  label="Project Photos & Documentation"
                  helperText="Use device camera to photograph fabrication progress or finished installations. Select star icon to designate cover photo."
                />
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-metal-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-metal-800 hover:bg-metal-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Project...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingProject ? 'Update Project' : 'Save Project'}
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
