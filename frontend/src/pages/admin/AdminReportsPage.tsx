import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Wrench, Boxes } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { reportsApi } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminReportsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getDashboardStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Compiling financial & operations reports..." />;

  const trends = stats?.monthly_trends || [
    { month: 'Apr', revenue: 140000, orders: 4 },
    { month: 'May', revenue: 210000, orders: 6 },
    { month: 'Jun', revenue: 185000, orders: 5 },
    { month: 'Jul', revenue: 290000, orders: 8 },
    { month: 'Aug', revenue: 320000, orders: 9 },
    { month: 'Sep', revenue: 410000, orders: 12 },
  ];

  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Executive Financial & Workshop Reports
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Comprehensive review of production throughput, monthly revenue in ETB, and inventory turnover.
        </p>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-3">
          Monthly Revenue Velocity (ETB)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262b28" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#111413', borderColor: '#374151', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#C5161D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
