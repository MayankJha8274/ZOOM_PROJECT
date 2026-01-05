/**
 * WITH AUTH - withAuth.jsx
 * Higher-Order Component (HOC) for protecting routes
 * 
 * This wraps components that require authentication
 * If user is not logged in (no token), redirects to /auth
 * 
 * USAGE:
 * Instead of: export default MyComponent
 * Use: export default withAuth(MyComponent)
 * 
 * Protected pages:
 * - Home page
 * - History page
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

// Higher-order component that wraps protected components
const withAuth = (WrappedComponent ) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        // Check if user has authentication token
        const isAuthenticated = () => {
            if(localStorage.getItem("token")) {
                return true; // User is logged in
            } 
            return false; // User is not logged in
        }

        // Check authentication on component mount
        useEffect(() => {
            if(!isAuthenticated()) {
                // No token found, redirect to login page
                router("/auth")
            }
        }, [router])

        // If authenticated, render the wrapped component
        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;