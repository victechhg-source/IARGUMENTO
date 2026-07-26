import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md border-l border-foreground/40 pl-5 md:pl-8">
        <div className="mb-8 text-left">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-foreground/50 bg-transparent">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="border border-card/20 bg-card p-7 text-card-foreground shadow-none [&_.text-muted-foreground]:text-card-foreground/60 [&_.text-primary]:text-card-foreground md:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}