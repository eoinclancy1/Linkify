import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDataProvider } from '@/lib/data/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const role = searchParams.get('role');
  const provider = getDataProvider();

  if (id) {
    const employee = await provider.getEmployeeById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json(employee);
  }

  // Return advisors when ?role=advisor
  if (role === 'advisor') {
    const advisors = await provider.getAdvisors();
    return NextResponse.json(advisors);
  }

  const department = searchParams.get('department');
  let employees = await provider.getEmployees();

  if (department) {
    employees = employees.filter(e => e.department === department);
  } else {
    // By default, exclude Content Engineering from the main list
    employees = employees.filter(e => e.department !== 'Content Engineering');
  }

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
    const { linkedinUrl, role } = body as { linkedinUrl?: string; role?: string };

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

    const prismaRole = role === 'advisor' ? 'ADVISOR' : 'EMPLOYEE';

    const employee = await prisma.employee.create({
      data: {
        linkedinUrl: normalizedUrl,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        isActive: true,
        isManuallyAdded: true,
        role: prismaRole,
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

export async function DELETE(request: NextRequest) {
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Employee management requires database connection' },
      { status: 400 },
    );
  }

  try {
    const { prisma } = await import('@/lib/db/prisma');
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Deactivate rather than hard delete to preserve post history
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employee DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove employee' },
      { status: 500 },
    );
  }
}
