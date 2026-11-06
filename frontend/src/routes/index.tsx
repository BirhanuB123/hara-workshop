import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Layout
import { PublicLayout } from '../layouts/PublicLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { AboutPage } from '../pages/public/AboutPage';
import { ServicesPage } from '../pages/public/ServicesPage';
import { ServiceDetailPage } from '../pages/public/ServiceDetailPage';
import { ProductsPage } from '../pages/public/ProductsPage';
import { ProductDetailPage } from '../pages/public/ProductDetailPage';
import { RequestQuotePage } from '../pages/public/RequestQuotePage';
import { ContactPage } from '../pages/public/ContactPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Pages (Account-Free Browsing & Ordering) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:slug" element={<ServiceDetailPage />} />
        <Route path="/services/:serviceSlug/products/:productSlug" element={<ProductDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/projects/*" element={<Navigate to="/products" replace />} />
        <Route path="/portfolio/*" element={<Navigate to="/products" replace />} />
        <Route path="/request-quote" element={<RequestQuotePage />} />
        <Route path="/order" element={<Navigate to="/request-quote" replace />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* 2. Legacy Auth & Portal URLs safely redirect to public home */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/customer/*" element={<Navigate to="/" replace />} />
      <Route path="/portal/*" element={<Navigate to="/" replace />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />

      {/* 3. Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
