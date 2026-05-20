import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getDashboardStats, getRecentBookings, getWeeklyRevenue } from '../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function KPICard({ icon, label, value, sub, color }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const STATUS_BADGE = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  checked_in: 'badge-checked_in', checked_out: 'badge-checked_out', cancelled: 'badge-cancelled'
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentBookings(), getWeeklyRevenue()])
      .then(([s, b, r]) => { setStats(s); setBookings(b); setRevenue(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const roomPie = stats ? [
    { name: 'Available', value: parseInt(stats.rooms.available) || 0 },
    { name: 'Occupied', value: parseInt(stats.rooms.occupied) || 0 },
    { name: 'Maintenance', value: parseInt(stats.rooms.maintenance) || 0 },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Operations Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Real-time snapshot of hotel operations</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="🏨" label="Total Rooms" value={stats?.rooms?.total || 0} sub={`${stats?.rooms?.available || 0} available`} color="bg-blue-100" />
        <KPICard icon="🛏️" label="Occupied" value={stats?.rooms?.occupied || 0} sub={`${stats?.rooms?.maintenance || 0} maintenance`} color="bg-red-100" />
        <KPICard icon="📅" label="Bookings Today" value={stats?.bookings?.today || 0} sub={`${stats?.bookings?.checked_in || 0} checked in`} color="bg-green-100" />
        <KPICard icon="💰" label="Today's Revenue" value={`KES ${parseInt(stats?.revenue?.today || 0).toLocaleString()}`} sub={`KES ${parseInt(stats?.revenue?.pending || 0).toLocaleString()} pending`} color="bg-amber-100" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Weekly Revenue (KES)</h3>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`KES ${parseInt(v).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Room Status</h3>
          {roomPie.some(r => r.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roomPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {roomPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend iconSize={10} iconType="circle" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No room data yet</div>
          )}
        </div>
      </div>

      {/* Revenue summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', val: stats?.revenue?.total, color: 'text-gray-900' },
          { label: 'Paid', val: stats?.revenue?.paid, color: 'text-green-600' },
          { label: 'Pending', val: stats?.revenue?.pending, color: 'text-yellow-600' },
          { label: 'Refunded', val: stats?.revenue?.refunded, color: 'text-red-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-lg font-bold ${color}`}>KES {parseInt(val || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Guest', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No bookings yet</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{b.customer_name || 'Walk-in'}</td>
                  <td className="px-5 py-3 text-gray-600">{b.room_number} <span className="text-gray-400 capitalize">({b.room_type})</span></td>
                  <td className="px-5 py-3 text-gray-600">{b.check_in}</td>
                  <td className="px-5 py-3 text-gray-600">{b.check_out}</td>
                  <td className="px-5 py-3 font-medium">KES {parseInt(b.total_amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
