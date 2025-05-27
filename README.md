# piano-staff

Reading exercise application for note reading.

## 📚 Table of Contents

- [Recommended IDE Setup](#recommended-ide-setup)
- [Type Support for .vue Imports in TS](#type-support-for-vue-imports-in-ts)
- [Customize configuration](#customize-configuration)
- [Project Setup](#project-setup)
- [Commit Message Guidelines for Version Bumping](#️-commit-message-guidelines-for-version-bumping)
- [Run Dockerfile](#run-dockerfile)

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## 🛠️ Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
pnpm test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
pnpm build
pnpm test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

## ✍️ Commit Message Guidelines for Version Bumping

This project uses [repease-please](https://github.com/marketplace/actions/release-please-action) to automatically bump the version on merge based on your commit messages.

To ensure correct versioning, follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) guidelines.

### 🔺 Major Version Bump (X.0.0)

Triggered when the commit message includes:

- `"BREAKING CHANGE"` anywhere
- `"major"` anywhere
- Conventional commit format: `refactor!: drop support for Node 6`

### 🔸 Minor Version Bump (0.X.0)

Triggered when:

- The commit message starts with `feat`
- Example: `feat: add user login support`
- Contains the word `minor`.
- Custom triggers can be defined via `minor-wording`

### 🔹 Patch Version Bump (0.0.X)

Default for all other changes.

Triggered by commit messages like:

- `fix: handle null pointer in API`
- `patch: correct spelling errors`
- Custom triggers can be defined via `patch-wording`.

### 🧪 Pre-release Version Bump

Triggered by commit messages containing:

- `pre-alpha`
- `pre-beta`
- `pre-rc`
- Example bump: `1.6.0-alpha.1` → `1.6.0-alpha.2` or `1.6.0-alpha.1` → `1.6.0-beta.0`

### 🧠 Tips

- Use conventional commits for consistency: `type(scope): message`.
- You can customize trigger keywords using `minor-wording`, `major-wording`, `patch-wording`, and `rc-wording` in the workflow config.
- If needed, override the detected version bump manually with the `version-type` input.

### Run Dockerfile

```sh
docker build -t note-exercise .
```

```sh
docker rm -f piano-nginx
```

```sh
docker run --name piano-nginx -d -p 8080:80 note-exercise
```
