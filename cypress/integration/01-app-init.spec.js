/* eslint-disable cypress/no-unnecessary-waiting */
describe('App login & initial setup', () => {
  before(() => {
    cy.visit('/?server=prod')
  })

  it('Should log in & get to the resource workspace screen successfully', () => {
    cy.get('h1').contains('Login').should('be.visible')

    const USERNAME = Cypress.env('TEST_USERNAME')
    const PASSWORD = Cypress.env('TEST_PASSWORD')

    cy.get('input[name="username"]').should('be.visible').type(USERNAME)
    cy.get('input[type="password"]').should('be.visible').type(PASSWORD)
    cy.get('[data-test="submit-button"]').click()

    cy.intercept('GET', `https://git.door43.org/api/v1/users/${USERNAME}?noCache=**`).as('getUser')
    cy.intercept('GET', `https://git.door43.org/api/v1/users/${USERNAME}/tokens?noCache=**`).as('getToken')
    cy.intercept('GET', 'https://git.door43.org/api/v1/user/orgs?noCache=**').as('getOrgs')

    cy.wait('@getUser', { requestTimeout: 15000 })
    cy.wait('@getToken', { requestTimeout: 15000 })
    cy.wait('@getOrgs', { requestTimeout: 15000 })

    cy.get('[data-cy="account-setup-title"]').contains('Account Setup').should('be.visible')
    cy.get('[data-cy="account-setup-description"]').contains('Choose your Organization and Primary Language').should('be.visible')

    // Select organization
    cy.wait(6000)
    cy.get('[id="organization-select-outlined"]').click()
    cy.wait(1000)
    cy.get('[data-value="test_org"]').should('have.text', 'test_org').click()

    // Select language
    cy.get('[id="primary-language-select-outlined"]').click()
    cy.wait(1000)
    cy.get('[data-value="en"]').should('have.text', 'en - English - English').click()

    // Save selection and continue
    cy.get('[data-cy="app-setup-save-and-continue"]').contains('Save and Continue').should('be.visible').click()

    // Test translationNotes card is found on the screen
    cy.wait(1000)
    cy.get('[id="resource_card_tn"]').should('be.visible')
  })
})
