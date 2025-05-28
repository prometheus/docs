import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import {
  Anchor,
  AppShell,
  AppShellMain,
  ColorSchemeScript,
  Container,
  Group,
  mantineHtmlProps,
  MantineProvider,
  Space,
  Text,
} from "@mantine/core";

// Using layered imports here to be able to override Mantine's CSS, see
// https://mantine.dev/styles/mantine-styles/#css-layers.
import "@mantine/core/styles.layer.css";
import "@mantine/code-highlight/styles.layer.css";
import "@mantine/spotlight/styles.layer.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { theme } from "@/theme";
import docsConfig from "../../docs-config";

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const latoFont = Lato({
  variable: "--font-lato",
  preload: true,
  subsets: ["latin"],
  weight: "300",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(docsConfig.siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${interFont.variable} ${latoFont.variable}`}
    >
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <AppShell header={{ height: "var(--header-height)" }}>
            <Header />

            <AppShellMain>
              <Container size="xl" mt="xl" px={{ base: "md", xs: "xl" }}>
                {children}
                <Space h={50} />
              </Container>
            </AppShellMain>

            <footer
              style={{
                backgroundColor:
                  "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-9))",
              }}
            >
              <Container size="xl" px={{ base: "md", xs: "xl" }} py="xl">
                <Group>
                  <Text c="dimmed" fz="sm">
                    &copy; Prometheus Authors 2014-{new Date().getFullYear()} |
                    Documentation Distributed under CC-BY-4.0
                  </Text>
                  <Text c="dimmed" fz="sm">
                    &copy; {new Date().getFullYear()} The Linux Foundation. All
                    rights reserved. The Linux Foundation has registered
                    trademarks and uses trademarks. For a list of trademarks of
                    The Linux Foundation, please see our{" "}
                    <Anchor
                      inherit
                      href="https://www.linuxfoundation.org/trademark-usage"
                      target="_blank"
                    >
                      Trademark Usage
                    </Anchor>{" "}
                    page.
                  </Text>
                </Group>
              </Container>
            </footer>
          </AppShell>
        </MantineProvider>
      </body>
      {/* The Google Analytics ID is not secret, but we want to keep it in an environment variable so that
          people who clone and host this repo somewhere else don't accidentally pollute our GA4 stats */}
      {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
      )}
    </html>
  );
}
