// src/utils/withRouter.js
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import React from 'react';

export function withRouter(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    return (
      <Component
        {...props}
        navigate={navigate}
        params={params}
        location={location}
      />
    );
  };
}
