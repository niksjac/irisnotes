import { Provider } from 'jotai';
import { MainLayout } from "./features/layout";

// Import Tailwind first as base
import "./styles/tailwind.css";
// Essential theme variables (editor font sizes, editor background)
import "./styles/theme.css";

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
