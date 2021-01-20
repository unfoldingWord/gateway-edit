import sgMail from '@sendgrid/mail'
import { APP_VERSION } from '../../src/common/constants'

async function sendFeedback({ name, email, message, category }) {
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

  return sgMail.send(msg)
}

export default async (req, res) => {
  if (req.method === 'POST') {
    const { name, email, message, category } = req.body
    console.log({ name, email, message, category })
    const response = await sendFeedback({
      name,
      email,
      message,
      category,
    }).catch(e => console.log(e))

    console.log({ response })
    return res.status(200).end()
  }

  return res.status(404).json({
    error: {
      code: 'not_found',
      messgae:
        "The requested endpoint was not found or doesn't support this method.",
    },
  })
}
