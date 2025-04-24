FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY streamlit/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Streamlit app and necessary files
COPY streamlit/app.py .
COPY streamlit/utils/ ./utils/
COPY streamlit/assets/ ./assets/

# Expose port for Streamlit
EXPOSE 8501

# Command to run the Streamlit app
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0", "--server.port=8501"]
