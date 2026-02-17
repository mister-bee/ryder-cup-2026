export interface Template {
  name: string;
  description: string;
  promptTemplate: string;
  requiredParams: string[];
  defaults: Record<string, string>;
  defaultAspectRatio: string;
  defaultSize: string;
}

export const TEMPLATES: Template[] = [
  {
    name: "team-badge",
    description: "Circular team badge with team name and colors",
    promptTemplate:
      "A professional circular sports team badge for team '{teamName}' " +
      "with primary color {primaryColor} and accent color {accentColor}. " +
      "Clean modern design, suitable for a sports app icon. " +
      "Transparent background, no text artifacts.",
    requiredParams: ["teamName", "primaryColor"],
    defaults: { accentColor: "gold" },
    defaultAspectRatio: "1:1",
    defaultSize: "1K",
  },
  {
    name: "session-banner",
    description: "Wide banner for session headers (16:9)",
    promptTemplate:
      "A wide sports event banner for a golf session called '{sessionName}'. " +
      "Feature team names '{teamAName}' vs '{teamBName}'. " +
      "Background color {backgroundColor}. " +
      "Professional, clean typography, modern sports graphic design.",
    requiredParams: ["sessionName", "teamAName", "teamBName"],
    defaults: { backgroundColor: "dark green" },
    defaultAspectRatio: "16:9",
    defaultSize: "1K",
  },
  {
    name: "score-icon",
    description: "Small score indicator icon",
    promptTemplate:
      "A minimal, clean score indicator icon showing the number '{score}' " +
      "in {teamColor} color. Round shape, bold number centered, " +
      "suitable as a small app icon. Transparent background.",
    requiredParams: ["score", "teamColor"],
    defaults: {},
    defaultAspectRatio: "1:1",
    defaultSize: "1K",
  },
  {
    name: "leaderboard-header",
    description: "Wide header graphic for the leaderboard page",
    promptTemplate:
      "A wide leaderboard header graphic for '{eventName}'. " +
      "Feature '{teamAName}' vs '{teamBName}' in a dramatic sports competition style. " +
      "Golf-themed, professional, vibrant colors, modern design.",
    requiredParams: ["eventName", "teamAName", "teamBName"],
    defaults: {},
    defaultAspectRatio: "16:9",
    defaultSize: "1K",
  },
  {
    name: "player-avatar",
    description: "Placeholder avatar for player profiles",
    promptTemplate:
      "A stylized placeholder avatar for a golfer named '{playerName}'. " +
      "Team color {teamColor}. Silhouette style with golf club, " +
      "circular frame, clean modern design.",
    requiredParams: ["playerName", "teamColor"],
    defaults: {},
    defaultAspectRatio: "1:1",
    defaultSize: "1K",
  },
];

export function getTemplate(name: string): Template | undefined {
  return TEMPLATES.find((t) => t.name === name);
}

export function buildPrompt(
  template: Template,
  params: Record<string, string>,
): string {
  // Validate required params
  for (const req of template.requiredParams) {
    if (!(req in params)) {
      throw new Error(
        `Template '${template.name}' requires parameter '${req}' but it was not provided.`,
      );
    }
  }

  // Merge defaults with user params (user params take precedence)
  const merged = { ...template.defaults, ...params };

  // Substitute {placeholder} tokens
  let prompt = template.promptTemplate;
  for (const [key, value] of Object.entries(merged)) {
    prompt = prompt.replaceAll(`{${key}}`, value);
  }

  return prompt;
}
