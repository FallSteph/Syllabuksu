export type UserRole = 'admin' | 'faculty' | 'dept_head' | 'dean' | 'citl' | 'vpaa';

export type SyllabusStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review_dept_head'
  | 'under_review_dean'
  | 'under_review_citl'
  | 'under_review_vpaa'
  | 'approved'
  | 'returned';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  college: string;
  department: string;
  isApproved: boolean;
  createdAt: string;
  notificationsEnabled: boolean;
}

export interface Syllabus {
  id: string;
  courseCode: string;
  courseTitle: string;
  semesterPeriod: string;
  college: string;
  department: string;
  facultyId: string;
  facultyName: string;
  fileName: string;
  status: SyllabusStatus;
  createdAt: string;
  updatedAt: string;
  feedback?: string;
  reviewHistory: ReviewAction[];
  // ADDED: Form links
  form17Link?: string;
  form18Link?: string;
  // ADDED: AI analysis
  aiAnalysis?: {
    score: number;
    suggestions: any[];
    appliedSuggestions: boolean;
  };
}

export interface ReviewAction {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  action: 'approved' | 'returned' | 'forwarded';
  comment?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  syllabusId?: string;
  isRead: boolean;
  createdAt: string;
}

export const COLLEGES = [
  'College of Arts and Sciences',
  'College of Business',
  'College of Education',
  'College of Nursing',
  'College of Law',
  'College of Technologies',
  'College of Public Administration & Governance',
] as const;

export const DEPARTMENTS: Record<string, string[]> = {
  'College of Arts and Sciences': [
    'Department of Biology',
    'Department of Chemistry',
    'Department of English',
    'Department of Filipino',
    'Department of Mathematics',
    'Department of Physics',
    'Department of Psychology',
    'Department of Social Sciences',
  ],
  'College of Business': [
    'Department of Accountancy',
    'Department of Business Administration',
    'Department of Economics',
    'Department of Marketing',
    'Department of Finance',
  ],
  'College of Education': [
    'Department of Elementary Education',
    'Department of Secondary Education',
    'Department of Special Education',
    'Department of Physical Education',
  ],
  'College of Nursing': [
    'Department of Nursing',
    'Department of Midwifery',
  ],
  'College of Law': [
    'Department of Law',
    'Department of Legal Studies',
  ],
  'College of Technologies': [
    'Department of Computer Science',
    'Department of Information Technology',
    'Department of Engineering',
    'Department of Industrial Technology',
  ],
  'College of Public Administration & Governance': [
    'Department of Public Administration',
    'Department of Governance',
    'Department of Political Science',
  ],
};

export const SEMESTERS = [
  '1st Semester 2024-2025',
  '2nd Semester 2024-2025',
  'Summer 2025',
  '1st Semester 2025-2026',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  faculty: 'Faculty',
  dept_head: 'Dept. Head',
  dean: 'Dean',
  citl: 'CITL',
  vpaa: 'VPAA',
};

export const STATUS_LABELS: Record<SyllabusStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review_dept_head: 'Under Review by Dept Head',
  under_review_dean: 'Under Review by Dean',
  under_review_citl: 'Under Review by CITL',
  under_review_vpaa: 'Under Review by VPAA',
  approved: 'Approved',
  returned: 'Returned for Revision',
};

export const STATUS_COLORS: Record<SyllabusStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-info/10 text-info',
  under_review_dept_head: 'bg-warning/10 text-warning',
  under_review_dean: 'bg-warning/10 text-warning',
  under_review_citl: 'bg-warning/10 text-warning',
  under_review_vpaa: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  returned: 'bg-destructive/10 text-destructive',
};