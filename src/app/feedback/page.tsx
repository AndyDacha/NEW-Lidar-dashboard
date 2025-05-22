"use client";
import { useState, useEffect } from 'react';

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  page: string;
  type: string;
  benefit: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [form, setForm] = useState({ name: '', email: '', page: '', type: 'Bug', benefit: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch feedback on mount
  useEffect(() => {
    fetch('/api/feedback')
      .then(res => res.json())
      .then(setFeedback);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess('Feedback submitted!');
      setForm({ name: '', email: '', page: '', type: 'Bug', benefit: '', message: '' });
      const updated = await res.json();
      setFeedback(updated);
    } else {
      setError('Failed to submit feedback.');
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    const res = await fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFeedback(updated);
    }
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-orange">Feedback & Feature Requests</h1>
        <a href="/dashboard" className="text-brand-orange underline hover:text-orange-700">Back to Dashboard</a>
      </div>
      <div className="max-w-2xl mx-auto bg-gray-50 rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-brand-orange mb-2">Submit Feedback or Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Page / Section</label>
            <input name="page" value={form.page} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g. Dashboard, Reporting, etc." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type of Request</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="Bug">Bug</option>
              <option value="Enhancement">Enhancement</option>
              <option value="Change">Change</option>
              <option value="General Feedback">General Feedback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message / Requirement</label>
            <textarea name="message" value={form.message} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Benefit / Reason</label>
            <textarea name="benefit" value={form.benefit} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} required />
          </div>
          <button type="submit" className="bg-brand-orange text-white font-bold py-2 px-6 rounded shadow hover:bg-orange-600" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </form>
      </div>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-brand-orange mb-4">All Feedback & Requests</h2>
        <ul className="space-y-4">
          {feedback.map(item => (
            <li key={item.id} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-brand-orange">{item.name}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${item.status === 'Completed' ? 'bg-green-200 text-green-800' : item.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : item.status === 'Open' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>{item.status}</span>
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(item.id, e.target.value)}
                  className="ml-2 text-xs px-2 py-1 rounded border border-gray-300"
                  disabled={updating === item.id}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 mb-1">{item.page} | {item.type}</div>
              <div className="text-gray-700 mb-1">{item.message}</div>
              <div className="text-xs text-gray-500 mb-1">Benefit: {item.benefit}</div>
              <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()} | {item.email}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 