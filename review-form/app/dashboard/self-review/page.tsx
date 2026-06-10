'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';

export default function SelfReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    department: '',
    name: '',
    period: '',
    clientComplaints: 0,
    clientComplaintsComment: '',
    clientAttrition: 0,
    clientAttritionComment: '',
    minorDelays: 0,
    minorDelaysComment: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData((prev) => ({
      ...prev,
      name: parsedUser.name,
      department: parsedUser.department || '',
    }));
    setLoading(false);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted successfully!');
    // 这里后续会集成 Supabase
    console.log('Form data:', formData);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="file:///C:/Users/vincent/Desktop/TASSURE IN.png"
                alt="Tassure"
                className="h-10 w-auto"
              />
              <span className="font-semibold text-slate-900 hidden sm:inline">Review System</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8">
          ← Back to Dashboard
        </Link>

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/80 p-12 shadow-xl">
          <div className="text-center mb-12 pb-8 border-b border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">📋 Employee Self Review</h1>
            <p className="text-slate-600">Please complete your honest evaluation of your performance this period</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg font-bold text-sm">1</span>
                <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Review Period</label>
                  <input
                    type="text"
                    placeholder="e.g. June 2026"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Client Stability */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg font-bold text-sm">2</span>
                <h2 className="text-lg font-bold text-slate-900">📊 Client Stability</h2>
              </div>

              <div className="space-y-4">
                {/* Client Complaints */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-slate-900">Client Complaints / Issues</p>
                      <p className="text-sm text-slate-600 mt-1">Were there any client complaints, issues, or controllable churn this period?</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={formData.clientComplaints}
                      onChange={(e) => setFormData({ ...formData, clientComplaints: parseInt(e.target.value) })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold text-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Your Comment</label>
                    <textarea
                      rows={3}
                      placeholder="Explain any issues..."
                      value={formData.clientComplaintsComment}
                      onChange={(e) => setFormData({ ...formData, clientComplaintsComment: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-all"
                    ></textarea>
                  </div>
                </div>

                {/* Client Attrition */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-slate-900">Client Attrition</p>
                      <p className="text-sm text-slate-600 mt-1">Was there client loss due to lack of follow-up or unresolved issues?</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={formData.clientAttrition}
                      onChange={(e) => setFormData({ ...formData, clientAttrition: parseInt(e.target.value) })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold text-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Your Comment</label>
                    <textarea
                      rows={3}
                      placeholder="Provide context..."
                      value={formData.clientAttritionComment}
                      onChange={(e) => setFormData({ ...formData, clientAttritionComment: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-all"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-8 border-t border-slate-200">
              <button
                type="reset"
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Submit Self Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
