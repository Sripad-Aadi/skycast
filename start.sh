# start.sh
#!/usr/bin/env bash
# Navigate to the backend directory
cd backend
# Run the Flask app using Gunicorn
gunicorn app:app