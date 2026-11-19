const neutral = {
  50: "var(--neutral-50)",
  100: "var(--neutral-100)",
  200: "var(--neutral-200)",
  300: "var(--neutral-300)",
  400: "var(--neutral-400)",
  500: "var(--neutral-500)",
  600: "var(--neutral-600)",
  700: "var(--neutral-700)",
  800: "var(--neutral-800)",
  900: "var(--neutral-900)",
  950: "var(--neutral-950)",
};

const accent = {
  50: "var(--brand-50)",
  100: "var(--brand-100)",
  200: "var(--brand-200)",
  300: "var(--brand-300)",
  400: "var(--brand-400)",
  500: "var(--brand-500)",
  600: "var(--color-accent-600)",
  700: "var(--color-accent-700)",
  800: "var(--color-accent-800)",
  900: "var(--brand-900)",
  950: "var(--brand-950)",
};

const config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: neutral,
        accent,
        page: "var(--color-page)",
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          hover: "var(--color-surface-hover)",
        },
        foreground: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        action: {
          DEFAULT: "var(--color-action)",
          hover: "var(--color-action-hover)",
          text: "var(--color-accent-text)",
        },
        success: {
          DEFAULT: "var(--color-success-text)",
          bg: "var(--color-success-bg)",
          border: "var(--color-success-border)",
          text: "var(--color-success-text)",
        },
        warning: {
          DEFAULT: "var(--color-warning-text)",
          bg: "var(--color-warning-bg)",
          border: "var(--color-warning-border)",
          text: "var(--color-warning-text)",
        },
        danger: {
          DEFAULT: "var(--color-danger-text)",
          bg: "var(--color-danger-bg)",
          border: "var(--color-danger-border)",
          text: "var(--color-danger-text)",
        },
        info: {
          DEFAULT: "var(--color-info-text)",
          bg: "var(--color-info-bg)",
          border: "var(--color-info-border)",
          text: "var(--color-info-text)",
        },
        status: {
          operational: {
            bg: "var(--status-operational-bg)",
            border: "var(--status-operational-border)",
            text: "var(--status-operational-text)",
          },
          degraded: {
            bg: "var(--status-degraded-bg)",
            border: "var(--status-degraded-border)",
            text: "var(--status-degraded-text)",
          },
          outage: {
            bg: "var(--status-outage-bg)",
            border: "var(--status-outage-border)",
            text: "var(--status-outage-text)",
          },
          maintenance: {
            bg: "var(--status-maintenance-bg)",
            border: "var(--status-maintenance-border)",
            text: "var(--status-maintenance-text)",
          },
          unknown: {
            bg: "var(--status-unknown-bg)",
            border: "var(--status-unknown-border)",
            text: "var(--status-unknown-text)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-family-sans)"],
        mono: ["var(--font-family-mono)"],
      },
      fontSize: {
        "12": "var(--font-size-12)",
        "13": "var(--font-size-13)",
        "14": "var(--font-size-14)",
        "16": "var(--font-size-16)",
        "20": "var(--font-size-20)",
        "24": "var(--font-size-24)",
        "30": "var(--font-size-30)",
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "600",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        24: "var(--space-24)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-lg)",
        full: "var(--radius-md)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-md)",
        xl: "var(--shadow-md)",
      },
    },
  },
};

export default config;
