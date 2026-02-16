export interface Semester {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
}

const DEFAULT_SEMESTERS: Semester[] = [
  {
    id: '1',
    name: 'Spring 2024',
    code: '2024-SPRING',
    startDate: '2024-01-15',
    endDate: '2024-05-15',
    isActive: true,
    isCurrent: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Fall 2024',
    code: '2024-FALL',
    startDate: '2024-08-26',
    endDate: '2024-12-20',
    isActive: true,
    isCurrent: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Spring 2025',
    code: '2025-SPRING',
    startDate: '2025-01-13',
    endDate: '2025-05-16',
    isActive: true,
    isCurrent: false,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const STORAGE_KEY = 'syllabus_tracker_semesters';

export const semesterStorage = {
  getSemesters(): Semester[] {
    if (typeof window === 'undefined') return DEFAULT_SEMESTERS;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      this.setSemesters(DEFAULT_SEMESTERS);
      return DEFAULT_SEMESTERS;
    } catch (error) {
      console.error('Error loading semesters:', error);
      return DEFAULT_SEMESTERS;
    }
  },

  setSemesters(semesters: Semester[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(semesters));
    } catch (error) {
      console.error('Error saving semesters:', error);
    }
  },

  addSemester(semester: Omit<Semester, 'id' | 'createdAt'>): Semester {
    const semesters = this.getSemesters();
    const newSemester: Semester = {
      ...semester,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    if (newSemester.isCurrent) {
      semesters.forEach(s => s.isCurrent = false);
    }
    
    semesters.push(newSemester);
    this.setSemesters(semesters);
    return newSemester;
  },

  updateSemester(id: string, updates: Partial<Semester>): Semester | null {
    const semesters = this.getSemesters();
    const index = semesters.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    if (updates.isCurrent === true) {
      semesters.forEach(s => s.isCurrent = false);
    }
    
    semesters[index] = { ...semesters[index], ...updates };
    this.setSemesters(semesters);
    return semesters[index];
  },

  deleteSemester(id: string): boolean {
    const semesters = this.getSemesters();
    const filtered = semesters.filter(s => s.id !== id);
    
    if (filtered.length === 0) return false;
    
    this.setSemesters(filtered);
    return true;
  },

  getActiveSemesters(): Semester[] {
    const semesters = this.getSemesters();
    return semesters.filter(s => s.isActive);
  },

  getCurrentSemester(): Semester | undefined {
    const semesters = this.getSemesters();
    return semesters.find(s => s.isCurrent && s.isActive);
  },

  resetToDefaults(): void {
    this.setSemesters(DEFAULT_SEMESTERS);
  }
};