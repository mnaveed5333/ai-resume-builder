import "./globals.css";
import StoreProvider from "./StoreProvider";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "AI Resume Builder",
  description: "Build professional resumes with AI assistance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Navbar />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}