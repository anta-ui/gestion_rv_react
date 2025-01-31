const initialState = {
    auth: {
      token: null,
      user: null,
    },
  };
  
  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'LOGIN':
        // Assurer que seul auth est modifié sans redéfinir complètement state
        return {
          ...state,  // Garder le reste de l'état inchangé
          auth: {
            token: action.token,
            user: action.user,
          },
        };
        
      case 'LOGOUT':
        // Réinitialiser auth à null sans toucher aux autres parties de l'état
        return {
          ...state,  // Garder le reste de l'état inchangé
          auth: {
            token: null,
            user: null,
          },
        };
        
      default:
        return state;
    }
  };
  
  export default authReducer;
  