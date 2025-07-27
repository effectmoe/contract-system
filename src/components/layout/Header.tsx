'use client';

import Link from 'next/link';
import { FileText, Plus, BarChart3, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">電子契約システム</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/contracts"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              契約書一覧
            </Link>
            <Link
              href="/contracts/new"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新規作成
            </Link>
            <Link
              href="/contracts/analytics"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              分析
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            <Link
              href="/contracts"
              className="block py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              契約書一覧
            </Link>
            <Link
              href="/contracts/new"
              className="block py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              新規作成
            </Link>
            <Link
              href="/contracts/analytics"
              className="block py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              分析
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}