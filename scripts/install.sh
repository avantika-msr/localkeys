#!/bin/bash
set -e

# LocalKeys Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/localkeys/localkeys/main/scripts/install.sh | bash

INSTALL_DIR="/usr/local/bin"
REPO="localkeys/localkeys"
BINARY_NAME="localkeys"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Installing LocalKeys...${NC}"

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    if [ "$ARCH" = "arm64" ]; then
      BINARY_FILE="localkeys-macos-arm64"
      echo -e "${YELLOW}Detected: macOS Apple Silicon${NC}"
    else
      BINARY_FILE="localkeys-macos-x64"
      echo -e "${YELLOW}Detected: macOS Intel${NC}"
    fi
    ;;
  Linux)
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
      BINARY_FILE="localkeys-linux-arm64"
      echo -e "${YELLOW}Detected: Linux ARM64${NC}"
    else
      BINARY_FILE="localkeys-linux-x64"
      echo -e "${YELLOW}Detected: Linux x64${NC}"
    fi
    ;;
  *)
    echo -e "${RED}❌ Unsupported OS: $OS${NC}"
    echo -e "${YELLOW}Please download manually from: https://github.com/$REPO/releases${NC}"
    exit 1
    ;;
esac

# Get latest release version
echo -e "${BLUE}🔍 Finding latest release...${NC}"
if command -v curl >/dev/null 2>&1; then
  LATEST_VERSION=$(curl -s https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
elif command -v wget >/dev/null 2>&1; then
  LATEST_VERSION=$(wget -qO- https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
else
  echo -e "${RED}❌ Neither curl nor wget found. Please install one of them.${NC}"
  exit 1
fi

if [ -z "$LATEST_VERSION" ]; then
  echo -e "${YELLOW}⚠️  Could not fetch latest version. Using v0.1.0${NC}"
  LATEST_VERSION="v0.1.0"
fi

echo -e "${GREEN}Latest version: $LATEST_VERSION${NC}"

# Download binary
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_VERSION/$BINARY_FILE"
TEMP_FILE="/tmp/$BINARY_NAME"

echo -e "${BLUE}📥 Downloading $BINARY_FILE...${NC}"
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_FILE"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$DOWNLOAD_URL" -O "$TEMP_FILE"
fi

# Check if download was successful
if [ ! -f "$TEMP_FILE" ]; then
  echo -e "${RED}❌ Download failed${NC}"
  exit 1
fi

# Make executable
chmod +x "$TEMP_FILE"

# Test the binary
echo -e "${BLUE}🔧 Testing binary...${NC}"
if "$TEMP_FILE" --version >/dev/null 2>&1 || "$TEMP_FILE" -V >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Binary test passed${NC}"
else
  echo -e "${RED}❌ Binary test failed${NC}"
  rm -f "$TEMP_FILE"
  exit 1
fi

# Install binary
echo -e "${BLUE}📝 Installing to $INSTALL_DIR...${NC}"

# Check if we have write permissions
if [ -w "$INSTALL_DIR" ]; then
  mv "$TEMP_FILE" "$INSTALL_DIR/$BINARY_NAME"
else
  # Need sudo
  echo -e "${YELLOW}🔐 Administrator privileges required for installation...${NC}"
  sudo mv "$TEMP_FILE" "$INSTALL_DIR/$BINARY_NAME"
fi

# Verify installation
if [ -f "$INSTALL_DIR/$BINARY_NAME" ]; then
  echo -e "${GREEN}✅ LocalKeys installed successfully!${NC}"
else
  echo -e "${RED}❌ Installation failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🎉 Installation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run: ${GREEN}localkeys status${NC}"
echo -e "  2. Initialize in your project: ${GREEN}cd my-project && localkeys init${NC}"
echo -e "  3. Start storing secrets: ${GREEN}localkeys set API_KEY your-secret${NC}"
echo ""
echo -e "${BLUE}For more information:${NC}"
echo -e "  • Documentation: ${GREEN}localkeys --help${NC}"
echo -e "  • GitHub: ${GREEN}https://github.com/$REPO${NC}"
echo ""