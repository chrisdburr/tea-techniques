#!/bin/bash
# update-nginx.sh - Update Nginx configuration and restart

echo "Updating Nginx configuration for handling API requests..."
echo "======================================================"

# Make the script executable
chmod +x $0

# Make sure we're running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Backup existing configuration
echo "1. Backing up existing Nginx configuration..."
if [ -f /etc/nginx/conf.d/tea-techniques.conf ]; then
  cp /etc/nginx/conf.d/tea-techniques.conf /etc/nginx/conf.d/tea-techniques.conf.bak
  echo "   Backup created: /etc/nginx/conf.d/tea-techniques.conf.bak"
fi

# Copy the updated configuration to the correct location
echo "2. Copying new Nginx configuration..."
cp tea-techniques.conf /etc/nginx/conf.d/tea-techniques.conf
echo "   Configuration copied to /etc/nginx/conf.d/tea-techniques.conf"

# Test the Nginx configuration
echo "3. Testing Nginx configuration..."
nginx -t 2>&1 | tee /tmp/nginx-test-output.txt
if [ $? -ne 0 ]; then
  echo "❌ Nginx configuration test failed"
  echo "   Error output:"
  cat /tmp/nginx-test-output.txt
  if [ -f /etc/nginx/conf.d/tea-techniques.conf.bak ]; then
    echo "   Restoring backup configuration..."
    cp /etc/nginx/conf.d/tea-techniques.conf.bak /etc/nginx/conf.d/tea-techniques.conf
    echo "   Backup restored. Please fix the configuration errors."
  fi
  exit 1
fi
echo "   ✅ Nginx configuration test passed"

# Restart Nginx to apply changes
echo "4. Restarting Nginx service..."
systemctl restart nginx
if [ $? -ne 0 ]; then
  echo "❌ Failed to restart Nginx"
  echo "   Please check the Nginx error logs with: sudo journalctl -u nginx"
  exit 1
fi
echo "   ✅ Nginx restarted successfully"

# Verify Nginx is running
echo "5. Verifying Nginx is running..."
systemctl is-active --quiet nginx
if [ $? -ne 0 ]; then
  echo "❌ Nginx is not running"
  echo "   Please check the Nginx error logs with: sudo journalctl -u nginx"
  exit 1
fi
echo "   ✅ Nginx is running properly"

# Show Nginx status
systemctl status nginx --no-pager | grep -E "Active:|Main|Tasks"

echo ""
echo "Configuration updated successfully!"
echo "===================================="
echo "Your application should now correctly handle API requests."
echo ""
echo "To test the API directly, try:"
echo "curl -v https://arch-webserver.tailb4d95.ts.net/api/"
echo ""
echo "To test the frontend with API integration:"
echo "Visit https://arch-webserver.tailb4d95.ts.net/techniques/"
echo ""
echo "For debugging, check the Nginx logs:"
echo "sudo tail -f /var/log/nginx/tea-techniques-error.log"
echo "sudo tail -f /var/log/nginx/tea-techniques-access.log"