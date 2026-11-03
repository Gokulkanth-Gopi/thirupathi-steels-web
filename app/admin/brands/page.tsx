'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { Brand } from '@/db/schema';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Info,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Secondary Steel' as 'Primary Steel' | 'Secondary Steel',
    tagline: '',
    description: '',
    features: '',
    logo: '',
    display_order: 1,
    is_active: true,
  });

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch brands');
      }
      setBrands(data.data || []);
    } catch (err: any) {
      console.error('Error loading brands:', err);
      setError(err.message || 'Unable to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openAddModal = () => {
    const nextOrder = brands.length > 0 ? Math.max(...brands.map((b) => b.display_order)) + 1 : 1;
    setEditingBrand(null);
    setFormData({
      name: '',
      category: 'Secondary Steel',
      tagline: '',
      description: '',
      features: 'Fe 550D Grade, BIS 1786 Certified, High Ductility',
      logo: '',
      display_order: nextOrder,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      category: brand.category,
      tagline: brand.tagline || '',
      description: brand.description || '',
      features: typeof brand.features === 'string'
        ? brand.features
        : Array.isArray(brand.features)
        ? brand.features.join(', ')
        : '',
      logo: brand.logo || '',
      display_order: brand.display_order || 1,
      is_active: brand.is_active,
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError(null);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'brands');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      setFormData((prev) => ({ ...prev, logo: data.url }));
      setSuccessMsg('Brand logo uploaded successfully.');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Failed to upload brand logo');
    } finally {
      setUploadingLogo(false);
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
        name: formData.name.trim(),
        category: formData.category,
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        features: formData.features.trim(),
        logo: formData.logo.trim(),
        display_order: Number(formData.display_order),
        is_active: formData.is_active,
      };

      if (editingBrand) {
        const res = await fetch(`/api/admin/brands/${editingBrand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update brand');
        setSuccessMsg(`Brand ${editingBrand.name} updated. Public website synchronized.`);
      } else {
        const res = await fetch('/api/admin/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create brand');
        setSuccessMsg(`Brand ${payload.name} created successfully.`);
      }

      setModalOpen(false);
      await loadBrands();
    } catch (err: any) {
      console.error('Save brand error:', err);
      setError(err.message || 'Error saving brand');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !brand.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle status');
      setSuccessMsg(`Brand ${brand.name} status updated.`);
      await loadBrands();
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete brand');
      setDeleteConfirmId(null);
      setSuccessMsg('Brand deleted successfully.');
      await loadBrands();
    } catch (err: any) {
      setError(err.message || 'Error deleting brand');
    }
  };

  const activeCount = brands.filter((b) => b.is_active).length;
  const primaryCount = brands.filter((b) => b.category === 'Primary Steel').length;
  const secondaryCount = brands.filter((b) => b.category === 'Secondary Steel').length;

  return (
    <SaasAdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf4ef] text-[#0c4a3b] border border-emerald-200">
                Live Public Brands Sync
              </span>
              <span className="text-xs text-steel-500 font-mono">brands table</span>
            </div>
            <h1 className="text-2xl font-black text-[#111827] tracking-tight mt-1">
              Brands & Mill Partners
            </h1>
            <p className="text-xs text-steel-600 mt-0.5">
              Manage authorized TMT steel manufacturers, brand logos, primary/secondary categories, and product specifications.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/brands"
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
              <span>Add Brand</span>
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
                Total Brands
              </div>
              <div className="text-2xl font-black text-[#111827] mt-1">{brands.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Active on Public
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
                Primary Producers
              </div>
              <div className="text-2xl font-black text-[#0c4a3b] mt-1">{primaryCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Secondary Producers
              </div>
              <div className="text-2xl font-black text-steel-800 mt-1">{secondaryCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Notice Strip */}
        <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 text-brand-900 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-brand flex-shrink-0" />
          <span>
            <strong>Brand Logos & Images:</strong> Upload new high-resolution logos directly or supply asset URLs. Changes synchronize immediately across the header, live stock filters, and the public <Link href="/brands" target="_blank" className="underline font-bold hover:text-brand-950">/brands</Link> page.
          </span>
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-2xl border border-steel-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-steel-100 flex items-center justify-between">
            <div className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Authorized Brand Directory ({brands.length})
            </div>
            <button
              onClick={loadBrands}
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
                  <th className="py-3 px-4">Brand & Logo</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Tagline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {brands.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-steel-500">
                      No brands configured. Click &quot;Add Brand&quot; to begin.
                    </td>
                  </tr>
                )}

                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-steel-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-steel-500">
                      #{b.display_order}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-9 bg-steel-50 rounded-lg border border-steel-200/80 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                          {b.logo ? (
                            <Image
                              src={b.logo}
                              alt={b.name}
                              fill
                              sizes="56px"
                              className="object-contain p-0.5"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-steel-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#111827] text-sm">{b.name}</div>
                          <div className="text-[10px] text-steel-500 font-mono">id: {b.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.category === 'Primary Steel'
                            ? 'bg-emerald-50 text-[#0c4a3b] border-emerald-200'
                            : 'bg-steel-100 text-steel-700 border-steel-200'
                        }`}
                      >
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-steel-700 max-w-xs truncate" title={b.tagline || ''}>
                      {b.tagline || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          b.is_active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle public visibility"
                      >
                        {b.is_active ? (
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
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-steel-600 hover:text-steel-900 hover:bg-steel-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit brand"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(b.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete brand"
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
                  Delete Brand?
                </h3>
                <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                  Are you sure you want to delete brand <strong className="font-mono">{deleteConfirmId}</strong>? Note: If any stock lots are linked to this brand, the database will block deletion to protect stock integrity. You can deactivate it instead.
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

        {/* Add / Edit Brand Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-steel-200 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-steel-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eaf4ef] text-[#0c4a3b] flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111827]">
                      {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add New Brand'}
                    </h3>
                    <p className="text-[11px] text-steel-500">
                      Configure mill producer credentials and public display profile
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
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TATA TISCON"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as 'Primary Steel' | 'Secondary Steel',
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    >
                      <option value="Primary Steel">Primary Steel (Virgin Ore)</option>
                      <option value="Secondary Steel">Secondary Steel (Thermex Quenching)</option>
                    </select>
                  </div>
                </div>

                {/* Brand Image / Logo Section */}
                <div className="p-3.5 rounded-xl bg-steel-50 border border-steel-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-steel-700 uppercase tracking-wider">
                      Brand Logo Image
                    </label>
                    <span className="text-[10px] text-steel-500 font-mono">PNG, WebP, SVG, JPG</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-14 bg-white rounded-xl border border-steel-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                      {formData.logo ? (
                        <Image
                          src={formData.logo}
                          alt="Brand Preview"
                          fill
                          sizes="80px"
                          className="object-contain p-1"
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
                          id="brand-logo-file"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="px-3 py-1.5 text-xs font-bold text-steel-700 bg-white hover:bg-steel-100 border border-steel-200 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5 text-steel-500" />
                          <span>{uploadingLogo ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                        {formData.logo && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logo: '' })}
                            className="px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or enter image URL (/images/brands/sample.png)"
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        className="w-full px-2.5 py-1 text-[11px] font-mono bg-white border border-steel-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c4a3b]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Super Ductile Fe 550D Rebars"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Key Features & Certifications (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fe 550D Super Ductile, Virgin Iron Ore Base, BIS 1786 Certified"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide overview of brand metallurgy, quality standards, and application fit..."
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
                    {saving ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create Brand'}
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

