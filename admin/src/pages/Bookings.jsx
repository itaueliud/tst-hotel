import { useState, useEffect } from 'react';
import { getBookings, confirmBooking, checkinBooking, checkoutBooking, cancelBooking } from '../lib/api';

const STATUS_BADGE = { pending: 'badge-pending', confirmed: 'badge-confirmed', checked_in: 'badge-checked_in', checked_out: 'badge-checked_out', cancelled: 'badge-cancelled' };

const ACTIONS = {
  pending: [{ label: 'Confirm', fn: confirmBooking, color: 'btn-primary' }],
  confirmed: [{ label: 'Check In', fn: checkinBooking, color: 'btn-primary' }],
  checked_in: [{ label: 'Check Out', fn: checkoutBooking, color: 'bg-green-600 hover:bg-green-700 text-white btn' }],
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    getBookings(filter ? { status: filter } : {})
      .then(setBookings).catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (fn, id) => {
    setActing(true);
    try { await fn(id); load(); setSelected(null); } catch {}
    finally { setActing(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await cancelBooking(id); load(); setSelected(null); } catch {}
  };

  const filtered = search
    ? bookings.filter(b => b.customer_name?.toLowerCase().includes(search.toLowerCase()) || b.room_number?.includes(search))
    : bookings;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <input
          type="text" placeholder="Search guest or room..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input w-64"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Guest', 'Room', 'Check-in', 'Check-out', 'Guests', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No bookings found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(b)}>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.customer_name || 'Walk-in'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.room_number} <span className="text-gray-400 capitalize text-xs">({b.room_type})</span></td>
                  <td className="px-4 py-3 text-gray-600">{b.check_in}</td>
                  <td className="px-4 py-3 text-gray-600">{b.check_out}</td>
                  <td className="px-4 py-3 text-gray-600">{b.guests}</td>
                  <td className="px-4 py-3 font-medium">KES {parseInt(b.total_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {ACTIONS[b.status]?.map(({ label, fn, color }) => (
                        <button key={label} onClick={() => handleAction(fn, b.id)}
                          className={`${color} text-xs py-1 px-2`}>{label}</button>
                      ))}
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button onClick={() => handleCancel(b.id)}
                          className="text-xs btn border border-red-200 text-red-600 hover:bg-red-50 py-1 px-2">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-gray-900">Booking Detail</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_BADGE[selected.status]}`}>
                  {selected.status?.replace('_', ' ')}
                </span>
              </div>
              {[
                ['Booking ID', selected.id?.slice(0, 8).toUpperCase()],
                ['Guest', selected.customer_name || 'Walk-in'],
                ['Email', selected.customer_email || '—'],
                ['Phone', selected.customer_phone || '—'],
                ['Room', `${selected.room_number} (${selected.room_type})`],
                ['Check-in', selected.check_in],
                ['Check-out', selected.check_out],
                ['Guests', selected.guests],
                ['Total', `KES ${parseInt(selected.total_amount || 0).toLocaleString()}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{v}</span>
                </div>
              ))}
              {selected.special_requests && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Special Requests</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selected.special_requests}</div>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              {ACTIONS[selected.status]?.map(({ label, fn, color }) => (
                <button key={label} onClick={() => handleAction(fn, selected.id)} disabled={acting}
                  className={`${color} flex-1 disabled:opacity-60`}>{label}</button>
              ))}
              {['pending', 'confirmed'].includes(selected.status) && (
                <button onClick={() => handleCancel(selected.id)} className="btn-danger">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
