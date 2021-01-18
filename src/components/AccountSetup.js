import React, { useState, useEffect, useContext } from 'react'
import PropTypes from 'prop-types'
import Paper from 'translation-helps-rcl/dist/components/Paper'
import FormControl from '@material-ui/core/FormControl'
import { makeStyles } from '@material-ui/core/styles'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
// import Button from '@material-ui/core/Button'
import { getGatewayLanguages } from '@common/languages'
import { ReferenceContext } from '@context/ReferenceContext'

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    minWidth: '100%',
  },
}))

function AccountSetup({ authentication }) {
  const classes = useStyles()
  const [organizations, setOrganizations] = useState([])
  const [languages, setLanguages] = useState([])
  const {
    state: { owner: organization, languageId },
    actions: { setOwner: setOrganization, setLanguageId },
  } = useContext(ReferenceContext)

  useEffect(() => {
    async function getOrgs() {
      const orgs = await fetch('https://git.door43.org/api/v1/user/orgs', {
        ...authentication.config,
      })
        .then(response => response.json())
        .then(data => data.map(org => org.username))
      setOrganizations(orgs)
    }

    if (authentication) {
      getOrgs()
    }
  }, [authentication])

  useEffect(() => {
    async function getLanguages() {
      const languages = await getGatewayLanguages()
      setLanguages(languages || [])
    }

    getLanguages()
  }, [])

  const handleOrgChange = event => {
    setOrganization(event.target.value)
  }

  const handleLanguageChange = event => {
    setLanguageId(event.target.value)
  }

  // const handleSubmit = () => {}
  // const disabledButton = !organization || !languageId

  return (
    <div className='flex flex-col justify-center items-center'>
      <div className='flex flex-col w-full px-4 lg:w-132 lg:p-0'>
        <Paper className='flex flex-col h-40 w-full p-6 pt-3 px-7 my-2'>
          <h5>Account Setup</h5>
          <p className='text-lg'>
            Choose your Organization and Primary Language
          </p>
        </Paper>
        <Paper className='flex flex-col h-80 w-full p-6 pt-3 my-2'>
          <h5>Translation Settings</h5>
          <div className='flex flex-col justify-between my-4'>
            <FormControl variant='outlined' className={classes.formControl}>
              <InputLabel id='demo-simple-select-outlined-label'>
                Organization
              </InputLabel>
              <Select
                labelId='demo-simple-select-outlined-label'
                id='demo-simple-select-outlined'
                value={organization}
                onChange={handleOrgChange}
                label='Organization'
              >
                {organizations.map((org, i) => (
                  <MenuItem key={`${org}-${i}`} value={org}>
                    {org}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant='outlined' className={classes.formControl}>
              <InputLabel id='demo-simple-select-outlined-label'>
                Primary Translating Language
              </InputLabel>
              <Select
                labelId='demo-simple-select-outlined-label'
                id='demo-simple-select-outlined'
                value={languageId}
                onChange={handleLanguageChange}
                label='Primary Translating Language'
              >
                {languages.map(({ languageId, languageName, localized }, i) => (
                  <MenuItem key={`${languageId}-${i}`} value={languageId}>
                    {`${languageId} - ${languageName} - ${localized}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </Paper>
        {/* <div className='flex justify-end h-62 w-full'>
          <Button
            className='my-2'
            variant='contained'
            color='primary'
            disableElevation
            disabled={disabledButton}
            onClick={handleSubmit}
          >
            Save and Continue
          </Button>
        </div> */}
      </div>
    </div>
  )
}

AccountSetup.propTypes = {
  authentication: PropTypes.object.isRequired,
}

export default AccountSetup
