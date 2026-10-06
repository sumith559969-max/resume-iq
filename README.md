This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Email confirmation redirects

`NEXT_PUBLIC_APP_URL` optionally overrides the origin used for email confirmation links. It is set in `.env.local` to the current development machine's LAN address so another device on the same network can reach the callback. Keep it unset in Vercel to use the domain serving the page, or set it to a real deployment URL when a canonical domain is required. Add the callback URL to Supabase Auth's allowed redirect URLs.

For confirmation links opened on a different device, configure the Supabase Confirm signup email template to link directly to the callback with the token hash, for example:

```text
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
```

The callback also supports the standard PKCE `code` flow when the confirmation is completed in the same browser that initiated registration.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
