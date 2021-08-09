// index.js

const axios = require('axios')

module.exports = {
  onPreBuild: async ({ packageJson, netlifyConfig }) => {
    console.log('Hello world from onPreBuild event!')
    console.log({ netlifyConfig })
    // console.log({ packageJson })
    // console.log(process.env)
    const token = process.env.ZULIP_TOKEN
    const name = packageJson.name
    const version = packageJson.version
    const user = 'netlify-bot@unfoldingword.zulipchat.com'
    console.log(`Building ${name} ${version}, token length = ${token.length}`)

    try {
      // const token_ = Buffer.from(`${user}:${token}`, 'utf8').toString('base64')

      const data = {
        to:       'SOFTWARE - UR/github',
        subject:  'netlify testing',
        content:  'This is another test',
        type:     'stream',
      }
      console.log({ data })

      await axios.post('https://unfoldingword.zulipchat.com/api/v1/messages',
        data,
        {
          auth: {
            username: user,
            password: token,
          },
        })
    } catch (error) {
      console.error('error Sending Zulip notification', error)
    }
  }
}
