#!/usr/bin/env bash

set -euo pipefail

echo "Installing the latest pnpm..."
npm install --global pnpm@latest --allow-scripts=pnpm

echo "Configuring pnpm for Zsh..."
export PNPM_HOME="$HOME/.local/share/pnpm"
mkdir -p "$PNPM_HOME/bin"

if ! grep -Fqx 'export PNPM_HOME="$HOME/.local/share/pnpm"' "$HOME/.zshrc"; then
  echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> "$HOME/.zshrc"
fi

if ! grep -Fqx 'export PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"' "$HOME/.zshrc"; then
  echo 'export PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"' >> "$HOME/.zshrc"
fi

export PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"

echo "Installing VS Code extension development tools..."
npm install --global @vscode/vsce@latest yo generator-code --allow-scripts=yo,@vscode/vsce-sign

echo "Configuring Oh My Posh..."
mkdir -p "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"

if ! command -v oh-my-posh >/dev/null 2>&1; then
  echo "Installing Oh My Posh..."
  curl -fsSL https://ohmyposh.dev/install.sh | bash -s -- -d "$HOME/.local/bin"
fi

if ! grep -Fq 'oh-my-posh init zsh' "$HOME/.zshrc"; then
  {
    echo
    echo 'export PATH="$HOME/.local/bin:$PATH"'
    echo 'eval "$(oh-my-posh init zsh)"'
  } >> "$HOME/.zshrc"
fi

if [ -f "package.json" ]; then
  echo "Installing project dependencies..."
  pnpm install
fi

echo
echo "Frameweave development environment is ready."
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "pnpm global bin: $(pnpm config get global-bin-dir)"
