'use client';

import { useEffect, useState } from 'react';
import { LifebuoyIcon, PlusIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

const STATUS_VARIANT = { open: 'danger', in_progress: 'warning', resolved: 'success', closed: 'neutral' };
const CATEGORIES = ['Login / access', 'Students & admissions', 'Staff', 'Fees', 'Attendance', 'Mobile app', 'Billing', 'Other'];
const emptyForm = { subject: '', description: '', category: CATEGORIES[0], priority: 'medium' };

/** Requests to the EduPulse team. They are answered in the EduPulse admin panel. */
export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      const { data } = await api.getSupportTickets();
      setTickets(data);
    } catch (err) {
      console.warn('Failed to load tickets:', err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createSupportTicket(form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.message || 'Failed to send your request');
    }
    setSaving(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <LifebuoyIcon className="w-7 h-7 text-primary" /> Help & Support
          </h2>
          <p className="text-text-secondary text-sm mt-1">Tell the EduPulse team about a problem or a request.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="w-4 h-4" /> New request
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-sm text-text-secondary">No requests yet.</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">#{ticket.id} · {ticket.subject}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {ticket.category || 'General'} · {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[ticket.status] || 'neutral'}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mt-3 whitespace-pre-line">{ticket.description}</p>
              {ticket.resolution && (
                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs font-medium text-green-800 mb-1">EduPulse reply</p>
                  <p className="text-sm text-green-900 whitespace-pre-line">{ticket.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New support request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Subject *</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input-field"
              maxLength={200}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Urgency</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical: school cannot work</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Details *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={5}
              maxLength={5000}
              placeholder="What happened, on which screen, and for which student or staff ID?"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Sending...' : 'Send'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
