import { Provider } from 'jotai';
import { MainLayout } from './features/layout';

// Import Tailwind first as base
import './styles/tailwind.css';

// Essential theme variables (editor font sizes, editor background)
import './styles/theme.css';

// Main App component with Jotai Provider
function App() {
  return (
    <Provider>
      <MainLayout />
    </Provider>
  );
}

export default App;
