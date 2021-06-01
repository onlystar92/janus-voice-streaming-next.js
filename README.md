# Velt voice
Web client using WebRTC voice rooms running on a Janus backend.

## Getting Started

First, install all the dependencies using the following command:
```bash
yarn
```

Second, you will need to [install mk-cert](https://github.com/FiloSottile/mkcert#installation) to generate a certificate. We require a certificate to run the development environment. You can generate the certificate and configure it following [this guide](https://web.dev/how-to-use-local-https/#setup). You can configure the certificate in the `server.js` file.

Third, run the development server:
```bash
yarn dev
```

Open [https://localhost:3000](https://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
