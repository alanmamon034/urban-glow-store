import { useEffect } from "react";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("ugb_visit_notified")) return;
    sessionStorage.setItem("ugb_visit_notified", "1");
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []);

  return <Component {...pageProps} />;
}
