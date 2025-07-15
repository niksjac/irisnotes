import { Provider } from 'jotai';
import { MainLayout } from "./layouts";

// Import Tailwind first as base
import "./styles/tailwind.css";
// Legacy theme for compatibility during migration
import "./styles/theme.css";
import "./styles/components.css";
import "./styles/focus-management.css";

function AppContent() {
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
