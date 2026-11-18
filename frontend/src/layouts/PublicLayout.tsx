import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';

export const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-lime text-forge selection:bg-brand-red selection:text-white overflow-x-hidden">
    <PublicNavbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <PublicFooter />
  </div>
);
