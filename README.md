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
yarn start
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
