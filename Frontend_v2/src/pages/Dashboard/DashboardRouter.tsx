import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages/Admin/Dashboard';
import FacultyDashboard from '@/pages/Faculty/Dashboard';
import ReviewerDashboard from '@/pages/Reviewer/Dashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'dept_head':
    case 'dean':
    case 'citl':
    case 'vpaa':
      return <ReviewerDashboard />;
    default:
      return <FacultyDashboard />;
  }
}
