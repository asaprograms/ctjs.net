namespace NodeJS {
  interface ProcessEnv {
    // Required
    DATABASE_URL: string;
    NEXT_PUBLIC_WEB_ROOT: string;
    DISCORD_ANNOUNCE_CHANNEL_WEBHOOK: string;
    DISCORD_VERIFY_CHANNEL_WEBHOOK: string;
    JWT_SECRET: string;
    JWT_COOKIE_NAME: string;

    // Optional
    OLD_DATABASE_URL?: string;
    MAILERSEND_API_KEY?: string;
    MAILERSEND_DOMAIN_ID?: string;
    MAILERSEND_VERIFICATION_TEMPLATE_ID?: string;
    MAILERSEND_PASSWORD_RESET_TEMPLATE_ID?: string;
    GITHUB_TOKEN?: string;
    NEXT_PUBLIC_IGNORE_EMAIL_VERIFICATION?: string;
  }
}
