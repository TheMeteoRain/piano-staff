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

## ✍️ Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This helps with readability, automated changelogs, and versioning.

**Format:**

```
<type>(optional-scope): <description>

[optional body]

[optional footer(s)]
```

**Examples:**

```
> feat: add search bar to header
> fix(auth): handle expired token on refresh
> chore: update dependencies
> feat(api)!: remove deprecated endpoint
> refactor!: migrate to new database schema
```

The `!` after the type (or in the footer) indicates a **breaking change**.

**Breaking Changes:**

To signal a breaking change, you can either:

- Add a `!` after the type/scope (e.g. `feat!`, `fix(core)!`)
- Or add a `BREAKING CHANGE:` section in the footer

Example:

```
> feat!: remove deprecated login method
> BREAKING CHANGE: The old login() function has been removed. Use loginWithToken() instead.
```

**Common types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `ci`: CI/CD only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools

### Run Dockerfile

```sh
docker build -t note-exercise .
```

```sh
docker rm -f note-exercise-nginx
```

```sh
docker run --name note-exercise-nginx -d -p 8080:80 note-exercise
```
