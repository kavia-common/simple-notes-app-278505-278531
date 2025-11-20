import React from 'react';
import PropTypes from 'prop-types';

/**
 * TopNav
 * - Displays brand
 */

// PUBLIC_INTERFACE
export default function TopNav({ title }) {
  return (
    <nav className="topnav" aria-label="Top navigation">
      <div className="brand" aria-label="Application name">
        <span className="dot" aria-hidden="true" />
        {title}
      </div>
      <div aria-hidden="true" />
    </nav>
  );
}

TopNav.propTypes = {
  title: PropTypes.string.isRequired,
};
