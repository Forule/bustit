# Configuration

The web app needs very little configuration. Basically, there are two types: build time
configuration, read when the app is built, and runtime configuration, read by the web server that
renders the pages, runs the Server Actions and talks to the game server.

Both are set through environment variables or, as an alternative, environment files in the web
app's directory. For local development, `.env.development` is committed with values that only work
locally; personal overrides go into the uncommitted `.env.development.local`. A template for a
deployment is available at [`.env.example`](../.env.example).

---

**NOTE**

The configuration is based on the technical possibilities of [Next.js](https://nextjs.org/), see
[Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables). The web
app only uses a part of what is technically possible, but the principles of Next.js still apply,
such as the order in which environment files are loaded.

---

## Configuration Options

### Build time configuration

Changing these variables requires a rebuild of the web app.

| Environment Variable | Description                                                                                                 | Required |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| NEXT_OUTPUT_MODE     | Set to `standalone` to build a self-contained server for a container image. Unset, a regular build is made. | No       |

There are no `NEXT_PUBLIC_` variables. Anything with that prefix would be readable by every browser.

### Runtime configuration

Changing these variables requires a restart of the web server. They are validated when the server
starts, and a missing or malformed variable stops it.

| Environment Variable | Description                                                                                                                  | Required |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| SERVER_URL           | URL the web server reaches the game server at, without the `/api` prefix (e.g. `http://<HOST>:8080`). Browsers never see it. | Yes      |
| AUTH_SECRET          | Secret that encrypts the session cookie. At least 32 characters, random in production. Changing it ends all sessions.        | Yes      |
