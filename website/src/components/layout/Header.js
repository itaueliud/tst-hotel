import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">TST</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight">TST Hotels</div>
              <div className="text-xs text-gray-500 leading-tight">&amp; Lodges</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Home</Link>
            <Link href="/rooms" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Rooms</Link>
            <Link href="/#amenities" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Amenities</Link>
            <Link href="/#contact" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Contact</Link>
            <Link href="/rooms" className="btn-primary text-sm py-2 px-5">Book Now</Link>
          </nav>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="block w-5 h-0.5 bg-gray-600 mb-1"></span>
            <span className="block w-5 h-0.5 bg-gray-600 mb-1"></span>
            <span className="block w-5 h-0.5 bg-gray-600"></span>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 text-gray-700 hover:text-primary-600">Home</Link>
            <Link href="/rooms" className="block py-2 text-gray-700 hover:text-primary-600">Rooms</Link>
            <Link href="/#contact" className="block py-2 text-gray-700 hover:text-primary-600">Contact</Link>
            <Link href="/rooms" className="btn-primary block text-center mt-2">Book Now</Link>
          </div>
        )}
      </div>
    </header>
  );
}
