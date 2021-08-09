// index.js

const url = require('url')
const axios = require('axios')

module.exports = {
  onPreBuild: async ({ constants, packageJson, netlifyConfig }) => {
    console.log('Zulip notification')
    console.log({ constants })
    console.log({ netlifyConfig })
    // console.log({ netlifyConfig.build.environment })
    // console.log({ packageJson })
    // console.log(process.env)
    const token = process.env.ZULIP_TOKEN
    const name = packageJson.name
    const version = packageJson.version
    const user = 'netlify-bot@unfoldingword.zulipchat.com'
    const content = `Building ${name} ${version}, token length = ${token.length}`
    console.log(content)

    try {
      // const token_ = Buffer.from(`${user}:${token}`, 'utf8').toString('base64')

      const data = {
        to:       'SOFTWARE - UR/github',
        subject:  'netlify testing',
        content,
        type:     'stream',
      }
      console.log({ data })
      const params = new url.URLSearchParams(data)

      await axios.post('https://unfoldingword.zulipchat.com/api/v1/messages',
        params.toString(),
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
