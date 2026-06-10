'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, hasAccess } from '@/lib/auth';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
      <div className="text-slate-600">Loading...</div>
    </div>;
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      id: 'self-review',
      label: 'Self Review',
      icon: '📋',
      description: 'Complete your performance review',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'leader-review',
      label: 'Leader Review',
      icon: '👥',
      description: 'Evaluate your team members',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      icon: '📊',
      description: 'View all submissions & analytics',
      color: 'from-slate-700 to-slate-800',
    },
  ];

  const roleLabels = {
    admin: '🔑 Administrator',
    leader: '👨‍💼 Department Leader',
    employee: '👤 Employee',
  };

  const roleDescriptions = {
    admin: 'Full access to all features and data',
    leader: 'Can review team members and submit self-review',
    employee: 'Can submit your own performance review',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/tassure-logo.png"
              alt="Tassure"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Review System</h1>
              <p className="text-xs text-slate-500">Performance Evaluation Platform</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* User Info Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/80 p-8 mb-12 shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h2>
              <p className="text-slate-600">{user.email}</p>
              {user.department && (
                <p className="text-sm text-slate-500 mt-1">{user.department}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl mb-2">{roleLabels[user.role].split(' ')[0]}</div>
              <p className="font-semibold text-slate-900">{roleLabels[user.role]}</p>
              <p className="text-xs text-slate-600 mt-1">{roleDescriptions[user.role]}</p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex gap-2 flex-wrap">
            {user.role === 'admin' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-xs font-semibold text-red-700">FULL ACCESS</span>
              </span>
            )}
            {user.role === 'leader' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="text-xs font-semibold text-purple-700">LIMITED ACCESS</span>
              </span>
            )}
            {user.role === 'employee' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-xs font-semibold text-blue-700">BASIC ACCESS</span>
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6">Available Functions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const hasPermission = hasAccess(user.role, item.id);

              if (!hasPermission) {
                return (
                  <div
                    key={item.id}
                    className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 p-px opacity-50 cursor-not-allowed"
                  >
                    <div className="bg-white/50 rounded-2xl p-8 flex flex-col items-center justify-center h-full text-center">
                      <div className="text-4xl mb-4 opacity-50">{item.icon}</div>
                      <h4 className="font-bold text-slate-400 mb-2">{item.label}</h4>
                      <p className="text-xs text-slate-400 mb-4">{item.description}</p>
                      <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        ⛔ Restricted
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/${item.id}`}
                  className="relative group rounded-2xl overflow-hidden bg-gradient-to-br p-px hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`bg-gradient-to-br ${item.color} rounded-2xl p-8 flex flex-col items-center justify-center h-full text-center text-white relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                    {/* 背景光晕 */}
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>

                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <h4 className="font-bold text-lg mb-2 relative z-10">{item.label}</h4>
                    <p className="text-sm opacity-90 relative z-10">{item.description}</p>
                    <div className="mt-4 text-xs font-semibold opacity-75 relative z-10">→ Open</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">ℹ️ Note:</span> Your access level is <span className="font-bold">{roleLabels[user.role]}</span>. You can only access features available for your role. Contact your administrator if you believe this is incorrect.
          </p>
        </div>
      </div>
    </div>
  );
}
