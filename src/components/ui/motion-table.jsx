import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

const MotionTable = React.forwardRef(({ 
  className, 
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  transition = { duration: 0.3 },
  ...props 
}, ref) => (
  <motion.div
    initial={initial}
    animate={animate}
    transition={transition}
    className="relative w-full overflow-auto"
  >
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props} />
  </motion.div>
))
MotionTable.displayName = "MotionTable"

const MotionTableHeader = React.forwardRef(({ 
  className, 
  initial = { opacity: 0, y: -10 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.3 },
  ...props 
}, ref) => (
  <motion.thead 
    ref={ref} 
    initial={initial}
    animate={animate}
    transition={transition}
    className={cn("[&_tr]:border-b", className)} 
    {...props} 
  />
))
MotionTableHeader.displayName = "MotionTableHeader"

const MotionTableBody = React.forwardRef(({ 
  className, 
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  transition = { duration: 0.3, delay: 0.1 },
  ...props 
}, ref) => (
  <motion.tbody
    ref={ref}
    initial={initial}
    animate={animate}
    transition={transition}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props} />
))
MotionTableBody.displayName = "MotionTableBody"

const MotionTableRow = React.forwardRef(({ 
  className, 
  initial = { opacity: 0, y: 10 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.3 },
  whileHover = { scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" },
  whileTap = { scale: 0.98 },
  ...props 
}, ref) => (
  <motion.tr
    ref={ref}
    initial={initial}
    animate={animate}
    transition={transition}
    whileHover={whileHover}
    whileTap={whileTap}
    className={cn(
      "border-b transition-colors data-[state=selected]:bg-muted",
      className
    )}
    {...props} />
))
MotionTableRow.displayName = "MotionTableRow"

const MotionTableHead = React.forwardRef(({ 
  className, 
  initial = { opacity: 0, y: -5 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.3 },
  ...props 
}, ref) => (
  <motion.th
    ref={ref}
    initial={initial}
    animate={animate}
    transition={transition}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props} />
))
MotionTableHead.displayName = "MotionTableHead"

const MotionTableCell = React.forwardRef(({ 
  className, 
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  transition = { duration: 0.3 },
  ...props 
}, ref) => (
  <motion.td
    ref={ref}
    initial={initial}
    animate={animate}
    transition={transition}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props} />
))
MotionTableCell.displayName = "MotionTableCell"

const MotionTableCaption = React.forwardRef(({ 
  className, 
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  transition = { duration: 0.3 },
  ...props 
}, ref) => (
  <motion.caption
    ref={ref}
    initial={initial}
    animate={animate}
    transition={transition}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props} />
))
MotionTableCaption.displayName = "MotionTableCaption"

export {
  MotionTable,
  MotionTableHeader,
  MotionTableBody,
  MotionTableRow,
  MotionTableHead,
  MotionTableCell,
  MotionTableCaption,
}