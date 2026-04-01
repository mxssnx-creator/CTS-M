# Backup Files Directory

This directory contains backup copies of important files for recovery purposes.

## File Naming Convention

All backup files use the `.tmp` extension to prevent them from being compiled during the build process.

## Current Backups

- **trade-engine_backup_v3.1.ts.tmp** - Backup of original ContinuousTradeEngine before refactoring to GlobalTradeEngineCoordinator
- **settings-page_backup_v1.tsx.tmp** - Original settings page backup
- **settings-page_backup_v2.tsx.tmp** - Settings page backup version 2
- **settings-page_complete_backup.tsx.tmp** - Complete settings page backup
- **settings-page-backup-v3.tsx.tmp** - Settings page backup version 3
- **database-backup-v3.ts.tmp** - Database schema backup version 3

## Recovery Instructions

To recover from a backup:
1. Copy the `.tmp` file
2. Remove the `.tmp` extension
3. Move to the appropriate location in the project
4. Review and test thoroughly before deploying

## Important Notes

- These files are NOT compiled during build
- Keep backups organized with version numbers
- Document significant changes in this README
- Never delete backups without confirmation
