import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Phone, MapPin, Building, Search, Filter, ShieldCheck, ShieldAlert,
  Calendar, FileText, ShoppingBag, Eye, X, CheckCircle, AlertTriangle, MessageSquare
} from 'lucide-react';
import { customersApi, quotesApi, ordersApi } from '../../services/api';
import { User, Quote, Order } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Customer Inspection Modal
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await customersApi.getAll();
      setCustomers(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerDetails = async (customer: User) => {
    setSelectedCustomer(customer);
    setLoadingDetails(true);
    setCustomerQuotes([]);
    setCustomerOrders([]);

    try {
      // Fetch full details + user quotes and orders
      const [detailRes, quotesRes, ordersRes] = await Promise.all([
        customersApi.getById(customer.id),
        quotesApi.getAll(),
        ordersApi.getAll(),
      ]);

      if (detailRes?.data) {
        setSelectedCustomer(detailRes.data);
      }

      const allQuotes: Quote[] = quotesRes.data.results || quotesRes.data || [];
      const userQuotes = allQuotes.filter(q => (q.customer as any)?.id === customer.id || (q.customer as any) === customer.id);
      setCustomerQuotes(userQuotes);

      const allOrders: Order[] = ordersRes.data.results || ordersRes.data || [];
      const userOrders = allOrders.filter(o => (o.customer as any)?.id === customer.id || (o.customer as any) === customer.id);
      setCustomerOrders(userOrders);
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleActive = async (customerId: string) => {
    setIsToggling(true);
    try {
      const res = await customersApi.toggleActive(customerId);
      const updatedActive = res.data.is_active;

      // Update in local state
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, is_active: updatedActive } : c));
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, is_active: updatedActive } : null);
      }
    } catch (err) {
      console.error('Failed to toggle customer active status', err);
      alert('Failed to update customer account status.');
    } finally {
      setIsToggling(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const term = search.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone_number && c.phone_number.includes(term)) ||
      (c.customer_profile?.company_name && c.customer_profile.company_name.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE' && !c.is_active) return false;
    if (statusFilter === 'INACTIVE' && c.is_active) return false;

    return true;
  });

  if (loading) return <LoadingSpinner text="Loading customers..." />;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-red" />
            Customers Directory
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage registered customer accounts, view quotation/order histories, and control account activation status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-metal-900 border border-metal-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red w-56 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-metal-900 border border-metal-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Total Registered Clients</span>
            <p className="text-xl font-bold text-white mt-1">{customers.length}</p>
          </div>
          <Users className="w-7 h-7 text-metal-600" />
        </div>
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-emerald-400 uppercase text-[10px] font-bold tracking-wider">Active Accounts</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{customers.filter(c => c.is_active).length}</p>
          </div>
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="bg-metal-900 border border-metal-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-red-400 uppercase text-[10px] font-bold tracking-wider">Deactivated Accounts</span>
            <p className="text-xl font-bold text-red-400 mt-1">{customers.filter(c => !c.is_active).length}</p>
          </div>
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
      </div>

      {/* Customer Table / List */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-red font-bold text-xs uppercase">
                        {c.first_name ? c.first_name[0] : (c.email ? c.email[0] : 'C')}
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Customer Account'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">ID: {c.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white block">{c.email}</span>
                    <span className="text-gray-400 text-[11px]">{c.phone_number || 'No phone'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {c.customer_profile?.company_name || <span className="text-gray-600">Individual</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {c.customer_profile?.address || 'Addis Ababa'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.is_active 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                        : 'bg-red-950/60 text-red-400 border border-red-800/40'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {c.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openCustomerDetails(c)}
                        className="px-2.5 py-1 bg-metal-800 hover:bg-metal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          c.is_active
                            ? 'bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40'
                            : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No customers found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail & Activity History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-metal-900 border border-metal-700 rounded-2xl max-w-2xl w-full p-6 text-left shadow-2xl my-8 relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-metal-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-metal-800 pb-4 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-red font-bold text-base uppercase">
                    {selectedCustomer.first_name ? selectedCustomer.first_name[0] : 'C'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedCustomer.first_name || selectedCustomer.last_name 
                        ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()
                        : 'Customer Profile'}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">{selectedCustomer.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/messages`}
                    className="px-3 py-1.5 bg-metal-800 hover:bg-metal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-metal-700"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-brand-red" />
                    <span>Message Customer</span>
                  </Link>

                  <button
                    disabled={isToggling}
                    onClick={() => handleToggleActive(selectedCustomer.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      selectedCustomer.is_active
                        ? 'bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700'
                        : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
                    }`}
                  >
                    {isToggling ? 'Updating...' : (selectedCustomer.is_active ? 'Deactivate Account' : 'Activate Account')}
                  </button>
                </div>
              </div>
            </div>

            {(selectedCustomer as any).potential_duplicate_name && (
              <div className="mb-4 p-3 bg-amber-950/50 border border-amber-800/80 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-200">Note: Potential Duplicate Name Detected</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Another registered customer shares this first and last name. Contact details (email & phone) are unique. Verify order specifications and delivery address to avoid confusion.
                  </p>
                </div>
              </div>
            )}

            {loadingDetails ? (
              <LoadingSpinner text="Retrieving customer quote and order portfolio..." />
            ) : (
              <div className="space-y-5">
                {/* Profile Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-metal-950 p-4 rounded-xl border border-metal-800">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Phone Number</span>
                    <p className="text-white font-medium mt-0.5">{selectedCustomer.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Company / Organization</span>
                    <p className="text-white font-medium mt-0.5">{selectedCustomer.customer_profile?.company_name || 'Individual'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Delivery / Workshop Address</span>
                    <p className="text-white font-medium mt-0.5">{selectedCustomer.customer_profile?.address || 'Addis Ababa'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Tax ID / TIN</span>
                    <p className="text-white font-mono mt-0.5">{selectedCustomer.customer_profile?.tin_number || 'N/A'}</p>
                  </div>
                </div>

                {/* Quotations Activity */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-red" />
                    Quotation Requests ({customerQuotes.length})
                  </h4>
                  {customerQuotes.length === 0 ? (
                    <div className="bg-metal-950 p-3 rounded-lg border border-metal-800 text-center text-xs text-gray-500">
                      No quotation requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {customerQuotes.map(q => (
                        <div key={q.id} className="bg-metal-950 p-2.5 rounded-lg border border-metal-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{q.project_title}</span>
                            <span className="text-[10px] text-gray-500 font-mono">Ref: {q.quote_number}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-metal-800 text-gray-300">
                              {q.status}
                            </span>
                            {q.total_amount > 0 && (
                              <span className="block text-[11px] font-mono font-bold text-brand-red mt-0.5">
                                {q.total_amount.toLocaleString()} ETB
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Orders Activity */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-brand-red" />
                    Customer Orders ({customerOrders.length})
                  </h4>
                  {customerOrders.length === 0 ? (
                    <div className="bg-metal-950 p-3 rounded-lg border border-metal-800 text-center text-xs text-gray-500">
                      No workshop orders associated with this account.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {customerOrders.map(o => (
                        <div key={o.id} className="bg-metal-950 p-2.5 rounded-lg border border-metal-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">Order #{o.order_number}</span>
                            <span className="text-[10px] text-gray-500">
                              {o.items?.length ? o.items.map(i => i.item_title).join(', ') : 'Custom Fabrication'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-metal-800 flex items-center justify-end">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-5 py-2 bg-metal-800 hover:bg-metal-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
