import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Design Tokens - Glassmorphism
                glass: {
                    DEFAULT: "var(--glass-bg)",
                    hover: "var(--glass-bg-hover)",
                    active: "var(--glass-bg-active)",
                    border: "var(--glass-border)",
                    "border-hover": "var(--glass-border-hover)",
                    "border-active": "var(--glass-border-active)",
                },
                // Design Tokens - FSRS Ratings
                fsrs: {
                    easy: "var(--fsrs-easy)",
                    good: "var(--fsrs-good)",
                    hard: "var(--fsrs-hard)",
                    again: "var(--fsrs-again)",
                },
                // Design Tokens - Semantic Colors
                success: "var(--success)",
                warning: "var(--warning)",
                error: "var(--error)",
                info: "var(--info)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                // Extended radius tokens
                xs: "var(--radius-xs)",
                xl: "var(--radius-xl)",
                "2xl": "var(--radius-2xl)",
                "3xl": "var(--radius-3xl)",
            },
            spacing: {
                xs: "var(--spacing-xs)",
                sm: "var(--spacing-sm)",
                md: "var(--spacing-md)",
                lg: "var(--spacing-lg)",
                xl: "var(--spacing-xl)",
                "2xl": "var(--spacing-2xl)",
                "3xl": "var(--spacing-3xl)",
            },
            backdropBlur: {
                xs: "var(--glass-blur-xs)",
                sm: "var(--glass-blur-sm)",
                md: "var(--glass-blur-md)",
                lg: "var(--glass-blur-lg)",
                xl: "var(--glass-blur-xl)",
            },
            transitionDuration: {
                fast: "var(--duration-fast)",
                normal: "var(--duration-normal)",
                slow: "var(--duration-slow)",
                slower: "var(--duration-slower)",
            },
            zIndex: {
                base: "var(--z-base)",
                dropdown: "var(--z-dropdown)",
                sticky: "var(--z-sticky)",
                fixed: "var(--z-fixed)",
                "modal-backdrop": "var(--z-modal-backdrop)",
                modal: "var(--z-modal)",
                popover: "var(--z-popover)",
                tooltip: "var(--z-tooltip)",
            },
            fontFamily: {
                sans: [
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "SF Pro Display",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
            },
        },
    },
    plugins: [],
};

export default config;
