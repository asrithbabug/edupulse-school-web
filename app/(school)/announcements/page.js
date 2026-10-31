'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';


export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', priority: 'medium' });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.getAnnouncements();
        setAnnouncements(res && res.data ? res.data : Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn('Failed to fetch announcements:', err.message);
        setAnnouncements([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Backend expects: title, body, category, important
      const payload = {
        title: formData.title,
        body: formData.body,
        category: 'General',
        important: formData.priority === 'high',
      };
      const result = await api.createAnnouncement(payload);
      // Refetch to get server data with proper fields
      const res = await api.getAnnouncements();
      setAnnouncements(res && res.data ? res.data : Array.isArray(res) ? res : []);
      setModalOpen(false);
      setFormData({ title: '', body: '', priority: 'medium' });
    } catch (err) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  const priorityVariant = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'neutral';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Announcements</h2>
          <p className="text-text-secondary text-sm mt-1">Post and manage school announcements</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MegaphoneIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{announcement.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{announcement.body || announcement.content}</p>
                  <p className="text-xs text-text-muted mt-2">{announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : announcement.date}</p>
                </div>
              </div>
              <Badge variant={priorityVariant(announcement.important ? 'high' : announcement.priority || 'medium')}>
                {announcement.important ? 'Important' : announcement.category || 'General'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Announcement title"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Content</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="input-field min-h-[120px] resize-none"
              placeholder="Announcement details..."
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Post</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
