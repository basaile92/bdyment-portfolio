import React from 'react';
import './CommandComponent.css';
import NameComponent from '../name/NameComponent';

function CommandComponent(props: any) {
  return (
    <div className="command-container">
      <NameComponent />
      <div className="subject">{props.children}</div>
    </div>
  );
}

export default CommandComponent;
