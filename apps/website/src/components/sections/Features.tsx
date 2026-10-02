'use client'

import { motion } from 'motion/react'
import { FileSearch, Terminal, GitBranch, Shield, Cpu, Bot } from 'lucide-react'

const features = [
  {
    icon: <FileSearch className="w-6 h-6 text-blue-400" />,
    title: "Read & Analyze Code",
    description: "Instantly reads any file in your project, analyzes structure, and understands context for better suggestions."
  },
  {
    icon: <Terminal className="w-6 h-6 text-blue-400" />,
    title: "Run Commands",
    description: "Executes shell commands with your explicit approval to build, test, and deploy applications."
  },
  {
    icon: <GitBranch className="w-6 h-6 text-blue-400" />,
    title: "Git Integration",
    description: "Seamlessly manages branches, checks status, views diffs, and explores commit history."
  },
  {
    icon: <Shield className="w-6 h-6 text-blue-400" />,
    title: "Security First",
    description: "Built-in 3-tier permission system ensures the agent only does what you authorize."
  },
  {
    icon: <Cpu className="w-6 h-6 text-blue-400" />,
    title: "System Diagnostics",
    description: "Monitors CPU, RAM, and disk usage to optimize performance during heavy tasks."
  },
  {
    icon: <Bot className="w-6 h-6 text-blue-400" />,
    title: "AI Agent",
    description: "Advanced ReAct loop with extensive tool calling capabilities to solve complex engineering problems."
  }
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-[#0a0a0a] relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            What DevOS Can Do
          </motion.h2>
          <motion.p 
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A powerful suite of tools integrated directly into your workflow.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-100">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
