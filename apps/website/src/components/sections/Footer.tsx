import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-white/10 bg-[#050505] text-gray-400 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span>&copy; 2026</span>
          <span className="text-gray-600">|</span>
          <span>Built by <a href="https://github.com/mnvvshu" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">mnvvshu</a></span>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="px-2 py-1 bg-gray-800 rounded text-xs">MIT License</span>
          <a href="https://github.com/mnvvshu/DevOS" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
