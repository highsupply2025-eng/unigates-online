import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const NetflixHeader = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4">
      <svg viewBox="0 0 111 30" className="h-6 md:h-10 fill-primary" aria-label="Netflix">
        <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.03-13.622L94.468 0h5.063l3.062 7.874L105.875 0h5.063l-5.876 14.28zM90.47 0l-2.594 7.28L85.22 0H80.03l5.5 14.155V30h4.75V14.155L95.78 0H90.47zm-19 0v30h14.563v-4.5H76.22V0H71.47zm-8.093 0v30h4.75V0h-4.75zm-13.22 17.155c2.032.22 3.97.28 5.97.405V4.5h6.312V0H39.063v4.5h6.312v13.06l-.218-.405zm-11.53-2.78l-2.813 7.28L33.5 14.375 27.968 0H22.5v30h4.5V11.375l4.438 11.28h3.374l4.438-11.062V30h4.5V0h-5.5l-5.313 14.375zM6.25 4.5h7.063V0H6.25C2.812 0 0 2.813 0 6.25v17.5C0 27.187 2.813 30 6.25 30h7.063v-4.5H6.25c-.969 0-1.75-.782-1.75-1.75V6.25c0-.97.781-1.75 1.75-1.75z" />
      </svg>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 border border-border rounded px-3 py-1 text-sm text-foreground">
          <Globe className="w-4 h-4" />
          <span>English</span>
        </div>
        <Button variant="default" size="sm" className="font-semibold">
          Sign In
        </Button>
      </div>
    </header>
  );
};

export default NetflixHeader;
