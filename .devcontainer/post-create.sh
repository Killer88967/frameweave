#!/usr/bin/env bash

set -euo pipefail

WORKSPACE_DIR="$(pwd)"
THEME_FILE="$WORKSPACE_DIR/.devcontainer/frameweave.omp.json"
PNPM_HOME="$HOME/.local/share/pnpm"
LOCAL_BIN="$HOME/.local/bin"
ZSH_CONFIG_DIR="$HOME/.config/frameweave"
ZSH_INIT_FILE="$ZSH_CONFIG_DIR/zsh-init.zsh"
ZSHRC="$HOME/.zshrc"

if [ ! -f "$THEME_FILE" ]; then
  echo "Error: Oh My Posh theme not found: $THEME_FILE" >&2
  echo "Create .devcontainer/frameweave.omp.json before continuing." >&2
  exit 1
fi

echo "Installing the latest Oh My Posh..."
mkdir -p "$LOCAL_BIN"
curl -fsSL https://ohmyposh.dev/install.sh |
  bash -s -- -d "$LOCAL_BIN"

echo "Installing the latest pnpm..."
npm install --global pnpm@latest --allow-scripts=pnpm

echo "Configuring pnpm and Oh My Posh for Zsh..."
mkdir -p "$PNPM_HOME" "$LOCAL_BIN" "$ZSH_CONFIG_DIR"

if ! grep -Fqx 'export PNPM_HOME="$HOME/.local/share/pnpm"' "$ZSHRC"; then
  printf '%s\n' 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> "$ZSHRC"
fi

if ! grep -Fqx 'export PATH="$HOME/.local/bin:$PNPM_HOME:$PATH"' "$ZSHRC"; then
  printf '%s\n' 'export PATH="$HOME/.local/bin:$PNPM_HOME:$PATH"' >> "$ZSHRC"
fi

# Generate a Zsh configuration that points to this workspace's theme.
{
  printf "export FRAMEWEAVE_THEME='%s'\n" "$THEME_FILE"

  cat <<'ZSH_CONFIG'
autoload -Uz add-zsh-hook

frameweave_detect_package_manager() {
  local dir="$PWD"

  export FRAMEWEAVE_PM=""

  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/pnpm-lock.yaml" ]]; then
      export FRAMEWEAVE_PM="pnpm"
      return
    elif [[ -f "$dir/bun.lock" || -f "$dir/bun.lockb" ]]; then
      export FRAMEWEAVE_PM="bun"
      return
    elif [[ -f "$dir/yarn.lock" ]]; then
      export FRAMEWEAVE_PM="yarn"
      return
    elif [[ -f "$dir/package-lock.json" || -f "$dir/npm-shrinkwrap.json" ]]; then
      export FRAMEWEAVE_PM="npm"
      return
    elif [[ -f "$dir/deno.lock" ]]; then
      export FRAMEWEAVE_PM="deno"
      return
    fi

    dir="${dir:h}"
  done
}

# Refresh the detected manager as the working directory changes.
add-zsh-hook precmd frameweave_detect_package_manager
frameweave_detect_package_manager

# Load the repository-local theme when Oh My Posh is installed.
if command -v oh-my-posh >/dev/null 2>&1 &&
  [[ -f "$FRAMEWEAVE_THEME" ]]; then
  eval "$(oh-my-posh init zsh --config "$FRAMEWEAVE_THEME")"
fi
ZSH_CONFIG
} > "$ZSH_INIT_FILE"

# Add one source line to .zshrc without duplicating it on rebuilds.
SOURCE_LINE='source "$HOME/.config/frameweave/zsh-init.zsh"'

if ! grep -Fqx "$SOURCE_LINE" "$ZSHRC"; then
  printf '\n%s\n' "$SOURCE_LINE" >> "$ZSHRC"
fi

export PATH="$LOCAL_BIN:$PNPM_HOME:$PATH"

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
echo "Oh My Posh: $(oh-my-posh version)"
echo "Theme: $THEME_FILE"
