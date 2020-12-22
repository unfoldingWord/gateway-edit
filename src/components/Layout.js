import Header from '@components/Header'
import Footer from '@components/Footer'

export default function Layout({ children }) {
  return (
    <div className='h-screen w-screen flex flex-col'>
      <Header appName='translationCore: Create' />
      <main className='flex flex-1 w-auto'>{children}</main>
      <Footer />
    </div>
  )
}
