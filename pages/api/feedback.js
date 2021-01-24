import sendFeedback from '../../src/common/sendFeedback'

export default async (req, res) => {
  if (req.method === 'POST') {
    const { name, email, message, category } = req.body
    const res = await sendFeedback({
      name,
      email,
      message,
      category,
    }).catch(e => console.log(e))

    console.log({ res })

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
