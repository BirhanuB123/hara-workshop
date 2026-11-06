import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Wrench, 
  FileText, 
  AlertTriangle, 
  Boxes, 
  TrendingUp, 
  ArrowRight,
  ChevronRight
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

  // 1. Monthly Order Throughput Chart Data
  const orderThroughputData = stats?.monthly_order_trends || [
    { month: 'Oct', orders: 4 },
    { month: 'Nov', orders: 6 },
    { month: 'Dec', orders: 7 },
    { month: 'Jan', orders: 8 },
    { month: 'Feb', orders: 10 },
    { month: 'Mar', orders: 12 },
  ];

  // 2. Production by Stage Donut Data (5 core operational stages)
  const productionStages = stats?.production_by_stage || [
    { stage: 'ORDER CONFIRMED', count: 4, color: '#3B82F6' },
    { stage: 'IN PRODUCTION', count: 8, color: '#C5161D' },
    { stage: 'QUALITY CHECK', count: 3, color: '#F59E0B' },
    { stage: 'READY', count: 5, color: '#10B981' },
    { stage: 'DELIVERY / INSTALLATION', count: 4, color: '#8B5CF6' },
  ];

  // 3. Compact Production Overview Counts
  const prodOverview = stats?.production_overview || {
    in_production: 8,
    quality_check: 3,
    ready: 5,
    delivery: 4,
  };

  // 4. Quotations Awaiting Action (filter pending review)
  const pendingQuotes = quotes.filter(q => 
    q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW'
  );
  const displayedQuotes = (pendingQuotes.length > 0 ? pendingQuotes : quotes).slice(0, 4);

  // 5. Raw Materials Low Stock items
  const fallbackLowStock = [
    {
      id: 'ls-1',
      name: 'Mild Steel Welding Electrodes',
      sku: 'MAT-CON-001',
      current_stock: 4,
      minimum_stock: 10,
      unit: 'pieces'
    },
    {
      id: 'ls-2',
      name: 'Timber',
      sku: 'MAT-WOD-002',
      current_stock: 6,
      minimum_stock: 15,
      unit: 'units'
    }
  ];
  const displayedLowStock = lowStock.length > 0 ? lowStock : fallbackLowStock;

  // 6. Recent Customer Orders
  const displayedOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 text-left">
      {/* 1. TOP SUMMARY CARDS (Strictly Operational, Zero Financials) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="TOTAL ORDERS"
          value={stats?.total_orders ?? (orders.length || 24)}
          subtitle="All customer orders"
          icon={ShoppingBag}
        />
        <StatCard
          title="ACTIVE PRODUCTION"
          value={stats?.orders_in_production ?? (prodOverview.in_production || 8)}
          subtitle="Orders currently being produced"
          icon={Wrench}
        />
        <StatCard
          title="QUOTES AWAITING ACTION"
          value={stats?.quotes_awaiting_action ?? (pendingQuotes.length || 5)}
          subtitle="Customer quotation requests"
          icon={FileText}
        />
        <StatCard
          title="LOW STOCK ITEMS"
          value={stats?.low_stock_count ?? (displayedLowStock.length || 3)}
          subtitle="Materials requiring attention"
          icon={AlertTriangle}
        />
      </div>

      {/* 2. MAIN WORKSHOP CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Order Throughput Bar Chart */}
        <div className="lg:col-span-7 bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-metal-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monthly Order Throughput
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Customer orders confirmed each month</p>
            </div>
            <span className="text-xs font-bold text-brand-red flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Workshop Growth</span>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderThroughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262b28" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111413', 
                    borderColor: '#374151', 
                    borderRadius: '8px', 
                    fontSize: '12px' 
                  }}
                />
                <Bar dataKey="orders" name="Confirmed Orders" fill="#C5161D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production by Stage Donut Chart & Overview */}
        <div className="lg:col-span-5 bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-metal-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Production by Stage
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Distribution of active floor operations</p>
              </div>
              <Link 
                to="/admin/production" 
                className="text-xs text-brand-red font-semibold hover:underline flex items-center gap-1"
              >
                <span>Jobs</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="h-44 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productionStages}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={38}
                    paddingAngle={3}
                  >
                    {productionStages.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#C5161D'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111413', 
                      borderColor: '#374151', 
                      borderRadius: '8px', 
                      fontSize: '12px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stages Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-metal-800">
              {productionStages.map((s: any) => (
                <div key={s.stage} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-300 truncate text-[10px]">{s.stage}:</span>
                  <span className="font-bold text-white font-mono">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Production Overview */}
          <div className="bg-metal-950 p-3.5 rounded-lg border border-metal-800/80 mt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Production Overview (Current Floor Workload)
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-metal-900/80 p-2 rounded border border-metal-800">
                <span className="text-[10px] text-gray-400 block truncate">In Production</span>
                <span className="font-black text-white font-mono text-sm text-brand-red">{prodOverview.in_production}</span>
              </div>
              <div className="bg-metal-900/80 p-2 rounded border border-metal-800">
                <span className="text-[10px] text-gray-400 block truncate">Quality Check</span>
                <span className="font-black text-white font-mono text-sm text-amber-400">{prodOverview.quality_check}</span>
              </div>
              <div className="bg-metal-900/80 p-2 rounded border border-metal-800">
                <span className="text-[10px] text-gray-400 block truncate">Ready</span>
                <span className="font-black text-white font-mono text-sm text-emerald-400">{prodOverview.ready}</span>
              </div>
              <div className="bg-metal-900/80 p-2 rounded border border-metal-800">
                <span className="text-[10px] text-gray-400 block truncate">Delivery</span>
                <span className="font-black text-white font-mono text-sm text-purple-400">{prodOverview.delivery}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TWO COLUMNS: QUOTATIONS AWAITING ACTION & RAW MATERIALS STOCK ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotations Awaiting Action */}
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-metal-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-brand-red" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Quotations Awaiting Action
                </h3>
              </div>
              <Link to="/admin/quotes" className="text-xs text-brand-red font-semibold hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-metal-800/60 mt-1">
              {displayedQuotes.map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{q.quote_number}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <span className="text-gray-200 font-semibold block">{q.project_title || q.service_type}</span>
                    <span className="text-[11px] text-gray-400 block">
                      Customer: <strong className="text-gray-300">{q.customer?.full_name || q.customer?.email || 'Valued Client'}</strong>
                    </span>
                  </div>

                  <Link
                    to={`/admin/quotes/${q.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-metal-800 hover:bg-metal-700 text-brand-red hover:text-red-400 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-metal-700 transition"
                  >
                    <span>Review Quote</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-metal-800 flex justify-between items-center text-xs text-gray-400">
            <span>Pending proposals require CAD measurement & material costing</span>
            <Link to="/admin/quotes" className="text-brand-red font-semibold hover:underline">
              All Quotes →
            </Link>
          </div>
        </div>

        {/* Raw Materials Stock Alerts */}
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-metal-800 pb-3">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-brand-red" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Raw Materials Stock Alerts
                </h3>
              </div>
              <Link 
                to="/admin/raw-materials" 
                className="text-xs text-brand-red font-semibold hover:underline flex items-center gap-1"
              >
                <span>Manage Stock</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-metal-800/60 mt-1">
              {displayedLowStock.map((m: any) => (
                <div key={m.id || m.sku} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{m.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono block">SKU: {m.sku}</span>
                    <span className="text-[11px] text-gray-300 block">
                      Stock: <strong className="text-red-400 font-mono">{m.current_stock} {m.unit || 'pieces'}</strong> • Minimum: <strong className="text-gray-400 font-mono">{m.minimum_stock} {m.unit || 'pieces'}</strong>
                    </span>
                  </div>

                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/60 text-red-400 border border-red-800/80 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    <span>LOW STOCK</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-metal-800 flex justify-between items-center text-xs">
            <span className="text-gray-400">Restock procurement from registered suppliers</span>
            <Link
              to="/admin/raw-materials"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-red hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. RECENT CUSTOMER ORDERS TABLE */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-metal-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-brand-red" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Customer Orders
            </h3>
          </div>
          <Link to="/admin/orders" className="text-xs text-brand-red font-semibold hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {displayedOrders.map((o) => {
                const serviceName = o.quote?.service_type || o.items?.[0]?.item_title || 'Metal & Wood Works';
                return (
                  <tr key={o.id} className="hover:bg-metal-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {o.customer?.full_name || o.customer?.email || 'Customer'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {serviceName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/orders`}
                        className="inline-flex items-center gap-1 text-brand-red hover:text-red-400 font-bold uppercase tracking-wider text-[11px]"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
