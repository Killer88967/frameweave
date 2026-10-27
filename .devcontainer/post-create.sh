#!/usr/bin/env bash

set -euo pipefail

echo "Installing the latest pnpm..."
npm install --global pnpm@latest --allow-scripts=pnpm

echo "Configuring pnpm for Zsh..."
export PNPM_HOME="$HOME/.local/share/pnpm"
mkdir -p "$PNPM_HOME"

if ! grep -Fqx 'export PNPM_HOME="$HOME/.local/share/pnpm"' "$HOME/.zshrc"; then
  echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> "$HOME/.zshrc"
fi

if ! grep -Fqx 'export PATH="$PNPM_HOME:$PATH"' "$HOME/.zshrc"; then
  echo 'export PATH="$PNPM_HOME:$PATH"' >> "$HOME/.zshrc"
fi

export PATH="$PNPM_HOME:$PATH"

echo "Installing VS Code extension development tools..."
npm install --global @vscode/vsce@latest yo generator-code --allow-scripts=yo,@vscode/vsce-sign

if [ -f "package.json" ]; then
  echo "Installing project dependencies..."
  pnpm install
fi

echo
echo "Frameweave development environment is ready."
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "pnpm global bin: $(pnpm config get global-bin-dir)"
