import sgMail from '@sendgrid/mail'
import { APP_VERSION } from '../common/constants'

export default async function sendFeedback({ name, email, message, category }) {
  let fullMessage = `${message}\n\nApp Version: ${APP_VERSION}`

  if (name) {
    fullMessage += `\n\nName: ${name}`
  }

  if (email) {
    fullMessage += `\n\nEmail: ${email}`
  }

  const msg = {
    to: process.env.HELP_DESK_EMAIL,
    from: email,
    subject: `Create App v2: ${category}`,
    text: fullMessage,
    html: fullMessage.replace(/\n/g, '<br>'),
  }

  sgMail.setApiKey(process.env.HELP_DESK_TOKEN)

  return sgMail.send(msg)
}
