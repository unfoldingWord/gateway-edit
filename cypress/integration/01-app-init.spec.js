describe('Login', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Should log in successfully', () => {
    cy.get('h1').contains('Login').should('be.visible')
    cy.get('input[name="username"]').type(Cypress.env('TEST_USERNAME'))
    cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'))
    cy.get('[data-test="submit-button"]').click()

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)
    cy.get('h3').contains('Account Setup').should('be.visible')
    cy.contains('Choose your Organization and Primary Language')

    // Select organization
    cy.get('[id="organization-select-outlined"]').click()
    cy.contains('test_org').click()

    // Select organization
    cy.get('[id="primary-language-select-outlined"]').click()
    cy.contains('en - English - English').should('be.visible').click()

    // Save selection and continue
    cy.get('[data-cy="app-setup-save-and-continue"]').contains('Save and Continue').should('be.visible').click()

    // Test translationNotes card is found on the screen
    cy.contains('translationNotes').should('be.visible')
  })
})
