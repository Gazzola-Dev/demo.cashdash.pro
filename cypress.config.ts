import { defineConfig } from "cypress";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    defaultCommandTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      TEST_EMAIL_1: process.env.TEST_EMAIL_1,
      TEST_EMAIL_2: process.env.TEST_EMAIL_2,
      TEST_EMAIL_3: process.env.TEST_EMAIL_3,
      TEST_PASSWORD: process.env.TEST_PASSWORD,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  },
});
