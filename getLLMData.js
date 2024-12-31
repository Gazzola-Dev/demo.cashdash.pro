const fs = require("fs/promises");
const path = require("path");
const OUTPUT_DIR = ".llm-data";

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function emptyDirectory(directory) {
  if (!(await exists(directory))) {
    return;
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await emptyDirectory(fullPath);
      await fs.rmdir(fullPath);
    } else {
      await fs.unlink(fullPath);
    }
  }
}

async function shouldIncludeFile(dirName, fileName) {
  // Only process files from specific directories with specific patterns
  const validDirs = ["hooks", "actions", "types", "constants"];
  if (!validDirs.includes(dirName)) {
    return false;
  }

  if (dirName === "hooks" && !fileName.endsWith(".hooks.ts")) {
    return false;
  }

  if (dirName === "actions" && !fileName.endsWith(".actions.ts")) {
    return false;
  }

  // For types and constants, maintain the original behavior
  if (dirName === "types" || dirName === "constants") {
    const periods = fileName.split(".").length - 1;
    return periods >= 2;
  }

  return true;
}

async function flatCopyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dirName = path.basename(src);
    if (entry.isDirectory()) {
      await flatCopyDir(srcPath, dest);
    } else {
      if (await shouldIncludeFile(dirName, entry.name)) {
        await fs.copyFile(srcPath, path.join(dest, entry.name));
      }
    }
  }
}

async function combineTypesFiles(typesDir, outputPath) {
  const files = await fs.readdir(typesDir);
  let combined = "";
  for (const file of files) {
    if (file === "database.types.ts") continue;
    // Only include files with additional period in their name
    if (file.split(".").length < 3) continue;
    const content = await fs.readFile(path.join(typesDir, file), "utf-8");
    combined += `// From ${file}\n${content}\n\n`;
  }
  if (combined) {
    await fs.writeFile(outputPath, combined);
  }
}

async function combineMigrations(migrationsDir, outputPath) {
  const files = (await fs.readdir(migrationsDir)).sort();
  let combined = "";
  for (const file of files) {
    const content = await fs.readFile(path.join(migrationsDir, file), "utf-8");
    combined += `-- From ${file}\n${content}\n\n`;
  }
  const timestamp = files[files.length - 1].split("_")[0];
  await fs.writeFile(
    path.join(OUTPUT_DIR, `${timestamp}combined_migrations.sql`),
    combined,
  );
}

async function main() {
  // Empty the output directory if it exists
  await emptyDirectory(OUTPUT_DIR);

  // Create fresh output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Directories to copy (only process specific directories)
  const dirsToCopy = ["actions", "hooks", "types", "constants"];
  for (const dir of dirsToCopy) {
    if (await exists(dir)) {
      await flatCopyDir(dir, OUTPUT_DIR);
    }
  }

  // Handle database types separately since they're special
  if (await exists("types/database.types.ts")) {
    await fs.copyFile(
      "types/database.types.ts",
      path.join(OUTPUT_DIR, "database.types.ts"),
    );
  }

  // Handle Supabase specific files
  if (await exists("supabase/database.types.ts")) {
    await fs.copyFile(
      "supabase/database.types.ts",
      path.join(OUTPUT_DIR, "database.types.ts"),
    );
  }

  if (await exists("supabase/migrations")) {
    await combineMigrations(
      "supabase/migrations",
      path.join(OUTPUT_DIR, "combined_migrations.sql"),
    );
  }

  // Files to copy
  const filesToCopy = [
    "package.json",
    "README.md",
    "tailwind.config.ts",
    "tailwind.config.js",
    "tsconfig.json",
    "next.config.mjs",
    "configuration.ts",
    "components.json",
    ".env.local.example",
    "styles/global.css",
  ];

  for (const file of filesToCopy) {
    if (await exists(file)) {
      const destPath = path.join(OUTPUT_DIR, path.basename(file));
      const destDir = path.dirname(destPath);
      if (destDir !== OUTPUT_DIR) {
        await fs.mkdir(destDir, { recursive: true });
      }
      await fs.copyFile(file, destPath);
    }
  }
}

main().catch(console.error);
