'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { GalleryImage } from '@/db/schema';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Upload,
  Info,
  X,
  AlertTriangle,
  FolderOpen,
  Camera,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const STANDARD_CATEGORIES = [
  'Yard Infrastructure',
  'Certified Products',
  'Logistics Fleet',
  'Quality Inspection',
  'Dispatch Operations',
  'Weighbridge & Inward',
];

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    category: 'Yard Infrastructure',
    image_url: '',
    description: '',
    display_order: 1,
    is_active: true,
  });

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch gallery images');
      }
      setImages(data.data || []);
    } catch (err: any) {
      console.error('Error loading gallery images:', err);
      setError(err.message || 'Unable to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const openAddModal = () => {
    const nextOrder = images.length > 0 ? Math.max(...images.map((i) => i.display_order)) + 1 : 1;
    setEditingImage(null);
    setFormData({
      title: '',
      category: 'Yard Infrastructure',
      image_url: '',
      description: '',
      display_order: nextOrder,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (img: GalleryImage) => {
    setEditingImage(img);
    setFormData({
      title: img.title,
      category: img.category,
      image_url: img.image_url,
      description: img.description || '',
      display_order: img.display_order || 1,
      is_active: img.is_active,
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
      fd.append('folder', 'gallery');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      setFormData((prev) => ({
        ...prev,
        image_url: data.url,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));
      setSuccessMsg('Gallery photograph uploaded successfully.');
    } catch (err: any) {
      console.error('Gallery image upload error:', err);
      setError(err.message || 'Failed to upload photograph');
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
        title: formData.title.trim(),
        category: formData.category.trim(),
        image_url: formData.image_url.trim(),
        description: formData.description.trim(),
        display_order: Number(formData.display_order),
        is_active: formData.is_active,
      };

      if (!payload.image_url) {
        throw new Error('Please upload an image or provide an image URL');
      }

      if (editingImage) {
        const res = await fetch(`/api/admin/gallery/${editingImage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update image');
        setSuccessMsg(`Photograph "${editingImage.title}" updated.`);
      } else {
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save image');
        setSuccessMsg(`New photograph "${payload.title}" added to gallery.`);
      }

      setModalOpen(false);
      await loadImages();
    } catch (err: any) {
      console.error('Save gallery error:', err);
      setError(err.message || 'Error saving gallery image');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (img: GalleryImage) => {
    try {
      const res = await fetch(`/api/admin/gallery/${img.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !img.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle status');
      setSuccessMsg(`Photograph status updated.`);
      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete image');
      setDeleteConfirmId(null);
      setSuccessMsg('Photograph removed from gallery.');
      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Error deleting image');
    }
  };

  const activeCount = images.filter((i) => i.is_active).length;
  const categoriesCount = new Set(images.map((i) => i.category)).size;

  return (
    <SaasAdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf4ef] text-[#0c4a3b] border border-emerald-200">
                Live Public Gallery Sync
              </span>
              <span className="text-xs text-steel-500 font-mono">gallery_images table</span>
            </div>
            <h1 className="text-2xl font-black text-[#111827] tracking-tight mt-1">
              Stockyard Media Gallery
            </h1>
            <p className="text-xs text-steel-600 mt-0.5">
              Upload and manage authentic photographs of the Salem stockyard, rebar bundles, crane unloading bays, and delivery logistics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/gallery"
              target="_blank"
              className="px-3.5 py-2 text-xs font-bold text-steel-700 bg-white hover:bg-steel-50 border border-steel-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>View Public Gallery</span>
              <ExternalLink className="w-3.5 h-3.5 text-steel-400" />
            </Link>
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0c4a3b] hover:bg-[#093c30] rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#0c4a3b]/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Image</span>
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
                Total Photographs
              </div>
              <div className="text-2xl font-black text-[#111827] mt-1">{images.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <Camera className="w-5 h-5" />
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
                Facility Categories
              </div>
              <div className="text-2xl font-black text-[#0c4a3b] mt-1">{categoriesCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-steel-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-steel-500 uppercase tracking-wider">
                Storage Directory
              </div>
              <div className="text-xs font-mono font-bold text-steel-700 mt-2 truncate">
                /public/uploads/gallery
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-steel-100 flex items-center justify-center text-steel-700">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Notice Strip */}
        <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 text-brand-900 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-brand flex-shrink-0" />
          <span>
            <strong>Public Gallery Reflection:</strong> All active photographs are immediately featured on the public <Link href="/gallery" target="_blank" className="underline font-bold hover:text-brand-950">/gallery</Link> page with responsive high-resolution image rendering and category pill tagging.
          </span>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-2xl border border-steel-200/80 shadow-2xs overflow-hidden flex flex-col group hover:border-[#0c4a3b]/40 hover:shadow-md transition-all"
            >
              <div className="relative h-48 w-full bg-steel-100 overflow-hidden">
                <Image
                  src={img.image_url}
                  alt={img.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                    {img.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-emerald-300 text-[10px] font-mono font-bold backdrop-blur-xs">
                    #{img.display_order}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggleActive(img)}
                    className={`p-1.5 rounded-full backdrop-blur-xs cursor-pointer transition-colors ${
                      img.is_active
                        ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                        : 'bg-rose-500/90 text-white hover:bg-rose-600'
                    }`}
                    title={img.is_active ? 'Public (Click to hide)' : 'Hidden (Click to publish)'}
                  >
                    {img.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-[#111827] text-sm leading-snug group-hover:text-[#0c4a3b] transition-colors">
                    {img.title}
                  </h4>
                  <p className="text-[11px] text-steel-600 mt-1 line-clamp-2 leading-relaxed">
                    {img.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-steel-100 flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      img.is_active ? 'text-emerald-700' : 'text-steel-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        img.is_active ? 'bg-emerald-500' : 'bg-steel-300'
                      }`}
                    />
                    {img.is_active ? 'Visible on /gallery' : 'Draft / Hidden'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(img)}
                      className="p-1.5 text-steel-600 hover:text-steel-900 hover:bg-steel-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit image"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(img.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && !loading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-steel-300">
            <Camera className="w-10 h-10 text-steel-300 mx-auto mb-2" />
            <h4 className="font-bold text-steel-700 text-sm">No photographs added yet</h4>
            <p className="text-xs text-steel-500 mt-1">
              Click &quot;Add Image&quot; to upload stockyard facilities and fleet photos.
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-steel-200">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">
                  Remove Photograph from Gallery?
                </h3>
                <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                  Are you sure you want to delete this photograph? It will be immediately removed from the public gallery display.
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

        {/* Add / Edit Gallery Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-steel-200 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-steel-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eaf4ef] text-[#0c4a3b] flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111827]">
                      {editingImage ? 'Edit Gallery Photograph' : 'Add Gallery Photograph'}
                    </h3>
                    <p className="text-[11px] text-steel-500">
                      Upload yard infrastructure or logistics photography
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
                {/* Image Upload Area */}
                <div className="p-3.5 rounded-xl bg-steel-50 border border-steel-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-steel-700 uppercase tracking-wider">
                      Photograph File *
                    </label>
                    <span className="text-[10px] text-steel-500 font-mono">JPG, PNG, WebP, AVIF</span>
                  </div>

                  <div className="relative h-44 w-full bg-white rounded-xl border border-dashed border-steel-300 flex items-center justify-center overflow-hidden">
                    {formData.image_url ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={formData.image_url}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="w-8 h-8 text-steel-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-steel-700">Select or Drag Photo Here</p>
                        <p className="text-[10px] text-steel-500 mt-0.5">Recommended 1200x800px or higher</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                      id="gallery-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3.5 py-1.5 text-xs font-bold text-steel-700 bg-white hover:bg-steel-100 border border-steel-200 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-steel-500" />
                      <span>{uploadingImage ? 'Uploading...' : 'Choose File to Upload'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Or enter image URL (/images/home/steel-yard-hero.jpg)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-white border border-steel-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0c4a3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Photograph Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salem Main Stockyard & Rebar Storage Bays"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <input
                      list="gallery-categories"
                      type="text"
                      required
                      placeholder="Select or type category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    />
                    <datalist id="gallery-categories">
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-steel-700 uppercase tracking-wider mb-1">
                    Description (Shown on public gallery card)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the facility section, equipment, or rebar bundle specification..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-steel-50 border border-steel-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4a3b]/20 focus:border-[#0c4a3b] resize-none"
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
                    <span>{formData.is_active ? 'Active on Public Gallery' : 'Hidden from Public Gallery'}</span>
                  </button>
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
                    {saving ? 'Saving...' : editingImage ? 'Save Changes' : 'Add to Gallery'}
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

