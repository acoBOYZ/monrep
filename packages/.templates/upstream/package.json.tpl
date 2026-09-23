{
  "name": "{{package}}",
  "version": "{{version}}",
  "private": true,
  "author": "ACO .",
  "type": "module",
  "description": "Vendored {{name}} upstream",
  "exports": {},
  "scripts": {
    "lint": "oxlint --threads=1 scripts",
    "clean": "rimraf dist node_modules bun.lock .turbo",
    "fmt": "oxfmt scripts",
    "fmtcheck": "oxfmt --check scripts",
    "build": "bun run scripts/build.ts"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/bun": "^1.4.2"
  }
}
