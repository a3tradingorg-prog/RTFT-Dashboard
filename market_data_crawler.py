import requests
from bs4 import BeautifulSoup
import json
import sys
import os

def crawl_forex_factory():
    url = "https://www.forexfactory.com/calendar"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        events = []
        
        # This is a simplified version of the crawler logic
        # In a real scenario, you'd parse the specific table rows
        calendar_rows = soup.select('.calendar__row')
        for row in calendar_rows:
            event_name = row.select_one('.calendar__event-title')
            if event_name:
                events.append({
                    "event": event_name.get_text(strip=True),
                    "impact": "High" if "high" in str(row) else "Medium" if "medium" in str(row) else "Low",
                    "time": row.select_one('.calendar__time').get_text(strip=True) if row.select_one('.calendar__time') else ""
                })
        
        return {
            "status": "success",
            "data": events[:20] # Limit to top 20 events
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    result = crawl_forex_factory()
    print(json.dumps(result))
