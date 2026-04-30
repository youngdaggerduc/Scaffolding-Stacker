import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export function CameraRig({ targetY, stackHeight, isGameOver }) {
  const { camera } = useThree()
  const smoothY = useRef(0)
  const shakeTimer = useRef(0)
  const wasGameOver = useRef(false)

  useFrame(({ clock }, delta) => {
    // Trigger shake exactly once when game over flips on
    if (isGameOver && !wasGameOver.current) {
      wasGameOver.current = true
      shakeTimer.current = 0.8  // shake duration in seconds
    }

    smoothY.current += (targetY - smoothY.current) * 0.04

    // Sway grows with tower height — adds mounting tension
    const swayAmp = Math.min(stackHeight * 0.009, 0.28)
    const sway = Math.sin(clock.elapsedTime * 0.55) * swayAmp

    // Screen shake — decaying random offset
    let shakeX = 0, shakeY = 0
    if (shakeTimer.current > 0) {
      shakeTimer.current = Math.max(0, shakeTimer.current - delta)
      const decay = shakeTimer.current / 0.8
      shakeX = (Math.random() * 2 - 1) * 0.45 * decay
      shakeY = (Math.random() * 2 - 1) * 0.25 * decay
    }

    camera.position.set(
      sway + shakeX,
      smoothY.current + 7 + shakeY,
      14
    )
    camera.lookAt(sway * 0.4, smoothY.current + 1, 0)
  })

  return null
}
