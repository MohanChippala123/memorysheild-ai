import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.classList.contains('cursor-expand')
      ) {
        setIsHovering(true)
      }
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter, true)
    document.addEventListener('mouseleave', handleMouseLeave, true)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter, true)
      document.removeEventListener('mouseleave', handleMouseLeave, true)
    }
  }, [])

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-50"
        animate={{
          x: position.x - 8,
          y: position.y - 8,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      >
        <motion.div
          className="w-4 h-4 rounded-full border border-[#D9A35F]"
          animate={{
            scale: isHovering ? 1.5 : 1,
            boxShadow: isHovering
              ? '0 0 15px rgba(217, 163, 95, 0.6)'
              : '0 0 8px rgba(217, 163, 95, 0.3)',
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </>
  )
}
