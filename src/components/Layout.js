import Header from '@components/Header'
import Footer from '@components/Footer'
import PropTypes from 'prop-types'

export default function Layout({ children }) {
  return (
    <div className='h-screen w-screen flex flex-col'>
      <Header appName='translationCore: Create' />
      <main className='flex flex-1 flex-col w-auto m-0'>{children}</main>
      <Footer />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}
