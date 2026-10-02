'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const links = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Architecture', href: '#architecture' },
  { name: 'Get Started', href: '#get-started' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <img src="/logo.png" alt="DevOS" className="w-8 h-8 rounded-lg object-contain" />
          <span><span className="text-blue-500">Dev</span>OS</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
          <a
            href="https://github.com/mnvvshu/DevOS"
            target="_blank"
            rel="noreferrer"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 shadow-md shadow-blue-500/20"
          >
            Launch App
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0a] border-b border-white/10 py-4 px-4 flex flex-col gap-4 shadow-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-300 text-lg font-medium py-2 border-b border-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a
              href="https://github.com/mnvvshu/DevOS"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-gray-300 text-lg font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ExternalLink className="w-5 h-5" /> GitHub
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}