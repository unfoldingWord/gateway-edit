# gateway-edit

[![Netlify Status](https://api.netlify.com/api/v1/badges/58e59c6e-0cea-43cd-b535-86d3495ce3c9/deploy-status)](https://app.netlify.com/sites/gateway-edit/deploys)
[![CI Status](https://github.com/unfoldingWord/gateway-edit/workflows/Run%20Cypress%20and%20Jest%20Tests/badge.svg)](https://github.com/unfoldingWord/gateway-edit/actions)

Main:
[![Current Verison](https://img.shields.io/github/package-json/v/unfoldingWord/gateway-edit/main)](https://github.com/unfoldingWord/gateway-edit/tags)
[![codecov](https://codecov.io/gh/unfoldingWord/gateway-edit/branch/main/graph/badge.svg?token=0HTP1JR1UL)](https://codecov.io/gh/unfoldingWord/gateway-edit)
Develop:
[![Current Verison](https://img.shields.io/github/package-json/v/unfoldingWord/gateway-edit/develop)](https://github.com/unfoldingWord/gateway-edit/tags)
[![codecov](https://codecov.io/gh/unfoldingWord/gateway-edit/branch/develop/graph/badge.svg?token=0HTP1JR1UL)](https://codecov.io/gh/unfoldingWord/gateway-edit)

Book Package harmonized view.

## Staging Environment URLs

- ***Production:*** https://gatewayedit.com or https://gateway-edit.netlify.app/
- ***Develop:*** https://develop--gateway-edit.netlify.app/
- ***Release-v0.9.0*** https://release-v0-9-0--gateway-edit.netlify.app/
- ***Release-v1.0.0*** https://release-v1-0-0--gateway-edit.netlify.app/

## Documentation

### JS-Docs generated documentation:
- last deployed to github pages: [deployed JS-Docs](https://unfoldingword.github.io/gateway-edit/gateway-edit/index.html)
- lasted local: [local JS-Docs](./docs/gateway-edit/index.html)

## Scripts

- "report:combined": combines Cypress & Jest test coverage reports into one coverage report.

### Running tests
- Before running any tests, make sure initialized by doing:
```
yarn
```
- also before running cypress tests, you must create a file `cypress.env.json` with contents such as (of course replace text in `<< >>` with you user login credentials):
```
{
  "TEST_USERNAME": <<my user name>>,
  "TEST_PASSWORD": <<my user password>>
}
```

#### Running Jest Unit Tests
```
yarn run test:unit
```

#### Running Cypress tests Interactively
- in first terminal, start the app by (in Windows, run this in `git Bash` as it needs bash):
```
yarn dev
```
- then in second terminal, to run cypress interactively do:
```
yarn run cypress
```

#### Running Cypress tests headless
- in terminal, start the app by (in Windows, run this in `git Bash` as it needs bash):
```
yarn test:headless
```

## UI Design
- Structure of the React components in this app

Application (in pages/_app.js)  contains:
* AuthContext context
* StoreContext context:

Home (in pages/index.js) contains:
<Layout>
  <WorkspaceContainer />
</Layout>

WorkspaceContainer component manages the Resource workspace
* Contains Workspace component (resource workspace rcl) that contains several:
    * ScriptureCard components
    * ResourceCard components

Layout component:
* accesses authentication context and store context
* Manages server selection through url variables
* Displays Onboarding component if login is required
* Contains the header and footer

BibleReference component:
* Uses bible Reference RCL
* Updates reference store context

Onboarding component
* Displays the AccountSetup component when login is required

Header component:
* Contains BibleReference component

Footer component:
* Shows app version/build

Drawer component (hamburger menu):
* Shows

TranslationSettings component:
* Prompts for organization and language

ResourceCard component:
* Card that displays translationHelps content

ScriptureCard component:
* Card that displays scripture content

AuthContext context:
* Initializes the authentication context (defined in gitea-react-toolkit)

StoreContext context:
* Manages and persists application state data into local storage

useLocalStorage - custom hook that persists generic application data  into local storage

useUserLocalStorage - custom hook that application data for logged in user into local storage
