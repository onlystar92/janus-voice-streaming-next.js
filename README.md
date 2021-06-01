# Velt voice
Web client using WebRTC voice rooms running on a Janus backend.

## Getting Started

First, install the project dependencies:
```bash
yarn
```

Second, you will need to [install mkcert](https://github.com/FiloSottile/mkcert#installation) to generate a certificate. We require a certificate to run the development environment. You can generate a certificate and configure it by following [this guide](https://web.dev/how-to-use-local-https/#setup). The generated certificate can be configured in the [server.js](https://github.com/Hylist/voice-site/blob/master/server.js#L9-L10) file.

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
