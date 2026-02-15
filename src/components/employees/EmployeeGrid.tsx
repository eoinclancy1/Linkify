'use client';

import EmployeeCard from '@/components/employees/EmployeeCard';

interface EmployeeData {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
  streak: number;
  isStreakActive: boolean;
  recentWeeks: number[];
}

interface EmployeeGridProps {
  employees: EmployeeData[];
}

export default function EmployeeGrid({ employees }: EmployeeGridProps) {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <p className="text-lg font-medium">No employees found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} {...employee} />
      ))}
    </div>
  );
}
