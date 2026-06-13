/** Core gameplay regression, asserted through user-visible behavior:
 * notes visibly move, answer buttons enable when a question is active,
 * answering updates the tally and the game loop continues.
 *
 * The single test hook into internals is `data-note` (the answer key) —
 * a black-box test cannot know which answer is correct without it.
 */

// fast settings so questions trigger quickly; seeding localStorage before
// load also covers settings hydration on a direct page load
const seedSettings = (win: Window) => {
  win.localStorage.setItem(
    'settings',
    JSON.stringify({
      secondsBetweenNotes: 1,
      questionTimeLimit: 10,
      showLastNoteQuessed: true,
    }),
  )
}

// fixed sequence seed: failures reproduce identically on re-run
const visitExercise = (path = '/training/clef-treble?seed=42') =>
  cy.visit(path, { onBeforeLoad: seedSettings })

/** the letters of all initially drawn notes, in order */
const initialSequence = () =>
  cy
    .get('#stave [data-note]', { timeout: 10000 })
    .should('have.length.at.least', 5)
    .then(($notes) => [...$notes].map((n) => n.getAttribute('data-note')))

/** a question is active exactly when the answer buttons are clickable */
const waitForQuestion = () =>
  cy.get('.note-button:not(:disabled)', { timeout: 15000 }).should('exist')

describe('note exercise', () => {
  it('renders the staff with notes and question guides', () => {
    visitExercise()
    cy.get('#stave svg', { timeout: 10000 }).should('be.visible')
    cy.get('#stave .vf-stavenote').should('have.length.at.least', 5)
    // one dashed guide per stave
    cy.get('.question-marker').should('have.length', 1)
  })

  it('renders two question guides in mixed mode (one per stave)', () => {
    visitExercise('/training/mixed?seed=42')
    cy.get('.question-marker', { timeout: 10000 }).should('have.length', 2)
  })

  it('produces the same note sequence for the same seed', () => {
    visitExercise('/training/clef-treble?seed=7')
    initialSequence().then((first) => {
      visitExercise('/training/clef-treble?seed=7')
      initialSequence().then((second) => {
        expect(second).to.deep.equal(first)
      })
      // and a different seed diverges (both sequences are fixed, so this
      // comparison is deterministic, not a probabilistic flake)
      visitExercise('/training/clef-treble?seed=8')
      initialSequence().then((other) => {
        expect(other).to.not.deep.equal(first)
      })
    })
  })

  it('visibly scrolls notes toward the question spot', () => {
    visitExercise()
    cy.get('#stave .vf-stavenote', { timeout: 10000 })
      .first()
      .then(($note) => {
        const before = $note[0].getBoundingClientRect().x
        cy.wait(1000)
        cy.get('#stave .vf-stavenote')
          .first()
          .should(($after) => {
            expect($after[0].getBoundingClientRect().x).to.be.lessThan(before)
          })
      })
  })

  it('scores a correct answer and keeps the game loop running', () => {
    visitExercise()
    waitForQuestion()
    // the only internals hook: which answer is correct
    cy.get('#stave [data-note]')
      .first()
      .invoke('attr', 'data-note')
      .then((note) => {
        cy.get('.note-button').contains(new RegExp(`^${note}$`)).click()
      })
    // hit is counted (visible tally)
    cy.contains('.guess-tally div', /^\s*1\s*$/).should('exist')
    // buttons disable during the pause...
    cy.get('.note-button:disabled').should('exist')
    // ...and a NEXT question arrives: buttons enable again — the
    // pause/resume loop survived
    waitForQuestion()
  })

  it('ends the game after the allowed mistakes, without pause when set to 0', () => {
    cy.visit('/training/clef-treble?seed=42', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'settings',
          JSON.stringify({
            secondsBetweenNotes: 1,
            questionTimeLimit: 10,
            showLastNoteQuessed: true,
            errorsAllowed: 2,
            pauseDuration: 0,
          }),
        )
      },
    })
    const answerWrong = () => {
      waitForQuestion()
      cy.get('#stave [data-note]')
        .first()
        .invoke('attr', 'data-note')
        .then((note) => {
          cy.get('.note-button').not(`:contains(${note})`).first().click()
        })
    }
    answerWrong() // 1/2 — zero-pause resume must deliver the next question
    answerWrong() // 2/2 — defeat
    cy.contains('Try again!', { timeout: 10000 }).should('be.visible')
    // flip to statistics: per-note rows show tries and accuracy like "0/1 0%"
    cy.contains('Tap to show statistics.').click()
    // 'exist', not 'visible': Cypress treats the 3D-flipped card face as
    // invisible (rotated + backface-hidden) even when it is the shown side
    cy.contains('Per note accuracy').should('exist')
    // tries and accuracy cells, e.g. "0/1" and "0%"
    cy.contains(/^\s*0\/1\s*$/).should('exist')
    cy.contains(/^\s*0%\s*$/).should('exist')
    // retry: the board comes back with a fresh staff and a playable question
    cy.contains('button', 'Retry').click()
    cy.get('#stave .vf-stavenote', { timeout: 10000 }).should(
      'have.length.at.least',
      5,
    )
    waitForQuestion()
  })

  it('counts a wrong answer toward the defeat limit', () => {
    visitExercise()
    waitForQuestion()
    cy.get('#stave [data-note]')
      .first()
      .invoke('attr', 'data-note')
      .then((note) => {
        cy.get('.note-button').not(`:contains(${note})`).first().click()
      })
    cy.get('.guess-tally').should('contain.text', '1 /')
    cy.contains('.guess-tally div', /^\s*0\s*$/).should('exist')
  })
})
