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

async function processDirectory(src, dest, prefix = "") {
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const srcPath = path.join(src, entry.name);
    const baseName = entry.name.replace(/\.(ts|tsx|js|jsx)$/, "");

    if (entry.isDirectory()) {
      const newPrefix = prefix ? `${prefix}_${entry.name}` : entry.name;
      await processDirectory(srcPath, dest, newPrefix);
    } else {
      if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
        const fileName = prefix ? `${prefix}_${baseName}` : baseName;
        const extension = path.extname(entry.name);
        const newFileName = fileName + extension;
        await fs.copyFile(srcPath, path.join(dest, newFileName));
      }
    }
  }
}

async function flatCopyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  const dirName = path.basename(src);

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const srcPath = path.join(src, entry.name);
    if (entry.isDirectory()) {
      await flatCopyDir(srcPath, dest);
    } else {
      const baseName = entry.name.replace(/\.(ts|tsx|js|jsx)$/, "");
      const extension = path.extname(entry.name);
      const newFileName = `${dirName}_${baseName}${extension}`;
      await fs.copyFile(srcPath, path.join(dest, newFileName));
    }
  }
}

function extractCreateStatements(sql) {
  // Split on semicolons but keep comments
  const statements = sql.split(/;(?=(?:[^'"]*["'][^'"]*["'])*[^'"]*$)/g);
  return statements
    .filter(stmt => {
      const normalizedStmt = stmt.trim().toLowerCase();
      return (
        normalizedStmt.startsWith("create ") ||
        normalizedStmt.startsWith("-- create") ||
        normalizedStmt.startsWith("alter ") ||
        normalizedStmt.startsWith("grant ") ||
        normalizedStmt.startsWith("revoke ")
      );
    })
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

function extractInsertStatements(sql) {
  const statements = sql.split(/;(?=(?:[^'"]*["'][^'"]*["'])*[^'"]*$)/g);
  return statements
    .filter(stmt => {
      const normalizedStmt = stmt.trim().toLowerCase();
      return (
        normalizedStmt.startsWith("insert ") ||
        normalizedStmt.startsWith("-- insert")
      );
    })
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

async function createSquashedMigration(migrationsDir) {
  const files = (await fs.readdir(migrationsDir))
    .filter(f => f !== ".DS_Store")
    .sort();

  let createStatements = new Set();
  let insertStatements = new Set();
  let timestamp = files[files.length - 1].split("_")[0];

  for (const file of files) {
    const content = await fs.readFile(path.join(migrationsDir, file), "utf-8");

    // Extract and add CREATE statements
    extractCreateStatements(content).forEach(stmt =>
      createStatements.add(stmt + ";"),
    );

    // Extract and add INSERT statements
    extractInsertStatements(content).forEach(stmt =>
      insertStatements.add(stmt + ";"),
    );
  }

  // Combine statements in logical order
  const combinedContent = [
    "-- Squashed migration combining all changes",
    "-- Types and Enums",
    ...Array.from(createStatements)
      .filter(
        stmt =>
          stmt.toLowerCase().includes("type") ||
          stmt.toLowerCase().includes("enum"),
      )
      .sort(),
    "",
    "-- Tables, Functions, and Triggers",
    ...Array.from(createStatements)
      .filter(
        stmt =>
          !stmt.toLowerCase().includes("type") &&
          !stmt.toLowerCase().includes("enum"),
      )
      .sort(),
    "",
    "-- Data",
    ...Array.from(insertStatements).sort(),
    "",
  ].join("\n");

  await fs.writeFile(
    path.join(OUTPUT_DIR, `${timestamp}squashed_migration.sql`),
    combinedContent,
  );
}

async function processCombinedFiles(combinedFilesDir, dest) {
  const entries = await fs.readdir(combinedFilesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const srcPath = path.join(combinedFilesDir, entry.name);
    if (entry.isFile()) {
      await fs.copyFile(srcPath, path.join(dest, entry.name));
    } else if (entry.isDirectory()) {
      await processCombinedFiles(srcPath, dest);
    }
  }
}

async function processTemplateFiles(templateDir, dest) {
  if (!(await exists(templateDir))) return;

  const entries = await fs.readdir(templateDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await processTemplateFiles(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  // Empty the output directory if it exists
  await emptyDirectory(OUTPUT_DIR);

  // Create fresh output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Process app and components directories with flattened structure
  if (await exists("app")) {
    await processDirectory("app", OUTPUT_DIR);
  }
  if (await exists("components")) {
    await processDirectory("components", OUTPUT_DIR);
  }

  // Process combinedFiles directory if it exists
  // if (await exists("combinedFiles")) {
  //   await processCombinedFiles("combinedFiles", OUTPUT_DIR);
  // }

  // Process templateFiles directory if it exists
  if (await exists("templateFiles")) {
    await processTemplateFiles("templateFiles", OUTPUT_DIR);
  }

  // Directories to copy (process all files in these directories)
  const dirsToCopy = ["actions", "hooks", "types", "constants", "stores"];
  for (const dir of dirsToCopy) {
    if (await exists(dir)) {
      await flatCopyDir(dir, OUTPUT_DIR);
    }
  }

  // Handle database types separately
  if (await exists("types/database.types.ts")) {
    await fs.copyFile(
      "types/database.types.ts",
      path.join(OUTPUT_DIR, "types_database.types.ts"),
    );
  }

  // Handle Supabase specific files
  if (await exists("supabase/database.types.ts")) {
    await fs.copyFile(
      "supabase/database.types.ts",
      path.join(OUTPUT_DIR, "supabase_database.types.ts"),
    );
  }

  if (await exists("supabase/migrations")) {
    // Create squashed migration only
    await createSquashedMigration("supabase/migrations");
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

  console.log("Data collection complete!");
}

main().catch(console.error);
