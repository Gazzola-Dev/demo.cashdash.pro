const fs = require("fs");
const path = require("path");

// Create combinedFiles directory if it doesn't exist
const combinedDir = path.join(__dirname, "combinedFiles");
if (!fs.existsSync(combinedDir)) {
  fs.mkdirSync(combinedDir);
}

// Warning banner to add at the top of each file
const warningBanner = `/*
 * ⚠️ DEVELOPMENT USE ONLY ⚠️
 * 
 * This file combines multiple source files and has all TypeScript errors disabled.
 * These error suppressions should NOT be copied into application code.
 * This file is for development reference only.
 * 
 * Use the original source files for application code.
 */

// @ts-nocheck
/* eslint-disable */
`;

function processFileContent(content, isFirstFile) {
  // Remove 'use client' and 'use server' directives if not the first file
  if (!isFirstFile) {
    content = content.replace(/"use client";\s*/g, "");
    content = content.replace(/"use server";\s*/g, "");
  }
  return content;
}

function getFilesWithEnding(dir, ending) {
  let content = warningBanner + "\n";
  const files = fs.readdirSync(dir);
  let isFirstFile = true;

  files.forEach(file => {
    if (file.endsWith(ending)) {
      const filePath = path.join(dir, file);
      let fileContent = fs.readFileSync(filePath, "utf8");
      fileContent = processFileContent(fileContent, isFirstFile);
      content += `// From ${file}\n${fileContent}\n\n`;
      isFirstFile = false;
    }
  });

  return content;
}

// Combine actions files
const actionsContent = getFilesWithEnding(
  path.join(__dirname, "actions"),
  "actions.ts",
);
fs.writeFileSync(
  path.join(combinedDir, "combinedActions.ts"),
  actionsContent,
  "utf8",
);

// Combine hooks files
const hooksContent = getFilesWithEnding(
  path.join(__dirname, "hooks"),
  "hooks.ts",
);
fs.writeFileSync(
  path.join(combinedDir, "combinedHooks.ts"),
  hooksContent,
  "utf8",
);

// Combine types files
const typesContent = getFilesWithEnding(
  path.join(__dirname, "types"),
  "types.ts",
);
fs.writeFileSync(
  path.join(combinedDir, "combinedTypes.ts"),
  typesContent,
  "utf8",
);

console.log(
  "Files have been combined successfully in the combinedFiles directory!",
);
