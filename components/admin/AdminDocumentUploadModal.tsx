'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Scale,
  Receipt,
  FileSignature,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentType } from '@/db/schema';

interface AdminDocumentUploadModalProps {
  billId: string;
  billNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPE_OPTIONS: Array<{
  id: DocumentType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'supplier_invoice',
    label: 'Supplier Commercial Invoice',
    desc: 'Original mill/supplier invoice showing tax breakdown and quantities',
    icon: Receipt,
  },
  {
    id: 'weighment_slip',
    label: 'Weighbridge Ticket / Slip',
    desc: 'Physical weighment certificate with gross/tare/net tonnage',
    icon: Scale,
  },
  {
    id: 'delivery_challan',
    label: 'Delivery Challan / Lorry Receipt',
    desc: 'Transporter delivery dispatch document and vehicle proof',
    icon: FileText,
  },
  {
    id: 'mill_test_certificate',
    label: 'Mill Test Certificate (MTC)',
    desc: 'Quality assurance test certificate verifying yield strength & chemical composition',
    icon: FileCheck,
  },
  {
    id: 'internal_note_doc',
    label: 'Internal Inspection / Yard Note',
    desc: 'Yard supervisor verification notes, condition remarks, or photos',
    icon: FileSignature,
  },
];

export function AdminDocumentUploadModal({
  billId,
  billNumber,
  isOpen,
  onClose,
  onSuccess,
}: AdminDocumentUploadModalProps) {
  const [documentType, setDocumentType] = useState<DocumentType>('supplier_invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  }

  function handleSelectedFile(file: File) {
    setErrorMsg(null);
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10 MB maximum limit.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext || '')) {
      setErrorMsg('Unsupported file extension. Allowed formats: PDF, JPEG, PNG, WebP.');
      return;
    }
    setSelectedFile(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);

      const res = await fetch(`/api/admin/bills/${billId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload document');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during upload');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-steel-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-steel-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Upload Supporting Document</h2>
              <p className="text-xs text-steel-400">Attached to Bill #{billNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-steel-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1.5">
              Document Category <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {DOCUMENT_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = documentType === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setDocumentType(opt.id)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                        : 'border-steel-200 hover:border-steel-300 hover:bg-steel-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="documentType"
                      checked={isSelected}
                      onChange={() => setDocumentType(opt.id)}
                      className="mt-0.5 text-brand focus:ring-brand"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-accent flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-brand" />
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-steel-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* File Drag & Drop Box */}
          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1.5">
              Select Document File <span className="text-rose-500">*</span>
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-brand bg-brand/10'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-steel-300 hover:border-brand/60 bg-steel-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-accent truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-steel-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-[10px] text-brand font-semibold hover:underline">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <UploadCloud className="w-8 h-8 text-steel-400 mx-auto" />
                  <p className="text-xs font-bold text-steel-700">
                    Click to browse or drag file here
                  </p>
                  <p className="text-[11px] text-steel-500">
                    PDF, JPEG, PNG, or WebP up to 10 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Confidential Notice */}
          <p className="text-[11px] text-steel-500 italic bg-amber-50/60 border border-amber-200/60 rounded-lg p-2.5 flex items-start gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
            <span>All uploads are securely processed, sanitized (EXIF metadata stripped), and kept in private storage. They will never be accessible via public search engines or unauthenticated visitors.</span>
          </p>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-steel-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-steel-300 rounded-lg text-xs font-semibold text-steel-700 hover:bg-steel-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting || !selectedFile}
              className="px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sanitizing & Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload & Attach</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
