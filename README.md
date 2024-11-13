# SG GUI

This repo is still in early days, but its goal is to provide a GUI on top of [the amazing ast-grep](https://ast-grep.github.io/).

![Screenshot](https://github.com/gksander/sg-gui/raw/main/docs/img/snapshot.png)

It aims to expose as much of the [`sg scan`](https://ast-grep.github.io/reference/cli/scan.html) functionality from AST-GREP as possible but display results in a beautiful web GUI that's easy to use and allow for easy experimentation with rewrites (that can be applied one "chunk" at a time).

## Installation and Usage

SG GUI requires AST-GREP to be installed and accessible via `sg`. You can find [installation instructions here](https://ast-grep.github.io/guide/quick-start.html#installation), but if you're on a Mac and using homebrew it's as simple as:

```shell
brew install ast-grep
```

Then, assuming you have Node >= 18 installed, you can simply run:

```shell
npx sg-gui
```

from the root of the directory you want to scan. This will start a server on `localhost:6169` that you can access in your browser. Use a `--port` flag to specify a different port, e.g. `npx sg-gui --port 3333`.

## FUTURE IMPROVEMENTS

- [ ] Character diffs, showing which characters in line changed. (E.g. whitespace changes sg seems to randomly pick up)
- [ ] View full file diff – similar code diff logic, just grab whole file contents and do the diff.
- [ ] Infer the language from glob
