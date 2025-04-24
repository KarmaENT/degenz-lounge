# Streamlit Deployment Tutorial for DeGeNz Lounge

This tutorial provides step-by-step instructions for deploying the DeGeNz Lounge AI Agent Builder & Library using Streamlit.

## What is Streamlit?

Streamlit is an open-source Python library that makes it easy to create and share custom web apps for machine learning and data science. In this deployment, we use Streamlit to create a simplified interface for the DeGeNz Lounge platform.

## Prerequisites

- Docker installed on your system
- Basic familiarity with command line operations
- The DeGeNz Lounge repository cloned to your local machine

## Step 1: Clone the Repository (if you haven't already)

```bash
git clone https://github.com/yourusername/degenz-lounge.git
cd degenz-lounge
```

## Step 2: Configure Environment Variables

Before deploying the Streamlit application, you need to configure the environment variables:

1. Navigate to the Streamlit deployment directory:
   ```bash
   cd deployment/streamlit
   ```

2. Create a `.env` file (or edit the existing one):
   ```bash
   nano .env
   ```

3. Add the following configuration (update with your actual values):
   ```
   API_URL=http://backend:8000/api
   STREAMLIT_SERVER_PORT=8501
   STREAMLIT_SERVER_HEADLESS=true
   STREAMLIT_SERVER_ENABLE_CORS=true
   ```

   Note: If you're running the backend separately, update the `API_URL` to point to your backend server.

## Step 3: Deploy the Streamlit Application

You can deploy the Streamlit application using the provided deployment script:

1. Make the script executable:
   ```bash
   chmod +x ./deployment/deploy-streamlit.sh
   ```

2. Run the deployment script:
   ```bash
   ./deployment/deploy-streamlit.sh
   ```

This script will:
- Build a Docker image for the Streamlit application
- Run a Docker container with the appropriate environment variables
- Verify that the container is running correctly

## Step 4: Access the Streamlit Interface

Once the deployment is complete, you can access the Streamlit interface at:

```
http://localhost:8501
```

The Streamlit interface provides a simplified way to interact with the DeGeNz Lounge platform, including:
- Creating and managing AI agents
- Working with prompts
- Using the multi-agent sandbox
- Accessing the marketplace

## Step 5: Connecting to the Backend API

The Streamlit interface is designed to work with the DeGeNz Lounge backend API. To use the full functionality:

1. Make sure the backend API is running (either locally or on a server)
2. Update the `API_URL` in the `.env` file to point to your backend API
3. Restart the Streamlit container:
   ```bash
   docker stop degenz-lounge-streamlit
   ./deployment/deploy-streamlit.sh
   ```

## Step 6: Stopping the Streamlit Application

To stop the Streamlit application:

```bash
docker stop degenz-lounge-streamlit
```

To remove the container completely:

```bash
docker rm degenz-lounge-streamlit
```

## Step 7: Viewing Logs

To view the Streamlit application logs:

```bash
docker logs degenz-lounge-streamlit
```

To follow the logs in real-time:

```bash
docker logs -f degenz-lounge-streamlit
```

## Deploying to Streamlit Cloud

You can also deploy the Streamlit application to Streamlit Cloud for public access:

1. Create an account on [Streamlit Cloud](https://streamlit.io/cloud)
2. Connect your GitHub repository
3. Point to the `deployment/streamlit/app.py` file
4. Configure the necessary secrets in the Streamlit Cloud dashboard (equivalent to the `.env` file)
5. Deploy the application

## Customizing the Streamlit Interface

You can customize the Streamlit interface by modifying the following files:

- `deployment/streamlit/app.py`: Main Streamlit application
- `deployment/streamlit/utils/*.py`: Utility functions for API interactions
- `deployment/streamlit/assets/`: Images and other static assets

After making changes, rebuild and restart the container:

```bash
docker stop degenz-lounge-streamlit
docker rm degenz-lounge-streamlit
./deployment/deploy-streamlit.sh
```

## Troubleshooting

### Issue: Container fails to start

Solution: Check the Docker logs for errors:
```bash
docker logs degenz-lounge-streamlit
```

### Issue: Cannot connect to the backend API

Solution: 
1. Verify that the backend API is running
2. Check that the `API_URL` in the `.env` file is correct
3. Ensure that the backend API is accessible from the Streamlit container

### Issue: Streamlit interface loads but features don't work

Solution:
1. Check the browser console for JavaScript errors
2. Verify that the API endpoints are responding correctly
3. Check the Streamlit logs for Python errors

## Next Steps

- Explore the DeGeNz Lounge application through the Streamlit interface
- Create your first AI agent
- Set up a multi-agent sandbox
- List an agent on the marketplace

For more information, refer to the [DeGeNz Lounge documentation](../README.md).
