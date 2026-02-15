import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Content Management - GreekLingua Admin",
  description: "Manage learning content, vocabulary, grammar, and phrases",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F11' },
  ],
};

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
