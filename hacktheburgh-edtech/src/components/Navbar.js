import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-blue-900 text-white py-4 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* University Logo and Name */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="text-xl font-semibold hover:text-blue-200 transition-colors duration-200">
              The University of Edinburgh
            </Link>
          </div>

          {/* Navigation Links and Search */}
          <div className="flex items-center space-x-8">
            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-blue-200 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-200">
                Home
              </Link>
              <Link href="/courses" className="hover:text-blue-200 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-200">
                Courses
              </Link>
              <Link href="/my-courses" className="hover:text-blue-200 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-200">
                My Courses
              </Link>
              <Link href="/settings" className="hover:text-blue-200 transition-colors duration-200 border-b-2 border-transparent hover:border-blue-200">
                Settings
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search courses..."
                className="bg-blue-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu (Hidden by default) */}
      <div className="md:hidden hidden bg-blue-800 mt-2 py-2">
        <div className="container mx-auto px-4 flex flex-col space-y-2">
          <Link href="/" className="hover:text-blue-200 py-2 transition-colors duration-200">
            Home
          </Link>
          <Link href="/courses" className="hover:text-blue-200 py-2 transition-colors duration-200">
            Courses
          </Link>
          <Link href="/my-courses" className="hover:text-blue-200 py-2 transition-colors duration-200">
            My Courses
          </Link>
          <Link href="/settings" className="hover:text-blue-200 py-2 transition-colors duration-200">
            Settings
          </Link>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="relative mt-2">
            <input
              type="text"
              placeholder="Search courses..."
              className="bg-blue-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 