import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { BackendProvider } from "../components/BackendContext";
import { AnalysisProvider } from "../components/AnalysisContext";
import GlobalStatus from "../components/GlobalStatus";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
    return (
        <div className={inter.className}>
            <BackendProvider>
                <AnalysisProvider>
                    <Component {...pageProps} />
                    <GlobalStatus />
                </AnalysisProvider>
            </BackendProvider>
        </div>
    );
}
