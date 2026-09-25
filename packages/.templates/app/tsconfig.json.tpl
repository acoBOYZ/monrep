{
  "extends": "./../../tsconfig.json",
  "compilerOptions": {
    "lib": ["ESNext", "ESNext.Temporal", "ES2023.Array", "DOM", "DOM.Iterable", "WebWorker"],
    "target": "ESNext",
    "types": ["vite/client", "node"],
    "paths": {
      "@/*": ["./src/*"],
      "@monrep/ui": ["../ui/src"],
      "@monrep/ui/*": ["../ui/src/*"],
      "@monrep/hooks": ["../hooks/src"],
      "@monrep/utils": ["../utils/src"],
      "@monrep/utils/*": ["../utils/src/*"],
      "@monrep/db": ["../db/src"],
      "@monrep/db/*": ["../db/src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "doctor.config.ts"],
  "exclude": ["node_modules", "dist"]
}
