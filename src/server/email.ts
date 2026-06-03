import { Resend } from "resend";

const FROM =
  process.env.EMAIL_FROM || "GoScale Finance <onboarding@resend.dev>";
const APP = (process.env.APP_URL || "https://finance-rho-beryl.vercel.app").replace(
  /\/$/,
  "",
);
const LOGO = `${APP}/icon-192.png`;
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

let _resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = client();
  if (!resend) {
    console.warn("RESEND_API_KEY manquant — email non envoyé:", opts.subject);
    return { ok: false, error: "RESEND_API_KEY manquant" };
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    console.error("Resend error:", error);
    return { ok: false, error: String(error.message ?? error) };
  }
  return { ok: true };
}

// --- Branded, email-client-robust HTML (tables + inline styles) -------------

function layout(title: string, preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.07);">
        <tr><td style="background:#0a0a0a;padding:22px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;"><img src="${LOGO}" width="34" height="34" alt="" style="display:block;border-radius:9px;"></td>
            <td style="vertical-align:middle;font-family:${FONT};font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">GoScale<span style="color:#FF5500;">Finance</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="height:4px;background:#FF5500;background:linear-gradient(90deg,#FF7A18,#FF3D2E);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:34px 30px;font-family:${FONT};color:#3f3f46;font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#18181b;font-weight:700;">${title}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
        <tr><td style="padding:18px 30px;text-align:center;font-family:${FONT};">
          <p style="margin:0 0 4px;color:#a1a1aa;font-size:12px;">GoScale Finance — Gestion financière personnelle</p>
          <p style="margin:0;color:#c4c4cc;font-size:11px;">Email automatique, merci de ne pas y répondre.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;"><tr>
    <td align="center" style="border-radius:12px;background:#FF5500;background:linear-gradient(90deg,#FF7A18,#FF3D2E);">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
    </td></tr></table>`;
}

export function resetPasswordEmail(firstName: string, link: string) {
  const hi = firstName ? ` ${firstName}` : "";
  return {
    subject: "Réinitialisation de votre mot de passe",
    html: layout(
      "Réinitialisez votre mot de passe",
      "Lien valable 1 heure pour choisir un nouveau mot de passe.",
      `<p style="margin:0 0 12px;">Bonjour${hi},</p>
       <p style="margin:0 0 22px;">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau — ce lien expire dans <strong>1 heure</strong>.</p>
       ${button(link, "Réinitialiser mon mot de passe")}
       <p style="margin:22px 0 0;color:#71717a;font-size:13px;">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :<br>
       <a href="${link}" target="_blank" style="color:#FF5500;word-break:break-all;">${link}</a></p>
       <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #eeeeee;color:#a1a1aa;font-size:13px;">Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, votre mot de passe reste inchangé.</p>`,
    ),
  };
}

export function summaryEmail(
  firstName: string,
  data: { period: string; income: string; expense: string; balance: string },
  appUrl: string,
) {
  const hi = firstName ? ` ${firstName}` : "";
  const row = (
    label: string,
    value: string,
    color: string,
    bold = false,
    top = true,
  ) =>
    `<tr>
      <td style="padding:13px 16px;color:#52525b;font-size:14px;${top ? "border-top:1px solid #eeeeee;" : ""}">${label}</td>
      <td style="padding:13px 16px;text-align:right;color:${color};font-size:15px;font-weight:${bold ? 700 : 600};${top ? "border-top:1px solid #eeeeee;" : ""}">${value}</td>
    </tr>`;
  return {
    subject: `Votre récapitulatif — ${data.period}`,
    html: layout(
      `Récapitulatif — ${data.period}`,
      `Revenus ${data.income} · Dépenses ${data.expense} · Solde ${data.balance}`,
      `<p style="margin:0 0 20px;">Bonjour${hi}, voici votre résumé financier pour <strong>${data.period}</strong>.</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #eeeeee;border-radius:12px;overflow:hidden;">
         ${row("Revenus", data.income, "#059669", false, false)}
         ${row("Dépenses", data.expense, "#e11d48")}
         ${row("Solde", data.balance, "#18181b", true)}
       </table>
       <div style="margin-top:22px;">${button(appUrl, "Voir mon tableau de bord")}</div>`,
    ),
  };
}

export function alertsEmail(
  firstName: string,
  items: { title: string; message: string }[],
  appUrl: string,
) {
  const hi = firstName ? ` ${firstName}` : "";
  const list = items
    .map(
      (i) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;background:#fafafa;border:1px solid #eeeeee;border-left:3px solid #FF5500;border-radius:8px;">
           <tr><td style="padding:13px 16px;">
             <div style="font-weight:600;color:#18181b;font-size:15px;">${i.title}</div>
             <div style="color:#71717a;font-size:14px;margin-top:2px;">${i.message}</div>
           </td></tr>
         </table>`,
    )
    .join("");
  return {
    subject: `Vos finances — ${items.length} rappel(s) & alerte(s)`,
    html: layout(
      "Vos rappels et alertes",
      `${items.length} élément(s) demandent votre attention.`,
      `<p style="margin:0 0 18px;">Bonjour${hi}, voici ce qui demande votre attention :</p>
       ${list}
       <div style="margin-top:20px;">${button(appUrl, "Ouvrir mon tableau de bord")}</div>
       <p style="margin:18px 0 0;color:#a1a1aa;font-size:12px;">Vous pouvez désactiver ces emails dans Profil ▸ Alertes.</p>`,
    ),
  };
}
