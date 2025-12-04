import { createTheme } from '@mui/material/styles';

// Our custom color palette and styles
export const customColors = {
  // Background colors
  background: {
    main: '#F4F6F8',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Primary accent - Mint to Emerald gradient
  primary: {
    light: '#34D399',
    main: '#10B981',
    dark: '#059669',
    gradient: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
  },

  // Status colors
  status: {
    error: '#F87171',
    warning: '#FBBF24',
    success: '#10B981',
    info: '#60A5FA',
  },

  // Typography colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    white: '#FFFFFF',
  },

  // Icon colors
  icon: {
    inactive: '#D1D5DB',
    active: '#FFFFFF',
    primary: '#10B981',
  },

  // Parking spot colors
  spot: {
    free: '#FFFFFF',
    freeOutline: '#10B981',
    occupied: '#F3F4F6',
    occupiedOutline: '#EF4444',
    selected: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
  }
};

export const customStyles = {
  // Border Radius
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    xlarge: '20px',
    pill: '50px',
  },

  // Shadows
  shadows: {
    card: '0 4px 20px rgba(0, 0, 0, 0.05)',
    cardHover: '0 8px 30px rgba(0, 0, 0, 0.08)',
    button: '0 2px 10px rgba(16, 185, 129, 0.2)',
    buttonHover: '0 4px 15px rgba(16, 185, 129, 0.3)',
    glow: '0 0 20px rgba(16, 185, 129, 0.3)',
  },

  // Typography
  typography: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
};

// Create MUI theme with our custom colors
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: customColors.primary.light,
      main: customColors.primary.main,
      dark: customColors.primary.dark,
    },
    secondary: {
      main: customColors.text.secondary,
    },
    error: {
      main: customColors.status.error,
    },
    warning: {
      main: customColors.status.warning,
    },
    success: {
      main: customColors.status.success,
    },
    info: {
      main: customColors.status.info,
    },
    background: {
      default: customColors.background.main,
      paper: customColors.background.card,
    },
    text: {
      primary: customColors.text.primary,
      secondary: customColors.text.secondary,
      disabled: customColors.text.disabled,
    },
  },
  typography: {
    fontFamily: customStyles.typography.fontFamily,
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Export everything
export { theme as default };
export { theme };