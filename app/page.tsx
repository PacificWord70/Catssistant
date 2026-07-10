import CatTree from '@/components/CatTree'
import Reveal from '@/components/motion/Reveal'
import Parallax from '@/components/motion/Parallax'

export default function Home() {
  return (
    <div style={{ margin: '-2rem -1rem 0', minHeight: '100vh' }}>
      <Reveal>
        <Parallax offset={20}>
          <CatTree />
        </Parallax>
      </Reveal>
    </div>
  )
}
