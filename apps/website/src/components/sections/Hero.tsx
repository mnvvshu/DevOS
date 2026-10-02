'use client'

import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

const HeroScene = dynamic(() => import('../3d/HeroScene'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050505] -z-10" />
})

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20">
      <HeroScene />
      
      <div className="z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-blue-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          DevOS
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Your local AI developer OS. Seamlessly integrate intelligent agents into your engineering workflow.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a href="#get-started" className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            Get Started
          </a>
          <a href="https://github.com/mnvvshu/DevOS" target="_blank" rel="noreferrer" className="px-8 py-3 rounded-full border border-gray-600 hover:border-gray-400 text-white font-medium transition-colors">
            View on GitHub
          </a>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-10 text-gray-400 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <span className="text-sm mb-2 uppercase tracking-widest text-xs">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  )
}
