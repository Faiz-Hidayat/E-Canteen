import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background py-4">
      <p className="text-center text-xs text-muted-foreground">
        Dibuat oleh{" "}
        <Link
          href="https://github.com/faiz-hidayat"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Muhammad Faiz Hidayat
        </Link>
      </p>
    </footer>
  );
}
