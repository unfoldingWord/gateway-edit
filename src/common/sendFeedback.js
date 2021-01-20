import sgMail from '@sendgrid/mail'
import { APP_VERSION } from '../common/constants'

export default function sendFeedback({ name, email, message, category }) {
  let fullMessage = `${message}\n\nApp Version:\n${APP_VERSION}`

  if (name) {
    fullMessage += `\n\nName: ${name}`
  }

  if (email) {
    fullMessage += `\n\nEmail: ${email}`
  }

  const msg = {
    // to: process.env.NEXT_PUBLIC_HELP_DESK_EMAIL,
    to: 'colonmanuel7@gmail.com',
    from: email,
    subject: `Create App v2: ${category}`,
    text: fullMessage,
    html: fullMessage.replace(/\n/g, '<br>'),
  }

  console.log(process.env.NEXT_PUBLIC_HELP_DESK_TOKEN)

  sgMail.setApiKey(process.env.NEXT_PUBLIC_HELP_DESK_TOKEN)

  sgMail.send(msg).then(
    () => {},
    error => {
      console.error(error)

      if (error.response) {
        console.error(error.response.body)
      }
    }
  )
}
