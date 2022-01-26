import { useState , useEffect } from 'react'
import { motion } from 'framer-motion/dist/framer-motion'
import ResourceCard from '@components/ResourceCard'

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  })

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        scrollHeight: window.document.documentElement.scrollHeight,
        scrollWidth: window.document.documentElement.scrollWidth,
      })
    }

    // only execute all the code below in client side
    if (typeof window !== 'undefined') {
      // Add event listener
      window.addEventListener('resize', handleResize)

      // Call handler right away so state gets updated with initial window size
      handleResize()

      // Remove event listener on cleanup
      return () => window.removeEventListener('resize', handleResize)
    }
  }, []) // Empty array ensures that effect is only run on mount
  return windowSize
}

const MinimizableWrapper = (props) => {
  // const [minimized, setMinimized] = useState(false)
  const [minimized, setMinimized] = useState(0)
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)
  const { height } = useWindowSize()

  function minimize() {
    setMinimized(height - 150)
    setScale(0.2)
    setOpacity([0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1])
  }

  function maximize() {
    setMinimized(0)
    setScale(1)
    setOpacity(1)
  }

  console.log({ height })

  return (
    <motion.div
      animate={{
        y: minimized, scale, opacity,
      }}
      transition={{ times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
      onClick={minimized > 0 ? maximize : minimize}>
      <ResourceCard
        {...props}
        onMinimize={() => minimize()}
      />
    </motion.div>
  )
}

export default MinimizableWrapper
