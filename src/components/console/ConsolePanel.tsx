import { Button } from "@/components/ui/button"
import { useSandboxStore } from "@/lib/store"
import { getConsoleLogClass } from "@/lib/constants"

interface ConsolePanelProps {}

export default function ConsolePanel({}: ConsolePanelProps) {
  const logs = useSandboxStore((s) => s.consoleLogs)
  const open = useSandboxStore((s) => s.consoleOpen)
  const setOpen = useSandboxStore((s) => s.setConsoleOpen)
  const clear = useSandboxStore((s) => s.clearConsole)

  return (
    <div className="w-full border-t border-zinc-800/80 bg-zinc-950/70">
      <button
        className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-800/50 transition-colors flex items-center justify-between"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium">Console</span>
        <span className="text-muted-foreground">{logs.length} entries</span>
      </button>
      {open && (
        <div>
          <div className="max-h-40 overflow-auto text-xs font-mono px-3 py-2 space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No messages</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={getConsoleLogClass(log.type)}>
                  <span className="opacity-60 mr-2">
                    {new Date(log.time).toLocaleTimeString()}
                  </span>
                  <span className="break-words">{log.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="px-3 pb-2">
            <Button size="sm" variant="outline" onClick={clear}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}