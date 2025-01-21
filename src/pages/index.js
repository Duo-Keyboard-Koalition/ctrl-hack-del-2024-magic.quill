import Image from "next/image";
import localFont from "next/font/local";
import VideoNoteApp from "./videoNoteApp";
import Navbar from "./navBar";
import Head from "next/head";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  return (
    <>

      <header>
        <title>Magic.quill - AI-Powered Note Taking</title>
        <meta name="description" content="Take smart notes with AI assistance" />
      </header>

      <Navbar />
      <VideoNoteApp />
    </>
  );
}
