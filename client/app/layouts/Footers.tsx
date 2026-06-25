import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Task Manager
        </p>
        <p className="text-sm text-muted-foreground">
          Built with Next.js
        </p>
      </div>
    </footer>
  );
};

export default Footer;
