import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "./card"

const MotionCard = React.forwardRef(({ 
  className, 
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.3 },
  whileHover = { y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)" },
  whileTap = { scale: 0.98 },
  ...props 
}, ref) => (
  <motion.div
    ref={ref}
    initial={initial}
    animate={animate}
    transition={transition}
    whileHover={whileHover}
    whileTap={whileTap}
  >
    <Card className={className} {...props} />
  </motion.div>
))

MotionCard.displayName = "MotionCard"

export { MotionCard }