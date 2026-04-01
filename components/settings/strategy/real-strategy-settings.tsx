"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export default function RealStrategySettings({
  settings,
  handleSettingChange,
}: {
  settings: any
  handleSettingChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Real Strategy Configuration</CardTitle>
          <CardDescription>
            Configure real strategy evaluation with profitfactor and drawdowntime thresholds for exchange mirroring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Evaluation Thresholds</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Profit Factor (0.1 - 3.0)</Label>
                <Slider
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  value={[settings.realMinProfitFactor || 0.7]}
                  onValueChange={([value]) => handleSettingChange("realMinProfitFactor", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1</span>
                  <span className="font-medium text-primary">{settings.realMinProfitFactor || 0.7}</span>
                  <span>3.0</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimal profit factor for real strategy evaluation (default: 0.7)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Drawdown Hours (1 - 48)</Label>
                <Slider
                  min={1}
                  max={48}
                  step={1}
                  value={[settings.realMaxDrawdownHours || 12]}
                  onValueChange={([value]) => handleSettingChange("realMaxDrawdownHours", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span className="font-medium text-primary">{settings.realMaxDrawdownHours || 12}h</span>
                  <span>48h</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum drawdown time for real strategy positions (default: 12h)
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Real-Time Execution</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Real Trade Interval (seconds)</Label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[settings.strategyRealTradeInterval || 1]}
                  onValueChange={([value]) => handleSettingChange("strategyRealTradeInterval", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1s</span>
                  <span className="font-medium">{settings.strategyRealTradeInterval || 1}s</span>
                  <span>10s</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position Monitoring Interval (seconds)</Label>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[settings.strategyRealPositionsInterval || 0.3]}
                  onValueChange={([value]) => handleSettingChange("strategyRealPositionsInterval", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1s</span>
                  <span className="font-medium">{settings.strategyRealPositionsInterval || 0.3}s</span>
                  <span>5s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Position Management</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Real Positions</Label>
                <Input
                  type="number"
                  min="10"
                  max="500"
                  value={settings.strategyRealMaxPositions || 100}
                  onChange={(e) => handleSettingChange("strategyRealMaxPositions", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum concurrent real strategy positions (default: 100)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Position Cooldown (seconds)</Label>
                <Input
                  type="number"
                  min="1"
                  max="300"
                  value={settings.strategyRealPositionCooldown || 20}
                  onChange={(e) => handleSettingChange("strategyRealPositionCooldown", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Cooldown between entries for same symbol (default: 20s)
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Live Trade Settings</h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-base">Live Trade Mirror</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mirror real pseudo positions to exchange when live trade is enabled on connection
                  </p>
                </div>
                <Switch
                  checked={settings.realLiveTradeMirror !== false}
                  onCheckedChange={(checked) => handleSettingChange("realLiveTradeMirror", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-base">Use TP/SL in Overall Settings</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use position TP and SL from overall settings instead of order commands for better performance
                  </p>
                </div>
                <Switch
                  checked={settings.realUseOverallTpSl !== false}
                  onCheckedChange={(checked) => handleSettingChange("realUseOverallTpSl", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-base">Real Trailing Enabled</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable trailing stop loss for real-time positions
                  </p>
                </div>
                <Switch
                  checked={settings.strategyRealTrailing !== false}
                  onCheckedChange={(checked) => handleSettingChange("strategyRealTrailing", checked)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Sets Configuration</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Set DB Length</Label>
                <Input
                  type="number"
                  min="50"
                  max="1000"
                  value={settings.setDbLength || 250}
                  onChange={(e) => handleSettingChange("setDbLength", Math.max(50, Number.parseInt(e.target.value)))}
                />
                <p className="text-xs text-muted-foreground">
                  Max entries per independent set (default: 250)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Threshold Rearrange %</Label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={settings.setThresholdRearrangePercent || 20}
                  onChange={(e) => handleSettingChange("setThresholdRearrangePercent", Math.max(5, Math.min(50, Number.parseInt(e.target.value))))}
                />
                <p className="text-xs text-muted-foreground">
                  Rearrange at X% less than max length (default: 20%, rearrange at 200 when max=250)
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="text-sm font-semibold">Real Strategy Overview</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Real Strategy evaluates main pseudo positions with profitfactor min 0.7 and max drawdowntime 12h.
                Each configuration combination maintains independent sets with 250 DB length and threshold rearrange
                at 20% less for high-frequency performance.
              </p>
              <p>
                When live trade is enabled on the main connection, real pseudo positions are mirrored to the
                exchange using TP/SL from overall settings for optimal performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
