import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const FEATURED_ROOMS = [
  { id: 'standard', name: 'Standard Room', price: 4500, type: 'standard', desc: 'Cozy and well-appointed room with garden view, perfect for solo or couple stays.', amenities: ['WiFi', 'AC', 'TV'], capacity: 2 },
  { id: 'deluxe', name: 'Deluxe Room', price: 7500, type: 'deluxe', desc: 'Spacious room with city views, sitting area, and premium furnishings.', amenities: ['WiFi', 'AC', 'TV', 'Minibar'], capacity: 3 },
  { id: 'suite', name: 'Luxury Suite', price: 15000, type: 'suite', desc: 'Expansive suite with separate living area, kitchenette, and stunning pool view.', amenities: ['WiFi', 'AC', 'TV', 'Minibar', 'Safe'], capacity: 4 },
];

const AMENITIES = [
  { icon: '🏊', name: 'Swimming Pool', desc: 'Heated outdoor pool open 6AM–10PM' },
  { icon: '🍽️', name: 'Restaurant', desc: 'Fine dining with local & international cuisine' },
  { icon: '💆', name: 'Spa & Wellness', desc: 'Full-service spa and massage center' },
  { icon: '🏋️', name: 'Fitness Center', desc: '24/7 fully equipped gymnasium' },
  { icon: '🚗', name: 'Free Parking', desc: 'Secure on-site parking for all guests' },
  { icon: '📶', name: 'Free WiFi', desc: 'High-speed internet throughout the property' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', rating: 5, text: 'Absolutely stunning hotel! The staff were incredibly welcoming and the room was immaculate. Will definitely return.' },
  { name: 'Michael O.', rating: 5, text: 'Best hotel in Nyeri by far. The executive suite was worth every shilling. Highly recommended for business travelers.' },
  { name: 'Amina H.', rating: 5, text: 'Wonderful family stay. The kids loved the pool and the breakfast buffet was spectacular.' },
];

export default function HomePage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [search, setSearch] = useState({ check_in: today, check_out: tomorrow, guests: 1, type: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(search);
    router.push(`/rooms?${params.toString()}`);
  };

  const typeColors = { standard: 'bg-blue-100 text-blue-700', deluxe: 'bg-purple-100 text-purple-700', suite: 'bg-amber-100 text-amber-700' };

  return (
    <>
      <Head>
        <title>TST Hotels & Lodges — Premium Hospitality in Nyeri</title>
        <meta name="description" content="Experience premium hospitality at TST Hotels & Lodges, Nyeri. Book rooms, suites and executive lodges online." />
      </Head>
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 text-white pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-block bg-primary-600/30 border border-primary-500/50 px-4 py-1 rounded-full text-primary-300 text-sm font-medium mb-6">
            ⭐ Nyeri's Premier Hotel
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Welcome to<br />
            <span className="text-primary-400">TST Hotels</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Experience unparalleled luxury and comfort in the heart of Nyeri. Your perfect getaway starts here.
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-2xl text-gray-900 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Check-in</label>
                <input type="date" value={search.check_in} min={today}
                  onChange={e => setSearch({...search, check_in: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Check-out</label>
                <input type="date" value={search.check_out} min={search.check_in}
                  onChange={e => setSearch({...search, check_out: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Guests</label>
                <select value={search.guests} onChange={e => setSearch({...search, guests: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Room Type</label>
                <select value={search.type} onChange={e => setSearch({...search, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Any Type</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold transition-colors text-sm">
                  Search Rooms
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['10+', 'Premium Rooms'], ['98%', 'Guest Satisfaction'], ['15+', 'Years Operating'], ['24/7', 'Guest Support']].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl font-bold">{n}</div>
              <div className="text-primary-200 text-sm mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Rooms & Suites</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">From cozy standard rooms to lavish executive suites — we have the perfect space for every occasion</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURED_ROOMS.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="h-52 bg-gradient-to-br from-gray-700 to-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-50">🏨</div>
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold capitalize ${typeColors[room.type]}`}>
                    {room.type}
                  </span>
                  <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full">
                    <span className="font-bold text-primary-600">KES {room.price.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs">/night</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{room.name}</h3>
                  <p className="text-gray-500 text-sm mb-3">{room.desc}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {room.amenities.map(a => (
                      <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a}</span>
                    ))}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">👤 Max {room.capacity}</span>
                  </div>
                  <Link href={`/rooms?type=${room.type}`} className="block text-center btn-primary text-sm py-2">Book This Room</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/rooms" className="btn-outline">View All Rooms</Link>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Hotel Amenities</h2>
            <p className="text-gray-500 text-lg">Everything you need for a perfect stay</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {AMENITIES.map((a) => (
              <div key={a.name} className="flex items-start space-x-4 p-5 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors">
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{a.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Guest Reviews</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex text-yellow-400 mb-3">{'★'.repeat(t.rating)}</div>
                <p className="text-gray-600 italic mb-4">"{t.text}"</p>
                <div className="font-semibold text-gray-900">— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready for Your Stay?</h2>
        <p className="text-primary-200 mb-8 text-lg">Book directly for the best rates. Instant confirmation.</p>
        <Link href="/rooms" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-colors">
          Book Your Room Now
        </Link>
      </section>

      <Footer />
    </>
  );
}
