# @react/ui

Shared UI component library for the monorepo.  
Built with **React + Tailwind CSS** and consumed directly as source by apps and workspace packages.

---

## ⚠️ Important: Tailwind Setup (Required)

This package **uses Tailwind CSS**.

Tailwind only generates styles for files listed in `content`.  
Because `@react/ui` is consumed as **source**, **every app or package that uses it MUST include its source path in their `tailwind.config.ts`.**

If you skip this step, **styles will silently be missing**.

---

## ✅ Required `tailwind.config.ts` Change

This `tailwind.config.ts` **lives inside `@react/ui`**.

Whenever another workspace package uses `@react/ui`, its source path must be added here.

```ts
import type { Config } from "tailwindcss";
import { resolve } from "path";

const config = {
  content: [
    /**
     * REQUIRED: local @react/ui sources
     */
    resolve(__dirname, "src/**/*.{ts,tsx}"),

    /**
     * REQUIRED: workspace packages that consume @react/ui
     */
    resolve(__dirname, "../file-preview/src/**/*.{ts,tsx}"),
    resolve(__dirname, "../file-uploader/src/**/*.{ts,tsx}"),

    // Add more packages here when they start using @react/ui:
    // resolve(__dirname, "../some-package/src/**/*.{ts,tsx}"),
  ],
  theme: {},
  plugins: [],
} satisfies Config;

export default config;
```

🔴 This step is **mandatory**.

---

## ❓ Why this is necessary

- Tailwind does **not** scan compiled output
- Tailwind does **not** scan `node_modules`
- Workspace packages are imported as source

➡️ Tailwind can only see class names if you explicitly point to the package `src` directory.

---

## 🧠 Rule of Thumb

If a package renders JSX with Tailwind classes,  
**its `src` path must be listed in every consuming Tailwind config.**

This applies to:
- `@react/ui`
- `@react/file-preview`
- `@react/file-uploader`
- any future UI/design packages

---

## 🧩 Example Usage

```tsx
import { Button, NativeEmojiPicker, SmartPopoverTrigger } from "@react/ui";

export function Example() {
  return (
      <SmartPopoverTrigger
        content={({ close }) => (
          <NativeEmojiPicker
            onChange={(value) => {
              appendText(value);
              close();
            }}
          />
        )}
      >
      <Button variant="primary">
        Click me
        <StickerIcon className="size-5" />
      </Button>
    </SmartPopoverTrigger>
  );
}
```

⚠️ This will not style correctly unless Tailwind is configured as shown above.

---

## 🚫 Common Mistakes

- Forgetting to add `@react/ui/src` to `content`
- Assuming Tailwind scans workspace packages automatically
- Relying on compiled output
- Not restarting the dev server after config changes

---

## ✅ Final Note

If UI styles are broken, **check Tailwind config first**.  
Almost all issues here are configuration-related, not component bugs.
