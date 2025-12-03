import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FooterLinking from '@/components/FooterLinking'
import CoursesPage from '@/components/CoursesPage'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <CoursesPage />
      <FooterLinking />
      <Footer />
    </main>
  )
}
