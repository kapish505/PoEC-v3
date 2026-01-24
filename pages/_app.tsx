import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { BackendProvider } from "../components/BackendContext";
import { AnalysisProvider } from "../components/AnalysisContext";
import Layout from "../components/Layout";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
    return (
        <div className={inter.className}>
            <BackendProvider>
                <AnalysisProvider>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </AnalysisProvider>
            </BackendProvider>
        </div>
    );
}
