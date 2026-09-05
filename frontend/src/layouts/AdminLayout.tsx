import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { X } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user, isInitialized } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-metal-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // RBAC Guard: Customers cannot enter admin portal
  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/portal" replace />;
  }

  const path = location.pathname;
  let pageTitle = 'Workshop Operations Management';
  let pageSubtitle = 'HARA WORKSHOP Enterprise ERP & Production Control';

  if (path.includes('/reports')) {
    pageTitle = 'Executive Analytics & Financial Reports';
    pageSubtitle = 'Revenue trends, order conversions, production efficiency, and material burn';
  } else if (path.includes('/quotes')) {
    pageTitle = 'Quotation Engine';
    pageSubtitle = 'Review customer requests, calculate materials & labor, issue price proposals';
  } else if (path.includes('/orders')) {
    pageTitle = 'Order Management';
    pageSubtitle = 'Monitor active orders, dispatch to production, and oversee fulfillment';
  } else if (path.includes('/production')) {
    pageTitle = '10-Stage Production Pipeline';
    pageSubtitle = 'Cutting, fabrication, assembly, finishing, quality check, and installation';
  } else if (path.includes('/inventory')) {
    pageTitle = 'Raw Materials & Inventory';
    pageSubtitle = 'Track steel tubes, hardwood lumber, fittings, and automated low-stock alerts';
  } else if (path.includes('/suppliers')) {
    pageTitle = 'Suppliers Registry';
    pageSubtitle = 'Manage metal importers, timber sawmills, and hardware vendors';
  } else if (path.includes('/products')) {
    pageTitle = 'Products Catalog';
    pageSubtitle = 'Maintain showroom items, custom furniture models, and base pricing';
  } else if (path.includes('/categories')) {
    pageTitle = 'Product Categories';
    pageSubtitle = 'Organize metal works, wooden furniture, and architectural fittings';
  } else if (path.includes('/services')) {
    pageTitle = 'Workshop Services';
    pageSubtitle = 'Define fabrication capabilities, turnaround rates, and price baselines';
  } else if (path.includes('/projects')) {
    pageTitle = 'Portfolio & Showcase';
    pageSubtitle = 'High-resolution before & after photos of completed workshop installations';
  } else if (path.includes('/invoices')) {
    pageTitle = 'Invoices & 15% VAT Records';
    pageSubtitle = 'Issue legal invoices, reconcile balances, and manage payment terms';
  } else if (path.includes('/payments')) {
    pageTitle = 'Payment Verification';
    pageSubtitle = 'Verify Telebirr, CBE, cash, and bank transfer receipts in Ethiopian Birr (ETB)';
  } else if (path.includes('/expenses')) {
    pageTitle = 'Workshop Operating Expenses';
    pageSubtitle = 'Consumables, machinery maintenance, diesel, transport, and utilities';
  } else if (path.includes('/customers')) {
    pageTitle = 'Customer Relationship Management';
    pageSubtitle = 'Directory of residential and commercial clients across Ethiopia';
  } else if (path.includes('/employees')) {
    pageTitle = 'Workshop Staff & Craftsmen';
    pageSubtitle = 'Supervisors, welders, carpenters, finishing masters, and engineers';
  } else if (path.includes('/users')) {
    pageTitle = 'System Users & Role-Based Access';
    pageSubtitle = 'Super Admin, Manager, Sales, Production, and Accountant credentials';
  } else if (path.includes('/messages')) {
    pageTitle = 'Live Customer Conversations';
    pageSubtitle = 'In-app chat and file exchange with prospective and active clients';
  } else if (path.includes('/notifications')) {
    pageTitle = 'System Event Notifications';
    pageSubtitle = 'Real-time alerts on quotes, order payments, and critical stock levels';
  } else if (path.includes('/audit-logs')) {
    pageTitle = 'Security & Audit Logs';
    pageSubtitle = 'Immutable log of administrative operations, stage changes, and transactions';
  } else if (path.includes('/settings')) {
    pageTitle = 'Workshop Enterprise Settings';
    pageSubtitle = 'Company details, VAT percentage, Telegram handles, and address configuration';
  }

  return (
    <div className="min-h-screen bg-metal-950 flex flex-col md:flex-row text-gray-100">
      {/* Desktop Admin Sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex flex-col h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-white bg-metal-800 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-metal-950">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
