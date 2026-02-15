export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  department: 'Engineering' | 'Marketing' | 'Sales' | 'Product' | 'Design' | 'Leadership' | 'Operations' | 'People' | 'Partnerships' | 'Data' | 'Content Engineering' | 'Other';
  linkedinProfileUrl: string;
  avatarUrl: string;
  companyStartDate?: string;
  isActive: boolean;
}
