# Changelog

All notable changes to this project are documented in this file.

## [0.6.0] - 2026-09-25

### 🚀 Features

- *(monrep)* New-codegen-layer by @acoBOYZ


### 🐛 Bug Fixes

- *(cli)* Richer git-cliff changelogs: `@user`, `#PR`, New Contributors. include non-conventional commits. by @acoBOYZ

- *(codegen)* Stop side-effect `import "@/db/registry"`. explicit host bind: client `DOHost`, server `bindDoApp()`. by @acoBOYZ

- Forgotten fmt by @acoBOYZ

- *(monrep)* Tiny polish + stream typing cleanup. bump durable-streams long-poll wait. by @acoBOYZ


### ⚙️ Miscellaneous Tasks

- Merge pull request #25 from acoBOYZ/fix-cliff by @acoBOYZ in #25

- Merge pull request #24 from acoBOYZ/fix-db-registry-sideeffects by @acoBOYZ in #24

- Merge pull request #23 from acoBOYZ/feat-new-codegen-layer by @acoBOYZ in #23

- Merge pull request #22 from acoBOYZ/fix-small by @acoBOYZ in #22


## [0.5.0] - 2026-09-25

### 🚀 Features

- *(main)* Add monrep favicon and app icons

### 🐛 Bug Fixes

- Partial stream upserts were wiping `createdAt` (StreamDB replaces the row). preserve audits on update.
- *(db)* Preserve createdAt on stream upsert updates

## [0.4.8] - 2026-09-24

# Changelog

All notable changes to this project are documented in this file.
