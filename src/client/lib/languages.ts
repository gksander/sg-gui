export type LanguageConfig = {
  displayName: string;
  sgLanguage: string;
  shikiId: string;
};

export type LanguageId = keyof typeof LANGUAGES;

export const LANGUAGES: Record<string, LanguageConfig> = {
  typescript: {
    displayName: "TypeScript",
    sgLanguage: "TypeScript",
    shikiId: "typescript",
  },
  tsx: {
    displayName: "TypeScript (JSX)",
    sgLanguage: "Tsx",
    shikiId: "tsx",
  },
  javascript: {
    displayName: "JavaScript",
    sgLanguage: "JavaScript",
    shikiId: "javascript",
  },
  jsx: {
    displayName: "JavaScript (JSX)",
    sgLanguage: "jsx",
    shikiId: "jsx",
  },
  python: {
    displayName: "Python",
    sgLanguage: "python",
    shikiId: "python",
  },
  ruby: {
    displayName: "Ruby",
    sgLanguage: "ruby",
    shikiId: "ruby",
  },
  rust: {
    displayName: "Rust",
    sgLanguage: "rust",
    shikiId: "rust",
  },
  go: {
    displayName: "Go",
    sgLanguage: "go",
    shikiId: "go",
  },
  java: {
    displayName: "Java",
    sgLanguage: "java",
    shikiId: "java",
  },
  kotlin: {
    displayName: "Kotlin",
    sgLanguage: "kotlin",
    shikiId: "kotlin",
  },
  swift: {
    displayName: "Swift",
    sgLanguage: "swift",
    shikiId: "swift",
  },
  cpp: {
    displayName: "C++",
    sgLanguage: "cpp",
    shikiId: "cpp",
  },
  csharp: {
    displayName: "C#",
    sgLanguage: "csharp",
    shikiId: "csharp",
  },
  php: {
    displayName: "PHP",
    sgLanguage: "php",
    shikiId: "php",
  },
  scala: {
    displayName: "Scala",
    sgLanguage: "scala",
    shikiId: "scala",
  },
  lua: {
    displayName: "Lua",
    sgLanguage: "lua",
    shikiId: "lua",
  },
  dart: {
    displayName: "Dart",
    sgLanguage: "dart",
    shikiId: "dart",
  },
  elixir: {
    displayName: "Elixir",
    sgLanguage: "elixir",
    shikiId: "elixir",
  },
  haskell: {
    displayName: "Haskell",
    sgLanguage: "haskell",
    shikiId: "haskell",
  },
};
