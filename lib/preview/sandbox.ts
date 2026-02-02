
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
