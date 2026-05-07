import { useEffect, useState } from 'react'
import useBoardStore from './store/boardStore'
import { useBoard } from './hooks/useBoard'
import Toolbar from './components/Toolbar'
import Board from './components/Board'
import UpgradePrompt from './components/UpgradePrompt'
import LicenseModal from './components/LicenseModal'
import SettingsPanel from './components/SettingsPanel'
import UpdateBar from './components/UpdateBar'

export default function App() {
  const { loadFromDisk } = useBoardStore()
  const { activeBoard } = useBoard()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showLicense, setShowLicense] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadFromDisk()
  }, [loadFromDisk])

  const openLicenseFromUpgrade = () => {
    setShowUpgrade(false)
    setShowLicense(true)
  }

  return (
    <div className="app">
      <UpdateBar />
      <Toolbar
        onUpgradePrompt={() => setShowUpgrade(true)}
        onOpenLicense={() => setShowLicense(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
      <Board board={activeBoard} />

      {showUpgrade && (
        <UpgradePrompt
          onClose={() => setShowUpgrade(false)}
          onEnterKey={openLicenseFromUpgrade}
        />
      )}
      {showLicense && (
        <LicenseModal onClose={() => setShowLicense(false)} />
      )}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onActivateLicense={() => setShowLicense(true)}
        />
      )}
    </div>
  )
}
