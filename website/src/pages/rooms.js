import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getAvailableRooms, getRooms } from '../lib/api';

const AMENITY_ICONS = { wifi: '📶', ac: '❄️', tv: '📺', minibar: '🍾', safe: '🔒', balcony: '🌿', bathtub: '🛁' };
const TYPE_COLORS = { standard: 'bg-blue-100 text-blue-700', deluxe: 'bg-purple-100 text-purple-700', suite: 'bg-amber-100 text-amber-700', executive: 'bg-rose-100 text-rose-700' };

export default function RoomsPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    check_in: router.query.check_in || today,
    check_out: router.query.check_out || tomorrow,
    guests: router.query.guests || 1,
    type: router.query.type || ''
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchRooms = async (f) => {
    setLoading(true);
    try {
      const data = await getAvailableRooms(f);
      setRooms(data);
      setSearched(true);
    } catch {
      // Fallback to all rooms if API not available
      try {
        const all = await getRooms({ type: f.type });
        setRooms(all);
        setSearched(true);
      } catch {
        setRooms([]);
        setSearched(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      const f = {
        check_in: router.query.check_in || today,
        check_out: router.query.check_out || tomorrow,
        guests: router.query.guests || 1,
        type: router.query.type || ''
      };
      setFilters(f);
      fetchRooms(f);
    }
  }, [router.isReady]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRooms(filters);
  };

  const nights = Math.max(1, Math.ceil((new Date(filters.check_out) - new Date(filters.check_in)) / 86400000));

  return (
    <>
      <Head>
        <title>Available Rooms — TST Hotels & Lodges</title>
      </Head>
      <Header />
      <div className="pt-16">
        {/* Search Bar */}
        <div className="bg-gray-900 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-white text-2xl font-bold mb-4 text-center">Find Your Perfect Room</h1>
            <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Check-in</label>
                <input type="date" value={filters.check_in} min={today}
                  onChange={e => setFilters({...filters, check_in: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Check-out</label>
                <input type="date" value={filters.check_out} min={filters.check_in}
                  onChange={e => setFilters({...filters, check_out: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Guests</label>
                <select value={filters.guests} onChange={e => setFilters({...filters, guests: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Room Type</label>
                <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">All Types</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full btn-primary text-sm py-2">Search</button>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Searching available rooms...</p>
            </div>
          ) : searched && rooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No rooms available</h3>
              <p className="text-gray-500">Try different dates or room type</p>
            </div>
          ) : (
            <>
              {searched && <p className="text-gray-600 mb-6">{rooms.length} room{rooms.length !== 1 ? 's' : ''} available · {nights} night{nights !== 1 ? 's' : ''}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                  <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">🏨</div>
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_COLORS[room.type]}`}>{room.type}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Available</span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/95 px-3 py-1.5 rounded-lg shadow">
                        <span className="font-bold text-primary-600 text-lg">KES {parseInt(room.price_night).toLocaleString()}</span>
                        <span className="text-gray-400 text-xs">/night</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900">Room {room.room_number}</h3>
                        <span className="text-xs text-gray-500">Floor {room.floor} · Max {room.capacity} 👤</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{room.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {room.amenities && Object.entries(room.amenities)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded" title={k}>
                              {AMENITY_ICONS[k] || '✓'} {k}
                            </span>
                          ))}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 text-center py-2 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500">Total ({nights}N)</div>
                          <div className="font-bold text-gray-900">KES {(room.price_night * nights).toLocaleString()}</div>
                        </div>
                        <Link href={`/book?room_id=${room.id}&check_in=${filters.check_in}&check_out=${filters.check_out}&guests=${filters.guests}`}
                          className="flex-1 btn-primary text-sm text-center py-2">
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
