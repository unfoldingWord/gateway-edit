describe('Login', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Should log in successfully', () => {
    cy.get('h1').contains('Login').should('be.visible')

    cy.get('input[name="username"]').should('be.visible').type(Cypress.env('TEST_USERNAME'))
    cy.get('input[type="password"]').should('be.visible').type(Cypress.env('TEST_PASSWORD'))
    cy.get('[data-test="submit-button"]').click()

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
    cy.get('[id="resource_card_tn"]').should('be.visible')
  })
})
