import React from 'react'
import Link from 'next/link'
import Layout from '@components/Layout'

const Home = () => (
  <Layout>
    <div>
      <h1>Welcome to Next!</h1>
      <p>
        To get started, edit <code>pages/index.js</code> and save to reload.
      </p>

      <div className='flex'>
        <Link href='https://github.com/zeit/next.js#getting-started'>
          <a className='m-1'>
            <h3>Getting Started &rarr;</h3>
            <p>Learn more about Next on Github and in their examples</p>
          </a>
        </Link>
        <Link href='https://open.segment.com/create-next-app'>
          <a className='m-1'>
            <h3>Examples &rarr;</h3>
            <p>
              Find other example boilerplates on the{' '}
              <code>create-next-app</code> site
            </p>
          </a>
        </Link>
        <Link href='https://github.com/segmentio/create-next-app'>
          <a className='m-1'>
            <h3>Create Next App &rarr;</h3>
            <p>Was this tool helpful? Let us know how we can improve it</p>
          </a>
        </Link>
      </div>
    </div>
  </Layout>
)

export default Home
