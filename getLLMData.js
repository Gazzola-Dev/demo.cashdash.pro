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

async function flatCopyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    if (entry.isDirectory()) {
      await flatCopyDir(srcPath, dest);
    } else {
      // Remove the directory prefix from the filename
      const fileName = entry.name;
      await fs.copyFile(srcPath, path.join(dest, fileName));
    }
  }
}

async function combineTypesFiles(typesDir, outputPath) {
  const files = await fs.readdir(typesDir);
  let combined = "";

  for (const file of files) {
    if (file !== "database.types.ts") {
      const content = await fs.readFile(path.join(typesDir, file), "utf-8");
      combined += `// From ${file}\n${content}\n\n`;
    }
  }

  await fs.writeFile(outputPath, combined);
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
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Directories to copy
  const dirsToCopy = ["actions", "hooks", "docs"];
  for (const dir of dirsToCopy) {
    if (await exists(dir)) {
      await flatCopyDir(dir, OUTPUT_DIR);
    }
  }

  // Handle types directory and database types
  if (await exists("types")) {
    await combineTypesFiles("types", path.join(OUTPUT_DIR, "combinedTypes.ts"));
    if (await exists("types/database.types.ts")) {
      await fs.copyFile(
        "types/database.types.ts",
        path.join(OUTPUT_DIR, "database.types.ts"),
      );
    }
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
    "tailwind.config.js", // Include both .ts and .js versions
    "tsconfig.json",
    "next.config.mjs",
    "configuration.ts",
    "components.json",
    ".env.local.example",
    "styles/global.css",
  ];

  for (const file of filesToCopy) {
    if (await exists(file)) {
      // For files in subdirectories, create the directory structure
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
