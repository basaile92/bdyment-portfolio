import React from 'react';
import './NameComponent.css';
import { config } from '../../../config';

function NameComponent() {
  return (
    <div className="name-container">
      <div className="name">{config.PROMPT_NAME}:</div>
      <div className="name-separator">→&nbsp;~&nbsp;</div>
      <div className="second-name-separator">→&nbsp;</div>
    </div>
  );
}

export default NameComponent;
