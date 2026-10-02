import Navbar from '@/components/ui/Navbar'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import HowItWorks from '@/components/sections/HowItWorks'
import Architecture from '@/components/sections/Architecture'
import GetStarted from '@/components/sections/GetStarted'
import Footer from '@/components/sections/Footer'
import SnowWrapper from '@/components/3d/SnowWrapper'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SnowWrapper />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Architecture />
      <GetStarted />
      <Footer />
    </main>
  )
}
