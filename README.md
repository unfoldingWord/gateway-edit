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

- **_Production:_** https://gatewayedit.com or https://gateway-edit.netlify.app/
- **_Develop:_** https://develop--gateway-edit.netlify.app/
- **_Release-v0.9.0_** https://release-v0-9-0--gateway-edit.netlify.app/
- **_Release-v1.0.0_** https://release-v1-0-0--gateway-edit.netlify.app/
- **_Release-v2.1.0_** https://release-v2-1-0--gateway-edit.netlify.app/

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

**Startup** is main.jsx which renders the Application (App)

**Application** (App.jsx) contains:

- AuthContext context
- StoreContext context:

  <AuthContextProvider>
    <StoreContextProvider>
      <Layout>
        <WorkspaceContainer />
      </Layout>
    </StoreContextProvider>
  </AuthContextProvider>

**Layout** component:

- accesses authentication context and store context
- Manages server selection through url variables
- Displays Onboarding component if login is required
- displays the settings page if selected
- Contains the header and footer

**WorkspaceContainer** component manages the workspace containing the resource cards

- Contains Workspace component (resource workspace rcl) that contains several cards of type:
  - ScriptureCard components
  - ResourceCard components

**BibleReference** component:

- Uses bible Reference RCL
- Updates reference store context

**Onboarding** component

- Displays the AccountSetup component when login is required

**Header** component:

- Contains BibleReference component

**Footer** component:

- Shows app version/build

**Drawer** component (hamburger menu):

- Shows

**TranslationSettings** component:

- Prompts for organization and language

**ResourceCard** component:

- Card that displays translationHelps content

**ScriptureCard** component:

- Card that displays scripture content

**AuthContext** context:

- Initializes the authentication context (defined in gitea-react-toolkit)

StoreContext context:

- Manages and persists the rest of the application state data into local storage

useLocalStorage - custom hook that persists generic application data into local storage

useUserLocalStorage - custom hook that application data for logged in user into local storage
