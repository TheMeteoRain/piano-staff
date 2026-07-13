/**
 * Generates Google Play Store graphics from the real app — run with
 * `pnpm store:assets`. Not a test: it drives the app, captures raw screenshots,
 * then composites them into branded HTML frames and screenshots those.
 *
 * Every asset is produced in both a -dark and a -light variant.
 *
 * Outputs land in cypress/screenshots/store-assets.cy.ts/ :
 *   - phone-*-{dark,light}.png / tablet-*-{dark,light}.png
 *       -> phone / 7" tablet / 10" tablet screenshots (1080x1920 works for all)
 *   - feature-*-{dark,light}.png  -> feature graphics (1024x500)
 *   - raw-*.png                   -> intermediate app captures (ignore)
 *
 * To refresh after an app update, just run the command again.
 */

// This is an asset generator, not a test: fixed waits are intentional (letting
// notes animate in and images decode before capture), so the anti-flake rule
// doesn't apply here.
/* eslint-disable cypress/no-unnecessary-waiting */

// asset generation shouldn't fail on the app's runtime errors (e.g. audio)
Cypress.on('uncaught:exception', () => false)

const SPEC = 'store-assets.cy.ts'
const rawPath = (name: string) => `cypress/screenshots/${SPEC}/raw-${name}.png`
const dataUri = (b64: string) => `data:image/png;base64,${b64}`

type Device = 'phone' | 'tablet'
type ThemeName = 'dark' | 'light'

interface Theme {
  storageValue: string // value setTheme() reads from localStorage
  frameBg: string
  featureBg: string
  text: string
  subtext: string
}

const THEMES: Record<ThemeName, Theme> = {
  dark: {
    storageValue: 'Dark',
    frameBg:
      'radial-gradient(120% 85% at 50% -10%, #7B3BF0 0%, #5D21DE 44%, #35128A 100%)',
    featureBg: 'radial-gradient(130% 150% at 0% 0%,#7B3BF0,#5D21DE 46%,#2C0E73)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,.9)',
  },
  light: {
    storageValue: 'Light',
    frameBg:
      'radial-gradient(120% 85% at 50% -10%, #F1ECFF 0%, #CDBCFF 55%, #9E7EF2 100%)',
    featureBg: 'radial-gradient(130% 150% at 0% 0%,#F5F1FF,#D8C9FF 46%,#B69DF6)',
    text: '#241056',
    subtext: 'rgba(36,16,86,.85)',
  },
}
const themeNames = Object.keys(THEMES) as ThemeName[]

const BEZEL = '#0d0d0f' // device bezels stay black in both themes, like real hardware
const FONT =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

// raw app viewports — phone kept under 768px wide so the mobile layout is
// preserved; tablet is wider to show the roomier layout
const RAW = {
  phone: { w: 600, h: 1280 },
  tablet: { w: 1000, h: 1400 },
}

// load a route in a forced theme (setTheme() reads localStorage on mount)
const visitThemed = (route: string, theme: ThemeName) =>
  cy.visit(route, {
    onBeforeLoad(win) {
      win.localStorage.setItem('theme', THEMES[theme].storageValue)
    },
  })

// scope waits to #content so the always-present footer nav/icons don't satisfy
// them before the routed view has actually rendered
const waitForStaff = () => {
  cy.get('#content svg', { timeout: 15000 }).should('be.visible')
  cy.wait(2500) // let a note animate in and samples settle
}
const waitForMenu = () => {
  cy.get('#content nav a, #content nav button', { timeout: 12000 })
    .should('have.length.at.least', 2)
    .and('be.visible')
  cy.wait(500)
}

interface Shot {
  name: string
  route: string
  device: Device
  caption: string
  prepare: () => void
}

const shots: Shot[] = [
  {
    name: 'phone-1-treble',
    route: '/training/clef-treble',
    device: 'phone',
    caption: 'Read music at a glance',
    prepare: waitForStaff,
  },
  {
    name: 'phone-2-menu',
    route: '/training/notes',
    device: 'phone',
    caption: 'Choose your challenge',
    prepare: waitForMenu,
  },
  {
    name: 'phone-3-keys',
    route: '/training/keys/sharp',
    device: 'phone',
    caption: 'Master key signatures',
    prepare: waitForStaff,
  },
  {
    name: 'tablet-1-treble',
    route: '/training/clef-treble',
    device: 'tablet',
    caption: 'Read music at a glance',
    prepare: waitForStaff,
  },
  {
    name: 'tablet-2-menu',
    route: '/training/notes',
    device: 'tablet',
    caption: 'Practice on any screen',
    prepare: waitForMenu,
  },
]

interface Feature {
  name: string
  title: string
  tagline: string
  phone: string // base name of a phone shot to embed (theme is appended)
}

const features: Feature[] = [
  {
    name: 'feature-1',
    title: 'Read music\nat a glance',
    tagline: 'The fast, fun way to read music',
    phone: 'phone-1-treble',
  },
  {
    name: 'feature-2',
    title: 'Practice\nanywhere',
    tagline: 'Quick daily drills · Offline · No ads',
    phone: 'phone-3-keys',
  },
]

function frameHtml(
  img: string,
  caption: string,
  device: Device,
  theme: Theme,
): string {
  const w = device === 'phone' ? 700 : 900
  const r = device === 'phone' ? 46 : 30
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    html,body{width:1080px;height:1920px}
    body{display:flex;flex-direction:column;align-items:center;
      padding:140px 70px 0;background:${theme.frameBg};font-family:${FONT};overflow:hidden}
    .caption{color:${theme.text};text-align:center;font-weight:800;font-size:78px;
      line-height:1.08;letter-spacing:-1.5px;max-width:920px;margin-bottom:96px;
      text-shadow:0 4px 26px rgba(0,0,0,.18)}
    .device{width:${w}px;padding:16px;background:${BEZEL};border-radius:${r + 14}px;
      box-shadow:0 42px 90px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.06)}
    .device img{display:block;width:100%;border-radius:${r}px}
  </style></head><body>
    <div class="caption">${caption}</div>
    <div class="device"><img src="${img}"></div>
  </body></html>`
}

function featureHtml(f: Feature, phoneImg: string, theme: Theme): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    html,body{width:1024px;height:500px}
    body{display:flex;align-items:center;gap:56px;padding:0 74px;
      background:${theme.featureBg};font-family:${FONT};overflow:hidden;color:${theme.text}}
    .left{flex:1}
    .badge{display:flex;align-items:center;gap:20px;margin-bottom:26px}
    .badge img{width:88px;height:88px;border-radius:22px;
      box-shadow:0 12px 30px rgba(0,0,0,.3)}
    .badge span{font-size:38px;font-weight:700}
    .title{font-size:70px;font-weight:800;line-height:1.02;letter-spacing:-2px;
      white-space:pre-line}
    .tag{margin-top:22px;font-size:30px;font-weight:500;color:${theme.subtext}}
    .phone{height:452px;border-radius:26px;border:7px solid ${BEZEL};
      box-shadow:0 26px 64px rgba(0,0,0,.4)}
  </style></head><body>
    <div class="left">
      <div class="badge"><img src="/icons/icon-512.png"><span>Musical Sight</span></div>
      <div class="title">${f.title}</div>
      <div class="tag">${f.tagline}</div>
    </div>
    <img class="phone" src="${phoneImg}">
  </body></html>`
}

// render an HTML string into a same-origin blank page and screenshot the viewport.
// The blank page is stubbed via cy.intercept so nothing needs to ship in the
// build; /icons/* still load from the real preview server (not intercepted).
function render(html: string) {
  cy.intercept('GET', '/blank.html', {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: '<!doctype html><meta charset="utf-8"><body></body>',
  })
  cy.visit('/blank.html')
  cy.document().then((doc) => {
    doc.open()
    doc.write(html)
    doc.close()
  })
  // wait until every image has actually decoded
  cy.get('img', { timeout: 10000 }).should(($imgs) => {
    $imgs.each((_, el) => {
      const img = el as HTMLImageElement
      expect(img.complete, img.src).to.eq(true)
      expect(img.naturalWidth, `naturalWidth ${img.src}`).to.be.greaterThan(0)
    })
  })
  cy.wait(200)
}

describe('store assets', () => {
  // pass 1: capture the raw app screens, in each theme
  shots.forEach((shot) => {
    themeNames.forEach((t) => {
      it(`raw ${shot.name} ${t}`, () => {
        cy.viewport(RAW[shot.device].w, RAW[shot.device].h)
        visitThemed(shot.route, t)
        shot.prepare()
        cy.screenshot(`raw-${shot.name}-${t}`, {
          capture: 'viewport',
          overwrite: true,
        })
      })
    })
  })

  // pass 2: composite each into a branded 1080x1920 frame
  shots.forEach((shot) => {
    themeNames.forEach((t) => {
      it(`frame ${shot.name} ${t}`, () => {
        cy.viewport(1080, 1920)
        cy.readFile(rawPath(`${shot.name}-${t}`), 'base64').then((b64) => {
          render(frameHtml(dataUri(b64), shot.caption, shot.device, THEMES[t]))
          cy.screenshot(`${shot.name}-${t}`, {
            capture: 'viewport',
            overwrite: true,
          })
        })
      })
    })
  })

  // pass 3: the 1024x500 feature graphics
  features.forEach((f) => {
    themeNames.forEach((t) => {
      it(`feature ${f.name} ${t}`, () => {
        cy.viewport(1024, 500)
        cy.readFile(rawPath(`${f.phone}-${t}`), 'base64').then((b64) => {
          render(featureHtml(f, dataUri(b64), THEMES[t]))
          cy.screenshot(`${f.name}-${t}`, {
            capture: 'viewport',
            overwrite: true,
          })
        })
      })
    })
  })
})
