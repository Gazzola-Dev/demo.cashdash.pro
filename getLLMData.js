const fs = require("fs");
const path = require("path");

// Whitelist of directories that contain reference-worthy code
const whitelistedDirs = [
  "actions", // Core business logic and data mutations
  "hooks", // Custom React hooks for reusable logic
  "types", // Type definitions useful for understanding data structures
  "components/shared", // Shared components across the application
  "components/layout", // Layout components
  "configuration.ts", // Configuration constants
  "constants", // Application constants
  "stores", // State management
  "middleware", // Authentication and routing middleware
  "lib",
];

// Whitelist of specific files that are useful for reference
const whitelistedFiles = [
  // Configuration files
  "tailwind.config.ts",
  "tailwind.config.js",
  "components.json",
  "next.config.mjs",
  "tsconfig.json",
  "package.json",
  "configuration.ts",
  ".prettierrc.json",
  ".eslintrc.json",

  // Environment files
  ".env.local",
  ".env.local.example",
  ".env.development",
  ".env.production",

  // Documentation
  "README.md",

  // Development utilities
  "makeAdmin.js",
  "getChanges.js",
  "generateTypes.js",
  "getIndex.js",
  "seed.js",

  // Test files are handled separately in isWhitelisted function
];

// Excluded directories and files that shouldn't be copied
const excludedDirs = ["node_modules", ".git", ".next", "out", "dist", "build"];

// Function to clear directory contents
function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

// Function to check if path matches whitelist patterns
function isWhitelisted(filePath) {
  // Check if file is directly whitelisted
  if (whitelistedFiles.includes(filePath)) {
    return true;
  }

  // Check if file is a test file
  if (filePath.endsWith(".cy.ts") || filePath.endsWith(".cy.tsx")) {
    return true;
  }

  // Check if file is in a whitelisted directory
  return whitelistedDirs.some(dir => filePath.startsWith(dir));
}

// Function to extract SQL statements
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

// Function to create squashed migration
function createSquashedMigration(migrationsDir, outputDir) {
  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f !== ".DS_Store")
      .sort();

    let createStatements = new Set();
    let insertStatements = new Set();
    let timestamp = files[files.length - 1].split("_")[0];

    files.forEach(file => {
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      // Extract and add CREATE statements
      extractStatements(content, "create").forEach(stmt =>
        createStatements.add(stmt + ";"),
      );

      // Extract and add INSERT statements
      extractStatements(content, "insert").forEach(stmt =>
        insertStatements.add(stmt + ";"),
      );
    });

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

    fs.writeFileSync(
      path.join(outputDir, `${timestamp}squashed_migration.sql`),
      combinedContent,
    );
  } catch (error) {
    console.error("Error creating squashed migration:", error);
  }
}

// Function to transform file path to flattened name
function getFlattenedFileName(sourcePath) {
  // Replace directory separators and special characters with underscores
  return sourcePath.replace(/[\/\\]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Function to copy file with flattened structure
function copyFile(sourcePath, targetDir) {
  const flattenedName = getFlattenedFileName(sourcePath);
  const targetPath = path.join(targetDir, flattenedName);
  fs.copyFileSync(sourcePath, targetPath);
}

// Function to get all whitelisted files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (excludedDirs.includes(file)) return;

    const filePath = path.join(dirPath, file);
    const relativePath = path.relative(process.cwd(), filePath);

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else if (isWhitelisted(relativePath)) {
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
}

// Function to read llm-files.txt
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

// Main execution
function main() {
  // Clear and recreate output directories
  clearDirectory(".llm");
  clearDirectory(".llm-dev");

  // Create squashed migration if migrations directory exists
  if (fs.existsSync("supabase/migrations")) {
    createSquashedMigration("supabase/migrations", ".llm");
  }

  // Get all whitelisted files
  const allFiles = getAllFiles(process.cwd());

  // Get files from llm-files.txt
  const llmFiles = getLLMFiles();

  if (llmFiles.length > 0) {
    // Copy files listed in llm-files.txt to .llm-dev
    llmFiles.forEach(file => {
      if (allFiles.includes(file)) {
        copyFile(file, ".llm-dev");
        console.log(
          `Copied to .llm-dev: ${file} as ${getFlattenedFileName(file)}`,
        );
      }
    });

    // Copy remaining files to .llm
    const remainingFiles = allFiles.filter(file => !llmFiles.includes(file));
    remainingFiles.forEach(file => {
      copyFile(file, ".llm");
      console.log(`Copied to .llm: ${file} as ${getFlattenedFileName(file)}`);
    });
  } else {
    // Copy all files to .llm if no files are specified in llm-files.txt
    allFiles.forEach(file => {
      copyFile(file, ".llm");
      console.log(`Copied to .llm: ${file} as ${getFlattenedFileName(file)}`);
    });
  }
}

// Run the script
main();
