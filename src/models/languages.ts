export type LanguageConfig = {
  displayName: string;
  sgLanguage: string;
  // TODO: need a shiki parser lang too eventually
};

export type LanguageId = keyof typeof LANGUAGES;

export const LANGUAGES: Record<string, LanguageConfig> = {
  typescript: {
    displayName: "TypeScript",
    sgLanguage: "TypeScript",
  },
  tsx: {
    displayName: "TypeScript (JSX)",
    sgLanguage: "Tsx",
  },
  javascript: {
    displayName: "JavaScript",
    sgLanguage: "JavaScript",
  },
  jsx: {
    displayName: "JavaScript (JSX)",
    sgLanguage: "jsx",
  },
  python: {
    displayName: "Python",
    sgLanguage: "python",
  },
  ruby: {
    displayName: "Ruby",
    sgLanguage: "ruby",
  },
  rust: {
    displayName: "Rust",
    sgLanguage: "rust",
  },
  go: {
    displayName: "Go",
    sgLanguage: "go",
  },
  java: {
    displayName: "Java",
    sgLanguage: "java",
  },
  kotlin: {
    displayName: "Kotlin",
    sgLanguage: "kotlin",
  },
  swift: {
    displayName: "Swift",
    sgLanguage: "swift",
  },
  cpp: {
    displayName: "C++",
    sgLanguage: "cpp",
  },
  csharp: {
    displayName: "C#",
    sgLanguage: "csharp",
  },
  php: {
    displayName: "PHP",
    sgLanguage: "php",
  },
  scala: {
    displayName: "Scala",
    sgLanguage: "scala",
  },
  lua: {
    displayName: "Lua",
    sgLanguage: "lua",
  },
  dart: {
    displayName: "Dart",
    sgLanguage: "dart",
  },
  elixir: {
    displayName: "Elixir",
    sgLanguage: "elixir",
  },
  haskell: {
    displayName: "Haskell",
    sgLanguage: "haskell",
  },
};
