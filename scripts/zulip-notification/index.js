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
    console.log(`Building ${name} ${version}, token length = ${token.length}`)

    try {
      await axios.post('https://unfoldingword.zulipchat.com/api/v1/messages',
        {
          type:     'stream',
          to:       'SOFTWARE - UR/github',
          subject:  'netlify testing',
          content:  'This is another test',
        },
        {
          headers: {
            'Authorization': `Basic netlify-bot@unfoldingword.zulipchat.com:${token}`,
          },
        })
    } catch (error) {
      console.error('error Sending Zulip notification', error)
    }
  }
}
