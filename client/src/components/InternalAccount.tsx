import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function InternalAccount({
  surface = "board",
}: {
  surface?: "board" | "habits";
}) {
  const { user, signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  const handleSignOut = async () => {
    setLeaving(true);
    const error = await signOut();
    if (error) {
      setLeaving(false);
      window.alert("Não foi possível sair agora. Tente novamente.");
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="mono-label hidden max-w-44 truncate text-[9px] text-white/55 xl:block"
        title={user?.email}
      >
        {user?.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={leaving}
        aria-label="Sair da área interna"
        title="Sair da área interna"
        className={cn(
          surface === "habits" ? "habit-glass" : "board-glass",
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-wait disabled:opacity-60"
        )}
      >
        {leaving ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
