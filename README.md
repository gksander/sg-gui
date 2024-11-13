# SG GUI

This repo is still in early days, but its goal is to provide a GUI on top of [the amazing ast-grep](https://ast-grep.github.io/).

![Screenshot](https://github.com/gksander/sg-gui/raw/main/docs/img/snapshot.png)

It aims to expose as much of the `sg scan` functionality from AST-GREP as possible but display results in a beautiful web GUI that's easy to use and allow for easy experimentation with rewrites (that can be applied one "chunk" at a time).

This project started as an experiment for me to learn more about Tauri and Rust, so don't expect perfection here.

## TODO:

- [ ] Error handling for when sg scan fails
- [ ] Need to do replacements based on offsets not the text itself
- [ ] Loading state when scan is running
- [ ] Perf improvements:
  - [ ] don't ship all of shiki's languages.
  - [ ] Some sort of inf scroll? if there are thousands of results, need to be able to handle that.
- [ ] Ellispses if in thousands for line number
- [ ] Proper release workflow
- [ ] Something is up with glob, using '*' really wonks stuff... don't use that as a default.
- [ ] Kill process/browser window if the other close

## Cleanup

- [ ] Service fns for endpoint logic so the apiRoutes isn't fat as shit.
- 

## FUTURE IMPROVEMENTS

- [ ] Character diffs, showing which characters in line changed. (E.g. whitespace changes sg seems to randomly pick up)
- [ ] View full file diff – similar code diff logic, just grab whole file contents and do the diff.
- [ ] Infer the language from glob?
