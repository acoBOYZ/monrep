{
  "extends": "./../../tsconfig.json",
  "compilerOptions": {

    // Environment setup
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    // "moduleResolution": "nodenext",

    // Output configuration
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "noEmit": false,

    // Type checking
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Additional checks
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts", "**/*.test.ts", "dist", "upstream/**/*"]
}
