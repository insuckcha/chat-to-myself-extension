import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs/promises";

export default defineConfig({
    plugins: [
        react(),
        {
            name: "fix-popup-html",
            apply: "build",
            closeBundle: async () => {
                const file = "dist/src/popup.html";
                let html = await fs.readFile(file, "utf-8");
                html = html.replace("./popup.tsx", "./popup.js");
                await fs.writeFile("dist/popup.html", html);
                await fs.rm("dist/src", { recursive: true, force: true });
            }
        },
        {
            name: "copy-manifest",
            apply: "build",
            closeBundle: async () => {
                await fs.copyFile("manifest.json", "dist/manifest.json");
            }
        }
    ],
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "src/popup.html")
            },
            output: {
                entryFileNames: "popup.js"
            }
        },
        outDir: "dist"
    }
});
