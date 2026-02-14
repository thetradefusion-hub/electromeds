import React, { useEffect } from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { RuleEngineModalProvider } from "./src/context/RuleEngineModalContext";

export default function App() {
  // #region agent log
  useEffect(() => {
    const root = typeof document !== "undefined" ? document.getElementById("root") : null;
    fetch("http://127.0.0.1:7242/ingest/1dfc81ad-c597-4667-9229-581e5b5698b5", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "App.tsx:mount",
        message: "App mounted",
        hypothesisId: "H3",
        timestamp: Date.now(),
        rootChildCount: root?.childNodes?.length ?? -1,
      }),
    }).catch(() => {});
  }, []);
  // #endregion
  return (
    <AuthProvider>
      <RuleEngineModalProvider>
        <RootNavigator />
      </RuleEngineModalProvider>
    </AuthProvider>
  );
}
