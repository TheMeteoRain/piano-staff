# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.6.2](https://github.com/TheMeteoRain/piano-staff/compare/v0.6.1...v0.6.2) (2026-07-14)


### Bug Fixes

* **ci:** include hidden files so assetlinks.json ships in the image ([b6a1d76](https://github.com/TheMeteoRain/piano-staff/commit/b6a1d76ec13317090062ec9f59c0a0da45f11762))

## [0.6.1](https://github.com/TheMeteoRain/piano-staff/compare/v0.6.0...v0.6.1) (2026-07-14)


### Bug Fixes

* **pwa:** auto-reload on service worker update ([d697132](https://github.com/TheMeteoRain/piano-staff/commit/d697132b0c81faeeec76f183c0c35225bb4acb67))
* **pwa:** remove stray mailto protocol handler ([5694b51](https://github.com/TheMeteoRain/piano-staff/commit/5694b514a233c479822b8648de7f8d23abcb258a))
* **twa:** serve Digital Asset Links for Play domain verification ([cc31d05](https://github.com/TheMeteoRain/piano-staff/commit/cc31d05165450324d44fcb6a937ed6a039684144))

## [0.6.0](https://github.com/TheMeteoRain/piano-staff/compare/v0.5.0...v0.6.0) (2026-07-13)


### Features

* **endscreen:** order per-note stats highest to lowest, matching the staff ([94f4770](https://github.com/TheMeteoRain/piano-staff/commit/94f4770f335c89abf75c8b68c016606d40529b52))
* **sight-reading:** swappable answer input — letter buttons or piano keyboard ([119af50](https://github.com/TheMeteoRain/piano-staff/commit/119af50f7842e87fcfc2425e695ac3afea7b95ad))
* **store:** generate Play Store graphics with Cypress ([320568d](https://github.com/TheMeteoRain/piano-staff/commit/320568d8ea8fb0caac075c8e6015895c38cae722))


### Bug Fixes

* **exercise:** center guess tally reliably on Safari/iPad ([5e64dde](https://github.com/TheMeteoRain/piano-staff/commit/5e64ddeeff2b22e8a7d7c75a79fac4c1cb16d46d))
* **pwa:** correct manifest icon paths to /icons/ ([d677d53](https://github.com/TheMeteoRain/piano-staff/commit/d677d53b98c499861496bb6e0e0dcb7673b34c89))

## [0.5.0](https://github.com/TheMeteoRain/piano-staff/compare/v0.4.1...v0.5.0) (2026-07-12)


### Features

* **endscreen:** show attempts per note as x/y - N% ([f380990](https://github.com/TheMeteoRain/piano-staff/commit/f3809909e695aabc03e235781c034e1d6deabdbd))
* **exercise:** authentic offline piano note playback ([e2d9262](https://github.com/TheMeteoRain/piano-staff/commit/e2d92620a089ddb3b1eb3d81a33998a38b00f92f))
* **exercise:** faded dashed guides at the question spot ([bc9a223](https://github.com/TheMeteoRain/piano-staff/commit/bc9a2231a8ff0cc61ae86c7453f25b8939a77697))
* **exercise:** pause-drain progress loop, guess tally and answer animations ([9fa5a25](https://github.com/TheMeteoRain/piano-staff/commit/9fa5a255642f819247dd95bab8f06767df630ae3))
* **exercise:** self-paced mode to answer notes before the question spot ([34e0dc3](https://github.com/TheMeteoRain/piano-staff/commit/34e0dc3eec27cf94d9fe40717b9084c0a732f84a))
* **nav:** vertical secondary-nav transitions without view-transition flashes ([557eaa2](https://github.com/TheMeteoRain/piano-staff/commit/557eaa2c77a06e48f1da9739147c54efd004524d))
* new button look for exercises ([175ebd6](https://github.com/TheMeteoRain/piano-staff/commit/175ebd600e11140c3ed7025ac89bc06c18519deb))
* **pwa:** iOS install instructions and clearer install states ([d1055e6](https://github.com/TheMeteoRain/piano-staff/commit/d1055e66938b4b8ba64fe70eec990bde56e17d75))
* **settings:** add mistakes-allowed limit with 0 for unlimited ([cf872e2](https://github.com/TheMeteoRain/piano-staff/commit/cf872e2ededac3bf541e9b318af73314b51a6a52))
* **settings:** add note sounds toggle to mute playback ([4959db7](https://github.com/TheMeteoRain/piano-staff/commit/4959db77662d101ecf199452ab2f4364d6227c68))
* **settings:** configurable wait delay between notes, distinct from travel time ([60e790b](https://github.com/TheMeteoRain/piano-staff/commit/60e790bdff69aa29960e7fc3caf3ad279b1f0167))
* **settings:** split settings into hub, exercise settings and app info pages ([3fcd1e6](https://github.com/TheMeteoRain/piano-staff/commit/3fcd1e68f59440da9b75e1e51fa4294f7bc94f70))
* **theme:** gradient brand header and tinted cards ([5f4d6b5](https://github.com/TheMeteoRain/piano-staff/commit/5f4d6b5be7f80ad7468cb34b65c853698e361235))
* **theme:** semantic tokens, AAA status colors and gray-lavender backgrounds ([3163ae8](https://github.com/TheMeteoRain/piano-staff/commit/3163ae8e84d09a1379f1d1e4221177801bbd70e0))
* **training:** add key-signature recognition exercise ([24faae8](https://github.com/TheMeteoRain/piano-staff/commit/24faae8124aa5789042acded551517acc31673c2))
* **training:** show the view first, then a short delay before the timed start ([b5092f7](https://github.com/TheMeteoRain/piano-staff/commit/b5092f7e7250d4d3b02b3341d76f1ba8142cbc73))
* **training:** two-level nav — note reading & key signatures, each with 3 modes ([357dc7a](https://github.com/TheMeteoRain/piano-staff/commit/357dc7a65eb1c8a0f6faa125a7bd116ef93aaff3))


### Bug Fixes

* **a11y:** note buttons use AAA primary-fill tokens ([cb023fa](https://github.com/TheMeteoRain/piano-staff/commit/cb023fa2e6c5d211e159a3455564d176d4eef75d))
* always refresh localstorage ([899fdb3](https://github.com/TheMeteoRain/piano-staff/commit/899fdb309f6798776d03cd45b5115e9efb5c3b9b))
* color themes ([c9bc43c](https://github.com/TheMeteoRain/piano-staff/commit/c9bc43c5f9c7f52f2f103581dae071581eaf804b))
* **exercise:** hold on final mistake before game over so the outcome is visible ([6532cc4](https://github.com/TheMeteoRain/piano-staff/commit/6532cc4f20261d11ba0102b8b8c2571113954da7))
* **exercise:** kill leaked animation loops and freeze game clock in pause ([56b0796](https://github.com/TheMeteoRain/piano-staff/commit/56b07965e40d385f91e512721283b98579bf145f))
* **exercise:** position notes at first draw and scope svg lookups ([fe4f483](https://github.com/TheMeteoRain/piano-staff/commit/fe4f483579e070f89db09d213c8232271b2e3109))
* **exercise:** zero Tone lookAhead so notes play instantly on press ([2639920](https://github.com/TheMeteoRain/piano-staff/commit/26399202fc0137f07d46ce176c9b020b4a13fe81))
* **settings:** load saved settings synchronously and type accessors per key ([a5bba82](https://github.com/TheMeteoRain/piano-staff/commit/a5bba82d6558c3a971c2b1423396ef8ad3ada9a3))
* **training:** stop key-signature exercise on unmount so it doesn't keep playing ([4977dfe](https://github.com/TheMeteoRain/piano-staff/commit/4977dfe63513ba991ac4df06055b85b4955fc668))


### Performance Improvements

* **exercise:** drop deep reactivity over VexFlow note objects ([db01b95](https://github.com/TheMeteoRain/piano-staff/commit/db01b95abf71a5111ccbfa8cffa63eb0feef474d))
* **pwa:** serve precached assets cache-first instead of network-first ([23d9a90](https://github.com/TheMeteoRain/piano-staff/commit/23d9a90d66ba139f3b3d63eda6fe1cc38cfc94ed))

## [0.4.1](https://github.com/TheMeteoRain/piano-staff/compare/v0.4.0...v0.4.1) (2025-07-03)


### Bug Fixes

* Invalid manifest.json ([7fa90c2](https://github.com/TheMeteoRain/piano-staff/commit/7fa90c2f8603c2a0f683df127259ab2011df786e))
* Invalid manifest.json ([e1d46ee](https://github.com/TheMeteoRain/piano-staff/commit/e1d46ee4af240a6541d0763b4af2aea487062fde))

## [0.4.0](https://github.com/TheMeteoRain/piano-staff/compare/v0.3.0...v0.4.0) (2025-07-03)


### Features

* Add PWA capability ([185559a](https://github.com/TheMeteoRain/piano-staff/commit/185559a0577cd0e8c27d6ad637278e28720c4597))
* Stylize application ([3eb9bcf](https://github.com/TheMeteoRain/piano-staff/commit/3eb9bcf16d6fd8f6b1bd4954cce8caa87552516d))
* Update manifest.json to support TWA ([ac4fe43](https://github.com/TheMeteoRain/piano-staff/commit/ac4fe432d30ea522062242e3daf57e70bf521c0b))
* Update web and android icons ([7ce1be7](https://github.com/TheMeteoRain/piano-staff/commit/7ce1be74691f0c9b173a723668755dc5b67e8fcb))


### Bug Fixes

* Color theme variables ([045c888](https://github.com/TheMeteoRain/piano-staff/commit/045c888c5152fdc8648638ae880dc1c069aa4a25))

## [0.3.0](https://github.com/TheMeteoRain/piano-staff/compare/v0.2.0...v0.3.0) (2025-06-24)


### Features

* **metrics:** Send web tracing metrics ([b3140ff](https://github.com/TheMeteoRain/piano-staff/commit/b3140ff480e381ffc6dd090462784ba01d3281fe))
* Show application information ([65dbf05](https://github.com/TheMeteoRain/piano-staff/commit/65dbf054e5bf806ed893eb6c08aede601948d179))


### Bug Fixes

* **.env:** Change names ([0ae3b6b](https://github.com/TheMeteoRain/piano-staff/commit/0ae3b6b438d9ade244c3df58474d3dc73ac7f85c))
* **ci:** Correct keyword ([a3878cb](https://github.com/TheMeteoRain/piano-staff/commit/a3878cbe3ac0242e0875c10e05833a436c87133e))

## [0.2.0](https://github.com/TheMeteoRain/piano-staff/compare/v0.1.2...v0.2.0) (2025-05-28)


### Features

* **coverage:** Publish test coverage to GH pages ([6d60f06](https://github.com/TheMeteoRain/piano-staff/commit/6d60f069673d0a6aee291327515aaf8ca153b31b))


### Bug Fixes

* manifest.json version manually ([77b748d](https://github.com/TheMeteoRain/piano-staff/commit/77b748d3b948e5f38c8a396c76cd8004a72f2986))

## [0.1.2](https://github.com/TheMeteoRain/piano-staff/compare/v0.1.1...v0.1.2) (2025-05-27)


### Bug Fixes

* **pnpm:** approve-builds warning ([1d7bd6d](https://github.com/TheMeteoRain/piano-staff/commit/1d7bd6d3daaa5fbb49d225160008cb42a6e66bd5))

## [0.1.1](https://github.com/TheMeteoRain/piano-staff/compare/v0.1.0...v0.1.1) (2025-05-27)


### Miscellaneous Chores

* release 0.1.1 ([a3b7fb1](https://github.com/TheMeteoRain/piano-staff/commit/a3b7fb18a8f5898bce2e74941ef700f2f61e5fcf))

## 0.1.0 (2025-05-27)


### Miscellaneous Chores

* release 0.1.0 ([a7fd863](https://github.com/TheMeteoRain/piano-staff/commit/a7fd8639930a3cd4c3937336eceae2090538438c))

## [0.1.0-beta.0] - 2025-05-26

Base version of application.
