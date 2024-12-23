const { execSync } = require("child_process");
const fs = require("fs");

const reviewBranch = process.argv[2] || "HEAD";
const baseBranch = process.argv[3] || "dev";

function getDetailedChanges(review, base) {
  try {
    const filesCommand = `git diff --name-status ${base}...${review}`;
    const files = execSync(filesCommand, { encoding: "utf8" });

    if (!files) {
      return "No changes found between branches";
    }

    let output = `Changes between ${review} and ${base}:\n\n`;

    const changedFiles = files
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [status, ...pathParts] = line.split("\t");
        const path = pathParts.join("\t");
        return { status: status.charAt(0), path };
      });

    changedFiles.forEach(({ status, path }) => {
      const statusMap = {
        M: "Modified",
        A: "Added",
        D: "Deleted",
        R: "Renamed",
        C: "Copied",
      };

      output += `\n${statusMap[status] || status}: ${path}\n`;

      if (status !== "D") {
        try {
          const diffCommand = `git diff ${base}...${review} -- "${path}"`;
          const diff = execSync(diffCommand, { encoding: "utf8" });

          const changes = diff
            .split("\n")
            .filter(line => line.startsWith("+") || line.startsWith("-"))
            .map(line => {
              const prefix = line.startsWith("+") ? "Added" : "Removed";
              return `  ${prefix}: ${line.substring(1)}`;
            })
            .join("\n");

          output += `${changes}\n`;
        } catch (diffError) {
          output += `  Error getting diff: ${diffError.message}\n`;
        }
      }
      output += "\n---\n";
    });

    return output;
  } catch (error) {
    return `Error getting changes: ${error.message}`;
  }
}

const changes = getDetailedChanges(reviewBranch, baseBranch);
fs.writeFileSync("./changes.txt", changes);

console.log("Detailed changes written to changes.txt");
