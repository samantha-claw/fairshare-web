// Root layout — delegates to the locale-aware layout.
// All routes live under [locale]/, so this just passes through.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
