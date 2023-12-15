import fetch from 'node-fetch'
import { APP_VERSION } from '../../src/common/constants'

const handler = async function (event) {
  if (event.body === null) {
    return {
      statusCode: 400,
      body: JSON.stringify('Payload required'),
    }
  }

  const { name, email, message, category, extraData } = event.body

  //automatically generated snippet from the email preview
  //sends a request to an email handler for a subscribed email
  // Documentation: https://docs.netlify.com/integrations/email-integration/
  await fetch(`${process.env.URL}/.netlify/functions/emails/feedback`, {
    headers: {
      'netlify-emails-secret': process.env.NETLIFY_EMAILS_SECRET,
    },
    method: 'POST',
    body: JSON.stringify({
      from: process.env.HELP_DESK_EMAIL,
      to: email,
      subject: `gatewayEdit App: ${category}`,
      parameters: {
        name,
        email,
        message,
        extraData,
        version: APP_VERSION,
      },
    }),
  })

  return {
    statusCode: 200,
    body: JSON.stringify('Subscribe email sent!'),
  }
}

export { handler }

// export default async (req, res) => {
//   let errorMessage

//   if (req.method === 'POST') {
//     const { name, email, message, category, extraData } = req.body

//     try {
//       const response = await sendFeedback({
//         name,
//         email,
//         message,
//         category,
//         extraData,
//       })

//       console.log(`sendFeedback() response: ${JSON.stringify(response)}`)

//       if (!errorMessage) {
//         return res.status(200).json({ ...response })
//       }
//     } catch (e) {
//       errorMessage = e.toString()
//       console.warn(`sendFeedback() errorMessage: ${errorMessage}`)
//     }
//   }

//   // see if we can parse http code from message
//   let httpCode
//   const found = errorMessage.match(/\((\d+)\)/)

//   if (found?.length > 1) {
//     httpCode = parseInt(found[1], 10)
//   }

//   return res.status(404).json({
//     error: {
//       code: httpCode || 'not_found',
//       message:
//         errorMessage ||
//         "The requested endpoint was not found or doesn't support this method.",
//     },
//   })
// }
