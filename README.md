# SG GUI

This repo is still in early days, but its goal is to provide a desktop GUI on top of [the amazing ast-grep](https://ast-grep.github.io/).

![Screenshot](./docs/img/screenshot.png)

It aims to expose as much of the `sg scan` functionality from AST-GREP as possible but display results in a beautiful web GUI that's easy to use and allow for easy experimenation with rewrites (that can be applied one "chunk" at a time).

This project started as an experiment for me to learn more about Tauri and Rust, so don't expect perfection here.

## TODO:

- [ ] Perf improvements:
  - [ ] Less intersection observers???
  - [ ] Some sort of inf scroll???
- [ ] Gate on `sg` being available
- [ ] Ellispis if in thousands for line number
- [ ] Style and icon

- [ ] Build and distribute on GH!!!

## CLEANUP:

- [ ] code line height rem and placeholder div height... extract out specific line height to avoid drift

## FUTURE IMPROVEMENTS

- [ ] Character diffs, showing which characters in line changed. (E.g. whitespace changes sg seems to randomly pick up)
- [ ] View full file diff – similar code diff logic, just grab whole file contents and do the diff.
- [ ] Infer the language from glob?
