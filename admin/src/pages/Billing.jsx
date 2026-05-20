import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { getInvoices, generateInvoice, refundInvoice, recordCashPayment, getBookings } from '../lib/api';

const STATUS_BADGE = { pending: 'badge-pending', paid: 'badge-paid', failed: 'bg-red-100 text-red-700', refunded: 'badge-refunded' };
const PAY_ICONS = { card: '💳', mobile_money: '📱', cash: '💵', bank_transfer: '🏦' };
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [genModal, setGenModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [genForm, setGenForm] = useState({ booking_id: '', payment_method: 'cash', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [payModal, setPayModal] = useState(null);

  const load = () => {
    setLoading(true);
    getInvoices(filter ? { status: filter } : {})
      .then(setInvoices).catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openGenModal = async () => {
    try {
      const b = await getBookings({ status: 'confirmed' });
      setBookings(b);
    } catch { setBookings([]); }
    setGenForm({ booking_id: '', payment_method: 'cash', notes: '' });
    setError('');
    setGenModal(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await generateInvoice(genForm);
      setGenModal(false); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate invoice');
    } finally { setSaving(false); }
  };

  const handlePayCash = async (invoice) => {
    try { await recordCashPayment({ invoice_id: invoice.id }); load(); setPayModal(null); } catch {}
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Process refund for this invoice?')) return;
    try { await refundInvoice(id); load(); } catch {}
  };

  const total = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const paid = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const pending = invoices.filter(i => i.payment_status === 'pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const refunded = invoices.filter(i => i.payment_status === 'refunded').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

  const methodData = Object.entries(
    invoices.filter(i => i.payment_status === 'paid').reduce((acc, i) => {
      acc[i.payment_method || 'cash'] = (acc[i.payment_method || 'cash'] || 0) + parseFloat(i.amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value) }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openGenModal} className="btn-primary">+ Generate Invoice</button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Total Billed', total, 'text-gray-900'],
          ['Paid', paid, 'text-green-600'],
          ['Pending', pending, 'text-yellow-600'],
          ['Refunded', refunded, 'text-purple-600'],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-4">
            <div className="text-xs text-gray-500 mb-1">{l}</div>
            <div className={`text-xl font-bold ${c}`}>KES {Math.round(v).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Payment method chart */}
      {methodData.length > 0 && (
        <div className="card p-5 max-w-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={methodData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend iconSize={10} iconType="circle" formatter={(v) => <span className="text-xs capitalize">{v?.replace('_', ' ')}</span>} />
              <Tooltip formatter={(v) => `KES ${parseInt(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'paid', 'refunded'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Invoices table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Invoice #', 'Guest', 'Room', 'Check-in', 'Amount', 'Tax', 'Method', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No invoices found</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setPayModal(inv)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.room_number}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{inv.check_in}</td>
                  <td className="px-4 py-3 font-medium">KES {parseInt(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">KES {parseInt(inv.tax || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-base" title={inv.payment_method}>{PAY_ICONS[inv.payment_method] || '—'}</span>
                    <span className="ml-1 text-xs text-gray-500 capitalize">{inv.payment_method?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[inv.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {inv.payment_status === 'pending' && (
                        <button onClick={() => handlePayCash(inv)} className="btn-primary text-xs py-1 px-2">Mark Paid</button>
                      )}
                      {inv.payment_status === 'paid' && (
                        <button onClick={() => handleRefund(inv.id)} className="text-xs btn border border-purple-200 text-purple-600 hover:bg-purple-50 py-1 px-2">Refund</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={() => setPayModal(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-gray-900">{payModal.invoice_number}</h2>
              <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              {[
                ['Guest', payModal.customer_name],
                ['Email', payModal.customer_email],
                ['Phone', payModal.customer_phone],
                ['Room', `${payModal.room_number} (${payModal.room_type})`],
                ['Check-in', payModal.check_in],
                ['Check-out', payModal.check_out],
                ['Amount', `KES ${parseInt(payModal.amount).toLocaleString()}`],
                ['Tax (16%)', `KES ${parseInt(payModal.tax || 0).toLocaleString()}`],
                ['Total', `KES ${(parseInt(payModal.amount) + parseInt(payModal.tax || 0)).toLocaleString()}`],
                ['Payment Method', payModal.payment_method?.replace('_', ' ') || '—'],
                ['Status', payModal.payment_status],
                ['Paid At', payModal.paid_at ? new Date(payModal.paid_at).toLocaleString() : '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-medium text-gray-900 text-right capitalize">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              {payModal.payment_status === 'pending' && (
                <button onClick={() => handlePayCash(payModal)} className="btn-primary flex-1">Mark as Paid</button>
              )}
              {payModal.payment_status === 'paid' && (
                <button onClick={() => { handleRefund(payModal.id); setPayModal(null); }} className="btn border border-purple-200 text-purple-600 hover:bg-purple-50 flex-1">Process Refund</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {genModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-gray-900">Generate Invoice</h2>
              <button onClick={() => setGenModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Booking *</label>
                <select className="input" value={genForm.booking_id} onChange={e => setGenForm({ ...genForm, booking_id: e.target.value })} required>
                  <option value="">Select a confirmed booking</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.customer_name || 'Walk-in'} — Room {b.room_number} ({b.check_in})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Method</label>
                <select className="input" value={genForm.payment_method} onChange={e => setGenForm({ ...genForm, payment_method: e.target.value })}>
                  {['cash', 'card', 'mobile_money', 'bank_transfer'].map(m => (
                    <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
                <input className="input" value={genForm.notes} onChange={e => setGenForm({ ...genForm, notes: e.target.value })} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setGenModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Generating...' : 'Generate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
