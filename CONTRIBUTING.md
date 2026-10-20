# Contributing Guide

This document explains the conventions every contribution follows, whether it is written by a person
or with the help of an AI.

## Table of Contents

- [Project Language](#project-language)
- [Commit Messages](#commit-messages)
  - [Header](#header)
  - [Body](#body)
  - [Footer](#footer)
  - [Examples](#examples)
- [Before Committing](#before-committing)

## Project Language

English is the language of the project. Use it for source code, comments, documentation and commit
messages. The only exception is the German UI text in the translation files.

## Commit Messages

Commit messages follow a convention inspired by the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md).
It keeps the history readable and makes it easy to see which part of the project a commit touches.

Each commit message consists of a header, an optional body and an optional footer:

```
<header>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Header

```
<type>(<scope>): <short summary>
```

#### Type

- `feat`: A new feature or a change of behavior
- `fix`: A bug fix
- `docs`: Documentation only changes
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes to the build system, tooling, containers or dependencies
- `perf`: A code change that improves performance
- `revert`: Reverts a previous commit

#### Scope

The scope names the package a commit changes:

- `engine`
- `shared`
- `server`
- `web`

A commit that isn't about one package, such as a change to the root scripts or the repository's
documentation, has no scope. A commit that needs changes in several packages for one feature, such as
a schema in `shared` and its use in `server`, takes the scope of the package the feature is about.

#### Short Summary

A one-line description of the change in the imperative mood ("add", not "added" or "adds"), starting
with a lowercase letter and without a period at the end. Keep it under 72 characters.

### Body

Optional. One to five short sentences on why the change was made and anything a reader of the history
needs to understand it, such as a constraint that isn't obvious from the code. This is the place for
the reasoning behind a decision, which doesn't belong in code comments. Don't list what the diff
already shows.

### Footer

Optional. Breaking changes (`BREAKING CHANGE: <description>`), references to issues and co-author
lines.

### Examples

```
feat(web): require a session for every page but login and registration
```

```
build: add dockerfiles for the server and the web app

Both images build from the repository root, which holds the lockfile and
the workspaces. The server image has a separate migrate target, as
migrations run before the server starts.
```

## Before Committing

A change is done once these pass:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run format
```

Keep each commit focused on one change. Unrelated changes, such as a refactoring noticed on the way,
go into a commit of their own.
