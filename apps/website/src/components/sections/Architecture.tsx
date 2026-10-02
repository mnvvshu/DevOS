'use client'

import { motion } from 'motion/react'

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
        
        <div className="lg:w-1/2">
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Built for Engineers
          </motion.h2>
          <motion.p 
            className="text-gray-400 text-lg mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            DevOS uses a modern, modular monorepo architecture. 
            Everything is strongly typed, highly decoupled, and built for extensibility.
          </motion.p>

          <motion.div 
            className="grid grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {[
              { label: "Packages", val: "13" },
              { label: "Files", val: "181" },
              { label: "TypeScript", val: "100%" },
              { label: "Native Deps", val: "Zero" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-400">{stat.val}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {['React', 'Next.js', 'Fastify', 'Three.js', 'Tailwind', 'Zustand'].map(tech => (
              <span key={tech} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm font-medium border border-gray-700">
                {tech}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div 
          className="lg:w-1/2 w-full"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-xs text-gray-400 font-mono">devos-monorepo</span>
            </div>
            <div className="p-6 font-mono text-sm text-gray-300 leading-loose overflow-x-auto">
              <div className="text-blue-400">DevOS/</div>
              <div className="pl-4">
                <div className="text-purple-400">apps/</div>
                <div className="pl-4">
                  <div className="text-gray-300">├── desktop <span className="text-gray-500">// Tauri App</span></div>
                  <div className="text-gray-300">├── website <span className="text-gray-500">// Next.js</span></div>
                </div>
                <div className="text-purple-400 mt-2">packages/</div>
                <div className="pl-4">
                  <div className="text-gray-300">├── agent   <span className="text-gray-500">// AI Logic</span></div>
                  <div className="text-gray-300">├── core    <span className="text-gray-500">// Shared Utils</span></div>
                  <div className="text-gray-300">├── tools   <span className="text-gray-500">// File, Git, Cmd</span></div>
                  <div className="text-gray-300">└── ui      <span className="text-gray-500">// React components</span></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
