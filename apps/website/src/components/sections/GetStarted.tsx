'use client'

import { motion } from 'motion/react'
import { Terminal } from 'lucide-react'

export default function GetStarted() {
  return (
    <section id="get-started" className="py-24 px-4 bg-[#050505] relative overflow-hidden">
      {/* Simple particle background using CSS */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-[#050505] to-[#050505]"></div>
      
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
        <motion.h2 
          className="text-3xl md:text-5xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Get Started in 30 Seconds
        </motion.h2>
        
        <motion.p 
          className="text-gray-400 mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Clone the repository and start building with your local AI developer OS.
        </motion.p>

        <motion.div 
          className="w-full max-w-2xl bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-2xl overflow-hidden mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-[#111] px-4 py-3 flex items-center border-b border-gray-800">
            <Terminal className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-xs text-gray-500 font-mono">bash</span>
          </div>
          <div className="p-6 font-mono text-sm sm:text-base text-gray-300 leading-loose overflow-x-auto whitespace-pre">
            <span className="text-green-400">git</span> clone https://github.com/mnvvshu/DevOS.git
            <br />
            <span className="text-blue-400">cd</span> DevOS && <span className="text-yellow-400">pnpm</span> install
            <br />
            <span className="text-blue-400">cp</span> .env.example .env
            <br />
            <span className="text-yellow-400">pnpm</span> dev
          </div>
        </motion.div>

        <motion.a 
          href="https://github.com/mnvvshu/DevOS"
          target="_blank"
          rel="noreferrer"
          className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          View on GitHub
        </motion.a>
      </div>
    </section>
  )
}
