"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  lastUpdate: string | null
}

export function ConnectionStatus({ isConnected, lastUpdate }: ConnectionStatusProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="font-medium">Real-time Updates</span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
            <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>To enable real-time updates:</p>
            <code className="bg-muted px-2 py-1 rounded text-xs">npm run ws-server</code>
          </div>
        )}

        {lastUpdate && <div className="mt-2 text-xs text-muted-foreground">Last update: {lastUpdate}</div>}
      </CardContent>
    </Card>
  )
}
