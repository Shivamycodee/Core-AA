import "./globals.css";
import { Inter } from "next/font/google";
// import dynamic from "next/dynamic";
import ClientWalletContextProvider from "../../context/WalletContext.jsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "360 CORE AA",
  description: "Swap Without Paying tx Gas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientWalletContextProvider>
           {children}
           </ClientWalletContextProvider>
      </body>
    </html>
  );
}
