import { MainLayout } from "./components";
import { AppProvider } from "./contexts/AppContext";

// Import Tailwind first as base
import "./styles/tailwind.css";
// Legacy theme for compatibility during migration
import "./styles/theme.css";
import "./styles/components.css";
import "./styles/focus-management.css";

function AppContent() {
  return <MainLayout />;
}

// Main App component with Context Provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
