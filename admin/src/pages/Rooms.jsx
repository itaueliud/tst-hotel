import { useState, useEffect } from 'react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../lib/api';

const STATUS_COLORS = { available: 'bg-green-500', occupied: 'bg-red-500', maintenance: 'bg-amber-500' };
const TYPE_LABELS = { standard: 'STD', deluxe: 'DLX', suite: 'STE', executive: 'EXC' };
const TYPE_COLORS = { standard: 'bg-blue-100 text-blue-700', deluxe: 'bg-purple-100 text-purple-700', suite: 'bg-amber-100 text-amber-700', executive: 'bg-rose-100 text-rose-700' };

const EMPTY_ROOM = { room_number: '', floor: 1, type: 'standard', price_night: '', capacity: 2, description: '', amenities: { wifi: true, ac: true, tv: true, minibar: false, safe: false } };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '', floor: '' });
  const [modal, setModal] = useState(null); // null | 'create' | room object
  const [form, setForm] = useState(EMPTY_ROOM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getRooms(Object.fromEntries(Object.entries(filter).filter(([, v]) => v)))
      .then(setRooms).catch(() => setRooms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openCreate = () => { setForm(EMPTY_ROOM); setError(''); setModal('create'); };
  const openEdit = (r) => { setForm({ ...r, amenities: r.amenities || EMPTY_ROOM.amenities }); setError(''); setModal(r); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (modal === 'create') {
        await createRoom({ ...form, floor: parseInt(form.floor), price_night: parseFloat(form.price_night), capacity: parseInt(form.capacity) });
      } else {
        await updateRoom(modal.id, { price_night: parseFloat(form.price_night), description: form.description, amenities: form.amenities, status: form.status });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    try { await updateRoom(id, { status }); load(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try { await deleteRoom(id); load(); } catch {}
  };

  const floors = [...new Set(rooms.map(r => r.floor))].sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{rooms.length} rooms total</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Room</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {['', 'available', 'occupied', 'maintenance'].map(s => (
          <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} className="input text-xs px-3 py-1.5 w-auto">
          <option value="">All Types</option>
          {['standard', 'deluxe', 'suite', 'executive'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Total', rooms.length, 'bg-gray-100 text-gray-700'],
          ['Available', rooms.filter(r => r.status === 'available').length, 'bg-green-100 text-green-700'],
          ['Occupied', rooms.filter(r => r.status === 'occupied').length, 'bg-red-100 text-red-700'],
          ['Maintenance', rooms.filter(r => r.status === 'maintenance').length, 'bg-amber-100 text-amber-700'],
        ].map(([l, v, c]) => (
          <div key={l} className={`card p-4 ${c}`}>
            <div className="text-xs font-medium">{l}</div>
            <div className="text-2xl font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      {/* Floor grid */}
      {loading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : floors.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">No rooms found. Add your first room.</div>
      ) : floors.map(floor => (
        <div key={floor} className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-bold">{floor}</span>
            Floor {floor}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rooms.filter(r => r.floor === floor).map(room => (
              <div key={room.id} className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openEdit(room)}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 text-sm">{room.room_number}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[room.status]}`}></div>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[room.type]}`}>{TYPE_LABELS[room.type]}</span>
                <div className="text-xs text-gray-500 mt-2">KES {parseInt(room.price_night).toLocaleString()}</div>
                <div className="text-xs text-gray-400">👤 {room.capacity}</div>
                <div className="mt-2 hidden group-hover:flex gap-1">
                  {room.status !== 'available' && (
                    <button onClick={e => { e.stopPropagation(); handleStatus(room.id, 'available'); }}
                      className="flex-1 text-xs bg-green-100 text-green-700 rounded px-1 py-0.5">Free</button>
                  )}
                  {room.status !== 'maintenance' && (
                    <button onClick={e => { e.stopPropagation(); handleStatus(room.id, 'maintenance'); }}
                      className="flex-1 text-xs bg-amber-100 text-amber-700 rounded px-1 py-0.5">Maint.</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg text-gray-900">{modal === 'create' ? 'Add New Room' : `Edit Room ${modal.room_number}`}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              {modal === 'create' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Room Number *</label>
                    <input className="input" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="101" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Floor *</label>
                    <input type="number" className="input" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} min={1} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Type *</label>
                    <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {['standard', 'deluxe', 'suite', 'executive'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Capacity</label>
                    <input type="number" className="input" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} min={1} max={10} />
                  </div>
                </div>
              )}
              {modal !== 'create' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['available', 'occupied', 'maintenance'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Price Per Night (KES) *</label>
                <input type="number" className="input" value={form.price_night} onChange={e => setForm({ ...form, price_night: e.target.value })} min={0} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                <textarea className="input resize-none" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(form.amenities || {}).map(k => (
                    <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.amenities[k]} onChange={e => setForm({ ...form, amenities: { ...form.amenities, [k]: e.target.checked } })} className="rounded" />
                      <span className="text-xs text-gray-700 capitalize">{k}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1">Cancel</button>
                {modal !== 'create' && (
                  <button type="button" onClick={() => handleDelete(modal.id)} className="btn-danger">Delete</button>
                )}
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
