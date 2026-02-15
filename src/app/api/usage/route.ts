import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Neon pricing rates (as of 2025)
const NEON_COMPUTE_PER_HOUR = 0.106; // $/CU-hour
const NEON_STORAGE_PER_GB_MONTH = 0.35; // $/GB-month

interface NeonPeriod {
  period_id: string;
  consumption: Array<{
    project_id: string;
    compute_time_seconds: number;
    synthetic_storage_size_bytes: number;
    active_time_seconds: number;
    written_data_bytes: number;
    data_transfer_bytes: number;
  }>;
}

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── Apify costs (from ScrapeRun table) ──
    const scrapeRuns = await prisma.scrapeRun.findMany({
      where: { startedAt: { gte: thirtyDaysAgo } },
      orderBy: { startedAt: 'desc' },
    });

    const apifyTotal = scrapeRuns.reduce((sum, r) => sum + r.costUsd, 0);

    const apifyByType: Record<string, number> = {};
    for (const run of scrapeRuns) {
      apifyByType[run.type] = (apifyByType[run.type] ?? 0) + run.costUsd;
    }

    // ── Neon costs (from consumption API) ──
    const neonApiKey = process.env.NEON_API_KEY;
    const neonProjectId = process.env.NEON_PROJECT_ID;
    let neon: {
      configured: boolean;
      totalUsd: number;
      computeHours?: number;
      computeUsd?: number;
      storageGb?: number;
      storageUsd?: number;
    } = { configured: false, totalUsd: 0 };

    if (neonApiKey && neonProjectId) {
      try {
        const from = thirtyDaysAgo.toISOString();
        const to = new Date().toISOString();
        const url = `https://console.neon.tech/api/v2/consumption_history/projects?project_ids=${neonProjectId}&from=${from}&to=${to}&granularity=daily`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${neonApiKey}` },
          next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (res.ok) {
          const data = await res.json();
          let totalComputeSeconds = 0;
          let totalStorageBytes = 0;

          // Sum across all periods
          const periods: NeonPeriod[] = data.periods ?? [];
          for (const period of periods) {
            for (const c of period.consumption ?? []) {
              totalComputeSeconds += c.compute_time_seconds ?? 0;
              totalStorageBytes = Math.max(totalStorageBytes, c.synthetic_storage_size_bytes ?? 0);
            }
          }

          const computeHours = totalComputeSeconds / 3600;
          const storageGb = totalStorageBytes / (1024 * 1024 * 1024);
          const computeUsd = computeHours * NEON_COMPUTE_PER_HOUR;
          const storageUsd = storageGb * NEON_STORAGE_PER_GB_MONTH;

          neon = {
            configured: true,
            totalUsd: computeUsd + storageUsd,
            computeHours: Math.round(computeHours * 100) / 100,
            computeUsd: Math.round(computeUsd * 100) / 100,
            storageGb: Math.round(storageGb * 100) / 100,
            storageUsd: Math.round(storageUsd * 100) / 100,
          };
        }
      } catch (err) {
        console.error('Neon API error:', err);
        neon = { configured: true, totalUsd: 0 };
      }
    }

    // ── Vercel costs (manual entry from AppConfig) ──
    const config = await prisma.appConfig.findUnique({ where: { id: 'singleton' } });
    const vercelUsd = config?.vercelMonthlyCostUsd ?? 0;

    // ── Response ──
    return NextResponse.json({
      apify: {
        totalUsd: Math.round(apifyTotal * 100) / 100,
        byType: apifyByType,
        runs: scrapeRuns.map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          itemsProcessed: r.itemsProcessed,
          itemsCreated: r.itemsCreated,
          costUsd: r.costUsd,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
        })),
      },
      neon,
      vercel: {
        totalUsd: vercelUsd,
      },
      totalUsd: Math.round((apifyTotal + neon.totalUsd + vercelUsd) * 100) / 100,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 },
    );
  }
}
