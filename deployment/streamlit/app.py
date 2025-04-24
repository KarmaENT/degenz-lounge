import streamlit as st
import requests
import json
import os
from utils.auth import login, register, check_auth
from utils.agents import list_agents, create_agent, view_agent
from utils.prompts import list_prompts, create_prompt, view_prompt
from utils.sandbox import list_sessions, create_session, view_session
from utils.marketplace import list_marketplace_items, view_item, purchase_item

# Set page configuration
st.set_page_config(
    page_title="DeGeNz Lounge",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main {
        background-color: #111827;
        color: white;
    }
    .stButton button {
        background-color: #0EA5E9;
        color: white;
    }
    .stTextInput input, .stTextArea textarea {
        background-color: #1F2937;
        color: white;
        border: 1px solid #374151;
    }
    .sidebar .sidebar-content {
        background-color: #1F2937;
    }
    h1, h2, h3 {
        color: #0EA5E9;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user' not in st.session_state:
    st.session_state.user = None
if 'page' not in st.session_state:
    st.session_state.page = 'login'
if 'token' not in st.session_state:
    st.session_state.token = None

# Authentication pages
def show_login_page():
    st.title("DeGeNz Lounge")
    st.subheader("Login")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        
        if st.button("Login"):
            result = login(email, password)
            if result['success']:
                st.session_state.authenticated = True
                st.session_state.user = result['user']
                st.session_state.token = result['token']
                st.session_state.page = 'dashboard'
                st.experimental_rerun()
            else:
                st.error(result['message'])
        
        if st.button("Register Instead"):
            st.session_state.page = 'register'
            st.experimental_rerun()
    
    with col2:
        st.image("assets/logo.png", width=300)
        st.markdown("""
        Welcome to DeGeNz Lounge, your AI Agent Builder & Library platform.
        
        - Create and customize AI agents
        - Use the multi-agent sandbox
        - Buy and sell agents in the marketplace
        """)

def show_register_page():
    st.title("DeGeNz Lounge")
    st.subheader("Register")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        confirm_password = st.text_input("Confirm Password", type="password")
        
        if st.button("Register"):
            if password != confirm_password:
                st.error("Passwords do not match")
            else:
                result = register(email, password)
                if result['success']:
                    st.success("Registration successful! Please login.")
                    st.session_state.page = 'login'
                    st.experimental_rerun()
                else:
                    st.error(result['message'])
        
        if st.button("Login Instead"):
            st.session_state.page = 'login'
            st.experimental_rerun()
    
    with col2:
        st.image("assets/logo.png", width=300)
        st.markdown("""
        Join DeGeNz Lounge today and get access to:
        
        - AI Agent Builder
        - Multi-Agent Sandbox
        - Prompt Repository
        - Agent Marketplace
        """)

# Main application pages
def show_dashboard():
    st.title(f"Welcome, {st.session_state.user['email']}")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Your Agents", len(list_agents(st.session_state.token)))
        if st.button("View Agents"):
            st.session_state.page = 'agents'
            st.experimental_rerun()
    
    with col2:
        st.metric("Your Prompts", len(list_prompts(st.session_state.token)))
        if st.button("View Prompts"):
            st.session_state.page = 'prompts'
            st.experimental_rerun()
    
    with col3:
        st.metric("Sandbox Sessions", len(list_sessions(st.session_state.token)))
        if st.button("View Sandbox"):
            st.session_state.page = 'sandbox'
            st.experimental_rerun()
    
    with col4:
        st.metric("Marketplace Items", len(list_marketplace_items(st.session_state.token)))
        if st.button("View Marketplace"):
            st.session_state.page = 'marketplace'
            st.experimental_rerun()
    
    st.subheader("Recent Activity")
    st.info("This is a placeholder for recent activity. In a full implementation, this would show recent actions and updates.")

def show_agents_page():
    st.title("Your Agents")
    
    if st.button("Create New Agent"):
        st.session_state.page = 'create_agent'
        st.experimental_rerun()
    
    agents = list_agents(st.session_state.token)
    
    if not agents:
        st.info("You don't have any agents yet. Create your first agent to get started!")
    else:
        for i, agent in enumerate(agents):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.subheader(agent['name'])
                st.write(agent['description'] if agent['description'] else "No description provided.")
            with col2:
                if st.button("View", key=f"view_agent_{i}"):
                    st.session_state.current_agent = agent
                    st.session_state.page = 'view_agent'
                    st.experimental_rerun()
            st.markdown("---")

def show_create_agent_page():
    st.title("Create New Agent")
    
    name = st.text_input("Agent Name")
    description = st.text_area("Description")
    system_prompt = st.text_area("System Prompt", height=300)
    is_public = st.checkbox("Make this agent public")
    
    if st.button("Create Agent"):
        if not name or not system_prompt:
            st.error("Agent name and system prompt are required.")
        else:
            result = create_agent(st.session_state.token, name, description, system_prompt, is_public)
            if result['success']:
                st.success("Agent created successfully!")
                st.session_state.page = 'agents'
                st.experimental_rerun()
            else:
                st.error(result['message'])
    
    if st.button("Cancel"):
        st.session_state.page = 'agents'
        st.experimental_rerun()

def show_view_agent_page():
    agent = st.session_state.current_agent
    st.title(agent['name'])
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.subheader("Description")
        st.write(agent['description'] if agent['description'] else "No description provided.")
        
        st.subheader("System Prompt")
        st.code(agent['system_prompt'])
    
    with col2:
        st.subheader("Actions")
        if st.button("Use in Sandbox"):
            st.session_state.page = 'create_session'
            st.session_state.selected_agent = agent
            st.experimental_rerun()
        
        if st.button("List on Marketplace"):
            st.session_state.page = 'list_item'
            st.session_state.item_type = 'agent'
            st.session_state.item_id = agent['id']
            st.experimental_rerun()
        
        st.subheader("Details")
        st.write(f"Created: {agent['created_at']}")
        st.write(f"Updated: {agent['updated_at']}")
        st.write(f"Public: {'Yes' if agent['is_public'] else 'No'}")
    
    if st.button("Back to Agents"):
        st.session_state.page = 'agents'
        st.experimental_rerun()

# Similar functions for prompts, sandbox, and marketplace pages would be implemented here

# Main app logic
def main():
    # Sidebar navigation (only shown when authenticated)
    if st.session_state.authenticated:
        with st.sidebar:
            st.title("DeGeNz Lounge")
            st.button("Dashboard", on_click=lambda: setattr(st.session_state, 'page', 'dashboard'))
            st.button("Agents", on_click=lambda: setattr(st.session_state, 'page', 'agents'))
            st.button("Prompts", on_click=lambda: setattr(st.session_state, 'page', 'prompts'))
            st.button("Sandbox", on_click=lambda: setattr(st.session_state, 'page', 'sandbox'))
            st.button("Marketplace", on_click=lambda: setattr(st.session_state, 'page', 'marketplace'))
            st.markdown("---")
            if st.button("Logout"):
                st.session_state.authenticated = False
                st.session_state.user = None
                st.session_state.token = None
                st.session_state.page = 'login'
                st.experimental_rerun()
    
    # Display the appropriate page
    if not st.session_state.authenticated:
        if st.session_state.page == 'login':
            show_login_page()
        elif st.session_state.page == 'register':
            show_register_page()
        else:
            show_login_page()
    else:
        # Check if token is still valid
        if not check_auth(st.session_state.token):
            st.session_state.authenticated = False
            st.session_state.user = None
            st.session_state.token = None
            st.session_state.page = 'login'
            st.error("Your session has expired. Please login again.")
            st.experimental_rerun()
        
        # Show the appropriate page
        if st.session_state.page == 'dashboard':
            show_dashboard()
        elif st.session_state.page == 'agents':
            show_agents_page()
        elif st.session_state.page == 'create_agent':
            show_create_agent_page()
        elif st.session_state.page == 'view_agent':
            show_view_agent_page()
        # Additional page handlers would be added here
        else:
            show_dashboard()

if __name__ == "__main__":
    main()
