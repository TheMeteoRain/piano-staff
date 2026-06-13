/** Settings regression, asserted through user-visible behavior:
 * what the user sees on each page, where links lead, and whether a changed
 * setting survives a reload — not how it is stored. */

describe('settings', () => {
  it('shows the hub with exercise params first, misc second, app info last', () => {
    cy.visit('/settings')
    cy.get('fieldset legend').then(($legends) => {
      const titles = [...$legends].map((l) => l.textContent?.trim())
      expect(titles).to.deep.equal(['Exercise', 'Misc'])
    })
    cy.contains('label', 'Time between notes').should('be.visible')
    cy.contains('label', 'Question time limit').should('be.visible')
    cy.contains('label', 'Pause after answer').should('be.visible')
    cy.contains('label', 'Mistakes allowed').should('be.visible')
    cy.contains('label', 'Theme').should('be.visible')
    // reset-stats is flagged off until the feature is complete
    cy.contains('button', 'Reset Stats').should('not.exist')
    cy.contains(/App Info · v\d+/).should('be.visible')
  })

  it('navigates to app info', () => {
    cy.visit('/settings')
    cy.contains(/App Info · v\d+/).click()
    cy.url().should('include', '/settings/about')
    cy.contains(/Version:/).should('be.visible')
    cy.contains('Licenses').should('be.visible')
  })

  it('redirects the old training settings url to the focused exercise page', () => {
    cy.visit('/training/settings')
    cy.url().should('include', '/settings/exercise')
    // focused page: exercise params only, no misc
    cy.contains('label', 'Time between notes').should('be.visible')
    cy.contains('label', 'Theme').should('not.exist')
  })

  it('keeps a changed exercise setting after reload', () => {
    cy.visit('/settings/exercise')
    cy.get('#secondsBetweenNotes').clear().type('7').blur()
    cy.reload()
    cy.get('#secondsBetweenNotes').should('have.value', '7')
  })

  it('switches to dark theme and keeps it after reload', () => {
    cy.visit('/settings')
    cy.get('body').then(($body) => {
      const lightBg = getComputedStyle($body[0]).backgroundColor
      cy.get('#theme').contains('Dark').click()
      // colors actually change...
      cy.get('body').should(($b) => {
        expect(getComputedStyle($b[0]).backgroundColor).to.not.eq(lightBg)
      })
      cy.reload()
      // ...and stay changed after a reload
      cy.get('body').should(($b) => {
        expect(getComputedStyle($b[0]).backgroundColor).to.not.eq(lightBg)
      })
    })
  })
})
