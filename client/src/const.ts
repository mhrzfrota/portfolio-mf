import { Github, Instagram, Linkedin, MessageCircle } from "lucide-react";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const WHATSAPP_BUDGET_URL =
  "https://wa.me/5585996370080?text=Ol%C3%A1!%20Quero%20fazer%20um%20or%C3%A7amento.";

/** Links sociais compartilhados entre o menu mobile e a folha de contato. */
export const SOCIALS = [
  { href: "https://github.com/mhrzfrota", label: "GitHub", Icon: Github },
  {
    href: "https://www.linkedin.com/in/matheusfrt",
    label: "LinkedIn",
    Icon: Linkedin,
  },
  {
    href: "https://www.instagram.com/emefeservices",
    label: "Instagram",
    Icon: Instagram,
  },
  { href: WHATSAPP_BUDGET_URL, label: "WhatsApp", Icon: MessageCircle },
];

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
