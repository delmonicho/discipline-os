import { AuthGate } from './components/AuthGate'
import DisciplineOS from './DisciplineOS'

export default function App() {
  return (
    <AuthGate>
      <DisciplineOS />
    </AuthGate>
  )
}
