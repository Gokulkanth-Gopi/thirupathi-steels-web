'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { AdminDocumentUploadModal } from '@/components/admin/AdminDocumentUploadModal';
import { AdminDocumentPreviewModal } from '@/components/admin/AdminDocumentPreviewModal';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Layers,
  Scale,
  Truck,
  Calculator,
  UploadCloud,
  Eye,
  Trash2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  ExternalLink,
  Edit2,
  Save,
  Lock,
} from 'lucide-react';
import { BillWithDetails, BillDocument, DocumentType } from '@/db/schema';

export default function AdminBillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params?.id as string;

  const [user, setUser] = useState<{ id: string; username: string; fullName: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [bill, setBill] = useState<BillWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit notes & payment status state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [paymentStatusValue, setPaymentStatusValue] = useState<'paid' | 'partially_paid' | 'unpaid'>('paid');
  const [savingNotes, setSavingNotes] = useState(false);

  // Document modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<BillDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  async function checkAuthAndLoad() {
    try {
      setCheckingAuth(true);
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (!json.authenticated) {
        router.push('/admin/login');
        return;
      }
      setUser(json.user);
      await loadBillData();
    } catch (err) {
      console.error('Auth verification error:', err);
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadBillData() {
    if (!billId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/admin/bills/${billId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load bill details');
      }
      setBill(json.data);
      setNotesValue(json.data.notes || '');
      setPaymentStatusValue(json.data.payment_status || 'paid');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching bill');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billId]);

  async function handleSaveMetadata() {
    try {
      setSavingNotes(true);
      const res = await fetch(`/api/admin/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesValue.trim() || null,
          paymentStatus: paymentStatusValue,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update bill');
      }
      setEditingNotes(false);
      await loadBillData();
    } catch (err: any) {
      alert(`Error saving updates: ${err.message}`);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDeleteDocument(docId: string, docName: string) {
    if (!confirm(`Are you sure you want to remove "${docName}" from this bill?`)) {
      return;
    }
    try {
      setDeletingDocId(docId);
      const res = await fetch(`/api/admin/bills/${billId}/documents/${docId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete document');
      }
      await loadBillData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setDeletingDocId(null);
    }
  }

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-sm font-semibold text-accent">Loading Bill & Document Details...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !bill) {
    return (
      <SaasAdminLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-accent">{errorMsg || 'Bill Not Found'}</h2>
          <Link
            href="/admin/bills"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Bills Register</span>
          </Link>
        </div>
      </SaasAdminLayout>
    );
  }

  return (
    <SaasAdminLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/admin/bills"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-steel-600 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bills Register</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                bill.payment_status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : bill.payment_status === 'partially_paid'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              Payment: {bill.payment_status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Bill Title Banner */}
        <div className="bg-white p-6 rounded-2xl border border-steel-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand uppercase tracking-wider font-mono">
                Consignment Invoice
              </span>
              <span className="text-xs text-steel-400">•</span>
              <span className="text-xs text-steel-500 font-mono">Recorded {bill.created_at.slice(0, 10)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-accent font-mono tracking-tight">
              {bill.bill_number}
            </h1>
            <p className="text-xs sm:text-sm text-steel-600 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" />
              <span className="font-semibold text-accent">{bill.supplier}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Attach Document</span>
            </Button>
          </div>
        </div>

        {/* Two-Column Grid: Left (Commercial & Lot) vs Right (Confidential Documents) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commercial & Transport Info Card */}
            <div className="bg-white p-5 rounded-xl border border-steel-200 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5 border-b border-steel-100 pb-2.5">
                <Building2 className="w-4 h-4 text-brand" />
                <span>Commercial & Consignment Details</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Invoice Date</span>
                  <span className="font-bold text-accent font-mono text-sm">{bill.bill_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Transport Vehicle</span>
                  <span className="font-bold text-accent font-mono text-sm uppercase">
                    {bill.vehicle_no || 'Unspecified'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Recorded By</span>
                  <span className="font-bold text-accent">{bill.created_by_name || 'Admin'}</span>
                </div>
              </div>
            </div>

            {/* Physical Inventory & Lot Linkage Card */}
            <div className="bg-white p-5 rounded-xl border border-steel-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-steel-100 pb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand" />
                  <span>Physical Yard Stock Allocation</span>
                </h2>
                <Link
                  href="/admin/live-stock"
                  className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1"
                >
                  <span>Yard Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Brand & Spec</span>
                  <span className="font-bold text-accent text-sm">
                    {bill.brand_name || 'TMT Steel'} ({bill.diameter_mm} mm)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Steel Grade</span>
                  <span className="font-bold text-accent text-sm font-mono">{bill.grade || 'Fe 550D'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Physical Lot #</span>
                  <span className="font-bold text-brand font-mono text-sm">{bill.lot_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Inward Tonnage</span>
                  <span className="font-extrabold text-accent text-sm font-mono">
                    {(bill.quantity_kg / 1000.0).toFixed(3)} MT
                  </span>
                  <span className="text-[10px] text-steel-500 block">
                    ({bill.quantity_kg.toLocaleString('en-IN')} kg)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Location / Yard</span>
                  <span className="font-bold text-accent">Salem Main Yard</span>
                </div>
                <div>
                  <span className="text-[10px] text-steel-500 uppercase block font-semibold">Stock Movement</span>
                  <span className="font-mono text-emerald-700 font-bold">inward_receipt</span>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-white p-5 rounded-xl border border-steel-200 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5 border-b border-steel-100 pb-2.5">
                <Calculator className="w-4 h-4 text-brand" />
                <span>Financial & GST Breakdown</span>
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-steel-50">
                  <span className="text-steel-600">
                    Billed Quantity × Rate: ({bill.quantity_kg.toLocaleString('en-IN')} kg @ ₹{bill.rate_per_kg || 0}/kg)
                  </span>
                  <span className="font-mono font-bold text-accent">
                    ₹{bill.subtotal_amount?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-steel-50">
                  <span className="text-steel-600">Goods and Services Tax (GST @ {bill.tax_rate_percent || 18}%)</span>
                  <span className="font-mono font-bold text-amber-700">
                    ₹{bill.tax_amount?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>

                <div className="flex justify-between pt-2 text-sm font-extrabold">
                  <span className="text-accent">Grand Total Consignment Spend</span>
                  <span className="font-mono text-brand text-base">
                    ₹{bill.total_amount?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Internal Notes & Remarks Card */}
            <div className="bg-white p-5 rounded-xl border border-steel-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-steel-100 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Internal Yard Notes & Cross-References</span>
                </h2>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add internal yard observations, weighbridge ticket cross-references..."
                    className="w-full text-xs p-3 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-steel-600">Payment Status:</label>
                      <select
                        value={paymentStatusValue}
                        onChange={(e) => setPaymentStatusValue(e.target.value as any)}
                        className="text-xs p-1.5 border border-steel-300 rounded-md bg-white font-bold"
                      >
                        <option value="paid">Paid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(bill.notes || '');
                        }}
                        className="px-3 py-1.5 border border-steel-300 rounded-lg text-xs font-semibold text-steel-700 hover:bg-steel-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={handleSaveMetadata}
                        disabled={savingNotes}
                        className="px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {savingNotes ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save Updates</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-steel-700 italic">
                  {bill.notes || 'No internal remarks entered for this consignment.'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Confidential Attached Documents (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-steel-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-steel-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-steel-700">
                    Confidential Documents
                  </h2>
                </div>
                <span className="text-[11px] font-mono font-bold bg-steel-100 text-steel-700 px-2 py-0.5 rounded-full">
                  {bill.documents?.length || 0}
                </span>
              </div>

              <p className="text-[11px] text-steel-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-steel-400 flex-shrink-0" />
                <span>Invoices, weighbridge slips, and mill test certificates stored securely outside web root.</span>
              </p>

              {/* Document List */}
              {!bill.documents || bill.documents.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-steel-200 rounded-xl space-y-2">
                  <Paperclip className="w-8 h-8 text-steel-400 mx-auto" />
                  <p className="text-xs font-bold text-steel-700">No Documents Attached</p>
                  <p className="text-[11px] text-steel-500">
                    Attach supplier invoices, weighment tickets, or delivery challans.
                  </p>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Now</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bill.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-steel-50/70 border border-steel-200 rounded-xl space-y-2 hover:border-steel-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 truncate">
                          <FileText className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-accent truncate block" title={doc.original_filename}>
                              {doc.original_filename}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-steel-500 block">
                              {doc.document_type.replace(/_/g, ' ')} • {(doc.file_size_bytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            title="Preview Document"
                            className="p-1.5 text-steel-600 hover:text-brand hover:bg-white rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.original_filename)}
                            disabled={deletingDocId === doc.id}
                            title="Delete Document"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            {deletingDocId === doc.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-steel-400 flex items-center justify-between pt-1 border-t border-steel-100">
                        <span>Uploaded by {doc.uploaded_by_name}</span>
                        <span>{doc.created_at.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="w-full py-2 border-2 border-dashed border-steel-300 hover:border-brand/60 rounded-xl text-xs font-bold text-steel-600 hover:text-brand flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Attach Another Document</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AdminDocumentUploadModal
        billId={bill.id}
        billNumber={bill.bill_number}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          loadBillData();
        }}
      />

      {/* Document Preview Modal */}
      <AdminDocumentPreviewModal
        billId={bill.id}
        document={previewDoc}
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </SaasAdminLayout>
  );
}
