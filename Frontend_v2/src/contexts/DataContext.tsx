import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Syllabus, Notification, User, SyllabusStatus, ReviewAction, UserRole } from '@/types';
import { MOCK_SYLLABI } from '@/mock/syllabusData';
import { MOCK_NOTIFICATIONS, MOCK_PENDING_USERS, MOCK_USERS } from '@/mock/userData';

interface DataContextType {
  syllabi: Syllabus[];
  notifications: Notification[];
  pendingUsers: User[];
  allUsers: User[];
  addSyllabus: (syllabus: Omit<Syllabus, 'id' | 'createdAt' | 'updatedAt' | 'reviewHistory'>) => void;
  submitSyllabus: (id: string) => void;
  approveSyllabus: (id: string, userRole: UserRole, reviewerId: string, reviewerName: string, comment?: string) => void;
  returnSyllabus: (id: string, userRole: UserRole, reviewerId: string, reviewerName: string, feedback: string) => void;
  updateSyllabusStatus: (id: string, status: SyllabusStatus, feedback?: string) => void;
  addReviewAction: (syllabusId: string, action: Omit<ReviewAction, 'id' | 'timestamp'>) => void;
  getSyllabiForRole: (userId: string, role: UserRole, college: string, department: string) => Syllabus[];
  getNotificationsForUser: (userId: string) => Notification[];
  markNotificationRead: (id: string) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>, password?: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  archiveUser: (userId: string) => void;
  unarchiveUser: (userId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [syllabi, setSyllabi] = useState<Syllabus[]>(MOCK_SYLLABI);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [pendingUsers, setPendingUsers] = useState<User[]>(MOCK_PENDING_USERS);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const mapServerUser = (u: any): User => {
    const roleMap: Record<string, UserRole> = {
      FACULTY: 'faculty',
      DEPT_HEAD: 'dept_head',
      DEAN: 'dean',
      CITL: 'citl',
      VPAA: 'vpaa',
      ADMIN: 'admin',
    };
    return {
      id: String(u.id || u._id),
      firstName: u.firstName ?? u.first_name ?? '',
      lastName: u.lastName ?? u.last_name ?? '',
      email: u.email ?? '',
      role: roleMap[u.role] ?? (u.role as UserRole) ?? 'faculty',
      college: u.college ?? '',
      department: u.department ?? '',
      isApproved: true,
      status: u.status === 'archived' ? 'archived' : (u.status === 'ARCHIVED' ? 'archived' : 'active'),
      isActive: u.isActive ?? u.is_active ?? (u.status === 'ARCHIVED' ? false : true),
      lastLogin: u.lastLogin ?? u.last_login ?? undefined,
      updatedAt: u.updatedAt ?? u.updated_at ?? undefined,
      createdAt: u.createdAt ?? new Date().toISOString().split('T')[0],
      notificationsEnabled: true,
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.users)) {
          setAllUsers(data.users.map(mapServerUser));
        } else {
          setAllUsers(MOCK_USERS);
        }
      } catch {
        setAllUsers(MOCK_USERS);
      }
    })();
  }, []);

  // Helper function to notify department head
  const notifyDepartmentHead = (syllabus: Syllabus) => {
    // Find department head for this syllabus
    const deptHead = allUsers.find(user => 
      user.role === 'dept_head' && 
      user.department === syllabus.department &&
      user.college === syllabus.college &&
      user.isApproved === true
    );
    
    if (deptHead) {
      const newNotification: Notification = {
        id: `n${Date.now()}`,
        userId: deptHead.id,
        title: 'New Syllabus for Review',
        message: `New syllabus "${syllabus.courseCode} - ${syllabus.courseTitle}" from ${syllabus.facultyName} requires your review.`,
        syllabusId: syllabus.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);
      
      // Also notify faculty that submission was successful
      const facultyNotification: Notification = {
        id: `n${Date.now() + 1}`,
        userId: syllabus.facultyId,
        title: 'Syllabus Submitted Successfully',
        message: `Your syllabus "${syllabus.courseCode}" has been submitted to ${deptHead.firstName} ${deptHead.lastName} for review.`,
        syllabusId: syllabus.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [facultyNotification, ...prev]);
    }
  };

  // Add a new syllabus (Faculty creates or submits directly)
  const addSyllabus = (syllabus: Omit<Syllabus, 'id' | 'createdAt' | 'updatedAt' | 'reviewHistory'>) => {
    const newSyllabus: Syllabus = {
      ...syllabus,
      id: `s${Date.now()}`,
      // FIXED: Use the status passed from the component
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewHistory: [],
    };
    
    // If syllabus is submitted for review (not draft), add initial review action
    if (syllabus.status === 'under_review_dept_head') {
      newSyllabus.reviewHistory = [
        {
          id: `ra${Date.now()}`,
          reviewerId: syllabus.facultyId,
          reviewerName: syllabus.facultyName,
          reviewerRole: 'faculty',
          action: 'forwarded',
          comment: 'Submitted for department head review',
          timestamp: new Date().toISOString(),
        }
      ];
      
      // Notify department head
      notifyDepartmentHead(newSyllabus);
    }
    
    setSyllabi(prev => [newSyllabus, ...prev]);
  };

  // Faculty submits syllabus for review (from draft status)
  const submitSyllabus = (id: string) => {
    const syllabus = syllabi.find(s => s.id === id);
    if (!syllabus) return;
    
    setSyllabi(prev => prev.map(s => 
      s.id === id 
        ? { 
            ...s, 
            status: 'under_review_dept_head', // FIXED: Changed from 'submitted'
            updatedAt: new Date().toISOString(),
            reviewHistory: [
              ...s.reviewHistory,
              {
                id: `ra${Date.now()}`,
                reviewerId: s.facultyId,
                reviewerName: s.facultyName,
                reviewerRole: 'faculty',
                action: 'forwarded',
                comment: 'Submitted for department head review',
                timestamp: new Date().toISOString(),
              }
            ]
          }
        : s
    ));
    
    // Notify department head
    const updatedSyllabus = { ...syllabus, status: 'under_review_dept_head' as SyllabusStatus };
    notifyDepartmentHead(updatedSyllabus);
  };

  // Approve syllabus and move to next stage
  const approveSyllabus = (id: string, userRole: UserRole, reviewerId: string, reviewerName: string, comment?: string) => {
    setSyllabi(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      let nextStatus: SyllabusStatus = s.status;
      let action: 'approved' | 'forwarded' = 'approved';
      let defaultComment = comment || `Approved by ${userRole}`;
      
      // Determine next status based on current status and user role
      // FIXED: Start from 'under_review_dept_head' instead of 'submitted'
      if (userRole === 'dept_head' && s.status === 'under_review_dept_head') {
        nextStatus = 'under_review_dean';
        action = 'forwarded';
        defaultComment = comment || 'Forwarded to Dean for review';
      } 
      else if (userRole === 'dean' && s.status === 'under_review_dean') {
        nextStatus = 'under_review_citl';
        action = 'forwarded';
        defaultComment = comment || 'Forwarded to CITL for review';
      }
      else if (userRole === 'citl' && s.status === 'under_review_citl') {
        nextStatus = 'under_review_vpaa';
        action = 'forwarded';
        defaultComment = comment || 'Forwarded to VPAA for final approval';
      }
      else if (userRole === 'vpaa' && s.status === 'under_review_vpaa') {
        nextStatus = 'approved';
        action = 'approved';
        defaultComment = comment || 'Final approval granted';
      } else {
        // If no status change, return early
        return s;
      }
      
      // Create notification for next reviewer or faculty
      let notificationTarget = s.facultyId;
      let notificationTitle = 'Syllabus Approved';
      let notificationMessage = `Your syllabus "${s.courseCode}" has been approved`;
      
      if (nextStatus === 'under_review_dean') {
        // Find Dean of the college
        const dean = allUsers.find(u => u.role === 'dean' && u.college === s.college && u.isApproved === true);
        if (dean) {
          notificationTarget = dean.id;
          notificationTitle = 'New Syllabus for Review';
          notificationMessage = `New syllabus "${s.courseCode}" from ${s.department} requires your review`;
          
          // Add notification for dean
          const newNotification: Notification = {
            id: `n${Date.now()}`,
            userId: dean.id,
            title: notificationTitle,
            message: notificationMessage,
            syllabusId: s.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      } 
      else if (nextStatus === 'under_review_citl') {
        const citl = allUsers.find(u => u.role === 'citl' && u.isApproved === true);
        if (citl) {
          notificationTarget = citl.id;
          notificationTitle = 'New Syllabus for Review';
          notificationMessage = `New syllabus "${s.courseCode}" from ${s.college} requires CITL review`;
          
          const newNotification: Notification = {
            id: `n${Date.now()}`,
            userId: citl.id,
            title: notificationTitle,
            message: notificationMessage,
            syllabusId: s.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      }
      else if (nextStatus === 'under_review_vpaa') {
        const vpaa = allUsers.find(u => u.role === 'vpaa' && u.isApproved === true);
        if (vpaa) {
          notificationTarget = vpaa.id;
          notificationTitle = 'New Syllabus for Final Approval';
          notificationMessage = `Syllabus "${s.courseCode}" requires VPAA final approval`;
          
          const newNotification: Notification = {
            id: `n${Date.now()}`,
            userId: vpaa.id,
            title: notificationTitle,
            message: notificationMessage,
            syllabusId: s.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      }
      else if (nextStatus === 'approved') {
        notificationTitle = 'Syllabus Fully Approved';
        notificationMessage = `Your syllabus "${s.courseCode}" has been fully approved and is ready for printing`;
        
        // Notify faculty of final approval
        const newNotification: Notification = {
          id: `n${Date.now()}`,
          userId: s.facultyId,
          title: notificationTitle,
          message: notificationMessage,
          syllabusId: s.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
      
      return {
        ...s,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        reviewHistory: [
          ...s.reviewHistory,
          {
            id: `ra${Date.now()}`,
            reviewerId,
            reviewerName,
            reviewerRole: userRole,
            action,
            comment: defaultComment,
            timestamp: new Date().toISOString(),
          }
        ]
      };
    }));
  };

  // Return syllabus for revisions
  const returnSyllabus = (id: string, userRole: UserRole, reviewerId: string, reviewerName: string, feedback: string) => {
    setSyllabi(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      return {
        ...s,
        status: 'returned',
        feedback,
        updatedAt: new Date().toISOString(),
        reviewHistory: [
          ...s.reviewHistory,
          {
            id: `ra${Date.now()}`,
            reviewerId,
            reviewerName,
            reviewerRole: userRole,
            action: 'returned',
            comment: feedback,
            timestamp: new Date().toISOString(),
          }
        ]
      };
    }));
    
    // Notify faculty
    const syllabus = syllabi.find(s => s.id === id);
    if (syllabus) {
      const newNotification: Notification = {
        id: `n${Date.now()}`,
        userId: syllabus.facultyId,
        title: 'Syllabus Returned for Revision',
        message: `Your syllabus "${syllabus.courseCode}" has been returned with feedback. Please review and resubmit.`,
        syllabusId: id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  // Legacy function for compatibility
  const updateSyllabusStatus = (id: string, status: SyllabusStatus, feedback?: string) => {
    setSyllabi(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status, feedback, updatedAt: new Date().toISOString() }
        : s
    ));
    
    // If status is under_review_dept_head, notify department head
    if (status === 'under_review_dept_head') {
      const syllabus = syllabi.find(s => s.id === id);
      if (syllabus) {
        notifyDepartmentHead({ ...syllabus, status });
      }
    }
  };

  // Legacy function for compatibility
  const addReviewAction = (syllabusId: string, action: Omit<ReviewAction, 'id' | 'timestamp'>) => {
    const newAction: ReviewAction = {
      ...action,
      id: `ra${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setSyllabi(prev => prev.map(s =>
      s.id === syllabusId
        ? { ...s, reviewHistory: [...s.reviewHistory, newAction] }
        : s
    ));
  };

  // Get syllabi based on user role
  const getSyllabiForRole = (userId: string, role: UserRole, college: string, department: string): Syllabus[] => {
    switch (role) {
      case 'admin':
        return syllabi;
      
      case 'faculty':
        return syllabi.filter(s => s.facultyId === userId);
      
      case 'dept_head':
        return syllabi.filter(s => 
          s.department === department && 
          (s.status === 'under_review_dept_head' || s.status === 'returned') // FIXED: removed 'submitted'
        );
      
      case 'dean':
        return syllabi.filter(s => 
          s.college === college && 
          (s.status === 'under_review_dean' || s.status === 'returned')
        );
      
      case 'citl':
        return syllabi.filter(s => 
          s.status === 'under_review_citl' || s.status === 'returned'
        );
      
      case 'vpaa':
        return syllabi.filter(s => 
          s.status === 'under_review_vpaa' || s.status === 'returned'
        );
      
      default:
        return [];
    }
  };

  const getNotificationsForUser = (userId: string): Notification[] => {
    return notifications.filter(n => n.userId === userId);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const approveUser = (userId: string) => {
    const user = pendingUsers.find(u => u.id === userId);
    if (user) {
      setAllUsers(prev => [...prev, { ...user, isApproved: true }]);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const rejectUser = (userId: string) => {
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>, password?: string) => {
    (async () => {
      try {
        const body = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: password || 'TempPass123!',
          role: user.role,
          college: user.college,
          department: user.department,
        };
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data?.success && data.user) {
          setAllUsers(prev => [...prev, mapServerUser(data.user)]);
        } else {
          const newUser: User = {
            ...user,
            id: `u${Date.now()}`,
            createdAt: new Date().toISOString().split('T')[0],
          };
          setAllUsers(prev => [...prev, newUser]);
        }
      } catch {
        const fallback: User = {
          ...user,
          id: `u${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setAllUsers(prev => [...prev, fallback]);
      }
    })();
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: updates.firstName,
            lastName: updates.lastName,
            role: updates.role,
            college: updates.college,
            department: updates.department,
            status: updates.status,
          }),
        });
        const data = await res.json();
        if (data?.success && data.user) {
          const mapped = mapServerUser(data.user);
          setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...mapped } : u)));
        } else {
          setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
        }
      } catch {
        setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
      }
    })();
  };

  const archiveUser = (userId: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' }),
        });
        const data = await res.json();
        if (data?.success && data.user) {
          const mapped = mapServerUser(data.user);
          setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...mapped } : u)));
        } else {
          setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: 'archived' } : u)));
        }
      } catch {
        setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: 'archived' } : u)));
      }
    })();
  };

  const unarchiveUser = (userId: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
        const data = await res.json();
        if (data?.success && data.user) {
          const mapped = mapServerUser(data.user);
          setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...mapped } : u)));
        } else {
          setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: 'active' } : u)));
        }
      } catch {
        setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: 'active' } : u)));
      }
    })();
  };

  return (
    <DataContext.Provider value={{
      syllabi,
      notifications,
      pendingUsers,
      allUsers,
      addSyllabus,
      submitSyllabus,
      approveSyllabus,
      returnSyllabus,
      updateSyllabusStatus,
      addReviewAction,
      getSyllabiForRole,
      getNotificationsForUser,
      markNotificationRead,
      approveUser,
      rejectUser,
      addUser,
      updateUser,
      archiveUser,
      unarchiveUser,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
