import type { Module, RelationalModule, Release } from "app/api";

type DiscordField = { name: string; value: string; inline?: boolean };
type DiscordEmbed = {
  title: string;
  url?: string;
  description?: string;
  color: number;
  timestamp: string;
  image?: { url: string };
  fields?: DiscordField[];
};

const webRoot = () => process.env.NEXT_PUBLIC_WEB_ROOT ?? "https://ctjs.net";

const sendWebhook = async (webhookUrl: string | undefined, embed: DiscordEmbed) => {
  if (!webhookUrl) return undefined;
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "ctbot",
      avatar_url: `${webRoot()}/favicon.ico`,
      embeds: [embed],
    }),
  });
  if (!response.ok) throw new Error(`Discord webhook failed with status ${response.status}`);
  return (await response.json()) as { id: string };
};

const baseEmbed = (title: string, color = 0x7b2fb5): DiscordEmbed => ({
  title,
  color,
  timestamp: new Date().toISOString(),
});

export const onModuleCreated = async (module: RelationalModule<"user">) => {
  const embed = baseEmbed(`Module created: ${module.name}`);
  embed.url = `${webRoot()}/modules/${module.name}`;
  embed.fields = [{ name: "Author", value: module.user.name, inline: true }];
  if (module.summary) embed.fields.push({ name: "Summary", value: module.summary });
  if (module.image) embed.image = { url: `${webRoot()}/${module.image}` };
  await sendWebhook(process.env.DISCORD_ANNOUNCE_CHANNEL_WEBHOOK, embed);
};

export const onModuleDeleted = async (module: Module) => {
  await sendWebhook(
    process.env.DISCORD_ANNOUNCE_CHANNEL_WEBHOOK,
    baseEmbed(`Module deleted: ${module.name}`),
  );
};

export const onReleaseCreated = async (module: RelationalModule<"user">, release: Release) => {
  const embed = baseEmbed(`Release v${release.releaseVersion} created for module: ${module.name}`);
  embed.url = `${webRoot()}/modules/${module.name}`;
  embed.fields = [
    { name: "Author", value: module.user.name, inline: true },
    { name: "Release Version", value: release.releaseVersion, inline: true },
    { name: "Mod Version", value: release.modVersion, inline: true },
  ];
  if (release.changelog) {
    const value =
      release.changelog.length > 600
        ? `${release.changelog.substring(0, 597)}...`
        : release.changelog;
    embed.fields.push({ name: "Changelog", value });
  }
  await sendWebhook(process.env.DISCORD_ANNOUNCE_CHANNEL_WEBHOOK, embed);
};

export const onReleaseNeedsToBeVerified = async (module: Module, release: Release) => {
  const url = `${webRoot()}/modules/${module.name}/releases/${release.id}/verify`;
  const embed = baseEmbed(
    `Release v${release.releaseVersion} for module ${module.name} has been posted`,
    0x3cc5c5,
  );
  embed.description = `Please verify this release is safe and non-malicious.\n[Open the review page](${url})`;
  const response = await sendWebhook(process.env.DISCORD_VERIFY_CHANNEL_WEBHOOK, embed);
  if (response) release.verificationMessageId = response.id;
};

export const deleteReleaseVerificationMessage = async (release: Release) => {
  const webhookUrl = process.env.DISCORD_VERIFY_CHANNEL_WEBHOOK;
  if (!release.verificationMessageId || !webhookUrl) return;
  const url = new URL(webhookUrl);
  url.pathname = `${url.pathname}/messages/${release.verificationMessageId}`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Discord webhook deletion failed with status ${response.status}`);
  }
};
