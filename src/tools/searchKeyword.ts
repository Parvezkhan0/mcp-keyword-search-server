import * as fs from "fs/promises";
import * as path from "path";

interface SearchResult {
  filepath: string;
  keyword: string;
  totalMatches: number;
  matches: Array<{
    lineNumber: number;
    lineContent: string;
    matchPositions: number[];
  }>;
}

export async function searchKeywordInFile(
  filepath: string,
  keyword: string,
  caseSensitive: boolean = false
): Promise<SearchResult> {
  try {
    // Validate file exists and is accessible
    const stats = await fs.stat(filepath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filepath}`);
    }

    // Read file content
    const content = await fs.readFile(filepath, "utf-8");
    const lines = content.split("\n");

    // Prepare search keyword
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    
    // Search through lines
    const matches: Array<{
      lineNumber: number;
      lineContent: string;
      matchPositions: number[];
    }> = [];

    let totalMatches = 0;

    lines.forEach((line, index) => {
      const searchLine = caseSensitive ? line : line.toLowerCase();
      const positions: number[] = [];
      
      let position = searchLine.indexOf(searchKeyword);
      while (position !== -1) {
        positions.push(position);
        totalMatches++;
        position = searchLine.indexOf(searchKeyword, position + 1);
      }

      if (positions.length > 0) {
        matches.push({
          lineNumber: index + 1,
          lineContent: line,
          matchPositions: positions,
        });
      }
    });

    return {
      filepath: path.resolve(filepath),
      keyword,
      totalMatches,
      matches,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search file: ${error.message}`);
    }
    throw error;
  }
}