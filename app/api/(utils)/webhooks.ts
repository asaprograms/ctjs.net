import { EmbedBuilder } from "@discordjs/builders";
import type { Module, RelationalModule, Release } from "app/api";
import { WebhookClient } from "discord.js";

const announceClient = new WebhookClient({
  url: process.env.DISCORD_ANNOUNCE_CHANNEL_WEBHOOK,
});
const verifyClient = new WebhookClient({
  url: process.env.DISCORD_VERIFY_CHANNEL_WEBHOOK,
});

export const onModuleCreated = async (module: RelationalModule<"user">) => {
  const embed = new EmbedBuilder()
    .setTitle(`Module created: ${module.name}`)
    .setURL(`${process.env.NEXT_PUBLIC_WEB_ROOT}/modules/${module.name}`)
    .setColor(0x7b2fb5)
    .setTimestamp(Date.now())
    .addFields({ name: "Author", value: module.user.name, inline: true });

  if (module.summary) embed.addFields({ name: "Summary", value: module.summary });

  if (module.image) embed.setImage(`${process.env.NEXT_PUBLIC_WEB_ROOT}/${module.image}`);

  announceClient.send({
    username: "ctbot",
    avatarURL: `${process.env.NEXT_PUBLIC_WEB_ROOT}/favicon.ico`,
    embeds: [embed],
  });
};

export const onModuleDeleted = async (module: Module) => {
  const embed = new EmbedBuilder()
    .setTitle(`Module deleted: ${module.name}`)
    .setColor(0x7b2fb5)
    .setTimestamp(Date.now());

  announceClient.send({
    username: "ctbot",
    avatarURL: `${process.env.NEXT_PUBLIC_WEB_ROOT}/favicon.ico`,
    embeds: [embed],
  });
};

export const onReleaseCreated = async (module: RelationalModule<"user">, release: Release) => {
  const embed = new EmbedBuilder()
    .setTitle(`Release v${release.releaseVersion} created for module: ${module.name}`)
    .setURL(`${process.env.NEXT_PUBLIC_WEB_ROOT}/modules/${module.name}`)
    .setColor(0x7b2fb5)
    .setTimestamp(Date.now())
    .addFields(
      { name: "Author", value: module.user.name, inline: true },
      { name: "Release Version", value: release.releaseVersion, inline: true },
      { name: "Mod Version", value: release.modVersion, inline: true },
    );

  if (release.changelog) {
    const changelog =
      release.changelog.length > 600
        ? `${release.changelog.substring(0, 597)}...`
        : release.changelog;
    embed.addFields({ name: "Changelog", value: changelog });
  }

  announceClient.send({
    username: "ctbot",
    avatarURL: `${process.env.NEXT_PUBLIC_WEB_ROOT}/favicon.ico`,
    embeds: [embed],
  });
};

export const onReleaseNeedsToBeVerified = async (module: Module, release: Release) => {
  const url = `${process.env.NEXT_PUBLIC_WEB_ROOT}/modules/${module.name}/releases/${release.id}/verify`;

  const embed = new EmbedBuilder()
    .setTitle(`Release v${release.releaseVersion} for module ${module.name} has been posted`)
    .setDescription(
      `Please verify this release is safe and non-malicious.\nClick [here](${url}) to confirm verification`,
    )
    .setColor(0x3cc5c5)
    .setTimestamp(Date.now());

  const response = await verifyClient.send({
    username: "ctbot",
    avatarURL: `${process.env.NEXT_PUBLIC_WEB_ROOT}/favicon.ico`,
    embeds: [embed],
  });

  release.verificationMessageId = response.id;
};

export const deleteReleaseVerificationMessage = async (release: Release) => {
  if (release.verificationMessageId)
    await verifyClient.deleteMessage(release.verificationMessageId);
};
