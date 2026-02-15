import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const provider = getDataProvider();

  if (id) {
    const employee = await provider.getEmployeeById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json(employee);
  }

  const employees = await provider.getEmployees();
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  // Only works when using PostgreSQL
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Employee management requires database connection' },
      { status: 400 },
    );
  }

  try {
    const { prisma } = await import('@/lib/db/prisma');
    const body = await request.json();
    const { linkedinUrl } = body as { linkedinUrl?: string };

    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Valid LinkedIn profile URL is required (must contain linkedin.com/in/)' },
        { status: 400 },
      );
    }

    const normalizedUrl = linkedinUrl.replace(/\/+$/, '').split('?')[0];

    // Check if already exists
    const existing = await prisma.employee.findUnique({
      where: { linkedinUrl: normalizedUrl },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Employee with this LinkedIn URL already exists', employee: existing },
        { status: 409 },
      );
    }

    // Extract name from URL slug as placeholder
    const slug = normalizedUrl.split('/in/')[1] ?? 'unknown';
    const nameParts = slug.split('-').filter(Boolean);
    const firstName = nameParts[0] ?? slug;
    const lastName = nameParts.slice(1).join(' ');

    const employee = await prisma.employee.create({
      data: {
        linkedinUrl: normalizedUrl,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        isActive: true,
        isManuallyAdded: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Employee POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 },
    );
  }
}
