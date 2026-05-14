import { Routes, Route, Navigate } from "react-router-dom";

import NarrativeLayout from "./components/NarrativeLayout";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";
import CaseStudy from "./pages/CaseStudy";
import Concepts from "./pages/Concepts";
import Stake from "./pages/Stake";
import Send from "./pages/Send";
import Loans from "./pages/Loans";

export default function App() {
  return (
    <Routes>
      {/* Narrative routes — paper theme */}
      <Route element={<NarrativeLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/concepts" element={<Concepts />} />
        {/* /about is the primary path; /case-study kept for back-compat */}
        <Route path="/about" element={<CaseStudy />} />
        <Route path="/case-study" element={<CaseStudy />} />
      </Route>

      {/* App routes — navy theme. Tour + Explainer mount inside AppLayout. */}
      <Route element={<AppLayout />}>
        <Route path="/app" element={<Stake />} />
        <Route path="/app/send" element={<Send />} />
        <Route path="/app/loans" element={<Loans />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
