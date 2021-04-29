import sendFeedback from '../../src/common/sendFeedback'

export default async (req, res) => {
  if (req.method === 'POST') {
    const { name, email, message, category, extraData } = req.body
    const response = await sendFeedback({
      name,
      email,
      message,
      category,
      extraData,
    }).catch(e => console.log(e))

    return res.status(200).json({ ...response })
  }

  return res.status(404).json({
    error: {
      code: 'not_found',
      message:
        'The requested endpoint was not found or doesn\'t support this method.',
    },
  })
}
