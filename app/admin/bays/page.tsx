'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import {
  RefreshCw,
  Package,
  TrendingUp,
  Scale,
  Filter,
  Warehouse,
  ShieldCheck,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  Layers,
  Info,
  Search,
  Table as TableIcon,
  LayoutGrid,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface BayStatus {
  bay_id: string;
  bay_code: string;
  name: string;
  section: string;
  primary_diameters: number[];
  max_capacity_mt: number;
  current_quantity_kg: number;
  current_quantity_mt: number;
  occupancy_percent: number;
  status: 'optimal' | 'near_full' | 'low' | 'empty';
  display_order?: number;
  is_active?: boolean;
  notes?: string | null;
  lots: any[];
}

const AVAILABLE_DIAMETERS = [8, 10, 12, 16, 20, 25, 32];

export default function AdminYardBaysPage() {
  const router = useRouter();
  const [bays, setBays] = useState<BayStatus[]>([]);
  const [totalCapacityMt, setTotalCapacityMt] = useState(345);
  const [totalOccupiedMt, setTotalOccupiedMt] = useState(0);
  const [overallOccupancy, setOverallOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBay, setEditingBay] = useState<BayStatus | null>(null);
  const [formData, setFormData] = useState({
    bayCode: '',
    name: '',
    section: '',
    maxCapacityMt: 45,
    primaryDiameters: [12, 16] as number[],
    displayOrder: 1,
    isActive: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bayToDelete, setBayToDelete] = useState<BayStatus | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lots Preview Modal State
  const [lotsModalBay, setLotsModalBay] = useState<BayStatus | null>(null);

  async function loadBays() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bays', {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setBays(json.data.bays || []);
        setTotalCapacityMt(json.data.totalCapacityMt || 0);
        setTotalOccupiedMt(json.data.totalOccupiedMt || 0);
        setOverallOccupancy(json.data.overallOccupancyPercent || 0);
      }
    } catch (err) {
      console.error('Failed to load yard bays:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function showToast(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  }

  function openCreateModal() {
    setEditingBay(null);
    setFormError(null);
    const nextOrder = bays.length > 0 ? Math.max(...bays.map((b) => b.display_order || 0)) + 1 : 1;
    setFormData({
      bayCode: `Bay ${String.fromCharCode(65 + Math.floor(bays.length / 2))}-${(bays.length % 2) + 1}`,
      name: '',
      section: bays.length > 0 ? bays[bays.length - 1].section : 'Section A (Heavy Rebars)',
      maxCapacityMt: 45,
      primaryDiameters: [12, 16],
      displayOrder: nextOrder,
      isActive: true,
      notes: '',
    });
    setModalOpen(true);
  }

  function openEditModal(bay: BayStatus) {
    setEditingBay(bay);
    setFormError(null);
    setFormData({
      bayCode: bay.bay_code,
      name: bay.name,
      section: bay.section,
      maxCapacityMt: Number(bay.max_capacity_mt),
      primaryDiameters: Array.isArray(bay.primary_diameters) ? [...bay.primary_diameters] : [],
      displayOrder: bay.display_order !== undefined ? Number(bay.display_order) : 1,
      isActive: bay.is_active !== false,
      notes: bay.notes || '',
    });
    setModalOpen(true);
  }

  function toggleDiameter(d: number) {
    setFormData((prev) => {
      const exists = prev.primaryDiameters.includes(d);
      if (exists) {
        return { ...prev, primaryDiameters: prev.primaryDiameters.filter((item) => item !== d) };
      } else {
        return { ...prev, primaryDiameters: [...prev.primaryDiameters, d].sort((a, b) => a - b) };
      }
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.bayCode.trim()) {
      setFormError('Bay code is required (e.g., Bay A-1).');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Bay name / designated purpose is required.');
      return;
    }
    if (!formData.section.trim()) {
      setFormError('Section is required.');
      return;
    }
    if (isNaN(formData.maxCapacityMt) || formData.maxCapacityMt <= 0) {
      setFormError('Maximum capacity must be a positive number in MT.');
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingBay);
      const url = isEdit ? `/api/admin/bays/${editingBay?.bay_id}` : '/api/admin/bays';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error || 'Failed to save bay details.');
        return;
      }

      setModalOpen(false);
      const bayLabel = formData.bayCode.toLowerCase().startsWith('bay') ? formData.bayCode : `Bay ${formData.bayCode}`;
      showToast('success', isEdit ? `${bayLabel} updated successfully in database.` : `${bayLabel} created successfully.`);
      await loadBays();
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || 'Network error while saving bay.');
    } finally {
      setSaving(false);
    }
  }

  function promptDelete(bay: BayStatus) {
    setBayToDelete(bay);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!bayToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/bays/${bayToDelete.bay_id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        showToast('error', json.error || 'Cannot delete this bay from database.');
        setDeleteConfirmOpen(false);
        return;
      }

      // Optimistically remove from state so it immediately deletes in the table data
      const targetId = bayToDelete.bay_id;
      setBays((prev) => prev.filter((b) => b.bay_id !== targetId));

      setDeleteConfirmOpen(false);
      if (modalOpen && editingBay?.bay_id === targetId) {
        setModalOpen(false);
      }
      showToast('success', json.message || `Bay ${bayToDelete.bay_code} deleted from database.`);

      // Re-fetch authoritative metrics
      await loadBays();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete bay.');
    } finally {
      setDeleting(false);
    }
  }

  // Extract unique sections dynamically from current bays
  const uniqueSections = useMemo(() => {
    return Array.from(new Set(bays.map((b) => b.section.trim()))).filter(Boolean);
  }, [bays]);

  const sectionsList = useMemo(() => {
    return [
      { id: 'all', label: `All Sections (${bays.length})` },
      ...uniqueSections.map((sec) => {
        const count = bays.filter((b) => b.section.trim() === sec).length;
        return { id: sec, label: `${sec} (${count})` };
      }),
    ];
  }, [bays, uniqueSections]);

  const filteredBays = useMemo(() => {
    return bays.filter((b) => {
      const matchSection =
        selectedSection === 'all' || b.section.toLowerCase().includes(selectedSection.toLowerCase());
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        b.bay_code.toLowerCase().includes(query) ||
        b.name.toLowerCase().includes(query) ||
        b.section.toLowerCase().includes(query) ||
        (b.notes && b.notes.toLowerCase().includes(query)) ||
        (b.primary_diameters && b.primary_diameters.some((d) => `${d}mm`.includes(query)));
      return matchSection && matchSearch;
    });
  }, [bays, selectedSection, searchQuery]);

  return (
    <SaasAdminLayout baysCount={bays.length}>
      <div className="space-y-6 animate-saas-in pb-16">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Title Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Authoritative PostgreSQL Yard Map
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Yard Bays & Storage Architecture
            </h1>
            <p className="text-xs text-steel-500 mt-0.5">
              Manage physical stacking berths, rebar capacities, and real-time inventory allocation across Salem Main Yard.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-steel-100 p-1 rounded-xl border border-steel-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#0c4a3b] shadow-2xs'
                    : 'text-steel-600 hover:text-steel-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#0c4a3b] shadow-2xs'
                    : 'text-steel-600 hover:text-steel-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Map Grid</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadBays}
              className="bg-white cursor-pointer hover:border-emerald-600"
              title="Refresh bays"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="cursor-pointer bg-[#0c4a3b] hover:bg-[#073328] text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add New Bay</span>
            </Button>

            <Link href="/admin/settings">
              <Button variant="outline" size="sm" className="cursor-pointer bg-white border-steel-200 text-steel-700 hover:bg-steel-50">
                <Settings2 className="w-4 h-4 mr-1.5 text-steel-500" />
                <span>Yard Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Capacity Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-200/90 uppercase tracking-wider">
              <span>Occupied Tonnage</span>
              <Warehouse className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-white">
                {totalOccupiedMt.toFixed(2)} <span className="text-base font-sans text-emerald-300">MT</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-200 flex items-center gap-1.5">
              <span>Across {bays.reduce((acc, b) => acc + (b.lots?.length || 0), 0)} active stock lots</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Total Yard Capacity</span>
              <Scale className="w-4 h-4 text-steel-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {totalCapacityMt} <span className="text-base font-sans text-steel-500">MT</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500 flex items-center gap-1.5">
              <span>{bays.length} Configured database berths</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Overall Occupancy</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {overallOccupancy}%
              </div>
            </div>
            <div className="w-full bg-steel-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, overallOccupancy)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Weighbridge Gate 1</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Calibrated & Active</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500">
              Salem Bypass Weighbridge Sync OK
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-steel-200/90 shadow-2xs">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1">
            <Filter className="w-3.5 h-3.5 text-steel-400 shrink-0 ml-1 mr-1" />
            {sectionsList.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSection === sec.id
                    ? 'bg-[#0c4a3b] text-white shadow-2xs'
                    : 'bg-steel-50 text-steel-600 hover:bg-steel-100 border border-steel-200/70'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-steel-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bays, sizes, sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] text-xs text-steel-800 placeholder-steel-400 pl-8 pr-3 py-1.5 rounded-xl border border-steel-200 focus:border-emerald-600 focus:bg-white outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. TABLE VIEW: AUTHORITATIVE YARD BAYS DATA TABLE WITH IN-TABLE ACTIONS   */}
        {/* ========================================================================= */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-steel-700 border-collapse">
                <thead className="bg-[#f8fafc] text-steel-500 uppercase font-mono font-bold text-[10px] tracking-wider border-b border-steel-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Bay Code / Berth</th>
                    <th className="py-3 px-4">Designated Purpose & Name</th>
                    <th className="py-3 px-4">Yard Section</th>
                    <th className="py-3 px-4">Dedicated Sizes</th>
                    <th className="py-3 px-4 text-right">Max Cap (MT)</th>
                    <th className="py-3 px-4 text-right">Stored (MT)</th>
                    <th className="py-3 px-4 text-center">Occupancy</th>
                    <th className="py-3 px-4 text-center">Active Lots</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {filteredBays.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-steel-400 font-medium">
                        No yard bays match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBays.map((bay, idx) => {
                      const isFull = bay.occupancy_percent >= 85;
                      const isEmpty = bay.occupancy_percent === 0;
                      const isInactive = bay.is_active === false;

                      let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      let progressBg = 'bg-emerald-500';

                      if (isInactive) {
                        badgeColor = 'bg-slate-100 text-slate-600 border-slate-300';
                        progressBg = 'bg-slate-400';
                      } else if (isFull) {
                        badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                        progressBg = 'bg-rose-500';
                      } else if (bay.occupancy_percent > 65) {
                        badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                        progressBg = 'bg-amber-500';
                      } else if (isEmpty) {
                        badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        progressBg = 'bg-slate-300';
                      }

                      return (
                        <tr
                          key={bay.bay_id}
                          className="hover:bg-[#f8fafc]/80 transition-colors group"
                        >
                          {/* Order */}
                          <td className="py-3.5 px-4 text-center font-mono text-[11px] text-steel-400">
                            {bay.display_order ?? idx + 1}
                          </td>

                          {/* Bay Code */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-sm text-[#111827]">
                                {bay.bay_code}
                              </span>
                              {isInactive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase font-mono">
                                  Maintenance
                                </span>
                              )}
                            </div>
                            {bay.notes && (
                              <div className="text-[10px] text-steel-400 font-sans line-clamp-1 max-w-[200px]">
                                {bay.notes}
                              </div>
                            )}
                          </td>

                          {/* Name / Purpose */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs">
                            <div className="line-clamp-1">{bay.name}</div>
                          </td>

                          {/* Section */}
                          <td className="py-3.5 px-4 text-steel-600 font-medium">
                            <span className="inline-block px-2 py-0.5 rounded bg-steel-100 text-[11px] font-mono text-steel-700">
                              {bay.section}
                            </span>
                          </td>

                          {/* Diameters */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              {bay.primary_diameters && bay.primary_diameters.length > 0 ? (
                                bay.primary_diameters.map((d) => (
                                  <span
                                    key={d}
                                    className="text-[10px] font-mono font-bold bg-steel-100 text-steel-700 px-1.5 py-0.5 rounded"
                                  >
                                    {d}mm
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-steel-400 italic">All sizes</span>
                              )}
                            </div>
                          </td>

                          {/* Max Capacity MT */}
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                            {Number(bay.max_capacity_mt).toFixed(1)} MT
                          </td>

                          {/* Stored MT */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-extrabold text-slate-900">
                              {Number(bay.current_quantity_mt).toFixed(2)} MT
                            </div>
                            <div className="text-[9px] font-mono text-steel-400">
                              {Number(bay.current_quantity_kg).toLocaleString()} kg
                            </div>
                          </td>

                          {/* Occupancy Percent & Bar */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center gap-1 min-w-[70px]">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}
                              >
                                {bay.occupancy_percent}%
                              </span>
                              <div className="w-14 bg-steel-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${progressBg}`}
                                  style={{ width: `${Math.min(100, bay.occupancy_percent)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Active Lots */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setLotsModalBay(bay)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-steel-100 hover:bg-emerald-100/70 text-steel-700 hover:text-emerald-900 font-mono font-bold text-xs transition-colors cursor-pointer"
                              title="Click to view lots stored in this bay"
                            >
                              <Package className="w-3.5 h-3.5 text-steel-500" />
                              <span>{bay.lots?.length || 0}</span>
                            </button>
                          </td>

                          {/* In-Table Actions: Configure & Delete */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(bay)}
                                className="p-1.5 rounded-lg text-steel-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title={`Edit ${bay.bay_code}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => promptDelete(bay)}
                                className="p-1.5 rounded-lg text-steel-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title={`Delete ${bay.bay_code} from table and database`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary Strip */}
            <div className="p-3 bg-[#f8fafc] border-t border-steel-200 text-xs text-steel-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold">
                Showing {filteredBays.length} of {bays.length} yard berths in PostgreSQL database
              </span>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span>Total Capacity: {totalCapacityMt} MT</span>
                <span className="text-emerald-800">Total Stocked: {totalOccupiedMt.toFixed(2)} MT</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. GRID / MAP VIEW: VISUAL YARD LAYOUT                                     */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredBays.map((bay) => {
              const isFull = bay.occupancy_percent >= 85;
              const isEmpty = bay.occupancy_percent === 0;
              const isInactive = bay.is_active === false;

              let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              let progressColor = 'bg-emerald-500';

              if (isInactive) {
                badgeColor = 'bg-slate-100 text-slate-600 border-slate-300';
                progressColor = 'bg-slate-400';
              } else if (isFull) {
                badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                progressColor = 'bg-rose-500';
              } else if (bay.occupancy_percent > 65) {
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                progressColor = 'bg-amber-500';
              } else if (isEmpty) {
                badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                progressColor = 'bg-slate-300';
              }

              return (
                <div
                  key={bay.bay_id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between group hover:shadow-md ${
                    isInactive ? 'opacity-70 border-dashed border-steel-300' : 'border-steel-200/90 hover:border-emerald-400 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Bay Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-[#111827]">
                          {bay.bay_code}
                        </span>
                        {isInactive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            MAINTENANCE
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}
                        >
                          {bay.status.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => openEditModal(bay)}
                          className="p-1 rounded-lg text-steel-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title={`Edit ${bay.bay_code}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(bay)}
                          className="p-1 rounded-lg text-steel-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Delete ${bay.bay_code}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-steel-700 mt-1 line-clamp-1">
                      {bay.name}
                    </h3>
                    <div className="text-[10px] text-steel-400 font-mono mt-0.5">
                      {bay.section}
                    </div>

                    {/* Designated Diameters */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-steel-500">Designated:</span>
                      {bay.primary_diameters && bay.primary_diameters.length > 0 ? (
                        bay.primary_diameters.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] font-mono font-bold bg-steel-100 text-steel-700 px-1.5 py-0.5 rounded"
                          >
                            {d}mm
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-steel-400 italic">All sizes</span>
                      )}
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono font-semibold">
                        <span className="text-steel-600">{bay.current_quantity_mt} MT</span>
                        <span className="text-steel-400">/ {bay.max_capacity_mt} MT ({bay.occupancy_percent}%)</span>
                      </div>
                      <div className="w-full bg-steel-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                          style={{ width: `${Math.min(100, bay.occupancy_percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Notes if available */}
                    {bay.notes && (
                      <div className="mt-2.5 text-[10px] text-steel-500 bg-steel-50 p-2 rounded-lg border border-steel-100 line-clamp-2">
                        <span className="font-semibold text-steel-700">Note:</span> {bay.notes}
                      </div>
                    )}

                    {/* Lots Stored in this Bay */}
                    <div className="mt-4 pt-3 border-t border-steel-100 space-y-2">
                      <div className="text-[10px] font-bold text-steel-400 uppercase tracking-wider font-mono flex items-center justify-between">
                        <span>Stored Rebar Lots ({bay.lots?.length || 0})</span>
                      </div>

                      {!bay.lots || bay.lots.length === 0 ? (
                        <div className="p-3 rounded-xl bg-steel-50 text-center text-[11px] text-steel-400 font-medium">
                          Slot available for next trailer dispatch.
                        </div>
                      ) : (
                        bay.lots.slice(0, 3).map((lot) => (
                          <div
                            key={lot.id}
                            className="p-2.5 rounded-xl bg-[#f8fafc] border border-steel-100 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                          >
                            <div>
                              <div className="font-mono font-bold text-xs text-[#111827]">
                                {lot.lot_number}
                              </div>
                              <div className="text-[10px] text-steel-500 flex items-center gap-1">
                                <span className="font-semibold text-emerald-800">{lot.brand_name}</span>
                                <span>•</span>
                                <span>{lot.diameter_mm}mm {lot.grade}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-extrabold text-xs text-slate-900">
                                {(Number(lot.quantity_kg) / 1000).toFixed(1)} MT
                              </div>
                              <div className="text-[9px] text-steel-400 font-mono">
                                {Number(lot.quantity_kg).toLocaleString()} kg
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {bay.lots && bay.lots.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setLotsModalBay(bay)}
                          className="w-full text-center text-[11px] font-bold text-emerald-700 hover:underline py-1"
                        >
                          + View all {bay.lots.length} lots
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(bay)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-steel-100 hover:bg-emerald-100/60 text-steel-700 hover:text-emerald-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-steel-500" />
                      <span>Configure Bay</span>
                    </button>
                    <Link
                      href={`/admin/live-stock?search=${encodeURIComponent(bay.bay_code)}`}
                      className="py-1.5 px-2.5 rounded-xl bg-steel-50 hover:bg-steel-100 text-steel-600 hover:text-steel-900 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
                      title="View lots in live inventory"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADD / EDIT BAY MODAL                                                      */}
        {/* ========================================================================= */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-steel-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-steel-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">
                      {editingBay ? `Edit ${editingBay.bay_code}` : 'Add New Yard Bay'}
                    </h3>
                    <p className="text-xs text-steel-500">
                      Configure capacity, section allocation, and dedicated diameters in PostgreSQL.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-steel-400 hover:text-steel-600 hover:bg-steel-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bay Code */}
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Bay Code / Identifier *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bay A-1, BAY-09"
                      value={formData.bayCode}
                      onChange={(e) => setFormData({ ...formData, bayCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Yard Section *
                    </label>
                    <input
                      type="text"
                      required
                      list="section-suggestions"
                      placeholder="e.g. Section A (Heavy Rebars)"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <datalist id="section-suggestions">
                      {uniqueSections.map((sec) => (
                        <option key={sec} value={sec} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Bay Name */}
                <div>
                  <label className="block text-xs font-bold text-steel-700 mb-1">
                    Bay Name / Purpose Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Column & Footing Stacking"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Max Capacity in MT */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-steel-700">
                      Maximum Storage Capacity (MT) *
                    </label>
                    <span className="text-[11px] font-mono text-steel-500">
                      {formData.maxCapacityMt * 1000} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="1000"
                      required
                      value={formData.maxCapacityMt}
                      onChange={(e) => setFormData({ ...formData, maxCapacityMt: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    {/* Quick Capacity Presets */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[30, 40, 50, 60].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => setFormData({ ...formData, maxCapacityMt: cap })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            formData.maxCapacityMt === cap
                              ? 'bg-emerald-700 text-white'
                              : 'bg-steel-100 text-steel-600 hover:bg-steel-200'
                          }`}
                        >
                          {cap}MT
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Primary / Dedicated Diameters */}
                <div>
                  <label className="block text-xs font-bold text-steel-700 mb-1.5">
                    Dedicated Rebar Diameters
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVAILABLE_DIAMETERS.map((d) => {
                      const selected = formData.primaryDiameters.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDiameter(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            selected
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-steel-100 text-steel-600 hover:bg-steel-200 border border-steel-200'
                          }`}
                        >
                          <span>{d}mm</span>
                          {selected && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display Order and Active Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Display Order (Position)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-steel-700 mb-1">
                      Operational Status
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-steel-700">
                        {formData.isActive ? 'Active Operational Bay' : 'Under Maintenance / Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-steel-700 mb-1">
                    Operational Notes / Crane & Berth Specs
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Overhead Gantry 1 access; clearance for 40ft flatbed trailers"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-steel-100 flex items-center justify-between gap-3">
                  {editingBay ? (
                    <button
                      type="button"
                      onClick={() => promptDelete(editingBay)}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Bay</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalOpen(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={saving}
                      className="bg-[#0c4a3b] hover:bg-[#073328] text-white cursor-pointer"
                    >
                      {saving ? 'Saving...' : editingBay ? 'Save Changes' : 'Create Bay'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DELETE CONFIRMATION DIALOG (WITH SAFE LOT INVENTORY CHECK)                */}
        {/* ========================================================================= */}
        {deleteConfirmOpen && bayToDelete && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-steel-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111827]">
                    Delete {bayToDelete.bay_code}?
                  </h3>
                  <p className="text-xs text-steel-500">
                    This will permanently delete this bay from PostgreSQL and remove it from the table data.
                  </p>
                </div>
              </div>

              <div className="my-4 p-3 bg-steel-50 rounded-xl border border-steel-100 text-xs text-steel-600 space-y-1">
                <div><span className="font-semibold text-steel-800">Bay Code:</span> {bayToDelete.bay_code}</div>
                <div><span className="font-semibold text-steel-800">Designation:</span> {bayToDelete.name}</div>
                <div><span className="font-semibold text-steel-800">Section:</span> {bayToDelete.section}</div>
                <div><span className="font-semibold text-steel-800">Assigned Lots:</span> {bayToDelete.lots?.length || 0} active lot(s)</div>
              </div>

              {bayToDelete.lots && bayToDelete.lots.length > 0 ? (
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Cannot delete active bay:</span>
                      <p className="mt-0.5">
                        There are {bayToDelete.lots.length} active lot(s) currently stored in this bay. Please relocate or clear the stock lots before deleting.
                      </p>
                    </div>
                  </div>

                  {/* List of active lots in this bay */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#f8fafc] rounded-xl border border-steel-100 text-xs">
                    {bayToDelete.lots.map((lot) => (
                      <div key={lot.id} className="flex items-center justify-between font-mono text-[11px] p-1.5 bg-white rounded border border-steel-100">
                        <span className="font-bold text-slate-800">{lot.lot_number}</span>
                        <span className="text-emerald-800 font-semibold">{(Number(lot.quantity_kg) / 1000).toFixed(1)} MT</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="cursor-pointer"
                    >
                      Close & Relocate Lots
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deleting}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete from Table & DB'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOTS INSPECTOR MODAL                                                      */}
        {/* ========================================================================= */}
        {lotsModalBay && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-steel-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-steel-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">
                      {lotsModalBay.bay_code} &mdash; Stored Rebar Lots
                    </h3>
                    <p className="text-xs text-steel-500">
                      {lotsModalBay.name} &bull; {lotsModalBay.section}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLotsModalBay(null)}
                  className="p-1 rounded-lg text-steel-400 hover:text-steel-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!lotsModalBay.lots || lotsModalBay.lots.length === 0 ? (
                <div className="py-8 text-center text-steel-400 text-xs font-medium">
                  No active stock lots currently assigned to {lotsModalBay.bay_code}.
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto space-y-2">
                  {lotsModalBay.lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="p-3 rounded-xl bg-[#f8fafc] border border-steel-100 flex items-center justify-between hover:bg-emerald-50/40 transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {lot.lot_number}
                        </div>
                        <div className="text-[11px] text-steel-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-emerald-800">{lot.brand_name}</span>
                          <span>•</span>
                          <span>{lot.diameter_mm}mm {lot.grade}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          {(Number(lot.quantity_kg) / 1000).toFixed(2)} MT
                        </div>
                        <div className="text-[10px] text-steel-400 font-mono">
                          {Number(lot.quantity_kg).toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-steel-100 flex items-center justify-between">
                <Link
                  href={`/admin/live-stock?search=${encodeURIComponent(lotsModalBay.bay_code)}`}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>Open in Live Stock Table</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLotsModalBay(null)}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SaasAdminLayout>
  );
}
