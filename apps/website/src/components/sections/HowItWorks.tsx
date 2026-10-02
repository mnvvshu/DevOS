'use client'

import { motion } from 'motion/react'
import { MessageSquare, Brain, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    num: "01",
    icon: <MessageSquare className="w-8 h-8 text-blue-400" />,
    title: "You ask a question",
    desc: "Describe your problem, request a feature, or ask for a code review in plain English."
  },
  {
    num: "02",
    icon: <Brain className="w-8 h-8 text-blue-400" />,
    title: "Agent thinks & acts",
    desc: "The AI agent formulates a plan, reads files, and invokes tools to gather context and draft solutions."
  },
  {
    num: "03",
    icon: <CheckCircle2 className="w-8 h-8 text-blue-400" />,
    title: "You review & approve",
    desc: "Review proposed code changes or shell commands before they are executed. You stay in control."
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-[#050505] relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.h2 
          className="text-3xl md:text-5xl font-bold mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>

        <div className="relative flex flex-col md:flex-row gap-8 md:gap-4 justify-between">
          {/* Connecting Line - Desktop */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 -translate-y-1/2 z-0 opacity-30" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-gray-800 flex items-center justify-center mb-6 shadow-xl relative">
                <span className="absolute -top-3 -right-3 text-xs font-bold text-gray-500 bg-[#050505] px-2 rounded-full border border-gray-800">
                  {step.num}
                </span>
                {step.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
