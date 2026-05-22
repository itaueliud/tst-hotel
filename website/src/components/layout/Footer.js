import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">TST</span>
              </div>
              <div>
                <div className="font-bold text-white">TST Hotels</div>
                <div className="text-xs text-gray-400">&amp; Lodges</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium hospitality in Kenya. Experience comfort, elegance, and unforgettable stays.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
              <li><Link href="/rooms" className="hover:text-primary-400 transition-colors">Rooms & Rates</Link></li>
              <li><Link href="/#amenities" className="hover:text-primary-400 transition-colors">Amenities</Link></li>
              <li><Link href="/rooms" className="hover:text-primary-400 transition-colors">Book Now</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📍 Kimathi Street, Nyeri Town</li>
              <li>📞 +254 720 000 000</li>
              <li>✉️ info@tsthotels.com</li>
              <li>🌐 www.tsthotels.com</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Policies</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Check-in: 2:00 PM</li>
              <li>Check-out: 11:00 AM</li>
              <li>Free Cancellation: 24hrs prior</li>
              <li>Pets: Not allowed</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © 2026 TST Hotels &amp; Lodges. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
