// ── Brevo (email transaccional) ────────────────────────────────────────────
// Dashboard: https://app.brevo.com — SMTP & API → API Keys
// A diferencia de Resend, alcanza con verificar un único email remitente
// (sin dominio propio) para poder enviar a cualquier destinatario.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function isBrevoReady(): boolean {
  const key = process.env.BREVO_API_KEY;
  return !!key && key !== 'xkeysib-...';
}

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@gotravelacademy.com';
const FROM_NAME  = process.env.BREVO_FROM_NAME  || 'GO Travel Academy';

interface SendPayload { to: string; subject: string; html: string; replyTo?: string }

async function send({ to, subject, html, replyTo }: SendPayload) {
  if (!isBrevoReady()) {
    console.log('[Email - dev] Para:', to, '| Asunto:', subject);
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key':     process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
      ...(replyTo && { replyTo: { email: replyTo } }),
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[Email] Brevo rechazó el envío a', to, ':', res.status, body);
  }
}

interface UserData   { name: string; email: string }
interface CourseData { title: string; price: number }

// ── Código de verificación ───────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, code: string) {
  await send({
    to:      email,
    subject: `${code} — Código de verificación GO Travel Academy`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:#06043F;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.03em;">GO Travel Academy</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Tu código de verificación es</p>
          <div style="margin:20px auto;display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;
               border-radius:12px;padding:22px 40px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#06043F;
                  font-family:'Courier New',monospace;">${code}</span>
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">
            Expira en <strong>15 minutos</strong>. No lo compartas con nadie.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            Si no creaste una cuenta en GO Travel Academy, ignorá este email.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Bienvenida ───────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(user: UserData) {
  await send({
    to:      user.email,
    subject: `¡Bienvenido a GO Travel Academy, ${user.name.split(' ')[0]}!`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:#06043F;padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">GO Travel Academy</h1>
          <p style="margin:4px 0 0;color:#8CB0F4;font-size:13px;">Plataforma de educación online</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;">
            ¡Hola, ${user.name.split(' ')[0]}! 👋
          </h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.7;">
            Tu cuenta fue creada y verificada exitosamente.
            Ya podés explorar todos nuestros cursos y empezar a aprender.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#06043F;border-radius:8px;padding:13px 28px;">
                <a href="${process.env.FRONTEND_URL}/cursos"
                   style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">
                  Ver cursos disponibles →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:32px 0 0;color:#94a3b8;font-size:13px;">
            Accedés con: <strong style="color:#1e293b;">${user.email}</strong>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            © 2026 GO Travel Academy ·
            <a href="${process.env.FRONTEND_URL}" style="color:#6F95E8;">gotravelacademy.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Factura de compra ────────────────────────────────────────────────────────
export async function sendPurchaseConfirmationEmail(
  user: UserData,
  course: CourseData,
  amount: number,
  invoiceNumber: string,
) {
  const date = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  await send({
    to:      user.email,
    subject: `Factura #${invoiceNumber} — ${course.title}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">

      <!-- Header -->
      <tr>
        <td style="background:#06043F;padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">GO Travel Academy</h1>
                <p style="margin:3px 0 0;color:#8CB0F4;font-size:12px;">Plataforma de educación online</p>
              </td>
              <td align="right">
                <p style="margin:0;color:#9a9894;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">Factura</p>
                <p style="margin:2px 0 0;color:#fff;font-size:18px;font-weight:700;">#${invoiceNumber}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Status banner -->
      <tr>
        <td style="background:#d1fae5;padding:14px 40px;">
          <span style="color:#065f46;font-size:14px;font-weight:600;">
            ✅ Pago confirmado — Acceso activado
          </span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:28px;border-bottom:1px solid #e8e7e3;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;
                   text-transform:uppercase;color:#8a8983;">FACTURADO A</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;">${user.name}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${user.email}</p>
              </td>
              <td align="right" style="padding-bottom:28px;border-bottom:1px solid #e8e7e3;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;
                   text-transform:uppercase;color:#8a8983;">FECHA</p>
                <p style="margin:0;font-size:14px;color:#0d0d0d;">${date}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Detalle -->
      <tr>
        <td style="padding:28px 40px 0;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:600;letter-spacing:0.08em;
             text-transform:uppercase;color:#8a8983;">DETALLE</p>
          <table width="100%" cellpadding="0" cellspacing="0"
            style="border:1px solid #e8e7e3;border-radius:10px;overflow:hidden;">
            <tr style="background:#f4f3ef;">
              <td style="padding:12px 20px;font-size:11px;font-weight:600;letter-spacing:0.06em;
                 text-transform:uppercase;color:#8a8983;">Descripción</td>
              <td align="right" style="padding:12px 20px;font-size:11px;font-weight:600;
                 letter-spacing:0.06em;text-transform:uppercase;color:#8a8983;">Total</td>
            </tr>
            <tr>
              <td style="padding:18px 20px;border-top:1px solid #e8e7e3;">
                <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;">${course.title}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Acceso de por vida · Modalidad online</p>
              </td>
              <td align="right" style="padding:18px 20px;border-top:1px solid #e8e7e3;">
                <p style="margin:0;font-size:16px;font-weight:700;color:#0d0d0d;">
                  $${amount.toLocaleString('es-AR')}
                </p>
              </td>
            </tr>
            <tr style="background:#f4f3ef;">
              <td style="padding:14px 20px;border-top:1px solid #e8e7e3;">
                <p style="margin:0;font-size:13px;font-weight:700;color:#0d0d0d;">Total pagado</p>
              </td>
              <td align="right" style="padding:14px 20px;border-top:1px solid #e8e7e3;">
                <p style="margin:0;font-size:18px;font-weight:800;color:#0d0d0d;">
                  $${amount.toLocaleString('es-AR')}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:32px 40px 36px;">
          <p style="margin:0 0 20px;font-size:14px;color:#5a5955;">
            Ya tenés acceso completo al curso. Empezá cuando quieras.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#06043F;border-radius:8px;padding:13px 28px;">
                <a href="${process.env.FRONTEND_URL}/dashboard"
                   style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">
                  Ir a mi aprendizaje →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            Este documento es el comprobante de tu compra. Guardalo para tus registros.<br>
            Ante cualquier consulta respondé este email · © 2026 GO Travel Academy
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Aviso interno de venta (al equipo, no al alumno) ─────────────────────────
// Antes la única forma de enterarse de una compra era mirar el panel de
// Mercado Pago/Stripe a mano. Este mail se dispara junto con la factura del
// alumno, así que llega apenas se confirma el pago.
export async function sendPurchaseNotificationEmail(
  user: UserData & { phone?: string | null },
  course: CourseData,
  amount: number,
  currency: string,
  provider: string,
) {
  await send({
    to:      CONTACT_INBOX,
    subject: `💰 Nueva venta: ${course.title} — ${currency} ${amount.toLocaleString('es-AR')}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">
      <tr>
        <td style="background:#065f46;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">💰 Nueva venta confirmada</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Curso</p>
          <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1e293b;">${course.title}</p>

          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Monto</p>
          <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1e293b;">
            ${currency} ${amount.toLocaleString('es-AR')} · ${provider === 'stripe' ? 'Stripe' : 'Mercado Pago'}
          </p>

          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Alumno</p>
          <p style="margin:0;font-size:14px;color:#1e293b;">${user.name}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#64748b;">
            <a href="mailto:${user.email}" style="color:#2E63D6;">${user.email}</a>
            ${user.phone ? ` · ${user.phone}` : ''}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">GO Travel Academy · aviso automático de ventas</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Pago rechazado ───────────────────────────────────────────────────────────
// Se dispara cuando Mercado Pago avisa que un pago quedó "rejected" (tarjeta
// rechazada por el banco). Antes esto no le llegaba a nadie salvo que el
// alumno volviera a ver el cartel en el sitio.
export async function sendPaymentRejectedEmail(user: UserData, course: CourseData & { id: string }) {
  await send({
    to:      user.email,
    subject: `Tu pago no pudo procesarse — ${course.title}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">
      <tr>
        <td style="background:#06043F;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.03em;">GO Travel Academy</h1>
        </td>
      </tr>
      <tr>
        <td style="background:#fee2e2;padding:14px 40px;">
          <span style="color:#991b1b;font-size:14px;font-weight:600;">❌ Tu pago no fue aprobado</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Hola ${user.name.split(' ')[0]},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#5a5955;line-height:1.7;">
            Tu banco rechazó el pago del curso <strong>${course.title}</strong>. No se te cobró nada
            y todavía no tenés acceso al curso. Suele pasar con compras grandes por internet: el
            banco las frena por seguridad.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#5a5955;line-height:1.7;">
            Podés intentar de nuevo con la misma tarjeta (a veces alcanza con autorizarla llamando
            al banco), probar con otra tarjeta, o usar la opción de transferencia con 10% off.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#06043F;border-radius:8px;padding:13px 28px;">
                <a href="${process.env.FRONTEND_URL}/cursos/${course.id}"
                   style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">
                  Volver a intentar →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            ¿Necesitás ayuda? Respondé este email y te ayudamos a resolverlo.<br>© 2026 GO Travel Academy
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Reembolso / anulación ────────────────────────────────────────────────────
// Se dispara cuando un pago aprobado se reembolsa, se anula o entra en
// contracargo (Stripe: charge.refunded/charge.dispute.created — MP: refunded/
// cancelled/charged_back). El acceso al curso ya se revoca en el webhook; esto
// es lo que le avisa al alumno que pasó, en vez de que descubra que perdió el
// acceso sin ninguna explicación.
export async function sendRefundEmail(user: UserData, course: CourseData) {
  await send({
    to:      user.email,
    subject: `Reembolso procesado — ${course.title}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">
      <tr>
        <td style="background:#06043F;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.03em;">GO Travel Academy</h1>
        </td>
      </tr>
      <tr>
        <td style="background:#fef3c7;padding:14px 40px;">
          <span style="color:#92400e;font-size:14px;font-weight:600;">↩️ Reembolso procesado</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Hola ${user.name.split(' ')[0]},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#5a5955;line-height:1.7;">
            Te confirmamos que tu pago del curso <strong>${course.title}</strong> fue reembolsado.
            El dinero vuelve al medio de pago original — el tiempo en verse reflejado depende de tu
            banco o tarjeta.
          </p>
          <p style="margin:0;font-size:14px;color:#5a5955;line-height:1.7;">
            Como consecuencia, el acceso al curso quedó desactivado. Si esto no lo pediste vos o
            tenés dudas, respondé este email y lo revisamos.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">© 2026 GO Travel Academy</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Reset de contraseña ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await send({
    to:      email,
    subject: 'Restablecer contraseña — GO Travel Academy',
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">
      <tr>
        <td style="background:#06043F;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">GO Travel Academy</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0d0d0d;">
            Restablecer contraseña
          </h2>
          <p style="margin:0 0 24px;color:#5a5955;font-size:15px;line-height:1.7;">
            Recibimos una solicitud para restablecer tu contraseña.
            El enlace expira en <strong>1 hora</strong>.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#06043F;border-radius:8px;padding:13px 28px;">
                <a href="${resetUrl}"
                   style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">
                  Restablecer contraseña →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;color:#8a8983;font-size:13px;">
            Si no solicitaste este cambio, ignorá este email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 GO Travel Academy</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Formulario de contacto ────────────────────────────────────────────────────
const CONTACT_INBOX = 'academygotravel@gmail.com';

interface ContactMessage { name: string; email: string; subject: string; message: string }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export async function sendContactEmail({ name, email, subject, message }: ContactMessage) {
  name = escapeHtml(name);
  subject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  await send({
    to:      CONTACT_INBOX,
    replyTo: email,
    subject: `[Contacto web] ${subject} — ${name}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">
      <tr>
        <td style="background:#06043F;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">Nuevo mensaje de contacto</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">De</p>
          <p style="margin:0 0 20px;font-size:15px;color:#1e293b;">
            <strong>${name}</strong> · <a href="mailto:${email}" style="color:#2E63D6;">${email}</a>
          </p>
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Asunto</p>
          <p style="margin:0 0 20px;font-size:15px;color:#1e293b;">${subject}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Mensaje</p>
          <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;">${safeMessage}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Respondé este email para contestarle directo a ${name}.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

// ── Alerta: webhook de pagos falló ───────────────────────────────────────────
// Antes, si un webhook de Stripe/MP tiraba una excepción (bug, DB caída, lo
// que sea), solo quedaba en los logs de Railway — nadie se enteraba salvo que
// alguien fuera a mirarlos. Esto manda un aviso apenas pasa. Best-effort: si
// falla el envío del mail no debe romper el manejo del webhook en sí.
export async function sendWebhookErrorAlert(provider: 'Stripe' | 'Mercado Pago', context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await send({
    to:      CONTACT_INBOX,
    subject: `⚠️ Webhook de ${provider} falló — ${context}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7e3;">
      <tr>
        <td style="background:#7f1d1d;padding:24px 40px;">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:800;">⚠️ Webhook de pagos falló</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 40px;">
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Procesador</p>
          <p style="margin:0 0 18px;font-size:15px;font-weight:600;color:#1e293b;">${provider}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Dónde</p>
          <p style="margin:0 0 18px;font-size:15px;color:#1e293b;">${context}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#8a8983;text-transform:uppercase;letter-spacing:0.06em;">Error</p>
          <p style="margin:0;font-size:13px;color:#991b1b;font-family:'Courier New',monospace;background:#fef2f2;
             padding:12px 16px;border-radius:8px;white-space:pre-wrap;word-break:break-word;">${message}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px;border-top:1px solid #e8e7e3;background:#f4f3ef;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            Puede significar que una venta o un reembolso no se procesó bien — conviene revisar los
            logs de Railway y, si hace falta, el pago a mano en el panel de MP/Stripe.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}
