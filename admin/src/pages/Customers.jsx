import { useState, useEffect } from 'react';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deactivateCustomer } from '../lib/api';

const TIER_BADGE = { vip: 'badge-vip', regular: 'badge-regular', new: 'badge-new' };
const EMPTY = { full_name: '', email: '', phone: '', id_number: '', nationality: '', notes: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getCustomers({ search, tier: tierFilter })
      .then(setCustomers).catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tierFilter]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openDetail = async (id) => {
    try { setDetail(await getCustomer(id)); } catch {}
  };

  const openCreate = () => { setForm(EMPTY); setError(''); setModal('create'); };
  const openEdit = (c) => { setForm({ ...c }); setError(''); setModal(c); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (modal === 'create') await createCustomer(form);
      else await updateCustomer(modal.id, form);
      setModal(null); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this customer?')) return;
    try { await deactivateCustomer(id); load(); setDetail(null); } catch {}
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'ID Number', 'Nationality', 'Tier', 'Total Stays'];
    const rows = customers.map(c => [c.full_name, c.email, c.phone, c.id_number, c.nationality, c.tier, c.total_stays]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'tst_customers.csv'; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} guest{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-outline text-xs">⬇ Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ Add Guest</button>
        </div>
      </div>

      {/* Tier stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ['Total', customers.length, 'bg-gray-100 text-gray-700'],
          ['VIP', customers.filter(c => c.tier === 'vip').length, 'bg-yellow-100 text-yellow-700'],
          ['Regular', customers.filter(c => c.tier === 'regular').length, 'bg-blue-100 text-blue-700'],
        ].map(([l, v, c]) => (
          <div key={l} className={`card p-4 ${c}`}>
            <div className="text-xs font-medium">{l}</div>
            <div className="text-2xl font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input type="text" placeholder="Search by name, email or phone..."
            value={search} onChange={e => setSearch(e.target.value)} className="input flex-1 max-w-xs" />
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <div className="flex gap-2">
          {['', 'new', 'regular', 'vip'].map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${tierFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {t === '' ? 'All Tiers' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Guest', 'Contact', 'ID / Passport', 'Tier', 'Stays', 'Last Stay', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No customers found</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {c.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.full_name}</div>
                        <div className="text-xs text-gray-400">{c.nationality}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{c.email}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.id_number || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${TIER_BADGE[c.tier]}`}>{c.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-900">{c.total_stays}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.last_stay ? new Date(c.last_stay).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDetail(c.id)} className="btn text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 py-1 px-2">View</button>
                      <button onClick={() => openEdit(c)} className="btn-primary text-xs py-1 px-2">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-gray-900">Guest Profile</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-700">
                {detail.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{detail.full_name}</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${TIER_BADGE[detail.tier]}`}>{detail.tier}</span>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {[['Email', detail.email], ['Phone', detail.phone], ['ID/Passport', detail.id_number], ['Nationality', detail.nationality], ['Total Stays', detail.total_stays]].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-medium text-gray-900">{v || '—'}</span>
                </div>
              ))}
            </div>
            <h3 className="font-semibold text-gray-800 mb-3">Booking History</h3>
            <div className="space-y-2">
              {detail.bookings?.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">No bookings yet</div>
              ) : detail.bookings?.map(b => (
                <div key={b.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Room {b.room_number}</span>
                    <span className="text-gray-500">{b.check_in} → {b.check_out}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500 capitalize">{b.status?.replace('_', ' ')}</span>
                    <span className="font-medium">KES {parseInt(b.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => { openEdit(detail); setDetail(null); }} className="btn-primary flex-1">Edit</button>
              <button onClick={() => handleDeactivate(detail.id)} className="btn-danger">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-gray-900">{modal === 'create' ? 'Add Guest' : 'Edit Guest'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
                  <input className="input" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                  <input type="email" className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
                  <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">ID / Passport</label>
                  <input className="input" value={form.id_number || ''} onChange={e => setForm({ ...form, id_number: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nationality</label>
                  <input className="input" value={form.nationality || ''} onChange={e => setForm({ ...form, nationality: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
                <textarea className="input resize-none" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
