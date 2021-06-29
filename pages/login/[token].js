import Head from 'next/head';
import { useRouter } from 'next/router';
import { setToken } from 'observables/user';
import { useEffect } from 'react';

async function loginClient(token) {
  await fetch(`https://vapi.veltpvp.com/login/${token}`, {
    credentials: 'include',
    redirect: 'manual',
  });
  return token;
}

function TokenLogin() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (!token) {
      return;
    }

    async function logUserIn() {
      const responseToken = await loginClient(token);
      setToken(responseToken);
    }

    try {
      logUserIn().then(() => router.push('/'));
    } catch (err) {
      console.error('Error occurred while logging in:', err);
      router.push('/404');
    }
  }, [router, token]);

  return (
    <div>
      <Head>
        <title>Velt Voice - Login</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex items-center justify-center min-h-screen max-h-full bg-primary-100">
        <div className="flex flex-col items-center justify-center bg-secondary-200 py-12 px-16 shadow-md rounded-xl">
          <img
            className="h-24 w-auto"
            src="/steve-avatar.png"
            alt="User Avatar"
          />
          <div className="flex flex-col items-center mt-8">
            <svg
              className="animate-spin h-10 text-primary-100"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-4 text-xl text-white font-bold tracking-wide">
              Logging you in...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TokenLogin;
