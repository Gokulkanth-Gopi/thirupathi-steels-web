'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import {
  Settings,
  Database,
  Scale,
  ShieldCheck,
  Users,
  Server,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Lock,
  Layers,
  Building2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function loadSystemStats() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setCurrentUser(json.currentUser);
      }
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSystemStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleBackupDownload() {
    try {
      setExporting(true);
      const [lotsRes, billsRes, movementsRes] = await Promise.all([
        fetch('/api/stock', { cache: 'no-store' }),
        fetch('/api/admin/bills', { cache: 'no-store' }),
        fetch('/api/admin/movements', { cache: 'no-store' }),
      ]);

      const [lotsJson, billsJson, movementsJson] = await Promise.all([
        lotsRes.json(),
        billsRes.json(),
        movementsRes.json(),
      ]);

      const backupData = {
        meta: {
          app: 'Thirupathi Steels Yard Management System',
          exportTimestamp: new Date().toISOString(),
          database: 'thirupathi_steels',
          version: '1.0.0',
        },
        stockLots: lotsJson.data || [],
        bills: billsJson.data || [],
        movements: movementsJson.data || [],
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `thirupathi_steels_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Backup failed:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <SaasAdminLayout>
      <div className="space-y-6 animate-saas-in pb-16 max-w-5xl">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                System Diagnostics
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Yard & Database Settings
            </h1>
            <p className="text-xs text-steel-500 mt-0.5">
              Authoritative PostgreSQL 18 health metrics, physical weighbridge gate sensors, and staff credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackupDownload}
              disabled={exporting}
              className="bg-white cursor-pointer hover:border-emerald-600"
            >
              <Download className="w-4 h-4 mr-1.5 text-steel-600" />
              <span>{exporting ? 'Exporting...' : 'Export Snapshot'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemStats}
              className="bg-white cursor-pointer hover:border-emerald-600"
              title="Refresh stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Database Health Card */}
        <div className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-steel-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-[#111827]">
                  PostgreSQL 18 Database Engine
                </h2>
                <p className="text-xs text-steel-500">
                  Localhost cluster • Port 5432 • Sole authoritative data store
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE & HEALTHY
            </span>
          </div>

          {/* Table Counts Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#f8fafc] border border-steel-100">
              <div className="text-[10px] font-mono font-bold text-steel-400 uppercase">
                Stock Lots
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {stats?.tables?.stock_lots ?? '...'}
              </div>
              <div className="text-[10px] text-steel-500 mt-0.5">Physical lots in yard</div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8fafc] border border-steel-100">
              <div className="text-[10px] font-mono font-bold text-steel-400 uppercase">
                Movement Audits
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {stats?.tables?.stock_movements ?? '...'}
              </div>
              <div className="text-[10px] text-steel-500 mt-0.5">Immutable audit events</div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8fafc] border border-steel-100">
              <div className="text-[10px] font-mono font-bold text-steel-400 uppercase">
                Inward Bills
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {stats?.tables?.bills ?? '...'}
              </div>
              <div className="text-[10px] text-steel-500 mt-0.5">Verified supplier bills</div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8fafc] border border-steel-100">
              <div className="text-[10px] font-mono font-bold text-steel-400 uppercase">
                Total Yard Weight
              </div>
              <div className="text-2xl font-extrabold text-emerald-800 font-mono mt-1">
                {stats?.totalTonnageMt ? `${stats.totalTonnageMt} MT` : '...'}
              </div>
              <div className="text-[10px] text-steel-500 mt-0.5">
                {stats?.totalKg ? `${stats.totalKg.toLocaleString()} kg` : '...'}
              </div>
            </div>
          </div>
        </div>

        {/* Yard Physical Parameters */}
        <div className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-steel-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#111827]">
                Salem Yard Operational Rules
              </h2>
              <p className="text-xs text-steel-500">
                Authoritative parameters enforced across the web portal and inventory API.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-steel-100 gap-2">
              <div>
                <span className="font-bold text-slate-900">Yard Physical Location:</span>
                <p className="text-[11px] text-steel-500 mt-0.5">Thirupathi Steels, Salem, Tamil Nadu, India</p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-steel-200">
                Salem Main Yard
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-steel-100 gap-2">
              <div>
                <span className="font-bold text-slate-900">Authoritative Unit of Storage:</span>
                <p className="text-[11px] text-steel-500 mt-0.5">
                  Stored strictly in Kilograms with NUMERIC(14, 3) precision. Formatted as MT (kg / 1,000) for invoicing.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Kilograms (kg)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-steel-100 gap-2">
              <div>
                <span className="font-bold text-slate-900">Stock Status Thresholds:</span>
                <p className="text-[11px] text-steel-500 mt-0.5">
                  &bull; Out of stock: &le; 0 kg &nbsp;|&nbsp; &bull; Low stock: 0 &lt; qty &le; 1,500 kg &nbsp;|&nbsp; &bull; In stock: &gt; 1,500 kg
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                &le; 1,500 kg Alert
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-steel-100 gap-2">
              <div>
                <span className="font-bold text-slate-900">Approved TMT Rebar Brands (5 Only):</span>
                <p className="text-[11px] text-steel-500 mt-0.5">
                  TATA TISCON, SURYADEV, AGNI, SSI TMT, JPR (Chakraa)
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-steel-200">
                Strict Whitelist
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-steel-100 gap-2">
              <div>
                <span className="font-bold text-slate-900">Supported Diameters (6 Only):</span>
                <p className="text-[11px] text-steel-500 mt-0.5">
                  8 mm, 10 mm, 12 mm, 16 mm, 20 mm, 25 mm
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-steel-200">
                8mm – 25mm
              </span>
            </div>
          </div>
        </div>

        {/* Authorized Staff Accounts */}
        <div className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-steel-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#111827]">
                Authorized Yard Staff Accounts
              </h2>
              <p className="text-xs text-steel-500">
                HMAC-SHA256 signed session tokens with PBKDF2 password authentication.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                  SY
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Salem Yard Administrator</div>
                  <div className="text-[11px] text-steel-500 font-mono">admin@thirupathisteels.com</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ROLE: ADMIN
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                  YM
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Salem Yard Dispatch Manager</div>
                  <div className="text-[11px] text-steel-500 font-mono">yardmanager@thirupathisteels.com</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                ROLE: YARD_MANAGER
              </span>
            </div>
          </div>
        </div>
      </div>
    </SaasAdminLayout>
  );
}

