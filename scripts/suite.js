export const SUITE = [
  ["ProfileRegistry", []],
  ["MessageBoard", []],
  ["Guestbook", []],
  ["ProofRegistry", []],
  ["LinkRegistry", []],
  ["TipJar", ["OWNER"]],
  [
    "SimplePoll",
    ["What should this creator toolkit build next?", ["Community tools", "Identity tools", "Funding tools"]],
  ],
  ["AchievementBadges", ["OWNER"]],
  ["AllowlistRegistry", ["OWNER"]],
  ["DeploymentDirectory", ["OWNER"]],
];

export function resolveArgs(args, owner) {
  return args.map((arg) => (arg === "OWNER" ? owner : arg));
}
