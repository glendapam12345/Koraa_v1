#!/usr/bin/env node
/**
 * Actualiza plantillas de correo en Supabase para usar OTP ({{ .Token }}) en lugar del enlace por defecto,
 * y fija mailer_otp_length a 6 para que el código del correo coincida con la app (constants/authOtp.ts).
 *
 * Requiere un Personal Access Token (NO es la anon key):
 *   https://supabase.com/dashboard/account/tokens
 *
 * Uso:
 *   export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxx"
 *   npm run supabase:email-otp-templates
 *   (también: npm run supabase:email_otp_templates)
 *
 * O añade SUPABASE_ACCESS_TOKEN en tu .env (gitignored) y ejecuta el comando.
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Debe coincidir con OTP_CODE_LENGTH en constants/authOtp.ts */
const MAILER_OTP_LENGTH = 6;

function parseEnv(text) {
  const out = {};
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1].replace(/\r/g, '').trim();
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[key] = v;
  }
  return out;
}

function projectRefFromUrl(urlStr) {
  try {
    const host = new URL(urlStr.trim()).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const otpBlock = `
    <div style="background:#f4f4f7;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:700;letter-spacing:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;color:#121212;">{{ .Token }}</span>
    </div>
    <p style="color:#595959;font-size:14px;margin:0;text-align:center;">Este código caduca en 1 hora.</p>
    <p style="color:#999;font-size:12px;margin:16px 0 0;text-align:center;">Si no solicitaste este correo, ignóralo.</p>`;

const wrap = (title, intro) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 28px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <h1 style="color:#121212;font-size:22px;margin:0 0 12px;text-align:center;">${title}</h1>
    <p style="color:#595959;font-size:16px;line-height:1.5;margin:0 0 8px;text-align:center;">${intro}</p>
    ${otpBlock}
  </div>
</body></html>`;

const templates = {
  mailer_subjects_confirmation: 'Verifica tu correo — Koraa',
  mailer_templates_confirmation_content: wrap(
    'Verifica tu correo',
    'Introduce el código de 6 dígitos en la app para completar tu registro:',
  ),
  mailer_subjects_magic_link: 'Tu código de verificación — Koraa',
  mailer_templates_magic_link_content: wrap(
    'Código de acceso',
    'Introduce este código en la app (inicio sin contraseña o verificación):',
  ),
  mailer_subjects_recovery: 'Restablecer contraseña — Koraa',
  mailer_templates_recovery_content: wrap(
    'Restablecer contraseña',
    'Introduce este código en la app para continuar y elegir una nueva contraseña:',
  ),
  mailer_subjects_reauthentication: 'Verificación de identidad — Koraa',
  mailer_templates_reauthentication_content: wrap(
    'Confirma que eres tú',
    'Introduce este código en la app para confirmar tu identidad:',
  ),
  mailer_subjects_email_change: 'Confirma tu nuevo correo — Koraa',
  mailer_templates_email_change_content: wrap(
    'Confirma el cambio de correo',
    'Introduce este código para confirmar tu nueva dirección de correo:',
  ),
};

async function main() {
  let env = {};
  const envPath = join(root, '.env');
  if (fs.existsSync(envPath)) {
    env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  }
  const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;
  const urlStr =
    process.env.EXPO_PUBLIC_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
  const ref =
    process.env.SUPABASE_PROJECT_REF ||
    env.SUPABASE_PROJECT_REF ||
    (urlStr ? projectRefFromUrl(urlStr) : null);

  if (!token) {
    const envExists = fs.existsSync(envPath);
    console.error(
      '\n❌ Falta SUPABASE_ACCESS_TOKEN.\n   Créalo en: https://supabase.com/dashboard/account/tokens\n   Luego: export SUPABASE_ACCESS_TOKEN="sbp_..."\n   O añade en .env: SUPABASE_ACCESS_TOKEN=sbp_...\n',
    );
    if (envExists) {
      console.error(
        `   (Se leyó ${envPath} pero no hubo clave válida — guarda el archivo con Cmd+S y revisa que la línea sea exactamente: SUPABASE_ACCESS_TOKEN=sbp_...)\n`,
      );
    } else {
      console.error(`   (No existe ${envPath} en la raíz del proyecto)\n`);
    }
    process.exit(1);
  }
  if (!ref) {
    console.error(
      '\n❌ No pude obtener el project ref. Define EXPO_PUBLIC_SUPABASE_URL en .env o SUPABASE_PROJECT_REF.\n',
    );
    process.exit(1);
  }

  const url = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
  const payload = {
    ...templates,
    mailer_otp_length: MAILER_OTP_LENGTH,
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`\n❌ Error HTTP ${res.status}\n`, text);
    process.exit(1);
  }

  console.log(`\n✅ Auth email: plantillas OTP + mailer_otp_length=${MAILER_OTP_LENGTH} en el proyecto: ${ref}`);
  console.log('   (Confirm signup, Magic link, Recovery, Reauthentication, Email change)\n');
  try {
    const j = JSON.parse(text);
    if (j.mailer_subjects_confirmation) {
      console.log('   Asunto confirmación:', j.mailer_subjects_confirmation);
    }
  } catch {
    /* ok */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
