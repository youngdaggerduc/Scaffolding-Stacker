import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export function CameraRig({ targetY, stackHeight, isGameOver, impulse = 0, onImpulseConsumed }) {
  const { camera } = useThree()
  const smoothY = useRef(0)
  const shakeTimer = useRef(0)
  const shakeIntensity = useRef(0)
  const wasGameOver = useRef(false)

  useEffect(() => {
    if (impulse > 0) {
      shakeTimer.current = 0.35 + impulse * 0.15
      shakeIntensity.current = Math.min(0.55, 0.18 + impulse * 0.2)
      onImpulseConsumed?.()
    }
  }, [impulse, onImpulseConsumed])

  useFrame(({ clock }, delta) => {
    if (isGameOver && !wasGameOver.current) {
      wasGameOver.current = true
      shakeTimer.current = 0.9
      shakeIntensity.current = 0.55
    }

    smoothY.current += (targetY - smoothY.current) * 0.045

    // Pull back as the tower grows so the whole stack stays in frame
    const zoom = 14 + Math.min(stackHeight * 0.18, 16)
    const yLift = 7 + Math.min(stackHeight * 0.05, 4)

    const swayAmp = Math.min(stackHeight * 0.009, 0.32)
    const sway = Math.sin(clock.elapsedTime * 0.55) * swayAmp

    let shakeX = 0, shakeY = 0
    if (shakeTimer.current > 0) {
      shakeTimer.current = Math.max(0, shakeTimer.current - delta)
      const decay = Math.min(1, shakeTimer.current / 0.5)
      const amp = shakeIntensity.current * decay
      shakeX = (Math.random() * 2 - 1) * amp
      shakeY = (Math.random() * 2 - 1) * amp * 0.6
    }

    camera.position.set(
      sway + shakeX,
      smoothY.current + yLift + shakeY,
      zoom
    )
    camera.lookAt(sway * 0.4, smoothY.current + 1, 0)
  })

  return null
}
