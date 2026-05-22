import React from 'react';
import './HelpComponent.css';

function HelpComponent(props: any) {
  return (
    props.helpDisplayed && (
      <div className="help-container">
        <div className="help-content">
          <div className="title-help"> How to use a terminal?</div>
          <div className="help-line">
            <div>
              You can type commands in the terminal under this format:{' '}
              <span className="code">
                command {'{'}parameter{'}'}
              </span>
              .
            </div>
            <div className="help-underline">
              Type <span className={'key'}>Enter</span> to submit your command.
            </div>
            <div className="help-underline">
              To see which commands are available, type <span className="code">help</span>.
            </div>
          </div>
          <div className="help-line">
            Use the arrows <span className={'key'}>↑ ↓</span> to retrieve your previous commands.
          </div>
          <div className="help-line">
            Use <span className={'key'}>Tab</span> to browse the commands which are starting by the text in the command
            line.
          </div>
          <div className="help-line">
            Use <span className={'key'}>Ctrl-C</span> to give up a command you are typing.
          </div>
        </div>
      </div>
    )
  );
}

export default HelpComponent;
