#!/usr/bin/env bash

set -euo pipefail

echo "Installing the latest pnpm..."
npm install --global pnpm@latest --allow-scripts=pnpm

echo "Configuring pnpm for Zsh..."
export PNPM_HOME="$HOME/.local/share/pnpm"
mkdir -p "$PNPM_HOME"
touch "$HOME/.zshrc"

if ! grep -Fqx 'export PNPM_HOME="$HOME/.local/share/pnpm"' "$HOME/.zshrc"; then
  echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> "$HOME/.zshrc"
fi

if ! grep -Fqx 'export PATH="$PNPM_HOME:$PATH"' "$HOME/.zshrc"; then
  echo 'export PATH="$PNPM_HOME:$PATH"' >> "$HOME/.zshrc"
fi

export PATH="$PNPM_HOME:$PATH"

echo "Removing any previous Oh My Posh initialization..."
sed -i '/oh-my-posh init zsh/d' "$HOME/.zshrc"

if ! grep -Fq '# >>> Frameweave simple Zsh prompt >>>' "$HOME/.zshrc"; then
  cat >> "$HOME/.zshrc" <<'ZSH_PROMPT'

# >>> Frameweave simple Zsh prompt >>>
# Compatible with monospace fonts in VS Code Web and Safari.
setopt PROMPT_SUBST

frameweave_git_branch() {
  local branch
  branch="$(git branch --show-current 2>/dev/null)" || return
  [[ -n "$branch" ]] && printf ' (%s)' "$branch"
}

PROMPT='%(?..[exit %?] )%n %~$(frameweave_git_branch) %# '
# <<< Frameweave simple Zsh prompt <<<
ZSH_PROMPT
fi

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
