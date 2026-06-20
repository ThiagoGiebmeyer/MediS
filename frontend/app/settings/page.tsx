import SectionPlaceholder from "@/app/components/section-placeholder";

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Configurações"
      title="Preferências do sistema e conta"
      description="Espaço para personalização do painel, ajustes operacionais e parâmetros globais da experiência do usuário."
      highlights={[
        "Tema, cores e comportamento visual do app.",
        "Preferências da conta e dados de sessão.",
        "Ponto de partida para ajustes administrativos.",
      ]}
    />
  );
}