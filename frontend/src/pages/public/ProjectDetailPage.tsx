import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Calendar, Tag, ShieldCheck, PlusCircle } from 'lucide-react';
import { projectsApi } from '../../services/api';
import { Project } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      projectsApi.getById(id)
        .then(res => setProject(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading project portfolio details..." />;
  if (!project) return <div className="p-8 text-center text-white">Project not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        to="/projects"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects Portfolio</span>
      </Link>

      <div className="bg-metal-900 border border-metal-800 rounded-2xl overflow-hidden p-6 sm:p-10 space-y-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xs font-bold text-brand-red uppercase tracking-wider">
              {project.category} Solution
            </span>
            <span className="text-xs bg-metal-800 text-metal-300 px-2.5 py-0.5 rounded uppercase">
              {project.client_type} Project
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {project.title}
          </h1>
          {project.completion_date && (
            <p className="text-xs text-gray-400 mt-1">
              Completed on: {new Date(project.completion_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Main Image */}
        {project.primary_image && (
          <div className="rounded-xl overflow-hidden h-96 bg-black flex items-center justify-center border border-metal-800">
            <img
              src={project.primary_image}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Gallery of other images (e.g. before/after) */}
        {project.images && project.images.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Project Photos & Fabrication Stages
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.images.map((img) => (
                <div key={img.id} className="relative rounded-lg overflow-hidden border border-metal-800 h-44 bg-metal-950">
                  <img src={img.image} alt={img.caption || 'Project visual'} className="w-full h-full object-cover" />
                  {img.image_type !== 'REGULAR' && (
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {img.image_type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-metal-800">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Project Overview & Execution
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>

          <div className="bg-metal-950 p-6 rounded-xl border border-metal-800 space-y-4 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              Project Specifications
            </h4>
            <div className="space-y-2 text-gray-300">
              <div>
                <span className="text-gray-500 block">Materials Used:</span>
                <span className="font-semibold text-white">{project.materials_used}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Sector / Client Type:</span>
                <span className="font-semibold text-white">{project.client_type}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Fabrication Hub:</span>
                <span className="font-semibold text-white">Bole Arabsa Workshop, Addis Ababa</span>
              </div>
            </div>

            <div className="pt-4 border-t border-metal-800">
              <Link
                to={`/request-quote?reference=${encodeURIComponent(project.title)}`}
                className="w-full inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Request Similar Build</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
