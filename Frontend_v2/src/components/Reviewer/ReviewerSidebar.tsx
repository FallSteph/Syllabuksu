import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileSearch, History, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ReviewerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/dashboard' },
  { label: 'Review Syllabi', icon: <FileSearch className="h-5 w-5" />, path: '/reviewer/syllabi' },
  { label: 'History', icon: <History className="h-5 w-5" />, path: '/reviewer/history' },
];

export function ReviewerSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: ReviewerSidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <TooltipProvider delayDuration={0}>
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 lg:relative lg:inset-auto
        h-full flex-shrink-0
        bg-sidebar text-sidebar-foreground
        transform transition-all duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        flex flex-col overflow-hidden
      `}>
        <div className={`h-16 flex items-center border-b border-sidebar-border ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <Logo size="sm" className="text-sidebar-foreground [&_span]:text-sidebar-foreground" />
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto overflow-x-hidden`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const linkContent = (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-2' : 'px-4'} py-3 rounded-xl
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft' 
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <span className={`transition-transform group-hover:scale-110 ${isActive ? 'text-sidebar-primary-foreground' : ''}`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="px-4 py-3 rounded-xl bg-sidebar-accent/50">
              <p className="text-sm font-medium text-sidebar-foreground">
                {ROLE_LABELS[user.role]}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {user.role === 'dept_head' ? user.department : user.college}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
    </TooltipProvider>
  );
}