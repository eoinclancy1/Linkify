import type { Employee } from '@/types';

/**
 * Mulberry32 seeded PRNG - deterministic random number generator.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'James', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia',
  'Henry', 'Harper', 'Alexander', 'Evelyn', 'Sebastian', 'Aria', 'Jack',
  'Chloe', 'Daniel', 'Penelope', 'Matthew', 'Layla', 'Owen', 'Riley',
  'Samuel', 'Zoey', 'David', 'Nora', 'Joseph', 'Lily', 'Carter',
  'Eleanor', 'Wyatt', 'Hannah', 'John',
];

const lastNames = [
  'Chen', 'Rodriguez', 'Patel', 'Kim', 'O\'Brien', 'Nakamura', 'Singh',
  'Mueller', 'Santos', 'Johansson', 'Williams', 'Brown', 'Garcia',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Lee', 'Clark', 'Lewis', 'Walker',
  'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green',
  'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell',
];

const departments: Employee['department'][] = [
  'Engineering', 'Marketing', 'Sales', 'Product', 'Design',
];

// ~12 Engineering, ~8 Marketing, ~8 Sales, ~6 Product, ~6 Design
const departmentDistribution: Employee['department'][] = [
  ...Array(12).fill('Engineering'),
  ...Array(8).fill('Marketing'),
  ...Array(8).fill('Sales'),
  ...Array(6).fill('Product'),
  ...Array(6).fill('Design'),
];

const jobTitlesByDepartment: Record<Employee['department'], string[]> = {
  Engineering: [
    'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
    'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
    'Engineering Manager', 'Full Stack Developer', 'Platform Engineer',
    'Mobile Developer', 'QA Engineer', 'Site Reliability Engineer',
  ],
  Marketing: [
    'Marketing Manager', 'Content Strategist', 'SEO Specialist',
    'Growth Marketing Lead', 'Brand Manager', 'Social Media Manager',
    'Marketing Analyst', 'Campaign Manager',
  ],
  Sales: [
    'Account Executive', 'Sales Development Rep', 'Enterprise Sales Lead',
    'Sales Manager', 'Business Development Rep', 'Solutions Consultant',
    'Regional Sales Director', 'Sales Engineer',
  ],
  Product: [
    'Product Manager', 'Senior Product Manager', 'Product Analyst',
    'Technical Product Manager', 'Product Owner', 'VP of Product',
  ],
  Design: [
    'UX Designer', 'UI Designer', 'Senior Product Designer',
    'Design Lead', 'UX Researcher', 'Visual Designer',
  ],
  Leadership: [
    'CEO', 'Co-founder', 'CTO', 'VP of Engineering',
  ],
  Operations: [
    'Operations Manager', 'Chief of Staff', 'Finance Lead',
    'Strategy & Expansion', 'RevOps Manager',
  ],
  People: [
    'Head of Talent Acquisition', 'HR Manager', 'Recruiter',
  ],
  Partnerships: [
    'VP of Partnerships', 'Channel Manager', 'Alliances Lead',
  ],
  Data: [
    'Data Analyst', 'Analytics Engineer', 'BI Developer',
  ],
  'Content Engineering': [
    'Growth Advisor', 'Content Consultant', 'Fractional CMO',
  ],
  Other: [
    'Office Manager', 'Executive Assistant', 'General Manager',
  ],
};

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const shuffledFirstNames = shuffleArray(firstNames);
const shuffledLastNames = shuffleArray(lastNames);
const shuffledDepartments = shuffleArray(departmentDistribution);

export const seedEmployees: Employee[] = Array.from({ length: 40 }, (_, i) => {
  const firstName = shuffledFirstNames[i];
  const lastName = shuffledLastNames[i];
  const department = shuffledDepartments[i];
  const titles = jobTitlesByDepartment[department];
  const jobTitle = titles[Math.floor(rand() * titles.length)];
  const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase().replace(/'/g, '')}`;

  // Deterministic start date: between 6 and 36 months ago
  const monthsAgo = 6 + Math.floor(rand() * 30);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsAgo);
  startDate.setDate(1);

  return {
    id: `emp-${String(i + 1).padStart(3, '0')}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    jobTitle,
    department,
    linkedinProfileUrl: `https://linkedin.com/in/${slug}`,
    avatarUrl: `https://i.pravatar.cc/300?u=${slug}`,
    companyStartDate: startDate.toISOString(),
    isActive: rand() > 0.05, // ~95% active
  };
});
