import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { MetricsSection } from './components/MetricsSection'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'

export function Home() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="min-h-screen pl-20 md:pl-72">
        <Hero />
        <MetricsSection />
      </main>
      <div className="pl-20 md:pl-72">
        <Footer />
      </div>
    </>
  )
}
