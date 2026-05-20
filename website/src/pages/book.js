import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getRoom, createBooking, initiateMpesa, processStripePayment } from '../lib/api';

const STEPS = ['Your Details', 'Payment', 'Confirmation'];

export default function BookPage() {
  const router = useRouter();
  const { room_id, check_in, check_out, guests } = router.query;

  const [room, setRoom] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState('card');

  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    guest_id_number: '', special_requests: ''
  });

  const nights = check_in && check_out ? Math.max(1, Math.ceil((new Date(check_out) - new Date(check_in)) / 86400000)) : 1;
  const total = room ? room.price_night * nights : 0;
  const tax = total * 0.16;

  useEffect(() => {
    if (room_id) {
      getRoom(room_id).then(setRoom).catch(() => {});
    }
  }, [room_id]);

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.guest_email || !form.guest_phone) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep(1);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newBooking = await createBooking({
        room_id, check_in, check_out,
        guests: parseInt(guests) || 1,
        ...form
      });
      setBooking(newBooking);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!router.isReady) return null;

  return (
    <>
      <Head><title>Book Room — TST Hotels & Lodges</title></Head>
      <Header />
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${i === step ? 'text-primary-600' : 'text-gray-500'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left panel */}
            <div className="lg:col-span-2">
              {step === 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Your Details</h2>
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
                  <form onSubmit={handleGuestSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Full Name *</label>
                        <input type="text" value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})}
                          placeholder="John Doe" required
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Email Address *</label>
                        <input type="email" value={form.guest_email} onChange={e => setForm({...form, guest_email: e.target.value})}
                          placeholder="john@example.com" required
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Phone Number *</label>
                        <input type="tel" value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})}
                          placeholder="+254 7XX XXX XXX" required
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">National ID / Passport</label>
                        <input type="text" value={form.guest_id_number} onChange={e => setForm({...form, guest_id_number: e.target.value})}
                          placeholder="ID/Passport number"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">Special Requests</label>
                      <textarea value={form.special_requests} onChange={e => setForm({...form, special_requests: e.target.value})}
                        placeholder="Early check-in, dietary requirements, etc."
                        rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                    </div>
                    <button type="submit" className="btn-primary w-full">Continue to Payment</button>
                  </form>
                </div>
              )}

              {step === 1 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Payment Method</h2>
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[['card','💳','Credit/Debit Card'],['mobile_money','📱','M-Pesa'],['bank_transfer','🏦','Bank Transfer']].map(([v,icon,label]) => (
                      <button key={v} type="button" onClick={() => setPayMethod(v)}
                        className={`p-4 border-2 rounded-xl text-center transition-colors ${payMethod===v ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="text-2xl mb-1">{icon}</div>
                        <div className="text-xs font-medium text-gray-700">{label}</div>
                      </button>
                    ))}
                  </div>

                  {payMethod === 'card' && (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Card Number</label>
                        <input type="text" placeholder="4242 4242 4242 4242" maxLength={19}
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Expiry</label>
                          <input type="text" placeholder="MM/YY"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">CVV</label>
                          <input type="text" placeholder="123" maxLength={4}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  )}
                  {payMethod === 'mobile_money' && (
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-700 block mb-1">M-Pesa Phone Number</label>
                      <input type="tel" placeholder="+254 7XX XXX XXX" defaultValue={form.guest_phone}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      <p className="text-xs text-gray-500 mt-2">An STK push will be sent to your phone to complete payment.</p>
                    </div>
                  )}
                  {payMethod === 'bank_transfer' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
                      <p className="font-semibold mb-2">Bank Transfer Details:</p>
                      <p>Bank: Kenya Commercial Bank</p>
                      <p>Account: 1234567890</p>
                      <p>Name: TST Hotels & Lodges Ltd</p>
                      <p>Reference: Your booking reference</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="btn-outline flex-1">Back</button>
                    <button onClick={handlePayment} disabled={loading}
                      className="btn-primary flex-1 disabled:opacity-60">
                      {loading ? 'Processing...' : `Pay KES ${(total + tax).toLocaleString()}`}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-500 mb-6">Your reservation has been received. A confirmation will be sent to {form.guest_email}.</p>
                  {booking && (
                    <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                      <p className="text-sm text-gray-600"><span className="font-semibold">Booking ID:</span> {booking.id?.slice(0,8).toUpperCase()}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Guest:</span> {form.guest_name}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Check-in:</span> {check_in}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Check-out:</span> {check_out}</p>
                    </div>
                  )}
                  <Link href="/" className="btn-primary">Return Home</Link>
                </div>
              )}
            </div>

            {/* Right: Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>
                <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center text-4xl mb-4">🏨</div>
                {room ? (
                  <>
                    <div className="font-semibold text-gray-900 mb-1">Room {room.room_number}</div>
                    <div className="text-sm text-gray-500 capitalize mb-4">{room.type} Room · Floor {room.floor}</div>
                    <div className="space-y-2 text-sm border-t pt-4">
                      <div className="flex justify-between"><span className="text-gray-600">Check-in</span><span className="font-medium">{check_in}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Check-out</span><span className="font-medium">{check_out}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Guests</span><span className="font-medium">{guests}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Nights</span><span className="font-medium">{nights}</span></div>
                    </div>
                    <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Room ({nights}N)</span><span>KES {total.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Tax (16% VAT)</span><span>KES {Math.round(tax).toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Total</span><span className="text-primary-600">KES {Math.round(total + tax).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-center py-4">Loading room details...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
