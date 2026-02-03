
import { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";

export const SANDBOX_CONFIG = {
    template: "react-ts" as SandpackPredefinedTemplate,
    theme: "dark",

    // Default dependencies we always want available
    dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "lucide-react": "latest",
        "clsx": "latest",
        "tailwind-merge": "latest",
        "framer-motion": "latest",
    },

    // Tailwind configuration for the sandbox
    tailwindConfig: {
        theme: {
            extend: {
                colors: {
                    // Custom colors to match our app if needed
                }
            }
        }
    }
};

export function getSandboxDefaults() {
    return SANDBOX_CONFIG;
}

export function getDeploymentDependencies() {
    return {
        dependencies: {
            // Core React 19
            "react": "^19.0.0",
            "react-dom": "^19.0.0",

            // UI Libraries (matching workspace)
            "lucide-react": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest",
            "framer-motion": "latest",
        },
        devDependencies: {
            "@types/react": "^19.0.0",
            "@types/react-dom": "^19.0.0",
            "typescript": "^5.0.0",

            // Build Tool (Vite)
            "vite": "^5.0.0",
            "@vitejs/plugin-react": "^4.2.0",

            // Tailwind CSS
            "tailwindcss": "^3.4.0",
            "autoprefixer": "^10.4.14",
            "postcss": "^8.4.31"
        }
    };
}
