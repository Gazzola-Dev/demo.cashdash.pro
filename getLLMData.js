const fs = require("fs");
const path = require("path");

// Whitelist of directories that contain reference-worthy code
const whitelistedDirs = [
  "actions", // Core business logic and data mutations
  "hooks", // Custom React hooks for reusable logic
  "types", // Type definitions useful for understanding data structures
  "components", // All component directories
  "configuration.ts", // Configuration constants
  "constants", // Application constants
  "middleware", // Authentication and routing middleware
  "lib",
];

// Whitelist of specific files that should be included when in repo root
const whitelistedRootFiles = [
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
];

// System files to ignore
const ignoredFiles = [
  ".DS_Store",
  "Thumbs.db",
  ".directory",
  "desktop.ini",
  ".localized",
];

// Function to clear directory contents
function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

// Function to check if a file should be included based on whitelist rules
function shouldIncludeFile(filePath) {
  // Normalize path for consistent comparison
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Check if file is in ignored list
  const fileName = path.basename(normalizedPath);
  if (ignoredFiles.includes(fileName)) {
    return false;
  }

  // If file is in repo root, check against whitelistedRootFiles
  if (!normalizedPath.includes("/")) {
    return whitelistedRootFiles.includes(normalizedPath);
  }

  // Check if file is in or under a whitelisted directory
  return whitelistedDirs.some(dir => {
    const normalizedDir = dir.replace(/\\/g, "/");
    return (
      normalizedPath.startsWith(normalizedDir + "/") ||
      normalizedPath === normalizedDir
    );
  });
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
      .filter(file => !ignoredFiles.includes(file))
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

    const outputFileName = `${timestamp}squashed_migration.sql`;
    fs.writeFileSync(path.join(outputDir, outputFileName), combinedContent);
    return { originalPath: "supabase/migrations", outputFileName };
  } catch (error) {
    console.error("Error creating squashed migration:", error);
    return null;
  }
}

// Function to transform file path to flattened name
function getFlattenedFileName(sourcePath) {
  return sourcePath.replace(/[\/\\]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Function to copy file with flattened structure
function copyFile(sourcePath, targetDir) {
  const flattenedName = getFlattenedFileName(sourcePath);
  const targetPath = path.join(targetDir, flattenedName);
  fs.copyFileSync(sourcePath, targetPath);
  return flattenedName;
}

// Function to get all whitelisted files recursively
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

// Function to write index files
function writeIndexFile(mappings, outputDir, isDev = false) {
  const indexContent = mappings
    .map(
      ({ originalPath, outputFileName }) =>
        `${originalPath} ::> ${outputFileName}`,
    )
    .sort()
    .join("\n");

  const fileName = isDev ? "_index-llm-dev.txt" : "_index-llm.txt";
  fs.writeFileSync(path.join(outputDir, fileName), indexContent);
}

// Main execution
function main() {
  // Clear and recreate output directories
  clearDirectory(".llm");
  clearDirectory(".llm-dev");

  // Arrays to store file mappings
  const llmMappings = [];
  const llmDevMappings = [];

  // Create squashed migration if migrations directory exists
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
    // Copy files listed in llm-files.txt to .llm-dev
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
    // Copy all files to .llm if no files are specified in llm-files.txt
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
