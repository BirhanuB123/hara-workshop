import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { coreApi } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coreApi.getAuditLogs()
      .then(res => setLogs(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading security audit trails..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Security & Audit Logs
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Immutable records of stage advancements, quote proposals, orders, and inventory stock updates.
        </p>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 uppercase text-[10px] font-bold text-brand-red">{log.action}</td>
                  <td className="px-4 py-3 font-semibold text-white">{log.user_email || 'System'}</td>
                  <td className="px-4 py-3 font-mono text-gray-400">{log.ip_address || '127.0.0.1'}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{JSON.stringify(log.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
