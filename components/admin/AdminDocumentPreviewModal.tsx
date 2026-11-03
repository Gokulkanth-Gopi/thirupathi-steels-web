'use client';

import React from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileCheck,
  Scale,
  Receipt,
  FileSignature,
  ShieldCheck,
} from 'lucide-react';
import { BillDocument } from '@/db/schema';

interface AdminDocumentPreviewModalProps {
  billId: string;
  document: BillDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDocumentPreviewModal({
  billId,
  document,
  isOpen,
  onClose,
}: AdminDocumentPreviewModalProps) {
  if (!isOpen || !document) return null;

  const streamUrl = `/api/admin/bills/${billId}/documents/${document.id}`;
  const isPdf = document.mime_type === 'application/pdf';
  const isImage = document.mime_type.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-steel-900 rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col border border-steel-700 overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-steel-950 border-b border-steel-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="w-8 h-8 rounded-lg bg-brand/20 text-brand flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
                  {document.original_filename}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-steel-800 text-steel-300 uppercase shrink-0">
                  {document.document_type.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-[11px] text-steel-400">
                Uploaded by {document.uploaded_by_name} • {(document.file_size_bytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={streamUrl}
              download={document.original_filename}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-steel-800 hover:bg-steel-700 text-steel-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open New Tab</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-steel-400 hover:text-white rounded-lg hover:bg-steel-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 bg-steel-950 p-2 sm:p-4 overflow-auto flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={`${streamUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-lg border border-steel-800 bg-white"
              title={document.original_filename}
            />
          ) : isImage ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={streamUrl}
                alt={document.original_filename}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-lg border border-steel-800"
              />
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-steel-500 mx-auto" />
              <p className="text-sm font-semibold text-steel-300">
                Preview not directly available for this format.
              </p>
              <a
                href={streamUrl}
                download={document.original_filename}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
