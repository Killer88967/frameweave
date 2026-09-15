#!/usr/bin/env bash

set -euo pipefail

echo "Installing the latest pnpm..."
npm install --global pnpm@latest

echo "Installing VS Code extension development tools..."
npm install --global @vscode/vsce@latest yo generator-code

if ! command -v oh-my-posh >/dev/null 2>&1; then
  echo "Installing Oh My Posh..."
  curl -s https://ohmyposh.dev/install.sh | bash -s -- -d "$HOME/.local/bin"
fi

if ! grep -q "oh-my-posh init zsh" "$HOME/.zshrc"; then
  {
    echo
    echo 'export PATH="$HOME/.local/bin:$PATH"'
    echo 'eval "$(oh-my-posh init zsh)"'
  } >>"$HOME/.zshrc"
fi

if [ -f "package.json" ]; then
  echo "Installing project dependencies..."
  pnpm install
fi

echo
echo "Frameweave development environment is ready."
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
