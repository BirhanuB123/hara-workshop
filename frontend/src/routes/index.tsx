import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { AboutPage } from '../pages/public/AboutPage';
import { ServicesPage } from '../pages/public/ServicesPage';
import { ProductsPage } from '../pages/public/ProductsPage';
import { ProductDetailPage } from '../pages/public/ProductDetailPage';
import { ProjectsPage } from '../pages/public/ProjectsPage';
import { ProjectDetailPage } from '../pages/public/ProjectDetailPage';
import { RequestQuotePage } from '../pages/public/RequestQuotePage';
import { ContactPage } from '../pages/public/ContactPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Customer Portal Pages
import { CustomerDashboardPage } from '../pages/customer/CustomerDashboardPage';
import { CustomerQuotesPage } from '../pages/customer/CustomerQuotesPage';
import { CustomerQuoteDetailPage } from '../pages/customer/CustomerQuoteDetailPage';
import { CustomerOrdersPage } from '../pages/customer/CustomerOrdersPage';
import { CustomerOrderDetailPage } from '../pages/customer/CustomerOrderDetailPage';
import { CustomerInvoicesPage } from '../pages/customer/CustomerInvoicesPage';
import { CustomerPaymentsPage } from '../pages/customer/CustomerPaymentsPage';
import { CustomerMessagesPage } from '../pages/customer/CustomerMessagesPage';
import { CustomerNotificationsPage } from '../pages/customer/CustomerNotificationsPage';
import { CustomerProfilePage } from '../pages/customer/CustomerProfilePage';

// Admin / Staff Management Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminQuotesPage } from '../pages/admin/AdminQuotesPage';
import { AdminQuoteDetailPage } from '../pages/admin/AdminQuoteDetailPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminProductionPage } from '../pages/admin/AdminProductionPage';
import { AdminInventoryPage } from '../pages/admin/AdminInventoryPage';
import { AdminSuppliersPage } from '../pages/admin/AdminSuppliersPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminServicesPage } from '../pages/admin/AdminServicesPage';
import { AdminProjectsPage } from '../pages/admin/AdminProjectsPage';
import { AdminInvoicesPage } from '../pages/admin/AdminInvoicesPage';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage';
import { AdminExpensesPage } from '../pages/admin/AdminExpensesPage';
import { AdminCustomersPage } from '../pages/admin/AdminCustomersPage';
import { AdminEmployeesPage } from '../pages/admin/AdminEmployeesPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminMessagesPage } from '../pages/admin/AdminMessagesPage';
import { AdminNotificationsPage } from '../pages/admin/AdminNotificationsPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/request-quote" element={<RequestQuotePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* 2. Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* 3. Customer Portal */}
      <Route path="/portal" element={<CustomerLayout />}>
        <Route index element={<CustomerDashboardPage />} />
        <Route path="quotes" element={<CustomerQuotesPage />} />
        <Route path="quotes/:id" element={<CustomerQuoteDetailPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="orders/:id" element={<CustomerOrderDetailPage />} />
        <Route path="invoices" element={<CustomerInvoicesPage />} />
        <Route path="payments" element={<CustomerPaymentsPage />} />
        <Route path="messages" element={<CustomerMessagesPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
      </Route>

      {/* 4. Admin & Management Portal */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="quotes" element={<AdminQuotesPage />} />
        <Route path="quotes/:id" element={<AdminQuoteDetailPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="production" element={<AdminProductionPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="suppliers" element={<AdminSuppliersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="projects" element={<AdminProjectsPage />} />
        <Route path="invoices" element={<AdminInvoicesPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="expenses" element={<AdminExpensesPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* 5. Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
