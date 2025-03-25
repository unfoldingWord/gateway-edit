import React from 'react'
import PropTypes from 'prop-types'

export default function NetlifyBadge({ className }) {
  return (
    <div className={className ? `${className} my-2.5` : 'my-2.5'}>
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

NetlifyBadge.propTypes = { className: PropTypes.string }
