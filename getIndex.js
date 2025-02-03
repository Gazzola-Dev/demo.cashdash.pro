const fs = require("fs");
const path = require("path");
const os = require("os");

// Configuration
const excludedDirs = ["node_modules", ".git", ".next", "out", "dist", "build"];

// Function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (excludedDirs.includes(file)) return;

    const filePath = path.join(dirPath, file);
    const relativePath = path.relative(process.cwd(), filePath);

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
}

// Main execution
const allFiles = getAllFiles(process.cwd());

// Generate output content
const output = ["# All Files - Simple List", ...allFiles].join(os.EOL);

// Write to file
fs.writeFileSync("index-repo.txt", output);
console.log("Repository index has been generated in index-repo.txt");
