import { Link } from "@tanstack/react-router";
import { GITHUB_OWNER, GITHUB_URL } from "../../brand.gen";
import { ContentFrame } from "./ContentFrame";

const linkClass = "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline";

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-border/60">
      <ContentFrame className="flex h-12 items-center justify-between text-xs text-muted-foreground">
        <Link to="/" className={linkClass}>
          monrep
        </Link>
        <div className="flex gap-4">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={linkClass}>
            GitHub
          </a>
          <a
            href={`https://github.com/${GITHUB_OWNER}`}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Author
          </a>
          <Link to="/admin" className={linkClass}>
            Admin
          </Link>
        </div>
      </ContentFrame>
    </footer>
  );
}
