import { Provider } from 'jotai';
import { MainLayout } from "./components";
import { useAtomIntegration } from "./atoms/integration";

// Import Tailwind first as base
import "./styles/tailwind.css";
// Legacy theme for compatibility during migration
import "./styles/theme.css";
import "./styles/components.css";
import "./styles/focus-management.css";

function AppContent() {
  // Initialize integration between existing hooks and atoms
  useAtomIntegration();

  return <MainLayout />;
}

// Main App component with Jotai Provider
function App() {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
}

export default App;
