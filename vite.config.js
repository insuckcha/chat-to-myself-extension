import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs/promises";

export default defineConfig({
    plugins: [
        react(),

        // Fix <script src="./popup.tsx"> to popup.js in dist/popup.html
        {
            name: "fix-popup-html",
            apply: "build",
            writeBundle: async () => {
                const file = "dist/popup.html";
                try {
                    let html = await fs.readFile(file, "utf-8");
                    html = html.replace("./popup.tsx", "./popup.js");
                    await fs.writeFile(file, html);
                } catch (e) {
                    console.warn("fix-popup-html: popup.html not found:", e.message);
                }
            }
        },

        // Copy manifest.json to dist/
        {
            name: "copy-manifest",
            apply: "build",
            closeBundle: async () => {
                try {
                    await fs.copyFile("manifest.json", "dist/manifest.json");
                } catch (e) {
                    console.error("Failed to copy manifest.json:", e.message);
                }
            }
        },

        // ✅ Copy icons/ folder to dist/icons
        {
            name: "copy-icons",
            apply: "build",
            closeBundle: async () => {
                try {
                    await fs.mkdir("dist/icons", { recursive: true });
                    const files = ["icon16.png", "icon48.png", "icon128.png"];
                    for (const file of files) {
                        await fs.copyFile(`icons/${file}`, `dist/icons/${file}`);
                    }
                } catch (e) {
                    console.error("Failed to copy icons:", e.message);
                }
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
        outDir: "dist",
        emptyOutDir: true
    }
});
