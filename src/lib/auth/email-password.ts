/**
 * Local email/password sign-in. Public registration stays disabled.
 * First owner is claimed at /portal/login when WTAE_OWNER_EMAIL matches and
 * no owner exists yet. scripts/provision-owner.mjs remains the shell fallback.
 * Resend is only for forgot-password mail — sign-in does not use it.
 */
export const emailAndPasswordEnabled = true;

export const emailPasswordConfig = {
  enabled: true as const,
  disableSignUp: true,
  minPasswordLength: 10,
  async sendResetPassword({
    user,
    url,
  }: {
    user: { email: string };
    url: string;
  }) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return;
    const from =
      process.env.WTAE_RESET_FROM?.trim() ||
      "WTAE <noreply@welcome2atlantaevents.com>";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: user.email,
        subject: "Reset your WTAE portal password",
        text: `Use this link to choose a new password. If you did not request it, ignore this message.\n\n${url}`,
      }),
    });
  },
};
