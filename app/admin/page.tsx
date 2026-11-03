'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { SaasDashboardView } from '@/components/admin/SaasDashboardView';
import { AdminStockEntryForm } from '@/components/admin/AdminStockEntryForm';
import { X } from 'lucide-react';

export default function SaasAdminDashboardPage() {
  const router = useRouter();
  const [lots, setLots] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [billsCount, setBillsCount] = useState(0);
  const [movementsCount, setMovementsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [stockRes, billsRes, movementsRes] = await Promise.all([
        fetch('/api/stock', { cache: 'no-store' }),
        fetch('/api/admin/bills', { cache: 'no-store' }),
        fetch('/api/admin/movements', { cache: 'no-store' }),
      ]);

      const stockJson = await stockRes.json();
      if (stockJson.success) {
        setLots(stockJson.data || []);
        setMetrics(stockJson.metrics || null);
      }

      const billsJson = await billsRes.json();
      if (billsJson.success && billsJson.data) {
        setBillsCount(billsJson.data.length);
      }

      const movementsJson = await movementsRes.json();
      if (movementsJson.success) {
        setMovementsCount(typeof movementsJson.totalCount === 'number' ? movementsJson.totalCount : 0);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <SaasAdminLayout
      lotsCount={lots.length}
      billsCount={billsCount}
      movementsCount={movementsCount}
      onQuickNewLot={() => setShowStockModal(true)}
    >
      <SaasDashboardView
        lots={lots}
        metrics={metrics}
        billsCount={billsCount}
        onRefresh={loadDashboardData}
        onOpenConsignmentModal={() => router.push('/admin/bills')}
        onOpenAdjustModal={() => setShowStockModal(true)}
      />

      {/* Stock Entry & Adjustment Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-steel-200 animate-saas-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowStockModal(false)}
              aria-label="Close modal"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-steel-100 hover:bg-steel-200 flex items-center justify-center text-steel-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-[#111827]">New Inward Stock Lot Entry</h2>
              <p className="text-xs text-steel-500 mt-0.5">
                Record physical TMT inward rebar bundles into PostgreSQL inventory ledger.
              </p>
            </div>

            <AdminStockEntryForm
              onSuccess={() => {
                setShowStockModal(false);
                loadDashboardData();
              }}
            />
          </div>
        </div>
      )}
    </SaasAdminLayout>
  );
}
