'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Invalid credentials');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-steel-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-brand text-white items-center justify-center font-extrabold text-xl shadow-md mx-auto">
            TS
          </div>
          <h1 className="text-xl font-extrabold text-accent">Thirupathi Steels Yard Admin</h1>
          <p className="text-xs text-steel-500">
            Secure inventory management portal for authorized Salem yard dispatch and weighbridge personnel.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-accent mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-accent mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center cursor-pointer mt-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            <span>Sign In to Yard Portal</span>
          </Button>
        </form>

        <div className="pt-4 border-t border-steel-100 flex items-center justify-center gap-1.5 text-[11px] text-steel-500">
          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          <span>Server-side HMAC-SHA256 authenticated session</span>
        </div>
      </div>
    </div>
  );
}
