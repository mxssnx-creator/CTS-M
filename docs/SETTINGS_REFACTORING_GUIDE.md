# Settings Page Refactoring Guide

## Overview
The settings page has been refactored to split the monolithic `page.tsx` file into smaller, more manageable components.

## File Structure

\`\`\`
/components/settings/
├── types.ts                          # Shared TypeScript interfaces
├── utils.ts                          # Utility functions and initial settings
├── tabs/
│   ├── overall-tab.tsx              # Overall configuration tab (COMPLETED)
│   ├── exchange-tab-wrapper.tsx     # Exchange tab wrapper (TODO: Extract content)
│   ├── indication-tab-wrapper.tsx   # Indication tab wrapper (TODO: Extract content)
│   ├── strategy-tab-wrapper.tsx     # Strategy tab wrapper (TODO: Extract content)
│   └── system-tab-wrapper.tsx       # System tab wrapper (TODO: Extract content)
\`\`\`

## What's Been Done

### 1. Created Shared Type Definitions (`types.ts`)
- Extracted the `Settings` interface
- Created `SettingsTabProps` interface for consistent prop passing

### 2. Created Utility Functions (`utils.ts`)
- Moved `EXCHANGE_MAX_POSITIONS` constant
- Moved `initialSettings` constant
- Created reusable functions:
  - `saveSettings(settings: Settings)`
  - `loadSettings(): Promise<Settings | null>`
  - `exportSettingsToFile(settings: Settings)`
  - `importSettingsFromFile(onSuccess: callback)`

### 3. Created Tab Components

#### Completed:
- **OverallTab** (`tabs/overall-tab.tsx`): Fully extracted and functional
  - Contains all sub-tabs: Main, Connection, Monitoring, Install, Backup
  - Manages its own internal state for sub-tab navigation
  - Receives settings and handlers as props

#### Pending (Wrapper components created, content needs extraction):
- **ExchangeTabWrapper**: Placeholder ready for exchange configuration content
- **IndicationTabWrapper**: Placeholder ready for indication settings content
- **StrategyTabWrapper**: Placeholder ready for strategy settings content
- **SystemTabWrapper**: Placeholder ready for system settings content

## How to Use

### In the main `page.tsx`:

\`\`\`typescript
import { OverallTab } from "@/components/settings/tabs/overall-tab"
import { ExchangeTabWrapper } from "@/components/settings/tabs/exchange-tab-wrapper"
// ... other imports

export default function SettingsPage() {
  // ... all state and handlers remain here ...
  
  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="exchange">Exchange</TabsTrigger>
            <TabsTrigger value="indication">Indication</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <OverallTab
            settings={settings}
            handleSettingChange={handleSettingChange}
            addMainSymbol={addMainSymbol}
            removeMainSymbol={removeMainSymbol}
            addForcedSymbol={addForcedSymbol}
            removeForcedSymbol={removeForcedSymbol}
            newMainSymbol={newMainSymbol}
            setNewMainSymbol={setNewMainSymbol}
            newForcedSymbol={newForcedSymbol}
            setNewForcedSymbol={setNewForcedSymbol}
            connections={connections}
            databaseType={databaseType}
            setDatabaseType={setDatabaseType}
            databaseChanged={databaseChanged}
          />

          {/* Other tabs can be wrapped similarly */}
          <ExchangeTabWrapper>
            {/* Current exchange tab content can go here */}
          </ExchangeTabWrapper>
          
          {/* ... other tabs ... */}
        </Tabs>
      </div>
    </AuthGuard>
  )
}
\`\`\`

## Next Steps for Complete Refactoring

### To extract remaining tabs:

1. **Exchange Tab**:
   - Read lines ~2585-3425 from `page.tsx`
   - Create proper `ExchangeTab` component
   - Pass necessary props (selectedExchangeConnection, exchangeSymbols, etc.)

2. **Indication Tab** (largest section):
   - Read lines ~3426-5719 from `page.tsx`
   - Consider breaking into sub-components:
     - `MainIndicationTab`
     - `OptimalIndicationTab`
     - `AutoIndicationTab`
     - `CommonIndicatorsTab`

3. **Strategy Tab**:
   - Read lines ~5720-5965 from `page.tsx`
   - Extract strategy configuration UI

4. **System Tab**:
   - Read lines ~5966-end from `page.tsx`
   - Extract system configuration UI

## Benefits of This Approach

1. **Smaller Files**: Each tab component is focused and manageable
2. **Reusability**: Components can be tested and modified independently
3. **Maintainability**: Easier to find and fix bugs
4. **Performance**: Potential for better code splitting
5. **Type Safety**: Shared types ensure consistency

## Important Notes

- All state management remains in `page.tsx`
- Tab components are presentational - they receive data and callbacks via props
- Sub-tabs manage their own internal navigation state
- The main `page.tsx` still orchestrates all tabs and handles saving/loading
