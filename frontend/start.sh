#!/usr/bin/env bash
# Start the Next.js frontend (webpack, WSL-safe).
#
# Why this exists:
#   Turbopack refuses to follow cross-filesystem symlinks (Windows FS → Linux FS).
#   We run Next.js from the Linux-native ~/customerai/frontend/ directory where
#   node_modules is installed natively, and use --webpack which follows symlinks.
#
# Any new source file/directory you add under the Windows-path frontend/ needs
# a corresponding symlink in the Linux-native directory. This script handles that
# automatically for the standard source dirs (app/, components/, lib/, public/).

set -e

WIN="/mnt/c/Users/sephy/OneDrive/Documents/GitHub/customerai/frontend"
LINUX="/home/sephy/customerai/frontend"

# Sync file-level symlinks for each source directory
for dir in app components lib public; do
  mkdir -p "$LINUX/$dir"
  for f in "$WIN/$dir"/*; do
    [ -e "$f" ] || continue          # skip if glob matched nothing
    fname=$(basename "$f")
    ln -sfn "$f" "$LINUX/$dir/$fname"
  done
done

# Sync top-level config symlinks
for cfg in next.config.ts tsconfig.json postcss.config.mjs next-env.d.ts; do
  ln -sfn "$WIN/$cfg" "$LINUX/$cfg" 2>/dev/null || true
done

cd "$LINUX"
exec /home/sephy/customerai/frontend/node_modules/.bin/next dev --webpack
