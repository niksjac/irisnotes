// Layout configuration constants
export const LAYOUT_CONFIG = {
  SIDEBAR: {
    MIN_WIDTH: 200,
    MAX_WIDTH: 600,
    DEFAULT_WIDTH: 300,
  },
  FOCUS: {
    ACTIVITY_BAR_ID: 'activity-bar',
  },
  BREAKPOINTS: {
    MOBILE_TO_DESKTOP: 'md:flex-row',
  },
} as const;

// CSS class constants for consistent styling
export const LAYOUT_CLASSES = {
  CONTAINER: 'flex flex-col h-screen w-screen',
  MAIN_CONTENT: 'flex-1 overflow-hidden',
  CONTENT_WRAPPER: 'overflow-hidden h-full flex md:flex-row flex-col',
  MAIN_AREA: 'flex-1 flex flex-col overflow-hidden',
} as const;