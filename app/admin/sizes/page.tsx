'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { Diameter } from '@/db/schema';
import {
  Ruler,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Scale,
  Sparkles,
  Info,
  Layers,
  X,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminSizesPage() {
  const [sizes, setSizes] = useState<Diameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Diameter | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formData, setFormData] = useState({
    diameter_mm: 8,
    weight_kg_per_meter: 0.395,
    primary_use: '',
    key_applications: '',
    description: '',
    image: '',
    standard_grades: 'Fe 550D, Fe 500D',
    display_order: 1,
    is_active: true,
  });

  const loadSizes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/sizes');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sizes');
      }
      setSizes(data.data || []);
    } catch (err: any) {
      console.error('Error loading sizes:', err);
      setError(err.message || 'Unable to load sizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSizes();
  }, []);

  const openAddModal = () => {
    const nextOrder = sizes.length > 0 ? Math.max(...sizes.map((s) => s.display_order)) + 1 : 1;
    setEditingSize(null);
    setFormData({
      diameter_mm: 8,
      weight_kg_per_meter: 0.395,
      primary_use: '',
      key_applications: '',
      description: '',
      image: '/images/products/rebar-bundle.jpg',
      standard_grades: 'Fe 550D, Fe 500D',
      display_order: nextOrder,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (size: Diameter) => {
    setEditingSize(size);
    setFormData({
      diameter_mm: size.diameter_mm,
      weight_kg_per_meter: size.weight_kg_per_meter,
      primary_use: size.primary_use || '',
      key_applications: typeof size.key_applications === 'string'
        ? size.key_applications
        : Array.isArray(size.key_applications)
        ? size.key_applications.join(', ')
        : '',
      description: size.description || '',
      image: size.image || '',
      standard_grades: size.standard_grades || 'Fe 550D, Fe 500D',
      display_order: size.display_order || 1,
      is_active: size.is_active,
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sizes');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      setFormData((prev) => ({ ...prev, image: data.url }));
      setSuccessMsg('Bar size photograph uploaded successfully.');
    } catch (err: any) {
      console.error('Size image upload error:', err);
      setError(err.message || 'Failed to upload bar size image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        diameter_mm: Number(formData.diameter_mm),
        weight_kg_per_meter: Number(formData.weight_kg_per_meter),
        primary_use: formData.primary_use.trim(),
        key_applications: formData.key_applications.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        standard_grades: formData.standard_grades.trim(),
        display_order: Number(formData.display_order),
        is_active: formData.is_active,
      };

      if (editingSize) {
        const res = await fetch(`/api/admin/sizes/${editingSize.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update size');
        setSuccessMsg(`Size ${editingSize.diameter_mm}mm updated. Public products page synchronized.`);
      } else {
        const res = await fetch('/api/admin/sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create size');
        setSuccessMsg(`New size ${payload.diameter_mm}mm created successfully.`);
      }

      setModalOpen(false);
      await loadSizes();
    } catch (err: any) {
      console.error('Save size error:', err);
      setError(err.message || 'Error saving size');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (size: Diameter) => {
    try {
      const res = await fetch(`/api/admin/sizes/${size.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !size.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle status');
      setSuccessMsg(`Size ${size.diameter_mm}mm status updated to ${!size.is_active ? 'Active' : 'Inactive'}.`);
      await loadSizes();
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sizes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete size');
      setDeleteConfirmId(null);
      setSuccessMsg('Size deleted successfully.');
      await loadSizes();
    } catch (err: any) {
      setError(err.message || 'Error deleting size');
    }
  };

  const activeCount = sizes.filter((s) => s.is_active).length;

  return (
    <SaasAdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf4ef] text-[#0c4a3b] border border-emerald-200">
                Live Public Catalog Sync
              </span>
              <span className="text-xs text-steel-500 font-mono">diameters table</span>
            </div>
            <h1 className="text-2xl font-black text-[#111827] tracking-tight mt-1">
              Rebar Sizes & Diameters
            </h1>
            <p className="text-xs text-steel-600 mt-0.5">
              Manage supported bar diameters, nominal weights, and structural applications displayed on public product pages.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/tmt-products"
              target="_blank"
              className="px-3.5 py-2 text-xs font-bold text-steel-700 bg-white hover:bg-steel-50 border border-steel-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-steel-400" />
            </Link>
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0c4a3b] hover:bg-[#093c30] rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#0c4a3b]/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Size</span>
            </button>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Total Sizes
              </div>
              <div className="text-2xl font-black text-[#111827] mt-1">{sizes.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <Ruler className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Active on Public Site
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Size Range
              </div>
              <div className="text-xl font-black text-[#111827] mt-1 font-mono">
                {sizes.length > 0
                  ? `${Math.min(...sizes.map((s) => s.diameter_mm))}mm – ${Math.max(
                      ...sizes.map((s) => s.diameter_mm)
                    )}mm`
                  : 'N/A'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Tolerance Standard
              </div>
              <div className="text-sm font-black text-[#111827] mt-1 font-mono">
                BIS 1786 : 2008
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Notice Strip */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Instant Public Sync:</strong> Any updates to bar diameter, nominal weight, or applications will automatically update the product cards and BIS specification table on <Link href="/tmt-products" target="_blank" className="underline font-bold hover:text-amber-950">/tmt-products</Link> and <Link href="/products" target="_blank" className="underline font-bold hover:text-amber-950">/products</Link>.
          </span>
        </div>

        {/* Sizes Table */}
        <div className="bg-white rounded-2xl border border-steel-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-steel-100 flex items-center justify-between">
            <div className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Configured Diameters ({sizes.length})
            </div>
            <button
              onClick={loadSizes}
              disabled={loading}
              className="p-1.5 text-steel-500 hover:text-steel-800 hover:bg-steel-50 rounded-lg transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-steel-50/70 border-b border-steel-200/80 text-steel-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Diameter (mm)</th>
                  <th className="py-3 px-4">Unit Weight</th>
                  <th className="py-3 px-4">Primary Application</th>
                  <th className="py-3 px-4">Grades</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {sizes.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-steel-500">
                      No rebar sizes configured. Click &quot;Add New Size&quot; to begin.
                    </td>
                  </tr>
                )}

                {sizes.map((s) => (
                  <tr key={s.id} className="hover:bg-steel-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-steel-500">
                      #{s.display_order}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 bg-steel-100 rounded-lg border border-steel-200/80 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                          {s.image ? (
                            <Image
                              src={s.image}
                              alt={`${s.diameter_mm}mm Rebar`}
                              fill
                              sizes="48px"
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-steel-400" />
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0c4a3b] font-black text-xs flex items-center justify-center font-mono shadow-2xs flex-shrink-0">
                          {s.diameter_mm}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#111827]">{s.diameter_mm} mm Rebar</div>
                          <div className="text-[10px] text-steel-500 font-mono">id: {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-steel-800">
                      {Number(s.weight_kg_per_meter).toFixed(3)} kg/m
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-steel-700" title={s.primary_use || ''}>
                      {s.primary_use || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-steel-100 text-steel-700 border border-steel-200">
                        {s.standard_grades || 'Fe 550D'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle public visibility"
                      >
                        {s.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Public Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-steel-600 hover:text-steel-900 hover:bg-steel-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit size"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete size"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-steel-200">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">
                  Delete Rebar Diameter?
                </h3>
                <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                  Are you sure you want to delete size <strong className="font-mono">{deleteConfirmId}</strong>? Note: If any stock lots are linked to this diameter, the database will block the deletion to prevent foreign-key corruption. You can deactivate it instead.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs font-bold text-steel-700 bg-steel-100 hover:bg-steel-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Size Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-steel-200 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-steel-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eaf4ef] text-[#0c4a3b] flex items-center justify-center">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111827]">
                      {editingSize ? `Edit ${editingSize.diameter_mm}mm Rebar` : 'Add New Rebar Size'}
                    </h3>
                    <p className="text-[11px] text-steel-500">
                      Configure standard dimensions and catalog details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-steel-400 hover:text-steel-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Diameter (mm) *
                    </label>
                    <input
                      type="number"
                      required
                      min={4}
                      max={60}
                      step={1}
                      disabled={!!editingSize}
                      value={formData.diameter_mm}
                      onChange={(e) => setFormData({ ...formData, diameter_mm: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    />
                    {editingSize && (
                      <span className="text-[10px] text-steel-400">ID is immutable</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Nominal Weight (kg/m) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0.01}
                      max={50}
                      step={0.001}
                      value={formData.weight_kg_per_meter}
                      onChange={(e) =>
                        setFormData({ ...formData, weight_kg_per_meter: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    />
                  </div>
                </div>

                {/* Bar Size Image Section */}
                <div className="p-3.5 rounded-xl bg-steel-50 border border-steel-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-steel-700 uppercase tracking-wider">
                      Rebar Size Photograph
                    </label>
                    <span className="text-[10px] text-steel-500 font-mono">JPG, PNG, WebP, AVIF</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-16 bg-white rounded-xl border border-steel-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                      {formData.image ? (
                        <Image
                          src={formData.image}
                          alt="Bar Size Preview"
                          fill
                          sizes="96px"
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-steel-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                          id="size-photo-file"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 text-xs font-bold text-steel-700 bg-white hover:bg-steel-100 border border-steel-200 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5 text-steel-500" />
                          <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or enter image URL (/images/products/rebar-bundle.jpg)"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-2.5 py-1 text-[11px] font-mono bg-white border border-steel-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c4a3b]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Primary Application
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Column lateral ties & beam shear stirrups"
                    value={formData.primary_use}
                    onChange={(e) => setFormData({ ...formData, primary_use: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Key Applications (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Column lateral ties, Beam shear stirrups, Roof slabs"
                    value={formData.key_applications}
                    onChange={(e) => setFormData({ ...formData, key_applications: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Standard Certified Grades
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fe 550D, Fe 500D"
                    value={formData.standard_grades}
                    onChange={(e) => setFormData({ ...formData, standard_grades: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Description (Shown on product details)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide engineering context, bendability details, or structural use cases..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-mono bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Public Visibility
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        formData.is_active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {formData.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{formData.is_active ? 'Active on Public Site' : 'Hidden from Public'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-steel-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-steel-700 bg-steel-100 hover:bg-steel-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0c4a3b] hover:bg-[#093c30] rounded-xl transition-all shadow-md shadow-[#0c4a3b]/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingSize ? 'Save Changes' : 'Create Size'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SaasAdminLayout>
  );
}

