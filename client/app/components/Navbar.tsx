'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-2xl hover:text-blue-200 transition">
            ManoMITRA
          </Link>

          <div className="hidden md:flex space-x-6 items-center">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:text-blue-200 transition font-semibold"
                >
                  Dashboard
                </Link>
                <Link
                  href="/journal"
                  className="hover:text-blue-200 transition font-semibold"
                >
                  Journal
                </Link>
                <Link
                  href="/chat"
                  className="hover:text-blue-200 transition font-semibold"
                >
                  AI Chat
                </Link>
                <Link
                  href="/mood"
                  className="hover:text-blue-200 transition font-semibold"
                >
                  Mood Tracker
                </Link>
                <span className="text-sm text-blue-200">Hi, {user.fullName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="hover:text-blue-200 transition font-semibold">
                  Home
                </Link>
                <Link href="/about" className="hover:text-blue-200 transition font-semibold">
                  About
                </Link>
                <Link href="/get-started" className="hover:text-blue-200 transition font-semibold">
                  Get Started
                </Link>
                <Link href="/contact" className="hover:text-blue-200 transition font-semibold">
                  Contact
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-300 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden flex flex-col cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={`h-0.5 w-6 bg-white transition ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`h-0.5 w-6 bg-white my-1 transition ${isOpen ? 'opacity-0' : ''}`}></span>
            <span className={`h-0.5 w-6 bg-white transition ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/journal" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Journal
                </Link>
                <Link href="/chat" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  AI Chat
                </Link>
                <Link href="/mood" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Mood Tracker
                </Link>
                <div className="py-2 px-2 text-sm text-blue-200">Hi, {user.fullName}</div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 px-2 text-red-300 hover:bg-blue-700 rounded transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
                <Link href="/about" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  About
                </Link>
                <Link href="/get-started" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Get Started
                </Link>
                <Link href="/contact" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Contact
                </Link>
                <Link href="/login" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" className="block py-2 hover:bg-blue-700 px-2 rounded transition" onClick={() => setIsOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
