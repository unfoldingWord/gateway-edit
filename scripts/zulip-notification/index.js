// index.js

module.exports = {
  onPreBuild: ({ packageJson, netlifyConfig }) => {
    console.log('Hello world from onPreBuild event!')
    console.log({ netlifyConfig })
    console.log({ packageJson })
    console.log(process.env)
  },
}
