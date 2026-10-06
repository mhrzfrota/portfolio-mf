import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function InternalAccount() {
  const { user, signOut } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState(false);

  const sair = async () => {
    setSaindo(true);
    setErro(false);
    if (await signOut()) {
      setSaindo(false);
      setErro(true);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden max-w-48 truncate text-[12px] text-white/45 lg:block" title={user?.email}>
        {erro ? <span className="text-red-300">Não saiu. Tente de novo.</span> : user?.email}
      </span>
      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        aria-label="Sair da área interna"
        title="Sair"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-wait disabled:opacity-60"
      >
        {saindo ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </button>
    </div>
  );
}
