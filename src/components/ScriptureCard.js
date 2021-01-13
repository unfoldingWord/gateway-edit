import { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  useContent,
  useCardState,
} from 'translation-helps-rcl'
import { ScripturePane, useScripture } from "single-scripture-rcl";

export default function ScriptureCard({
  title,
  chapter,
  verse,
  server,
  owner,
  branch,
  languageId,
  classes,
  bookId,
  resourceId,
}) {
  const scriptureConfig = useScripture({
    reference: {
      projectId: bookId,
      chapter,
      verse,
    },
    resource: {
      languageId,
      projectId: resourceId,
      owner,
      branch,
    },
    config: {
      server,
      cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
    },
  });

  return (
    <Card classes={classes} title = {title}>
      <ScripturePane {...scriptureConfig}/>
    </Card>
  )
}

ScriptureCard.propTypes = {
  title: PropTypes.string.isRequired,
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  server: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  branch: PropTypes.string.isRequired,
  languageId: PropTypes.string.isRequired,
  bookId: PropTypes.string.isRequired,
  resourceId: PropTypes.string.isRequired,
}
