import React, { useEffect, useState } from 'react';
import { FolderGit2, PlusCircle, Eye } from 'lucide-react';
import { projectsApi } from '../../services/api';
import { Project } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll()
      .then(res => setProjects(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading portfolio..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Portfolio & Showcase Projects
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Maintain completed installations, before/after photographs, and client testimonials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
            <div className="h-44 bg-metal-950 flex items-center justify-center overflow-hidden">
              {p.primary_image ? (
                <img src={p.primary_image} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <FolderGit2 className="w-10 h-10 text-metal-600" />
              )}
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-brand-red font-bold uppercase">{p.category}</span>
                <h3 className="text-sm font-bold text-white">{p.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>
              </div>
              <div className="pt-2 border-t border-metal-800 text-[11px] text-gray-400">
                <span>Materials: {p.materials_used}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
