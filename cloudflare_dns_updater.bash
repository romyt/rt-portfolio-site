#!/bin/bash

# Cloudflare API details
ZONE_ID="55210a87b48d55bf5ddeb48f7a613b84"
API_TOKEN="GqXh9vIGP2lJOhVa6kya8uCbH6uGdkJ_if81kBFo"
DOMAIN="tohouri.com"  # The record to update (e.g., subdomain.example.com)
DATE=$(date "+%A, %B %d, %Y %H:%M:%S")

# Get current public IP (IPv4)
NEW_IP=$(curl -s https://api.ipify.org || dig +short myip.opendns.com @resolver1.opendns.com)

# Fetch all DNS records for the domain
DNS_RECORDS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$DOMAIN" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json")

# Extract record IDs and types
RECORD_IDS=$(echo "$DNS_RECORDS" | jq -r '.result[] | select(.type != "MX") | .id')
RECORD_TYPES=$(echo "$DNS_RECORDS" | jq -r '.result[] | select(.type != "MX") | .type')

# Loop through each non-MX record and update if it's an A or AAAA record
for RECORD_ID in $RECORD_IDS; do
    RECORD_TYPE=$(echo "$DNS_RECORDS" | jq -r --arg id "$RECORD_ID" '.result[] | select(.id == $id) | .type')
    RECORD_NAME=$(echo "$DNS_RECORDS" | jq -r --arg id "$RECORD_ID" '.result[] | select(.id == $id) | .name')
    
    # Skip records for tohouri.com and www.tohouri.com
    if [[ "$RECORD_NAME" == "tohouri.com" || "$RECORD_NAME" == "www.tohouri.com" ]]; then
        echo "[-] - $DATE - Skipping $RECORD_TYPE record for $RECORD_NAME (excluded domain)"
        continue
    fi
    
    if [[ "$RECORD_TYPE" == "A" || "$RECORD_TYPE" == "AAAA" ]]; then
        CURRENT_IP=$(echo "$DNS_RECORDS" | jq -r --arg id "$RECORD_ID" '.result[] | select(.id == $id) | .content')
        
        if [ "$NEW_IP" != "$CURRENT_IP" ]; then
            curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$RECORD_TYPE\",\"name\":\"$DOMAIN\",\"content\":\"$NEW_IP\",\"ttl\":120,\"proxied\":false}"
            echo "[+] - $DATE - Updated $RECORD_TYPE record for $DOMAIN to $NEW_IP"
        else
            echo "[-] - $DATE - $RECORD_TYPE record for $DOMAIN is already $NEW_IP"
        fi
    fi
done