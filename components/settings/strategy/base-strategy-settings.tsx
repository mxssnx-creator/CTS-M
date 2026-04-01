"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export default function BaseStrategySettings({
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
          <CardTitle>Base Strategy Configuration</CardTitle>
          <CardDescription>
            Configure base-level strategy parameters for pseudo positions with ratio volume calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Takeprofit Steps (2-20)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Takeprofit Min</Label>
                <Input
                  type="number"
                  min="2"
                  max="19"
                  step="1"
                  value={settings.strategyTpStepsMin || 2}
                  onChange={(e) => handleSettingChange("strategyTpStepsMin", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Minimum takeprofit factor (default: 2)</p>
              </div>
              <div className="space-y-2">
                <Label>Takeprofit Max</Label>
                <Input
                  type="number"
                  min="3"
                  max="20"
                  step="1"
                  value={settings.strategyTpStepsMax || 20}
                  onChange={(e) => handleSettingChange("strategyTpStepsMax", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Maximum takeprofit factor (default: 20)</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Stoploss Ratios (0.1-2.5)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stoploss Min</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="2.4"
                  step="0.1"
                  value={settings.strategySlRatiosMin || 0.1}
                  onChange={(e) => handleSettingChange("strategySlRatiosMin", Number.parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Minimum stoploss ratio (default: 0.1)</p>
              </div>
              <div className="space-y-2">
                <Label>Stoploss Max</Label>
                <Input
                  type="number"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={settings.strategySlRatiosMax || 2.5}
                  onChange={(e) => handleSettingChange("strategySlRatiosMax", Number.parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Maximum stoploss ratio (default: 2.5)</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Trailing Configuration</h3>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div>
                <Label className="text-base">Trailing Enabled</Label>
                <p className="text-xs text-muted-foreground mt-1">Enable trailing stop for base strategy positions</p>
              </div>
              <Switch
                checked={settings.strategyBaseTrailing !== false}
                onCheckedChange={(checked) => handleSettingChange("strategyBaseTrailing", checked)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trailing Start (ratio from TP)</Label>
                <Slider
                  min={0.2}
                  max={1.0}
                  step={0.2}
                  value={[settings.strategyTrailingStartDefault || 0.6]}
                  onValueChange={([value]) => handleSettingChange("strategyTrailingStartDefault", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.2</span>
                  <span className="font-medium">{settings.strategyTrailingStartDefault || 0.6}</span>
                  <span>1.0</span>
                </div>
                <p className="text-xs text-muted-foreground">Trailing start as ratio of takeprofit (default: 0.6)</p>
              </div>
              <div className="space-y-2">
                <Label>Trailing Stop (ratio from highest)</Label>
                <Slider
                  min={0.1}
                  max={0.5}
                  step={0.1}
                  value={[settings.strategyTrailingStopDefault || 0.2]}
                  onValueChange={([value]) => handleSettingChange("strategyTrailingStopDefault", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1</span>
                  <span className="font-medium">{settings.strategyTrailingStopDefault || 0.2}</span>
                  <span>0.5</span>
                </div>
                <p className="text-xs text-muted-foreground">Trailing stop as ratio of highest positive value (default: 0.2)</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Profit Factor</h3>
            <div className="space-y-2">
              <Label>Base Min Profit Factor</Label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.strategyBaseMinProfitFactor || 0.4}
                onChange={(e) => handleSettingChange("strategyBaseMinProfitFactor", Number.parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum profit factor for base strategy execution (default: 0.4)
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="text-sm font-semibold">Base Strategy Overview</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Base Strategy creates pseudo positions with ratio volume calculations from evaluated indications.
                Each configuration combination creates independent sets (250 DB length with 20% threshold rearrange).
              </p>
              <p>
                Trailing step is auto-calculated as stoploss/3. Trailing start is a ratio of takeprofit,
                trailing stop is a ratio of highest positive value.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
