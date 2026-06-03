import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Finance <onboarding@resend.dev>";

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

// --- Branded HTML wrapper ---

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0a0a0a;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#FF7A18,#FF3D2E);"></div>
      <span style="color:#fafafa;font-size:18px;font-weight:700;">Finance</span>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:28px;color:#e5e5e5;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#fafafa;">${title}</h1>
      ${body}
    </div>
    <p style="color:#737373;font-size:12px;margin-top:20px;text-align:center;">Finance — Gestion financière personnelle</p>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin:8px 0;padding:12px 22px;border-radius:12px;background:linear-gradient(90deg,#FF7A18,#FF3D2E);color:#fff;text-decoration:none;font-weight:600;">${label}</a>`;
}

export function resetPasswordEmail(firstName: string, link: string) {
  return {
    subject: "Réinitialisation de votre mot de passe",
    html: layout(
      "Réinitialisez votre mot de passe",
      `<p style="margin:0 0 8px;">Bonjour ${firstName || ""},</p>
       <p style="margin:0 0 16px;">Vous avez demandé à réinitialiser votre mot de passe. Ce lien expire dans 1 heure.</p>
       ${button(link, "Choisir un nouveau mot de passe")}
       <p style="margin:16px 0 0;color:#a3a3a3;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    ),
  };
}

export function summaryEmail(
  firstName: string,
  data: { period: string; income: string; expense: string; balance: string },
  appUrl: string,
) {
  return {
    subject: `Votre récapitulatif — ${data.period}`,
    html: layout(
      `Récapitulatif — ${data.period}`,
      `<p style="margin:0 0 16px;">Bonjour ${firstName || ""}, voici votre résumé :</p>
       <table style="width:100%;border-collapse:collapse;">
         <tr><td style="padding:8px 0;color:#a3a3a3;">Revenus</td><td style="padding:8px 0;text-align:right;color:#34d399;font-weight:600;">${data.income}</td></tr>
         <tr><td style="padding:8px 0;color:#a3a3a3;border-top:1px solid #262626;">Dépenses</td><td style="padding:8px 0;text-align:right;color:#fb7185;font-weight:600;border-top:1px solid #262626;">${data.expense}</td></tr>
         <tr><td style="padding:8px 0;color:#fafafa;font-weight:600;border-top:1px solid #262626;">Solde</td><td style="padding:8px 0;text-align:right;color:#fafafa;font-weight:700;border-top:1px solid #262626;">${data.balance}</td></tr>
       </table>
       <div style="margin-top:18px;">${button(appUrl, "Voir le détail")}</div>`,
    ),
  };
}

export function alertsEmail(
  firstName: string,
  items: { title: string; message: string }[],
  appUrl: string,
) {
  const list = items
    .map(
      (i) =>
        `<div style="padding:12px 0;border-bottom:1px solid #262626;"><div style="font-weight:600;color:#fafafa;">${i.title}</div><div style="color:#a3a3a3;font-size:14px;">${i.message}</div></div>`,
    )
    .join("");
  return {
    subject: `Vos finances — ${items.length} rappel(s) & alerte(s)`,
    html: layout(
      "Vos rappels et alertes",
      `<p style="margin:0 0 12px;">Bonjour ${firstName || ""}, voici ce qui demande votre attention :</p>
       ${list}
       <div style="margin-top:18px;">${button(appUrl, "Ouvrir mon tableau de bord")}</div>`,
    ),
  };
}
