'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Globe, Users, Link2, Wifi, WifiOff, Play, RefreshCw, Plus, Clock, Loader2, Search, UserCheck, MessageSquare, AtSign, DollarSign, ChevronRight, Trophy, Shield, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const isApifyConfigured = process.env.NEXT_PUBLIC_APIFY_CONFIGURED === 'true';

interface AppConfig {
  companyLinkedinUrl: string;
  companyName: string;
  scrapeEnabled: boolean;
  scrapeHistoryDays: number;
  mentionBonusMultiplier: number;
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
  const { data: advisors } = useSWR<EmployeeRecord[]>('/api/employees?role=advisor', fetcher);

  const [companyUrl, setCompanyUrl] = useState('');
  const [companyUrlInit, setCompanyUrlInit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newEmployeeUrl, setNewEmployeeUrl] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [addError, setAddError] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState<string | null>(null);
  const [mentionMultiplier, setMentionMultiplier] = useState(2.0);
  const [multiplierInit, setMultiplierInit] = useState(false);
  const [multiplierSaving, setMultiplierSaving] = useState(false);
  const [multiplierSaved, setMultiplierSaved] = useState(false);
  const [newAdvisorUrl, setNewAdvisorUrl] = useState('');
  const [addingAdvisor, setAddingAdvisor] = useState(false);
  const [advisorAddError, setAdvisorAddError] = useState('');
  const [removingAdvisor, setRemovingAdvisor] = useState<string | null>(null);

  // Initialize company URL from config
  if (config && !companyUrlInit) {
    setCompanyUrl(config.companyLinkedinUrl || '');
    setCompanyUrlInit(true);
  }

  // Initialize multiplier from config
  if (config && !multiplierInit) {
    setMentionMultiplier(config.mentionBonusMultiplier ?? 2.0);
    setMultiplierInit(true);
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

  const handleSaveMultiplier = useCallback(async () => {
    setMultiplierSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentionBonusMultiplier: mentionMultiplier }),
      });
      setMultiplierSaved(true);
      setTimeout(() => setMultiplierSaved(false), 2000);
    } finally {
      setMultiplierSaving(false);
    }
  }, [mentionMultiplier]);

  const handleTriggerScrape = useCallback(async (type: 'full' | 'discovery' | 'profiles' | 'posts' | 'mentions') => {
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

  const handleAddAdvisor = useCallback(async () => {
    if (!newAdvisorUrl.trim()) return;
    setAddingAdvisor(true);
    setAdvisorAddError('');
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl: newAdvisorUrl.trim(), role: 'advisor' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdvisorAddError(data.error || 'Failed to add advisor');
      } else {
        setNewAdvisorUrl('');
        await mutate('/api/employees?role=advisor');
      }
    } catch {
      setAdvisorAddError('Network error');
    } finally {
      setAddingAdvisor(false);
    }
  }, [newAdvisorUrl]);

  const handleRemoveAdvisor = useCallback(async (id: string) => {
    setRemovingAdvisor(id);
    try {
      await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      await mutate('/api/employees?role=advisor');
    } finally {
      setRemovingAdvisor(null);
    }
  }, []);

  const lastScrape = scrapeRuns?.[0];
  const isAnyScrapeRunning = scrapeRuns?.some((r) => r.status === 'RUNNING' || r.status === 'PENDING');

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Usage & Costs Link */}
      <Link href="/usage">
        <Card variant="interactive">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-linkify-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Usage & Costs</h3>
              <p className="text-sm text-neutral-400">View Apify, Neon, and Vercel spend for the last 30 days</p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </div>
        </Card>
      </Link>

      {/* Scoring */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Trophy className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Scoring</h3>
              <p className="text-sm text-neutral-400">Configure how leaderboard points are calculated</p>
            </div>
          </div>

          <div className="p-3 bg-elevated rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-300">Company mention bonus multiplier</label>
              <span className="text-sm font-semibold text-linkify-green">{mentionMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={mentionMultiplier}
              onChange={(e) => setMentionMultiplier(parseFloat(e.target.value))}
              className="w-full accent-linkify-green"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>1.0x (no bonus)</span>
              <span>5.0x</span>
            </div>
          </div>

          <div className="p-3 bg-elevated rounded-lg text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">Formula: </span>
            Points = (Likes &times;0.5 + Comments &times;2 + Shares &times;3){' '}
            {mentionMultiplier > 1 && (
              <span className="text-linkify-green">&times; {mentionMultiplier.toFixed(1)}x for company mentions</span>
            )}
          </div>

          <button
            onClick={handleSaveMultiplier}
            disabled={multiplierSaving}
            className="px-6 py-2.5 bg-linkify-green hover:bg-linkify-green-hover text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {multiplierSaved ? 'Saved!' : multiplierSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Card>

      {/* Company LinkedIn Page */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Globe className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Company LinkedIn Page</h3>
              <p className="text-sm text-neutral-400">The LinkedIn company page URL to track trending posts for</p>
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
          {config?.companyName && (
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Mention search query</label>
              <input
                type="text"
                value={config.companyName}
                readOnly
                className="w-full bg-elevated rounded-lg px-4 py-2.5 text-neutral-400 cursor-not-allowed outline-none text-sm"
              />
            </div>
          )}
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
                <button
                  onClick={() => handleTriggerScrape('mentions')}
                  disabled={!!scrapeLoading || isAnyScrapeRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-highlight text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {scrapeLoading === 'mentions' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AtSign className="w-4 h-4" />
                  )}
                  Search Mentions
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

      {/* Advisors */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linkify-green/10 rounded-lg">
              <Shield className="w-5 h-5 text-linkify-green" />
            </div>
            <div>
              <h3 className="font-semibold">Advisors</h3>
              <p className="text-sm text-neutral-400">
                {advisors ? `${advisors.length} advisors tracked` : 'Manage external advisors tracked by Linkify'}
              </p>
            </div>
          </div>

          {/* Add Advisor */}
          {isApifyConfigured && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={newAdvisorUrl}
                  onChange={(e) => { setNewAdvisorUrl(e.target.value); setAdvisorAddError(''); }}
                  placeholder="https://linkedin.com/in/advisor-name"
                  className="flex-1 bg-elevated rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-linkify-green transition-all text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAdvisor()}
                />
                <button
                  onClick={handleAddAdvisor}
                  disabled={addingAdvisor || !newAdvisorUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-linkify-green hover:bg-linkify-green-hover text-black font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {addingAdvisor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
              {advisorAddError && (
                <p className="text-sm text-red-400">{advisorAddError}</p>
              )}
            </div>
          )}

          {/* Advisor List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {advisors?.map((adv) => (
              <div key={adv.id} className="flex items-center gap-3 p-2 bg-elevated rounded-lg">
                {adv.avatarUrl ? (
                  <img
                    src={adv.avatarUrl}
                    alt={adv.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center text-xs font-semibold text-neutral-400">
                    {adv.fullName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{adv.fullName}</p>
                  <p className="text-xs text-neutral-500 truncate">{adv.jobTitle || 'No title'}</p>
                </div>
                {isApifyConfigured && (
                  <button
                    onClick={() => handleRemoveAdvisor(adv.id)}
                    disabled={removingAdvisor === adv.id}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Remove advisor"
                  >
                    {removingAdvisor === adv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
            {!advisors && (
              <div className="p-3 text-center text-sm text-neutral-500">Loading advisors...</div>
            )}
            {advisors?.length === 0 && (
              <div className="p-3 text-center text-sm text-neutral-500">No advisors yet</div>
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
