# CTS v3.1 Project Protection Policy

**Version:** v343 (Locked)
**Last Updated:** 2025-12-11
**Status:** PROTECTED - Core System

## Core Protection Rules

### 1. Main Project Pages (PROTECTED - DO NOT REPLACE)

The following pages constitute the core CTS v3.1 Trading System and must NEVER be replaced without explicit authorization:

#### Primary Navigation Pages:
- `/` - Overview/Dashboard
- `/live-trading` - Live Trading Interface
- `/presets` - Preset Management
- `/indications` - Indication Configuration
- `/strategies` - Strategy Management
- `/statistics` - Statistical Analysis
- `/analysis` - Position Analysis
- `/structure` - System Structure
- `/logistics` - Logistics Management
- `/monitoring` - System Monitoring
- `/settings` - System Settings

#### Protected Components:
- `components/app-sidebar.tsx` - Main Navigation
- `app/layout.tsx` - Root Layout
- All API routes under `/app/api/`
- All library files under `/lib/`
- Database schemas and migrations

### 2. Additional Features Policy

New features, experimental pages, or individual sites must be added under the **"Additional"** menu section without affecting the main project.

#### How to Add New Features:

1. **Create new pages under `/app/additional/`**
   \`\`\`
   app/
   └── additional/
       ├── feature-name/
       │   └── page.tsx
       └── experimental/
           └── page.tsx
   \`\`\`

2. **Add to "Additional" sidebar section**
   - Update `components/app-sidebar.tsx`
   - Add items to the `additionalItems` array
   - Keep separate from main `menuItems`

3. **Use independent routes**
   - `/additional/*` prefix for all new features
   - Avoid conflicts with core routes

### 3. Version Control Requirements

- **Backup before major changes**: Always create backups before significant modifications
- **Document changes**: Update this file with any additions to the Additional menu
- **Test isolation**: Ensure new features don't break core functionality
- **Database separation**: Use separate tables/collections for experimental features

### 4. Deployment Protection

The following must remain functional in all deployments:

✅ Dashboard displays system overview
✅ All 11 main navigation items accessible
✅ Trade engines can start/stop
✅ Settings can be modified and saved
✅ Database connections work
✅ Authentication system operational

### 5. Additional Menu Items (Current)

Items currently in the Additional section:
- (None yet - add new features here)

### 6. Emergency Rollback

If core functionality breaks:
1. Check v343 as the last known working version
2. Restore from backup via Settings → System → Backup/Restore
3. Review changes in Additional section
4. Remove problematic additions

### 7. Code Modification Guidelines

**Allowed Actions:**
- ✅ Add new pages under `/app/additional/`
- ✅ Create new components under `/components/additional/`
- ✅ Add new API routes under `/app/api/additional/`
- ✅ Extend functionality with backward compatibility
- ✅ Fix bugs in existing features
- ✅ Optimize performance without breaking changes

**Prohibited Actions:**
- ❌ Delete or replace main navigation pages
- ❌ Remove core API endpoints
- ❌ Modify database schema without migration
- ❌ Change core library functions without testing
- ❌ Override main layout without preserving functionality
- ❌ Break existing component interfaces

### 8. Review Checklist

Before deploying changes, verify:

- [ ] All main navigation items still work
- [ ] Dashboard loads without errors
- [ ] Settings page accessible and functional
- [ ] Trade engines can be controlled
- [ ] No console errors on main pages
- [ ] Authentication still works
- [ ] Database connections maintained
- [ ] New features isolated in Additional section

## Enforcement

This policy ensures system stability and allows for innovation without risking core functionality. All developers and AI assistants must follow these rules when modifying the CTS v3.1 codebase.

**Version Lock:** v343 is the baseline protected version. Any changes must maintain compatibility with this version's core functionality.
