import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email alerts will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Email would be sent:", params.subject, "to", params.to);
    return true; // Return true in development to prevent errors
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from || 'noreply@trainmanager.com',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateTrainingExpiryEmail(
  employeeName: string,
  trainingTitle: string,
  expiryDate: string,
  daysUntilExpiry: number
): { subject: string; html: string; text: string } {
  const isExpiring = daysUntilExpiry === 0;
  
  const subject = isExpiring
    ? `🚨 Treinamento vencido hoje - ${trainingTitle}`
    : `⚠️ Treinamento vence em ${daysUntilExpiry} dias - ${trainingTitle}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">TrainManager Pro</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0;">Sistema de Gestão de Treinamentos</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: ${isExpiring ? '#fef2f2' : '#fff7ed'}; border-left: 4px solid ${isExpiring ? '#dc2626' : '#ea580c'}; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: ${isExpiring ? '#dc2626' : '#ea580c'}; margin: 0 0 10px 0; font-size: 20px;">
            ${isExpiring ? '🚨 Treinamento Vencido' : '⚠️ Treinamento Vencendo'}
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px;">
            ${isExpiring 
              ? `O treinamento <strong>${trainingTitle}</strong> do funcionário <strong>${employeeName}</strong> venceu hoje.`
              : `O treinamento <strong>${trainingTitle}</strong> do funcionário <strong>${employeeName}</strong> vence em <strong>${daysUntilExpiry} dias</strong>.`
            }
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #111827;">Detalhes do Treinamento</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Funcionário:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${employeeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Treinamento:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${trainingTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Data de Vencimento:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${new Date(expiryDate).toLocaleDateString('pt-BR')}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://trainmanager.com'}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Acessar TrainManager Pro
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Este é um alerta automático do TrainManager Pro. Para gerenciar suas configurações de notificação, acesse seu painel de controle.</p>
        </div>
      </div>
    </div>
  `;

  const text = `
TrainManager Pro - Alerta de Treinamento

${isExpiring ? 'TREINAMENTO VENCIDO' : 'TREINAMENTO VENCENDO'}

Funcionário: ${employeeName}
Treinamento: ${trainingTitle}
Data de Vencimento: ${new Date(expiryDate).toLocaleDateString('pt-BR')}

${isExpiring 
  ? `O treinamento venceu hoje e requer ação imediata.`
  : `O treinamento vence em ${daysUntilExpiry} dias.`
}

Acesse o TrainManager Pro para mais detalhes: ${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://trainmanager.com'}
  `;

  return { subject, html, text };
}
