/* eslint-disable cypress/no-unnecessary-waiting */
describe('App login & initial setup', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Should log in & get to the resource workspace screen successfully', () => {
    cy.get('h1').contains('Login').should('be.visible')

    cy.get('input[name="username"]').should('be.visible').type(Cypress.env('TEST_USERNAME'))
    cy.get('input[type="password"]').should('be.visible').type(Cypress.env('TEST_PASSWORD'))
    cy.get('[data-test="submit-button"]').click()

    cy.intercept('GET', 'https://git.door43.org/api/v1/users/test_user01?noCache=**').as('getUser')
    cy.intercept('https://git.door43.org/api/v1/users/test_user01/tokens?noCache=**').as('getToken')
    cy.intercept('https://git.door43.org/api/v1/user/orgs?noCache=**').as('getOrgs')

    // This is necessary to make sure the "Account Setup" screen is loaded on the page
    cy.wait(['@getUser', '@getToken', '@getOrgs'])
    cy.wait(2000)

    cy.get('[data-cy="account-setup-title"]').contains('Account Setup').should('be.visible')
    cy.get('[data-cy="account-setup-description"]').contains('Choose your Organization and Primary Language').should('be.visible')

    // Select organization
    cy.get('[id="organization-select-outlined"]').should('be.visible').click()
    cy.contains('test_org').click()

    // Select organization
    cy.get('[id="primary-language-select-outlined"]').should('be.visible').click()
    cy.contains('en - English - English').should('be.visible').click()

    // Save selection and continue
    cy.get('[data-cy="app-setup-save-and-continue"]').contains('Save and Continue').should('be.visible').click()

    // Test translationNotes card is found on the screen
    cy.wait(1000)
    cy.get('[id="resource_card_tn"]').should('be.visible')
  })
})
