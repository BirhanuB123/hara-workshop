import React, { useEffect, useState } from 'react';
import { Briefcase, Phone, Wrench } from 'lucide-react';
import { accountsApi } from '../../services/api';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminEmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getUsers()
      .then(res => {
        const list = res.data.results || res.data || [];
        setEmployees(list.filter((u: User) => u.role !== 'CUSTOMER'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading workshop staff..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Workshop Craftsmen & Staff
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Supervisors, master welders, carpenters, and finishing technicians at Bole Arabsa workshop.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-red/20 text-brand-red uppercase">
                {emp.role.replace('_', ' ')}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Active Staff</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{emp.full_name}</h3>
              <p className="text-xs text-gray-400">{emp.employee_profile?.job_title || 'Craftsman'}</p>
            </div>
            <div className="pt-2 border-t border-metal-800 text-xs text-gray-300 space-y-1">
              <div><span className="text-gray-500">Department:</span> {emp.employee_profile?.department || 'Operations'}</div>
              <div><span className="text-gray-500">Skills:</span> {emp.employee_profile?.skills || 'TIG/MIG Welding, Joinery'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
