import { config } from "dotenv";
import path from "node:path";

const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  config({
    path: path.resolve(process.cwd(), file),
    override: true,
  });
}










