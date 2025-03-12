import React from 'react'
import PropTypes from 'prop-types'
import { Paper } from 'translation-helps-rcl'
import CircularProgress from '@components/CircularProgress'
import createDynamicComponent from '@utils/dynamicImport'

const AccountSetup = createDynamicComponent(() => import('@components/AccountSetup'), {
  loading: () => <CircularProgress size={180} />
})

function Onboarding({ authentication, authenticationComponent }) {
  if (authentication) {
    return <AccountSetup authentication={authentication} />
  }

  return (
    <div className='flex justify-center items-center h-full w-full'>
      <Paper className='flex justify-center items-center h-104 w-104 bg-white p-10 sm:h-116 sm:w-116'>
        {authenticationComponent}
      </Paper>
    </div>
  )
}

Onboarding.propTypes = {
  authentication: PropTypes.object,
  authenticationComponent: PropTypes.node.isRequired,
}

export default Onboarding
