import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import StoreContextProvider from "@/lib/StoreContextProvider.jsx";
import { ApolloWrapper } from "@/lib/ApolloWrapper.jsx";
import { ConfigProvider } from "antd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "",
  description: "",
};

const theme = {
  token: {
    fontSize: 16,
    colorPrimary: "#54C8E8"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ApolloWrapper>
          <ConfigProvider theme={theme}>
            <StoreContextProvider>
              <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
            </StoreContextProvider>
          </ConfigProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
