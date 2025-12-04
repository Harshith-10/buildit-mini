/**
 * Default starter code templates for different programming languages
 */

export const getDefaultStarterCode = (language: string): string => {
  switch (language.toLowerCase()) {
    case "java":
      return `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input and write your solution here
        
        System.out.println("Hello, BuildIT!");
        sc.close();
    }
}`;

    case "c":
    case "gcc":
    case "clang":
      return `#include <stdio.h>

int main() {
    // Read input and write your solution here
    
    printf("Hello, BuildIT!\\n");
    return 0;
}`;

    case "cpp":
    case "gpp":
    case "clangpp":
      return `#include <iostream>
using namespace std;

int main() {
    // Read input and write your solution here
    
    cout << "Hello, BuildIT!" << endl;
    return 0;
}`;

    case "python":
    case "python3":
      return `# Read input and write your solution here

print("Hello, BuildIT!")`;

    case "javascript":
    case "node":
      return `// Read input and write your solution here

function solve() {
    console.log("Hello, BuildIT!");
}

solve();`;

    case "go":
      return `package main

import "fmt"

func main() {
    // Read input and write your solution here
    
    fmt.Println("Hello, BuildIT!")
}`;

    case "rust":
      return `use std::io;

fn main() {
    // Read input and write your solution here
    
    println!("Hello, BuildIT!");
}`;

    default:
      return `// Write your solution here`;
  }
};

// Get file extension based on language
export const getFileExtension = (language: string): string => {
  switch (language.toLowerCase()) {
    case "java":
      return "java";
    case "c":
    case "gcc":
    case "clang":
      return "c";
    case "cpp":
    case "gpp":
    case "clangpp":
      return "cpp";
    case "python":
    case "python3":
      return "py";
    case "javascript":
    case "node":
      return "js";
    case "go":
      return "go";
    case "rust":
      return "rs";
    default:
      return "txt";
  }
};

// Get Monaco editor language ID
export const getMonacoLanguage = (language: string): string => {
  switch (language.toLowerCase()) {
    case "java":
      return "java";
    case "c":
    case "gcc":
    case "clang":
      return "c";
    case "cpp":
    case "gpp":
    case "clangpp":
      return "cpp";
    case "python":
    case "python3":
      return "python";
    case "javascript":
    case "node":
      return "javascript";
    case "go":
      return "go";
    case "rust":
      return "rust";
    default:
      return "plaintext";
  }
};

// Supported languages list
export const supportedLanguages = [
  { id: "python", name: "Python 3" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "c", name: "C" },
  { id: "javascript", name: "JavaScript" },
  { id: "go", name: "Go" },
];
