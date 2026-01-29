#!/bin/bash
set -e

echo "Running link validation and removing broken links..."

# Run mdox and capture output
output=$(mdox fmt --links.validate --links.validate.config-file=.mdoxlintrc.yaml --check $(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*") 2>&1 || true)

# Parse broken HTTP/HTTPS links and remove them
echo "$output" | grep -E '"https?://[^"]*" not accessible' | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    url=$(echo "$line" | grep -oP '"https?://[^"]*"' | tr -d '"')
    
    if [ -f "$file" ] && [ -n "$url" ]; then
        echo "Removing broken link: $url from $file"
        # Escape special characters for sed
        escaped_url=$(echo "$url" | sed 's/[&/\]/\\&/g')
        # Remove the link but keep the text if it's a markdown link [text](url)
        sed -i -E "s|\[([^\]]*)\]\($escaped_url\)|\1|g" "$file"
        # Remove plain URLs
        sed -i "s|$escaped_url||g" "$file"
    fi
done

echo "Broken link removal complete"
