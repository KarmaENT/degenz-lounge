# GitHub Codespaces Deployment Tutorial for DeGeNz Lounge

This tutorial provides step-by-step instructions for deploying the DeGeNz Lounge AI Agent Builder & Library using GitHub Codespaces.

## What is GitHub Codespaces?

GitHub Codespaces is a cloud-based development environment that allows you to develop entirely in the cloud. It provides a complete development environment including VS Code, terminal access, and customizable container configurations.

## Prerequisites

- A GitHub account
- A fork or clone of the DeGeNz Lounge repository in your GitHub account
- Basic familiarity with Git and GitHub

## Step 1: Open the Repository in GitHub Codespaces

1. Navigate to your fork of the DeGeNz Lounge repository on GitHub.
2. Click on the "Code" button (green button).
3. Select the "Codespaces" tab.
4. Click on "Create codespace on main" to create a new codespace.

![Create Codespace](../assets/codespaces-create.png)

GitHub will now create a new codespace for you. This may take a few minutes as it sets up the development environment.

## Step 2: Wait for the Codespace to Initialize

Once your codespace is created, it will automatically run the setup script (`setup-codespace.sh`) which:

1. Installs all frontend dependencies
2. Installs all backend dependencies
3. Creates necessary environment files
4. Makes deployment scripts executable

You can monitor the progress in the terminal window at the bottom of the screen.

## Step 3: Configure Environment Variables

Before running the application, you need to configure your environment variables:

1. In the Explorer sidebar, locate the `.env` file at the root of the project.
2. Update the following variables with your actual credentials:

```
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/degenz_lounge
REDIS_URL=redis://:your_password@redis:6379/0
JWT_SECRET=your_jwt_secret
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
GEMINI_API_KEY=your_gemini_api_key
```

## Step 4: Deploy the Application

Run the deployment script to start the application:

1. Open a terminal in VS Code (Terminal > New Terminal).
2. Run the deployment script:

```bash
chmod +x ./deployment/deploy-codespaces.sh
./deployment/deploy-codespaces.sh
```

This script will:
- Verify you're running in a GitHub Codespaces environment
- Set up the devcontainer configuration if needed
- Install dependencies if they haven't been installed
- Start the backend server
- Start the frontend server

## Step 5: Access the Application

Once the deployment is complete, you can access the application using the URLs provided in the terminal output:

- Frontend: `https://your-codespace-name-3000.github.dev`
- Backend API: `https://your-codespace-name-8000.github.dev`

GitHub Codespaces automatically handles port forwarding and provides secure URLs for accessing your application.

## Step 6: Development Workflow

You can now develop and test the application directly in the codespace:

1. Make changes to the code using the VS Code editor.
2. The application uses hot-reloading, so most changes will be reflected immediately.
3. For backend changes, the server will automatically restart.
4. For frontend changes, the page will automatically refresh.

## Step 7: Stopping the Application

To stop the application:

1. Note the process IDs (PIDs) provided in the terminal output when you ran the deployment script.
2. Run the following command to stop the servers:

```bash
kill PID1 PID2
```

Replace `PID1` and `PID2` with the actual process IDs.

## Step 8: Viewing Logs

To view the application logs:

```bash
# For backend logs
cat backend.log

# For frontend logs
cat frontend.log
```

## Troubleshooting

### Issue: Ports are not forwarded automatically

Solution: Manually forward the ports:
1. Click on the "Ports" tab in the bottom panel.
2. Click "Add Port" and add ports 3000 and 8000.

### Issue: Dependencies are not installed correctly

Solution: Manually install the dependencies:
```bash
# For frontend
cd frontend
npm install

# For backend
cd backend
pip install -r requirements.txt
```

### Issue: Application doesn't start

Solution: Check the logs for errors:
```bash
cat backend.log
cat frontend.log
```

## Next Steps

- Explore the DeGeNz Lounge application
- Create your first AI agent
- Set up a multi-agent sandbox
- List an agent on the marketplace

For more information, refer to the [DeGeNz Lounge documentation](../README.md).
