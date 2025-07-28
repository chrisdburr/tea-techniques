#!/bin/bash

# Optimize hero.jpg
echo "Optimizing hero.jpg..."

# Get original size
original_size=$(ls -lh public/hero.jpg | awk '{print $5}')
echo "Original size: $original_size"

# Create optimized version
# -resize 1600x\> : resize only if larger than 1600px wide
# -quality 85 : JPEG quality 85%
# -sampling-factor 4:2:0 : Chroma subsampling
# -strip : Remove metadata
# -interlace Plane : Progressive JPEG
magick public/hero.jpg \
  -resize "1600x>" \
  -quality 85 \
  -sampling-factor 4:2:0 \
  -strip \
  -interlace Plane \
  public/hero-optimized.jpg

# Replace original with optimized
mv public/hero-optimized.jpg public/hero.jpg

# Get new size
new_size=$(ls -lh public/hero.jpg | awk '{print $5}')
echo "Optimized size: $new_size"
echo "✅ Successfully optimized hero.jpg"