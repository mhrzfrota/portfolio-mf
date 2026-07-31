import type { Project } from "@/data/projects";
import type { Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

/**
 * Se o projeto está no ar, o botão leva ao site ("Acessar projeto").
 * Senão, "Ver projeto" leva à página do case ou, na falta dela, ao repositório.
 */
export function getProjectAction(project: Project, lang: Lang) {
  const t = getStrings(lang);

  if (project.liveUrl !== "#") {
    return {
      external: true,
      href: project.liveUrl,
      label: t.projects.visitProject,
    };
  }

  if (project.slug) {
    return {
      external: false,
      href: `/projetos/${project.slug}`,
      label: t.projects.viewProject,
    };
  }

  return {
    external: true,
    href: project.repoUrl,
    label: t.projects.viewProject,
  };
}
