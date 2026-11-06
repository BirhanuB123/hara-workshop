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

  // RBAC Guard: Only ADMIN role may access admin portal
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  const path = location.pathname;
  let pageTitle = 'Workshop Operations Management';
  let pageSubtitle = 'HARA WORKSHOP Enterprise ERP & Production Control';

  if (path.includes('/reports')) {
    pageTitle = 'Workshop Operational Analytics';
    pageSubtitle = 'Order throughput, production efficiency, and material burn';
  } else if (path.includes('/quotes')) {
    pageTitle = 'Quotation Engine';
    pageSubtitle = 'Review customer requests, calculate materials & labor, issue price proposals';
  } else if (path.includes('/orders')) {
    pageTitle = 'Order Management';
    pageSubtitle = 'Monitor active orders, dispatch to production, and oversee fulfillment';
  } else if (path.includes('/production')) {
    pageTitle = 'Production Jobs';
    pageSubtitle = 'Active workshop production, stage tracking, quality control, and delivery';
  } else if (path.includes('/raw-materials') || path.includes('/inventory')) {
    pageTitle = 'Raw Materials & Inventory';
    pageSubtitle = 'Track steel sections, timber lumber, fittings, and automated stock alerts';
  } else if (path.includes('/suppliers')) {
    pageTitle = 'Suppliers Registry';
    pageSubtitle = 'Manage metal importers, timber sawmills, and hardware vendors';
  } else if (path.includes('/products')) {
    pageTitle = 'Products Catalog';
    pageSubtitle = 'Maintain workshop products, custom furniture models, and base specs';
  } else if (path.includes('/services')) {
    pageTitle = 'Services & Media Management';
    pageSubtitle = 'Full Admin control over service photography, slots 1-10+, and craftsmanship descriptions';
  } else if (path.includes('/categories')) {
    pageTitle = 'Product Categories';
    pageSubtitle = 'Organize metal works, wooden furniture, and hybrid architectural fittings';
  } else if (path.includes('/customers')) {
    pageTitle = 'Customer Accounts';
    pageSubtitle = 'Directory of customer accounts, project quotes, orders, and communication history';
  } else if (path.includes('/notifications')) {
    pageTitle = 'System Notifications';
    pageSubtitle = 'Operational alerts on quotation requests, orders, and inventory thresholds';
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
