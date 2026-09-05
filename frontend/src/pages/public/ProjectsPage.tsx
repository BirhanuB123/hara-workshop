import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Eye, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { projectsApi } from '../../services/api';
import { Project } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll()
      .then(res => setProjects(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { label: 'All Works', value: 'ALL' },
    { label: 'Metal Works', value: 'METAL' },
    { label: 'Solid Wood', value: 'WOOD' },
    { label: 'Furniture', value: 'FURNITURE' },
    { label: 'Doors & Gates', value: 'DOORS' },
    { label: 'Custom Architecture', value: 'CUSTOM' },
  ];

  const filtered = selectedCategory === 'ALL'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Craftsmanship Portfolio</span>
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Completed Installations & Projects
        </h1>
        <p className="text-sm text-gray-400">
          A showcase of our custom metal frameworks, bespoke hardwood carpentry, and architectural solutions installed across Addis Ababa.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setSelectedCategory(c.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === c.value
                ? 'bg-brand-red text-white'
                : 'bg-metal-900 text-gray-300 hover:bg-metal-800 border border-metal-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading portfolio projects..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No projects in this category"
          description="Check back soon as we continuously document and upload our completed workshop builds."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden hover:border-metal-700 transition-all flex flex-col group shadow-lg"
            >
              <div className="h-56 bg-metal-950 relative overflow-hidden flex items-center justify-center">
                {project.primary_image ? (
                  <img
                    src={project.primary_image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-metal-700 flex flex-col items-center">
                    <FolderGit2 className="w-12 h-12 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hara Workshop</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-metal-700 text-brand-red text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                  {project.category}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-[11px] text-metal-400 mb-1.5">
                    <span className="capitalize">{project.client_type.toLowerCase()} Client</span>
                    {project.completion_date && (
                      <>
                        <span>•</span>
                        <span>{new Date(project.completion_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-red transition-colors mb-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-metal-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-mono truncate max-w-[180px]">
                    {project.materials_used}
                  </span>
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-brand-red hover:text-red-400"
                  >
                    <span>View Story</span>
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
