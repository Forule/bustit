export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { serverEnv } = await import('./lib/server/env');

  // Next.js only logs an error thrown here and keeps serving.
  try {
    serverEnv();
  } catch (error) {
    console.error('Invalid environment configuration', error);
    process.exit(1);
  }
}
