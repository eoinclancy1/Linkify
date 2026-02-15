'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { DollarSign, ArrowLeft, Database, Cloud, Zap, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ScrapeRun {
  id: string;
  type: string;
  status: string;
  itemsProcessed: number;
  itemsCreated: number;
  costUsd: number;
  startedAt: string;
  completedAt: string | null;
}

interface UsageData {
  apify: {
    totalUsd: number;
    byType: Record<string, number>;
    runs: ScrapeRun[];
  };
  neon: {
    configured: boolean;
    totalUsd: number;
    computeHours?: number;
    computeUsd?: number;
    storageGb?: number;
    storageUsd?: number;
  };
  vercel: {
    totalUsd: number;
  };
  totalUsd: number;
}

function StatusBadge({ status }: { status: string }) {
  const variant = {
    COMPLETED: 'green' as const,
    RUNNING: 'blue' as const,
    PENDING: 'orange' as const,
    FAILED: 'red' as const,
    PARTIAL: 'orange' as const,
  }[status] ?? 'neutral' as const;

  return <Badge variant={variant}>{status}</Badge>;
}

function formatScrapeType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export default function UsagePage() {
  const { data: usage, isLoading } = useSWR<UsageData>('/api/usage', fetcher);

  const [vercelCost, setVercelCost] = useState('');
  const [vercelInit, setVercelInit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (usage && !vercelInit) {
    setVercelCost(usage.vercel.totalUsd > 0 ? usage.vercel.totalUsd.toString() : '');
    setVercelInit(true);
  }

  const handleSaveVercelCost = useCallback(async () => {
    const value = parseFloat(vercelCost) || 0;
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercelMonthlyCostUsd: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [vercelCost]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold">Usage & Costs</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2 rounded-lg bg-elevated hover:bg-highlight transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-400" />
        </Link>
        <h1 className="text-2xl font-bold">Usage & Costs</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total (30d)"
          value={formatCost(usage?.totalUsd ?? 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Apify (30d)"
          value={formatCost(usage?.apify.totalUsd ?? 0)}
          icon={Zap}
        />
        <StatCard
          title="Neon (30d)"
          value={usage?.neon.configured ? formatCost(usage.neon.totalUsd) : 'N/A'}
          icon={Database}
        />
        <StatCard
          title="Vercel (30d)"
          value={formatCost(usage?.vercel.totalUsd ?? 0)}
          icon={Cloud}
        />
      </div>

      {/* Apify — Scrape Cost History */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Zap className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Apify Scrape Costs</h3>
              <p className="text-sm text-neutral-400">Cost per scrape operation (last 30 days)</p>
            </div>
          </div>

          {/* By type breakdown */}
          {usage?.apify.byType && Object.keys(usage.apify.byType).length > 0 && (
            <div className="flex gap-4 flex-wrap">
              {Object.entries(usage.apify.byType).map(([type, cost]) => (
                <div key={type} className="bg-elevated rounded-lg px-4 py-2">
                  <p className="text-xs text-neutral-400">{formatScrapeType(type)}</p>
                  <p className="text-sm font-semibold text-white">{formatCost(cost)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Runs table */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {usage?.apify.runs.map((run) => (
              <div key={run.id} className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatScrapeType(run.type)}</p>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-xs text-neutral-500">
                    {new Date(run.startedAt).toLocaleString()}
                    {run.itemsProcessed > 0 && ` · ${run.itemsProcessed} processed`}
                    {run.itemsCreated > 0 && ` · ${run.itemsCreated} created`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {run.costUsd > 0 ? formatCost(run.costUsd) : '—'}
                </span>
              </div>
            ))}
            {(!usage?.apify.runs || usage.apify.runs.length === 0) && (
              <p className="text-sm text-neutral-500 text-center p-3">No scrape runs in the last 30 days</p>
            )}
          </div>
        </div>
      </Card>

      {/* Neon Breakdown */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Database className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Neon Database</h3>
              <p className="text-sm text-neutral-400">PostgreSQL usage (last 30 days)</p>
            </div>
          </div>

          {usage?.neon.configured ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-elevated rounded-lg p-4">
                <p className="text-xs text-neutral-400">Compute</p>
                <p className="text-lg font-semibold text-white">{usage.neon.computeHours ?? 0}h</p>
                <p className="text-xs text-neutral-500">{formatCost(usage.neon.computeUsd ?? 0)}</p>
              </div>
              <div className="bg-elevated rounded-lg p-4">
                <p className="text-xs text-neutral-400">Storage</p>
                <p className="text-lg font-semibold text-white">{usage.neon.storageGb ?? 0} GB</p>
                <p className="text-xs text-neutral-500">{formatCost(usage.neon.storageUsd ?? 0)}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-elevated rounded-lg">
              <p className="text-sm text-neutral-400">
                Add <code className="text-neutral-300 bg-highlight px-1 rounded">NEON_API_KEY</code> and{' '}
                <code className="text-neutral-300 bg-highlight px-1 rounded">NEON_PROJECT_ID</code> environment variables to enable Neon cost tracking.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Vercel Cost (manual entry) */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Cloud className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Vercel Hosting</h3>
              <p className="text-sm text-neutral-400">Monthly cost (manual entry — Vercel has no billing API)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vercelCost}
                onChange={(e) => setVercelCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-elevated rounded-lg pl-7 pr-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-linkify-green transition-all"
              />
            </div>
            <button
              onClick={handleSaveVercelCost}
              disabled={saving}
              className="px-6 py-2.5 bg-linkify-green hover:bg-linkify-green-hover text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saved ? 'Saved!' : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
