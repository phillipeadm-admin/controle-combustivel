import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Controle de Combustível",
  description: "Gerenciamento inteligente de frotas e abastecimento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} bg-[var(--color-background)] text-slate-900 min-h-screen antialiased selection:bg-[#006fb3]/20`}
      >
        <main className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
