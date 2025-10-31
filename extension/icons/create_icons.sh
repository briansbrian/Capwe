#!/bin/bash

# Create simple placeholder icons using ImageMagick or just use base64 encoded data URLs
# For now, we'll create simple colored squares with text

for size in 16 48 128; do
  convert -size ${size}x${size} xc:#4285F4 \
    -gravity center \
    -pointsize $((size / 3)) \
    -fill white \
    -annotate +0+0 "C" \
    icon${size}.png 2>/dev/null || echo "ImageMagick not available, will use base64"
done
