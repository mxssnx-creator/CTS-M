"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const SELECTED_SET_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30]
const CONTINUING_COUNTS = [1, 2, 3, 4, 5, 6]

export default function MainStrategySettings({
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
          <CardTitle>Main Strategy Configuration</CardTitle>
          <CardDescription>
            Configure main-level strategy evaluation with profitfactor, set selection, and continuing positions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Profitfactor Evaluation</h3>
            <div className="space-y-2">
              <Label>Min Profit Factor (0.1 - 3.0)</Label>
              <Slider
                min={0.1}
                max={3.0}
                step={0.1}
                value={[settings.mainMinProfitFactor || 0.5]}
                onValueChange={([value]) => handleSettingChange("mainMinProfitFactor", value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1</span>
                <span className="font-medium text-primary">{settings.mainMinProfitFactor || 0.5}</span>
                <span>3.0</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimal profit factor ratio for main strategy evaluation (default: 0.5)
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Selected Sets Evaluation (Min PF: 0.6)</h3>
            <div className="space-y-2">
              <Label>Last Position Counts for Set Selection</Label>
              <div className="flex flex-wrap gap-2">
                {SELECTED_SET_COUNTS.map((count) => {
                  const selected = (settings.mainSelectedSetCounts || SELECTED_SET_COUNTS).includes(count)
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        const current = settings.mainSelectedSetCounts || [...SELECTED_SET_COUNTS]
                        const updated = selected ? current.filter((c: number) => c !== count) : [...current, count].sort((a, b) => a - b)
                        handleSettingChange("mainSelectedSetCounts", updated)
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {count}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluate from selected sets by last position count with min profitfactor 0.6
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Continuing Positions (Tracked on Config Sets)</h3>
            <div className="space-y-2">
              <Label>Position Counts for Continuing Evaluation</Label>
              <div className="flex flex-wrap gap-2">
                {CONTINUING_COUNTS.map((count) => {
                  const selected = (settings.mainContinuingPositionCounts || CONTINUING_COUNTS).includes(count)
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        const current = settings.mainContinuingPositionCounts || [...CONTINUING_COUNTS]
                        const updated = selected ? current.filter((c: number) => c !== count) : [...current, count].sort((a, b) => a - b)
                        handleSettingChange("mainContinuingPositionCounts", updated)
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {count}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Positions to be tracked (evaluated) on specified configuration sets
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Max Pseudo Positions (Per Direction, 1-8)</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Long</Label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={settings.strategyMainMaxPseudoPositionsLong || 1}
                  onChange={(e) =>
                    handleSettingChange("strategyMainMaxPseudoPositionsLong", Math.min(8, Math.max(1, Number.parseInt(e.target.value))))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Max pseudo positions for long per configuration set (default: 1)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Short</Label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={settings.strategyMainMaxPseudoPositionsShort || 1}
                  onChange={(e) =>
                    handleSettingChange("strategyMainMaxPseudoPositionsShort", Math.min(8, Math.max(1, Number.parseInt(e.target.value))))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Max pseudo positions for short per configuration set (default: 1)
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Adjustment Controls</h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-base">Ongoing Trailing</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable trailing stop loss for ongoing main strategy positions
                  </p>
                </div>
                <Switch
                  checked={settings.strategyMainOngoingTrailing !== false}
                  onCheckedChange={(checked) => handleSettingChange("strategyMainOngoingTrailing", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-base">Block Adjustment</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable block strategy adjustments for main positions
                  </p>
                </div>
                <Switch
                  checked={settings.strategyMainBlockAdjustment === true}
                  onCheckedChange={(checked) => handleSettingChange("strategyMainBlockAdjustment", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <Label className="text-base">DCA Adjustment</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable Dollar Cost Averaging adjustments for main positions
                  </p>
                </div>
                <Switch
                  checked={settings.strategyMainDcaAdjustment === true}
                  onCheckedChange={(checked) => handleSettingChange("strategyMainDcaAdjustment", checked)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="text-sm font-semibold">Main Strategy Overview</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Main Strategy evaluates pseudo positions from base sets by profitfactor. Selected sets are evaluated
                by last position counts with min PF 0.6. Each configuration combination creates independent sets
                with 250 DB length and 20% threshold rearrange for high-frequency performance.
              </p>
              <p>
                Continuing positions track evaluated positions on specified configuration sets. Block and DCA
                adjustments are stacked with the base pseudo position configurations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
