import React, {
  useState, useEffect, useContext,
} from 'react'
import PropTypes from 'prop-types'
import Paper from 'translation-helps-rcl/dist/components/Paper'
import FormControl from '@material-ui/core/FormControl'
import { makeStyles } from '@material-ui/core/styles'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import { getGatewayLanguages } from '@common/languages'
import { StoreContext } from '@context/StoreContext'

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    minWidth: '100%',
  },
}))

export default function TranslationSettings({ authentication }) {
  const classes = useStyles()
  const [organizations, setOrganizations] = useState([])
  const [languages, setLanguages] = useState([])
  const {
    state: { owner: organization, languageId },
    actions: {
      setOwner: setOrganization,
      setLanguageId,
    },
  } = useContext(StoreContext)

  useEffect(() => {
    async function getOrgs() {
      const orgs = await fetch('https://git.door43.org/api/v1/user/orgs', { ...authentication.config })
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

  return (
    <Paper className='flex flex-col h-80 w-full p-6 pt-3 my-2'>
      <h5>Translation Settings</h5>
      <div className='flex flex-col justify-between my-4'>
        <FormControl variant='outlined' className={classes.formControl}>
          <InputLabel id='demo-simple-select-outlined-label'>
            Organization
          </InputLabel>
          <Select
            labelId='organization-select-outlined-label'
            id='organization-select-outlined'
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
            labelId='primary-language-select-outlined-label'
            id='primary-language-select-outlined'
            value={languageId}
            onChange={handleLanguageChange}
            label='Primary Translating Language'
          >
            {languages.map(({
              languageId, languageName, localized,
            }, i) => (
              <MenuItem key={`${languageId}-${i}`} value={languageId}>
                {`${languageId} - ${languageName} - ${localized}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </Paper>
  )
}

TranslationSettings.propTypes = { authentication: PropTypes.object.isRequired }
