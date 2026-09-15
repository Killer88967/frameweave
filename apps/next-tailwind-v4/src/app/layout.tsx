import Script from "next/script";
import "./globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}

        <Script src="/frameweave-bridge.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
