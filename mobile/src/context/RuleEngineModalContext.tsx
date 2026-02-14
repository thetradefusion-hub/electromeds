import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { RuleEngineProcessingModal } from "../components/RuleEngineProcessingModal";
import type { SuggestionResponse, StructuredCaseInput } from "../api/classicalHomeopathy";

const isWeb = typeof document !== "undefined";
const ReactDOM = isWeb ? require("react-dom") : null;

export type RuleEngineModalOpenParams = {
  patientId: string;
  patientName: string;
  structuredCase: StructuredCaseInput;
  patientHistory?: Array<{ remedyId: string; date: string }>;
  selectedRubricIds?: string[];
  onSuccess: (response: SuggestionResponse) => void;
  onError: (error: unknown) => void;
};

type RuleEngineModalContextValue = {
  openRuleEngineModal: (params: RuleEngineModalOpenParams) => void;
  closeRuleEngineModal: () => void;
};

const RuleEngineModalContext = createContext<RuleEngineModalContextValue | null>(null);

function ModalContent({
  params,
  onClose,
}: {
  params: RuleEngineModalOpenParams;
  onClose: () => void;
}) {
  return (
    <RuleEngineProcessingModal
      visible={true}
      patientId={params.patientId}
      structuredCase={params.structuredCase}
      patientHistory={params.patientHistory}
      selectedRubricIds={params.selectedRubricIds}
      onSuccess={(response) => {
        onClose();
        const res = response;
        const cb = params.onSuccess;
        setTimeout(() => cb(res), 0);
      }}
      onError={(err) => {
        onClose();
        const cb = params.onError;
        setTimeout(() => cb(err), 0);
      }}
    />
  );
}

export function RuleEngineModalProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<RuleEngineModalOpenParams | null>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/1dfc81ad-c597-4667-9229-581e5b5698b5", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "RuleEngineModalContext.tsx:provider-mount",
        message: "RuleEngineModalProvider mounted",
        hypothesisId: "H4",
        timestamp: Date.now(),
        isWeb,
        paramsNull: params === null,
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  // Lazy-init portal container only when modal is first opened (not on mount).
  // Creating a div in document.body on mount can conflict with Expo's DevLoadingView
  // and cause removeChild/<style> errors on refresh.
  useEffect(() => {
    if (!isWeb || !params) return;
    if (portalContainerRef.current) {
      setPortalReady(true);
      return;
    }
    const el = document.createElement("div");
    el.setAttribute("data-rule-engine-modal-root", "true");
    document.body.appendChild(el);
    portalContainerRef.current = el;
    setPortalReady(true);
    // When params becomes null we do not remove the container (avoids removeChild during React commit).
  }, [isWeb, params]);

  useEffect(() => {
    if (!isWeb) return;
    return () => {
      const el = portalContainerRef.current;
      if (el?.parentNode) document.body.removeChild(el);
      portalContainerRef.current = null;
    };
  }, []);

  const openRuleEngineModal = useCallback((p: RuleEngineModalOpenParams) => {
    setParams(p);
  }, []);

  const closeRuleEngineModal = useCallback(() => {
    setParams(null);
  }, []);

  const closeModal = useCallback(() => {
    setParams(null);
  }, []);

  return (
    <RuleEngineModalContext.Provider value={{ openRuleEngineModal, closeRuleEngineModal }}>
      {children}
      {/* On web, render modal into a portal so its DOM/style tree is outside the app tree and unmounts without removeChild conflicts */}
      {isWeb && portalReady && portalContainerRef.current && ReactDOM?.createPortal(
        params ? <ModalContent params={params} onClose={closeModal} /> : null,
        portalContainerRef.current
      )}
      {/* On native, render modal as sibling (no document.body portal) */}
      {!isWeb && params && (
        <RuleEngineProcessingModal
          visible={true}
          patientId={params.patientId}
          structuredCase={params.structuredCase}
          patientHistory={params.patientHistory}
          selectedRubricIds={params.selectedRubricIds}
          onSuccess={(response) => {
            setParams(null);
            setTimeout(() => params.onSuccess(response), 0);
          }}
          onError={(err) => {
            setParams(null);
            setTimeout(() => params.onError(err), 0);
          }}
        />
      )}
    </RuleEngineModalContext.Provider>
  );
}

export function useRuleEngineModal(): RuleEngineModalContextValue {
  const ctx = useContext(RuleEngineModalContext);
  if (!ctx) throw new Error("useRuleEngineModal must be used within RuleEngineModalProvider");
  return ctx;
}
