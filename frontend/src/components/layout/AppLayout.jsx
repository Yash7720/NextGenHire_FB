import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import XPNotif from '../ui/XPNotif'
import ChatBot from '../ui/ChatBot'

export default function AppLayout({ gameState }) {
  const { userXP, level, levelXP, streak, showXP, xpAmount, notifications, markNotifRead, refreshNotifications } = gameState

  return (
    <div className="flex min-h-screen bg-bg grid-bg">
      <XPNotif show={showXP} amount={xpAmount} />
      <Sidebar 
        userXP={userXP} 
        level={level} 
        levelXP={levelXP} 
        streak={streak} 
        dailyQuests={gameState.dailyQuests}
        weeklyChallenges={gameState.weeklyChallenges}
        notifications={notifications}
        showXP={showXP}
      />

      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <TopBar
          userXP={userXP}
          streak={streak}
          notifications={notifications}
          markNotifRead={markNotifRead}
          refreshNotifications={refreshNotifications}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={gameState} />
        </main>
      </div>

      {/* Floating AI chatbot — visible on all app pages */}
      <ChatBot />
    </div>
  )
}
