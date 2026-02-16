import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { FacultySidebar } from '@/components/Faculty/FacultySidebar';
import { ReviewerSidebar } from '@/components/Reviewer/ReviewerSidebar';
import { FinalReviewerSidebar } from '@/components/Reviewer/FinalReviewerSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export function DashboardLayout() {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const sidebarProps = {
    isOpen: sidebarOpen,
    onClose: () => setSidebarOpen(false),
    isCollapsed: sidebarCollapsed,
    onToggleCollapse: () => setSidebarCollapsed(!sidebarCollapsed),
  };

  const renderSidebar = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return <AdminSidebar {...sidebarProps} />;
      case 'faculty':
        return <FacultySidebar {...sidebarProps} />;
      case 'citl':
      case 'vpaa':
        return <FinalReviewerSidebar {...sidebarProps} />;
      case 'dept_head':
      case 'dean':
        return <ReviewerSidebar {...sidebarProps} />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="h-screen bg-background flex overflow-hidden">
        {renderSidebar()}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}