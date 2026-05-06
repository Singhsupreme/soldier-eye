import BottomNav from './BottomNav'

export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-bg overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
      <BottomNav/>
    </div>
  )
}