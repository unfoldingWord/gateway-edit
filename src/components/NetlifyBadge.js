import React from 'react'

export default function NetlifyBadge() {
  return (
    <div className='w-full text-center my-2'>
      <a
        href='https://www.netlify.com'
        target='_blank'
        rel='noopener noreferrer'
      >
        <img
          src='https://www.netlify.com/img/global/badges/netlify-color-accent.svg'
          alt='Deploys by Netlify'
        />
      </a>
    </div>
  )
}
