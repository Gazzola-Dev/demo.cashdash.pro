const fs = require("fs");
const path = require("path");

// Whitelist of directories that contain reference-worthy code
const whitelistedDirs = [
  "actions", // Core business logic
  "hooks", // Custom React hooks
  "types", // Core type definitions
  "components", // Only key component directories
  "lib", // Utility functions
  "app", // Page components and routing
  // "supabase/migrations", // Database schema and functions
  "middleware", // Middleware functions
  // "styles",
  "docs",
  "providers",
  "data",
  "stores",
];

// Specific subdirectories to exclude even if under whitelisted directories
const blacklistedDirs = [
  "components/ui", // Exclude shadcn components
];

// Whitelist of specific files that should be included when in repo root
const whitelistedRootFiles = [
  // Core configuration files
  "tailwind.config.ts",
  "tailwind.config.js",
  "next.config.mjs",
  "configuration.ts",
  "src/configuration.ts",
  "package.json",
  "tsconfig.json",
  "components.json",

  // Environment examples
  ".env.local.example",
  ".env.local",

  // Documentation
  "README.md",
  "middleware.ts",
  ".gitlab-ci.yml",
  "cypress.config.ts",
];

// System files to ignore
const ignoredFiles = [
  ".DS_Store",
  "Thumbs.db",
  ".directory",
  "desktop.ini",
  ".localized",
  ".gitignore",
  ".temp_gotrue-version",
  ".temp_pooler-url",
  ".temp_postgres-version",
  ".temp_project-ref",
  ".temp_rest-version",
  ".temp_storage-version",
];

// Development warning header
const devWarningHeader = `/*
 * ⚠️ DEVELOPMENT USE ONLY ⚠️
 *
 * This file has all TypeScript errors disabled.
 * These error suppressions should NOT be copied into application code.
 * This file is for development reference only.
 *
 * Use the original source files for application code.
 */
// @ts-nocheck
/* eslint-disable */

`;

// Function to clear directory contents
function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

// Function to check if a file should be included
// Function to check if a file should be included
function shouldIncludeFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const fileName = path.basename(normalizedPath);

  // Check system files
  if (ignoredFiles.includes(fileName)) {
    return false;
  }

  // Check blacklisted directories - look for both middle and start of path
  if (
    blacklistedDirs.some(
      dir =>
        normalizedPath.includes(`/${dir}/`) ||
        normalizedPath.startsWith(dir + "/") ||
        normalizedPath === dir,
    )
  ) {
    return false;
  }

  // For root files, check whitelist
  if (!normalizedPath.includes("/")) {
    return whitelistedRootFiles.includes(normalizedPath);
  }

  // Check whitelisted directories
  return whitelistedDirs.some(dir => {
    const normalizedDir = dir.replace(/\\/g, "/");
    return (
      normalizedPath.startsWith(normalizedDir + "/") ||
      normalizedPath === normalizedDir
    );
  });
}

// Function to extract SQL statements by type
function extractStatements(sql, type) {
  const statements = sql.split(/;(?=(?:[^'"]*["'][^'"]*["'])*[^'"]*$)/g);
  return statements
    .filter(stmt => {
      const normalizedStmt = stmt.trim().toLowerCase();
      switch (type) {
        case "create":
          return (
            normalizedStmt.startsWith("create ") ||
            normalizedStmt.startsWith("-- create") ||
            normalizedStmt.startsWith("alter ") ||
            normalizedStmt.startsWith("grant ") ||
            normalizedStmt.startsWith("revoke ")
          );
        case "insert":
          return (
            normalizedStmt.startsWith("insert ") ||
            normalizedStmt.startsWith("-- insert")
          );
        default:
          return false;
      }
    })
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

// Create squashed migration from all migrations
function createSquashedMigration(migrationsDir, outputDir) {
  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter(file => !ignoredFiles.includes(file))
      .sort();

    let createStatements = new Set();
    let insertStatements = new Set();
    let timestamp = files[files.length - 1].split("_")[0];

    files.forEach(file => {
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      extractStatements(content, "create").forEach(stmt =>
        createStatements.add(stmt + ";"),
      );
      extractStatements(content, "insert").forEach(stmt =>
        insertStatements.add(stmt + ";"),
      );
    });

    const combinedContent = [
      devWarningHeader,
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

    const outputFileName = `${timestamp}squashed_migration.sql`;
    fs.writeFileSync(path.join(outputDir, outputFileName), combinedContent);
    return { originalPath: "supabase/migrations", outputFileName };
  } catch (error) {
    console.error("Error creating squashed migration:", error);
    return null;
  }
}

// Transform file path to flattened name
function getFlattenedFileName(sourcePath) {
  return sourcePath.replace(/[\/\\]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Copy file with development warning header
function copyFile(sourcePath, targetDir) {
  const flattenedName = getFlattenedFileName(sourcePath);
  const targetPath = path.join(targetDir, flattenedName);
  const content = fs.readFileSync(sourcePath, "utf8");
  fs.writeFileSync(targetPath, devWarningHeader + content);
  return flattenedName;
}

// Get all whitelisted files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs
    .readdirSync(dirPath)
    .filter(file => !ignoredFiles.includes(file));

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const relativePath = path.relative(process.cwd(), filePath);

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else if (shouldIncludeFile(relativePath)) {
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
}

// Read llm-files.txt for specific files to include
function getLLMFiles() {
  try {
    if (fs.existsSync("llm-files.txt")) {
      const content = fs.readFileSync("llm-files.txt", "utf8");
      return content.split("\n").filter(line => line.trim());
    }
  } catch (error) {
    console.error("Error reading llm-files.txt:", error);
  }
  return [];
}

// Write index file
function writeIndexFile(mappings, outputDir, isDev = false) {
  const indexContent = mappings
    .map(({ originalPath }) => originalPath)
    .sort()
    .join("\n");

  const fileName = isDev ? "_index-dev.txt" : "_index.txt";
  fs.writeFileSync(path.join(outputDir, fileName), indexContent);
}

// Main execution
function main() {
  // Clear and recreate output directories
  clearDirectory(".llm");
  clearDirectory(".llm-dev");

  const llmMappings = [];
  const llmDevMappings = [];

  // Create squashed migration if exists
  if (fs.existsSync("supabase/migrations")) {
    const migrationMapping = createSquashedMigration(
      "supabase/migrations",
      ".llm",
    );
    if (migrationMapping) {
      llmMappings.push(migrationMapping);
    }
  }

  // Get all whitelisted files
  const allFiles = getAllFiles(process.cwd());

  // Get files from llm-files.txt
  const llmFiles = getLLMFiles();

  if (llmFiles.length > 0) {
    // Copy specified files to .llm-dev
    llmFiles.forEach(file => {
      if (allFiles.includes(file)) {
        const outputFileName = copyFile(file, ".llm-dev");
        llmDevMappings.push({ originalPath: file, outputFileName });
        console.log(`.llm-dev: ${outputFileName}`);
      }
    });

    // Copy remaining files to .llm
    const remainingFiles = allFiles.filter(file => !llmFiles.includes(file));
    remainingFiles.forEach(file => {
      const outputFileName = copyFile(file, ".llm");
      llmMappings.push({ originalPath: file, outputFileName });
      console.log(`.llm: ${outputFileName}`);
    });
  } else {
    // Copy all files to .llm if no specific files specified
    allFiles.forEach(file => {
      const outputFileName = copyFile(file, ".llm");
      llmMappings.push({ originalPath: file, outputFileName });
      console.log(`.llm: ${outputFileName}`);
    });
  }

  // Write index files
  writeIndexFile(llmMappings, ".llm", false);
  if (llmDevMappings.length > 0) {
    writeIndexFile(llmDevMappings, ".llm-dev", true);
  }
}

// Run the script
main();
