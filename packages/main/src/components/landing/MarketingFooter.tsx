import { Link } from "@tanstack/react-router";
import { ContentFrame, SectionRule } from "./frame";

type FooterCol = {
  heading: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
};

const FOOTER_COLS: Array<FooterCol> = [
  {
    heading: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Capabilities", href: "#capabilities" },
      { label: "Install agent", href: "#get-started" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: "#get-started" },
      { label: "Control plane", href: "/" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/admin" },
      { label: "Open console", href: "/admin" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/acoBOYZ/monrep", external: true },
      { label: "Author", href: "https://github.com/acoBOYZ", external: true },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative z-10">
      <ContentFrame inset={false}>
        <SectionRule />
      </ContentFrame>
      <ContentFrame>
        <div className="pt-12 pb-4">
          <Link
            to="/"
            className="text-2xl font-semibold tracking-tight text-foreground underline-offset-4 hover:underline"
          >
            monrep
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Control plane for your servers</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:grid-cols-4 md:gap-8">
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ContentFrame>
    </footer>
  );
}
