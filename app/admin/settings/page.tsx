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
  Pencil,
  X,
  Phone,
  Clock,
  MapPin,
  AlertTriangle,
  Warehouse,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface YardSettingsData {
  yard_name: string;
  yard_location: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  gstin: string;
  operating_hours: string;
  low_stock_threshold_kg: number;
  unit_of_storage: string;
  weighbridge_gate: string;
  weighbridge_status: string;
  dispatch_notes: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Yard Settings state
  const [settings, setSettings] = useState<YardSettingsData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<YardSettingsData>({
    yard_name: 'Thirupathi Steels',
    yard_location: 'T.S. No: 153/3-A, Chennai Bye Pass Road, Seelanaickenpatti, Salem – 636 201, Tamil Nadu',
    phone_primary: '+91 90034 61089',
    phone_secondary: '+91 95973 90271',
    whatsapp_number: '919003461089',
    gstin: '33AAHFT1872C1ZF',
    operating_hours: 'Monday – Saturday: 8:30 AM – 7:30 PM (Sunday: On-Call)',
    low_stock_threshold_kg: 1500,
    unit_of_storage: 'Kilograms (kg)',
    weighbridge_gate: 'Gate 1 (Electronic Computerized Weighbridge)',
    weighbridge_status: 'Calibrated & Operational',
    dispatch_notes: 'Direct arterial highway access along Chennai Bye Pass for trailer flatbeds with instant computerized tare/gross printouts.',
  });

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
      ]);

      if (statsRes.status === 401 || settingsRes.status === 401) {
        router.push('/admin/login');
        return;
      }

      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats(statsJson.data);
        setCurrentUser(statsJson.currentUser);
      }

      const settingsJson = await settingsRes.json();
      if (settingsJson.success && settingsJson.data) {
        setSettings(settingsJson.data);
        setFormData(settingsJson.data);
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function handleOpenEdit() {
    if (settings) {
      setFormData(settings);
    }
    setSettingsError(null);
    setEditModalOpen(true);
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsError(null);

    if (!formData.yard_name.trim()) {
      setSettingsError('Yard facility name is required.');
      return;
    }
    if (!formData.yard_location.trim()) {
      setSettingsError('Physical address is required.');
      return;
    }
    if (!formData.phone_primary.trim()) {
      setSettingsError('Primary dispatch phone is required.');
      return;
    }
    if (Number(formData.low_stock_threshold_kg) <= 0) {
      setSettingsError('Low stock threshold must be a positive number in kg.');
      return;
    }

    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setSettingsError(json.error || 'Failed to update yard settings.');
        return;
      }

      setSettings(json.data);
      setEditModalOpen(false);
      showToast('success', 'Yard settings updated successfully in PostgreSQL.');
    } catch (err: any) {
      setSettingsError(err?.message || 'Network error saving settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleBackupDownload() {
    try {
      setExporting(true);
      const [lotsRes, billsRes, movementsRes, baysRes] = await Promise.all([
        fetch('/api/stock', { cache: 'no-store' }),
        fetch('/api/admin/bills', { cache: 'no-store' }),
        fetch('/api/admin/movements', { cache: 'no-store' }),
        fetch('/api/admin/bays', { cache: 'no-store' }),
      ]);

      const [lotsJson, billsJson, movementsJson, baysJson] = await Promise.all([
        lotsRes.json(),
        billsRes.json(),
        movementsRes.json(),
        baysRes.json(),
      ]);

      const backupData = {
        meta: {
          app: 'Thirupathi Steels Yard Management System',
          exportTimestamp: new Date().toISOString(),
          database: 'thirupathi_steels',
          version: '1.0.0',
        },
        yardSettings: settings,
        yardBays: baysJson.data?.bays || [],
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

  const activeSettings = settings || formData;

  return (
    <SaasAdminLayout>
      <div className="space-y-6 animate-saas-in pb-16 max-w-5xl">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                System Diagnostics & Settings
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Yard & Database Settings
            </h1>
            <p className="text-xs text-steel-500 mt-0.5">
              Authoritative PostgreSQL 18 parameters, editable yard physical rules, and weighbridge gate calibration.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              onClick={loadData}
              className="bg-white cursor-pointer hover:border-emerald-600"
              title="Refresh settings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Database Health Card */}
        <div className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-steel-100 flex-wrap gap-3">
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
                Yard Bays
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {stats?.tables?.yard_bays ?? '...'}
              </div>
              <div className="text-[10px] text-steel-500 mt-0.5">Active stacking berths</div>
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

        {/* Yard Physical Parameters - NOW FULLY EDITABLE */}
        <div className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-steel-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-[#111827]">
                  Salem Yard Operational Settings
                </h2>
                <p className="text-xs text-steel-500">
                  Customizable operational rules, weighbridge parameters, and low-stock alert thresholds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/bays">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer bg-white border-steel-200 text-steel-700 hover:bg-steel-50 text-xs"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                  <span>Configure Bays Table</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenEdit}
                className="cursor-pointer bg-[#0c4a3b] hover:bg-[#073328] text-white text-xs"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                <span>Edit Yard Settings</span>
              </Button>
            </div>
          </div>

          {/* Operational Settings Key-Value Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Facility / Yard Name</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-sm font-extrabold text-accent">{activeSettings.yard_name}</div>
              <p className="text-[11px] text-steel-500">{activeSettings.yard_location}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Low Stock Alert Threshold</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  SAFETY BUFFER
                </span>
              </div>
              <div className="text-sm font-extrabold text-amber-900 font-mono">
                {activeSettings.low_stock_threshold_kg.toLocaleString()} kg ({Number(activeSettings.low_stock_threshold_kg / 1000).toFixed(2)} MT)
              </div>
              <p className="text-[11px] text-steel-500">
                Lots at or below this tonnage trigger immediate yellow badge re-order warnings.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Weighbridge Gate Calibration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {activeSettings.weighbridge_status}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeSettings.weighbridge_gate}</span>
              </div>
              <p className="text-[11px] text-steel-500">
                Synchronized with computerized tare/gross slips printed for commercial invoices.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Yard Operating Schedule</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  DISPATCH HOURS
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{activeSettings.operating_hours}</span>
              </div>
              <p className="text-[11px] text-steel-500">
                Official gantry crane and trailer loading hours.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Contact & Dispatch Desks</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  GSTIN: {activeSettings.gstin}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-emerald-800">
                  <Phone className="w-3 h-3" /> {activeSettings.phone_primary}
                </span>
                {activeSettings.phone_secondary && (
                  <span className="flex items-center gap-1 text-steel-600">
                    • {activeSettings.phone_secondary}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-steel-500">
                WhatsApp Desk: +{activeSettings.whatsapp_number}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-steel-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Storage Precision Standard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  NUMERIC(14, 3)
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900">
                Unit: {activeSettings.unit_of_storage}
              </div>
              <p className="text-[11px] text-steel-500">
                Exact mill tare and gross measurement stored strictly in kilograms without floating-point error.
              </p>
            </div>
          </div>

          {/* Dispatch Notes Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-3">
            <Warehouse className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Dispatch & Logistics Notes:</span>
              <p className="text-[11px] text-emerald-900/90 mt-0.5 leading-relaxed">
                {activeSettings.dispatch_notes}
              </p>
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

        {/* EDIT YARD SETTINGS MODAL */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-steel-200 animate-saas-in max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-steel-100 hover:bg-steel-200 flex items-center justify-center text-steel-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Configuration Modal
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#111827] mt-1">
                  Edit Salem Yard Settings
                </h2>
                <p className="text-xs text-steel-500 mt-0.5">
                  Update facility operational parameters, weighbridge calibration, and stock alert buffers in PostgreSQL.
                </p>
              </div>

              {settingsError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Yard Facility Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.yard_name}
                      onChange={(e) => setFormData({ ...formData, yard_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      GSTIN Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-steel-700 mb-1">
                    Physical Yard Location & Route <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.yard_location}
                    onChange={(e) => setFormData({ ...formData, yard_location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Primary Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone_primary}
                      onChange={(e) => setFormData({ ...formData, phone_primary: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Secondary Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone_secondary}
                      onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      WhatsApp Number (91...)
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Low Stock Threshold (kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="50"
                      value={formData.low_stock_threshold_kg}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold_kg: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                    <span className="text-[10px] text-steel-400 mt-0.5 block">
                      Current: {(formData.low_stock_threshold_kg / 1000).toFixed(2)} MT threshold
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Weighbridge Gate Name
                    </label>
                    <input
                      type="text"
                      value={formData.weighbridge_gate}
                      onChange={(e) => setFormData({ ...formData, weighbridge_gate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Weighbridge Status
                    </label>
                    <select
                      value={formData.weighbridge_status}
                      onChange={(e) => setFormData({ ...formData, weighbridge_status: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white cursor-pointer"
                    >
                      <option value="Calibrated & Operational">Calibrated & Operational</option>
                      <option value="Routine Sensor Calibration Pending">Routine Sensor Calibration Pending</option>
                      <option value="Maintenance / Manual Tare Only">Maintenance / Manual Tare Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-steel-700 mb-1">
                    Dispatch & Highway Access Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.dispatch_notes}
                    onChange={(e) => setFormData({ ...formData, dispatch_notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-steel-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-steel-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={savingSettings}
                    className="cursor-pointer bg-[#0c4a3b] hover:bg-[#073328] text-white"
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        <span>Save Yard Settings</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SaasAdminLayout>
  );
}
