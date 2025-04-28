import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [categorySetupCompleted, setCategorySetupCompleted] = useState(null);

  // Load categorySetupCompleted status from sessionStorage on app load
  useEffect(() => {
    const setupCompleted = sessionStorage.getItem("categorySetupCompleted");
    if (setupCompleted !== null) {
      setCategorySetupCompleted(JSON.parse(setupCompleted));
    }
  }, []);

  // Set category setup completion flag in sessionStorage
  const markCategorySetupCompleted = () => {
    setCategorySetupCompleted(true);
    sessionStorage.setItem("categorySetupCompleted", true);
  };

  return (
    <UserContext.Provider value={{ categorySetupCompleted, markCategorySetupCompleted }}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UserContext;
