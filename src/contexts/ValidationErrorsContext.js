import React, { createContext, useState } from 'react';

export const ValidationErrorsContext = createContext();

export const ValidationErrorsProvider = ({ children }) => {
    const [validationErrors, setValidationErrors] = useState({});

    return (
        <ValidationErrorsContext.Provider value={{ validationErrors, setValidationErrors }}>
            {children}
        </ValidationErrorsContext.Provider>
    );
};
