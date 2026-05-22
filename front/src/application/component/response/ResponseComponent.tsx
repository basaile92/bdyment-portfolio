import React from 'react';
import './ResponseComponent.css';

function ResponseComponent(props: any) {
  return <div className="response" dangerouslySetInnerHTML={{ __html: props.children }} />;
}

export default ResponseComponent;
