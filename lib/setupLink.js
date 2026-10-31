'use client';

/**
 * After creating a parent or staff login: when no email could be sent (many
 * parents have none), show the set-password link so the admin can share it,
 * e.g. on WhatsApp.
 */
export function shareSetupLink(result, who) {
  const setup = result?.password_setup;
  if (!setup || setup.email_sent) return;

  const loginId = result?.student?.id || result?.staff?.id;
  alert(
    `Saved. ${setup.message}\n\nLogin ID: ${loginId}\n` +
      `Share this link with the ${who} to set a password (valid 72 hours):\n${setup.setup_link}`,
  );
}
