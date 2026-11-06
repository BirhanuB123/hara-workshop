import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { accountsApi } from '../../services/api';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getUsers()
      .then(res => setUsers(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading system users..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          System Users & User Roles
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Enterprise User Management with strict 2-role system: ADMIN (Full Workshop ERP Access) and CUSTOMER (Client Portal).
        </p>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{u.full_name}</td>
                  <td className="px-4 py-3 font-mono text-metal-300">{u.email}</td>
                  <td className="px-4 py-3">{u.phone_number || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'ADMIN'
                        ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                        : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
