import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CustomerSidebar } from '../components/layout/CustomerSidebar';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { X } from 'lucide-react';

export const CustomerLayout: React.FC = () => {
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

  // RBAC Guard: Only CUSTOMER role may access customer portal
  if (user?.role !== 'CUSTOMER') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const path = location.pathname;
  let pageTitle = 'Customer Portal';
  let pageSubtitle = 'Manage your quotes, orders, and workshop communications';

  if (path.includes('/quotes')) {
    pageTitle = 'My Quotations';
    pageSubtitle = 'Review detailed workshop proposals, price breakdowns, and approve projects';
  } else if (path.includes('/orders')) {
    pageTitle = 'My Orders';
    pageSubtitle = 'Track real-time workshop fabrication stages, milestones, and delivery';
  } else if (path.includes('/notifications')) {
    pageTitle = 'Account Notifications';
    pageSubtitle = 'Important updates regarding your order progress and quotes';
  } else if (path.includes('/profile')) {
    pageTitle = 'Profile & Delivery Address';
    pageSubtitle = 'Update contact numbers, Addis Ababa delivery locations, and TIN data';
  }

  return (
    <div className="min-h-screen bg-metal-950 flex flex-col md:flex-row text-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <CustomerSidebar />
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
            <CustomerSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
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
