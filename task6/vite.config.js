import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "/" is required: with nested URLs like /tasks/3 relative asset paths would break.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
