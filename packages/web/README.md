<p align="center">
  <img width="120" alt="Logo" src="./public/images/logo.svg">
  <h1 align="center">@bustit/web</h1>
</p>
<p align="center">
  The browser client of bustit.
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/CSS%20Library-Tailwind%20CSS-blue?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
</p>

## Table of Contents

- [Introduction](#introduction)
  - [Features](#features)
- [Configuration](#configuration)
- [Development](#development)

## Introduction

The web app is what players see of bustit. It renders the pages and is the only part browsers talk
to: it works as a backend for the frontend and calls the game server on their behalf. The game
server's token stays in the web app's encrypted session cookie and never reaches browser code.

### Features

- Login with username and password
- Every page but login and registration requires a session
- German and English, picked from the browser and kept in the URL
- A dark theme with fonts served from the app itself, nothing loaded from third parties

## Configuration

The web app is configured through environment variables, which are documented in
[`docs/configuration.md`](./docs/configuration.md).

## Development

Starts the web app with hot reload on http://localhost:3000. It needs the game server running;
`npm run dev` in the repository root starts both.

```bash
npm run dev -w @bustit/web
```

Builds the web app for production and starts it.

```bash
npm run build -w @bustit/web
npm run start -w @bustit/web
```
