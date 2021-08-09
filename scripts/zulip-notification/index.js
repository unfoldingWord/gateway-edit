// index.js

module.exports = {
  onPreBuild: ({ packageJson, netlifyConfig }) => {
    console.log('Hello world from onPreBuild event!')
    console.log({ netlifyConfig })
    // console.log({ packageJson })
    // console.log(process.env)
    const token = process.env.ZULIP_TOKEN
    const name = packageJson.name
    const version = packageJson.version
    console.log(`Building ${name} ${version}, token length = ${token}`)
  },
}
