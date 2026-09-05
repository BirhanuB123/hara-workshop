import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  FileText, 
  AlertTriangle, 
  Wrench, 
  Boxes, 
  PlusCircle, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { reportsApi, quotesApi, ordersApi, productionApi, inventoryApi } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [dashRes, qRes, oRes, pRes, iRes] = await Promise.all([
          reportsApi.getDashboardStats().catch(() => ({ data: null })),
          quotesApi.getAll(),
          ordersApi.getAll(),
          productionApi.getAll(),
          inventoryApi.getLowStock()
        ]);
        setStats(dashRes?.data);
        setQuotes(qRes.data.results || qRes.data || []);
        setOrders(oRes.data.results || oRes.data || []);
        setJobs(pRes.data.results || pRes.data || []);
        setLowStock(iRes.data.results || iRes.data || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading workshop operations dashboard..." />;

  // Chart data
  const revenueData = stats?.monthly_trends || [
    { month: 'Apr', revenue: 140000, orders: 4 },
    { month: 'May', revenue: 210000, orders: 6 },
    { month: 'Jun', revenue: 185000, orders: 5 },
    { month: 'Jul', revenue: 290000, orders: 8 },
    { month: 'Aug', revenue: 320000, orders: 9 },
    { month: 'Sep', revenue: 410000, orders: 12 },
  ];

  const stageBreakdown = stats?.production_breakdown || [
    { name: 'Prep & Cutting', value: 4, color: '#3B82F6' },
    { name: 'Fabrication', value: 6, color: '#C5161D' },
    { name: 'Finishing', value: 3, color: '#F59E0B' },
    { name: 'Quality Check', value: 2, color: '#10B981' },
  ];

  const totalRevenue = stats?.total_revenue || orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const activeJobs = jobs.filter(j => j.stage !== 'COMPLETED');
  const pendingQuotes = quotes.filter(q => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-8 text-left">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Workshop Revenue"
          value={`${(totalRevenue / 1000).toFixed(1)}k ETB`}
          subtitle="Verified payments collected"
          icon={DollarSign}
        />
        <StatCard
          title="Active Production Jobs"
          value={activeJobs.length}
          subtitle="Floor fabrication & assembly"
          icon={Wrench}
        />
        <StatCard
          title="Quotes Awaiting Proposal"
          value={pendingQuotes.length}
          subtitle="Action required from sales"
          icon={FileText}
        />
        <StatCard
          title="Low-Stock Alerts"
          value={lowStock.length}
          subtitle="Raw steel & timber reorders"
          icon={AlertTriangle}
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trends Bar Chart */}
        <div className="lg:col-span-8 bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-metal-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monthly Revenue Trends (ETB)
              </h3>
              <p className="text-xs text-gray-400">Order volumes and payments recorded over time</p>
            </div>
            <span className="text-xs font-bold text-brand-red flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Growth +24%</span>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262b28" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111413', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#C5161D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-metal-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Jobs by Workshop Stage
            </h3>
            <p className="text-xs text-gray-400">Distribution of active floor operations</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                >
                  {stageBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#C5161D'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111413', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-metal-800">
            {stageBreakdown.map((s: any) => (
              <div key={s.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-gray-300 truncate">{s.name}:</span>
                <span className="font-bold text-white font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Actionable Quotes & Low Stock Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotes Pending Price Proposal */}
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-metal-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-brand-red" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Quotations Awaiting Action
              </h3>
            </div>
            <Link to="/admin/quotes" className="text-xs text-brand-red font-semibold hover:underline">
              View All →
            </Link>
          </div>

          {quotes.slice(0, 4).map((q) => (
            <div key={q.id} className="py-2.5 flex justify-between items-center text-xs border-b border-metal-800/60 last:border-0">
              <div>
                <span className="font-mono font-bold text-white block">{q.quote_number}</span>
                <span className="text-gray-300 font-semibold">{q.project_title}</span>
                <span className="text-[10px] text-gray-500 block">Customer: {q.customer?.full_name || q.customer?.email}</span>
              </div>
              <div className="text-right">
                <StatusBadge status={q.status} />
                <Link
                  to={`/admin/quotes/${q.id}`}
                  className="mt-1.5 inline-block text-[11px] text-brand-red hover:underline font-semibold"
                >
                  Price Proposal →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Critical Inventory Low-Stock */}
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-metal-800 pb-3">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-brand-red" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Raw Materials Stock Alerts
              </h3>
            </div>
            <Link to="/admin/inventory" className="text-xs text-brand-red font-semibold hover:underline">
              Manage Stock →
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">All materials are currently above minimum threshold.</p>
          ) : (
            lowStock.slice(0, 4).map((m) => (
              <div key={m.id} className="py-2.5 flex justify-between items-center text-xs border-b border-metal-800/60 last:border-0">
                <div>
                  <span className="font-bold text-white block">{m.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">SKU: {m.sku} • {m.category}</span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/50 text-[10px] font-bold">
                    Stock: {m.current_stock} {m.unit} (Min: {m.minimum_stock})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
