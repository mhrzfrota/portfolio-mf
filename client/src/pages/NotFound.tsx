import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();
  const t = getStrings(lang);

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Card className="mx-4 w-full max-w-lg border-border bg-card shadow-lg">
        <CardContent className="pb-8 pt-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-red-100 dark:bg-red-950/50" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>

          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t.notFound.title}
          </h2>

          <p className="mb-8 leading-relaxed text-muted-foreground">
            {t.notFound.text}
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={handleGoHome}
              className="rounded-full bg-[var(--brand-ink)] px-6 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-black hover:shadow-lg dark:bg-[#EDEDED] dark:text-[#161616] dark:hover:bg-white"
            >
              <Home className="mr-2 h-4 w-4" />
              {t.notFound.goHome}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
