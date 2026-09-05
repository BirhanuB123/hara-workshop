import React, { useEffect, useState } from 'react';
import { Wrench, Clock, CheckCircle2, ChevronRight, AlertCircle, PlusCircle } from 'lucide-react';
import { productionApi } from '../../services/api';
import { ProductionJob, ProductionStage } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminProductionPage: React.FC = () => {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Stage update form state
  const [newStage, setNewStage] = useState<ProductionStage>('MATERIAL_PREP');
  const [newProgress, setNewProgress] = useState(50);
  const [logNotes, setLogNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const stages: ProductionStage[] = [
    'ORDER_CONFIRMED',
    'MATERIAL_PREP',
    'CUTTING',
    'FABRICATION',
    'ASSEMBLY',
    'FINISHING',
    'QUALITY_INSPECTION',
    'READY_FOR_DELIVERY',
    'INSTALLATION',
    'COMPLETED'
  ];

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await productionApi.getAll();
      setJobs(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openStageModal = (job: ProductionJob) => {
    setSelectedJob(job);
    setNewStage(job.stage);
    setNewProgress(job.progress_percentage);
    setLogNotes('');
    setShowModal(true);
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setUpdating(true);
    try {
      await productionApi.updateStage(selectedJob.id, {
        stage: newStage,
        progress_percentage: Number(newProgress),
        notes: logNotes,
      });
      setShowModal(false);
      loadJobs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to advance stage.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading 10-stage production floor..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Workshop 10-Stage Production Pipeline
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Real-time floor tracking from material prep and laser cutting through fabrication, finishing, and site installation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-metal-900 border border-metal-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-metal-700 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-black text-brand-red">{job.job_code}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-metal-800 text-metal-300 uppercase">
                  Order #{job.order_number}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white line-clamp-1">{job.customer_name}</h3>

              <div className="mt-3 bg-metal-950 p-3 rounded-lg border border-metal-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Current Stage:</span>
                  <span className="font-bold text-brand-red uppercase">{job.stage.replace('_', ' ')}</span>
                </div>
                <div className="w-full bg-metal-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-red h-2 rounded-full transition-all duration-500"
                    style={{ width: `${job.progress_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Priority: {job.priority}</span>
                  <span className="font-mono font-bold text-white">{job.progress_percentage}%</span>
                </div>
              </div>

              {job.notes && (
                <p className="text-[11px] text-gray-400 mt-2 line-clamp-2">
                  <span className="text-gray-500">Notes:</span> {job.notes}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-metal-800">
              <button
                onClick={() => openStageModal(job)}
                className="w-full bg-metal-800 hover:bg-brand-red text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Advance Workshop Stage</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Update Stage */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Advance Production: ${selectedJob?.job_code}`}
      >
        <form onSubmit={handleUpdateStage} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Select Next Workshop Stage *</label>
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value as ProductionStage)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-semibold"
            >
              {stages.map((st, idx) => (
                <option key={st} value={st}>
                  Stage {idx + 1}: {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-300 mb-1">
              <span>Progress Percentage (%)</span>
              <span className="font-mono text-brand-red">{newProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={newProgress}
              onChange={(e) => setNewProgress(Number(e.target.value))}
              className="w-full accent-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Craftsman Log Notes</label>
            <textarea
              rows={3}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="e.g. Cut 60x60 RHS tubes; MIG welding completed with primer coat applied..."
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {updating ? 'Saving...' : 'Record Stage Transition'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
