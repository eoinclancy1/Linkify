'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Globe, Users, Link2, Wifi, WifiOff, Play, RefreshCw, Plus, Clock, Loader2, Search, UserCheck, MessageSquare } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const isApifyConfigured = process.env.NEXT_PUBLIC_APIFY_CONFIGURED === 'true';

interface AppConfig {
  companyLinkedinUrl: string;
  companyName: string;
  scrapeEnabled: boolean;
  scrapeHistoryDays: number;
}

interface ScrapeRun {
  id: string;
  type: string;
  status: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  costUsd: number;
  startedAt: string;
  completedAt: string | null;
}

interface EmployeeRecord {
  id: string;
  fullName: string;
  jobTitle: string;
  avatarUrl: string;
  linkedinUrl?: string;
  linkedinProfileUrl?: string;
  lastScrapedAt?: string | null;
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

export default function SettingsPage() {
  const { data: config, isLoading: configLoading } = useSWR<AppConfig>(
    isApifyConfigured ? '/api/config' : null,
    fetcher,
  );
  const { data: scrapeRuns } = useSWR<ScrapeRun[]>(
    isApifyConfigured ? '/api/scrape/status' : null,
    fetcher,
    { refreshInterval: 5000 },
  );
  const { data: employees } = useSWR<EmployeeRecord[]>('/api/employees', fetcher);

  const [companyUrl, setCompanyUrl] = useState('');
  const [companyUrlInit, setCompanyUrlInit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newEmployeeUrl, setNewEmployeeUrl] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [addError, setAddError] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState<string | null>(null);

  // Initialize company URL from config
  if (config && !companyUrlInit) {
    setCompanyUrl(config.companyLinkedinUrl || '');
    setCompanyUrlInit(true);
  }

  const handleSaveConfig = useCallback(async () => {
    if (!isApifyConfigured) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyLinkedinUrl: companyUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [companyUrl]);

  const handleTriggerScrape = useCallback(async (type: 'full' | 'discovery' | 'profiles' | 'posts') => {
    setScrapeLoading(type);
    try {
      await fetch('/api/scrape/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      await mutate('/api/scrape/status');
    } finally {
      setScrapeLoading(null);
    }
  }, []);

  const handleAddEmployee = useCallback(async () => {
    if (!newEmployeeUrl.trim()) return;
    setAddingEmployee(true);
    setAddError('');
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl: newEmployeeUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add employee');
      } else {
        setNewEmployeeUrl('');
        await mutate('/api/employees');
      }
    } catch {
      setAddError('Network error');
    } finally {
      setAddingEmployee(false);
    }
  }, [newEmployeeUrl]);

  const lastScrape = scrapeRuns?.[0];
  const isAnyScrapeRunning = scrapeRuns?.some((r) => r.status === 'RUNNING' || r.status === 'PENDING');

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Company LinkedIn Page */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Globe className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Company LinkedIn Page</h3>
              <p className="text-sm text-neutral-400">The LinkedIn company page URL to track mentions for</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://linkedin.com/company/your-company"
              className="flex-1 bg-elevated rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-linkify-green transition-all"
            />
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 bg-linkify-green hover:bg-linkify-green-hover text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Card>

      {/* Apify Integration Status */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Link2 className="w-5 h-5 text-linkify-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Apify Integration Status</h3>
              <p className="text-sm text-neutral-400">LinkedIn data scraping via Apify</p>
            </div>
            {isApifyConfigured ? (
              <Badge variant="green">Connected</Badge>
            ) : (
              <Badge variant="orange">Not Connected</Badge>
            )}
          </div>

          {isApifyConfigured ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                <Wifi className="w-5 h-5 text-linkify-green" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-300">Apify integration active</p>
                  {lastScrape && (
                    <p className="text-xs text-neutral-500">
                      Last scrape: {new Date(lastScrape.startedAt).toLocaleString()} - {lastScrape.status}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleTriggerScrape('full')}
                  disabled={!!scrapeLoading || isAnyScrapeRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-linkify-green hover:bg-linkify-green-hover text-black font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {scrapeLoading === 'full' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Full Sync
                </button>
                <button
                  onClick={() => handleTriggerScrape('discovery')}
                  disabled={!!scrapeLoading || isAnyScrapeRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-highlight text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {scrapeLoading === 'discovery' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Discover Employees
                </button>
                <button
                  onClick={() => handleTriggerScrape('profiles')}
                  disabled={!!scrapeLoading || isAnyScrapeRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-highlight text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {scrapeLoading === 'profiles' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  Update Profiles
                </button>
                <button
                  onClick={() => handleTriggerScrape('posts')}
                  disabled={!!scrapeLoading || isAnyScrapeRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-highlight text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {scrapeLoading === 'posts' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Update Posts
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
              <WifiOff className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-sm text-neutral-300">Using mock data</p>
                <p className="text-xs text-neutral-500">
                  Set APIFY_TOKEN and NEXT_PUBLIC_APIFY_CONFIGURED=true to enable live data
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Employee Roster */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Users className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Employee Roster</h3>
              <p className="text-sm text-neutral-400">
                {employees ? `${employees.length} employees tracked` : 'Manage employees tracked by Linkify'}
              </p>
            </div>
          </div>

          {/* Add Employee */}
          {isApifyConfigured && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={newEmployeeUrl}
                  onChange={(e) => { setNewEmployeeUrl(e.target.value); setAddError(''); }}
                  placeholder="https://linkedin.com/in/employee-name"
                  className="flex-1 bg-elevated rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-linkify-green transition-all text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEmployee()}
                />
                <button
                  onClick={handleAddEmployee}
                  disabled={addingEmployee || !newEmployeeUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-linkify-green hover:bg-linkify-green-hover text-black font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {addingEmployee ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
              {addError && (
                <p className="text-sm text-red-400">{addError}</p>
              )}
            </div>
          )}

          {/* Employee List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {employees?.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-2 bg-elevated rounded-lg">
                {emp.avatarUrl ? (
                  <img
                    src={emp.avatarUrl}
                    alt={emp.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center text-xs font-semibold text-neutral-400">
                    {emp.fullName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.fullName}</p>
                  <p className="text-xs text-neutral-500 truncate">{emp.jobTitle || 'No title'}</p>
                </div>
                {emp.lastScrapedAt && (
                  <span className="text-xs text-neutral-500">
                    Scraped {new Date(emp.lastScrapedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
            {!employees && (
              <div className="p-3 text-center text-sm text-neutral-500">Loading employees...</div>
            )}
            {employees?.length === 0 && (
              <div className="p-3 text-center text-sm text-neutral-500">No employees yet</div>
            )}
          </div>
        </div>
      </Card>

      {/* Scrape History */}
      {isApifyConfigured && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linkify-green/10 rounded-lg">
                <Clock className="w-5 h-5 text-linkify-green" />
              </div>
              <div>
                <h3 className="font-semibold">Scrape History</h3>
                <p className="text-sm text-neutral-400">Recent scrape operations</p>
              </div>
            </div>

            <div className="space-y-2">
              {scrapeRuns?.map((run) => (
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
                      {run.itemsUpdated > 0 && ` · ${run.itemsUpdated} updated`}
                      {run.costUsd > 0 && ` · $${run.costUsd.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              ))}
              {(!scrapeRuns || scrapeRuns.length === 0) && (
                <div className="p-3 text-center text-sm text-neutral-500">No scrape history yet</div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
