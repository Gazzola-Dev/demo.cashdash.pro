const fs = require("fs");
const path = require("path");

// Create combinedFiles directory if it doesn't exist
const combinedDir = path.join(__dirname, "combinedFiles");
if (!fs.existsSync(combinedDir)) {
  fs.mkdirSync(combinedDir);
}

// Function to read all files in a directory with a specific ending
function getFilesWithEnding(dir, ending) {
  let content = "";
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (file.endsWith(ending)) {
      const filePath = path.join(dir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      content += `// From ${file}\n${fileContent}\n\n`;
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
