'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';


export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.getSchoolProfile();
        setProfile(res || null);
      } catch (err) {
        console.warn('Failed to fetch school profile:', err.message);
        setProfile(null);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      setProfile(await api.updateSchoolProfile(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    }
    setSaving(false);
  };

  const handleChange = (field, value) => {
    setProfile({ ...(profile || {}), [field]: value });
  };

  if (loading) return <LoadingSpinner />;

  // If profile is null (API unreachable), show empty state
  const p = profile || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
        <p className="text-text-secondary text-sm mt-1">Manage school profile and configuration</p>
      </div>

      <div className="card max-w-2xl">
        <h3 className="text-lg font-semibold text-text-primary mb-6">School Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">School Name</label>
              <input
                type="text"
                value={p.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Principal</label>
              <input
                type="text"
                value={p.principal || ''}
                onChange={(e) => handleChange('principal', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Address</label>
            <input
              type="text"
              value={p.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Phone</label>
              <input
                type="tel"
                value={p.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Email</label>
              <input
                type="email"
                value={p.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Board</label>
              <select
                value={p.board || ''}
                onChange={(e) => handleChange('board', e.target.value)}
                className="input-field"
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
                <option value="IB">IB</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Established</label>
              <input
                type="text"
                value={p.established || ''}
                onChange={(e) => handleChange('established', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Website</label>
              <input
                type="url"
                value={p.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span className="text-sm text-success font-medium">Saved successfully!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
