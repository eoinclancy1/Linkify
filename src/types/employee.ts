export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  department: 'Engineering' | 'Marketing' | 'Sales' | 'Product' | 'Design' | 'Other';
  linkedinProfileUrl: string;
  avatarUrl: string;
  isActive: boolean;
}
