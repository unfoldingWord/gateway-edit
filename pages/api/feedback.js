import sendFeedback from '../../src/common/sendFeedback'

export default async (req, res) => {
  let errorMessage

  if (req.method === 'POST') {
    const { name, email, message, category, extraData } = req.body

    try {
      const response = await sendFeedback({
        name,
        email,
        message,
        category,
        extraData,
      })

      console.log(`sendFeedback() response: ${JSON.stringify(response)}`)

      if (!errorMessage) {
        return res.status(200).json({...response})
      }
    } catch (e) {
      console.log(`sendFeedback() error:`, e)
      errorMessage = e.toString()
      console.log(`sendFeedback() errorMessage: ${errorMessage}`)
    }
  }

  let httpCode
  const found = errorMessage.match(/\((\d+)\)/)
  console.log(`sendFeedback() parsed error code: ${JSON.stringify(found)}`)

  if (found?.length > 1) {
    httpCode = parseInt(found[1], 10)
  }

  return res.status(404).json({
    error: {
      code: httpCode || 'not_found',
      message: errorMessage ||
        'The requested endpoint was not found or doesn\'t support this method.',
    },
  })
}
