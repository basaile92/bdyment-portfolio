import React, { useState } from 'react';
import './ConsoleComponent.css';
import CommandComponent from '../command/CommandComponent';
import ResponseComponent from '../response/ResponseComponent';
import PromptComponent from '../prompt/PromptComponent';
import BarComponent from '../bar/BarComponent';
import HistoryLine from '../../model/HistoryLine';
import HelpComponent from '../help/HelpComponent';

function ConsoleComponent() {
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [helpDisplayed, setHelpDisplayed] = useState(false);
  const addHistoryLine = (historyLine: HistoryLine) => {
    setHistory([...history, historyLine]);
  };
  const clearHistory = () => {
    setHistory([]);
  };
  return (
    <div>
      <HelpComponent helpDisplayed={helpDisplayed} setHelpDisplayed={setHelpDisplayed} />
      <BarComponent helpDisplayed={helpDisplayed} setHelpDisplayed={setHelpDisplayed} />
      <br />
      <div className="console">
        {history.map((historyLine) => (
          <div key={historyLine.date}>
            <br />
            <CommandComponent>{historyLine.command}</CommandComponent>
            {historyLine.response && (
              <div>
                <br />
                <ResponseComponent>{historyLine.response}</ResponseComponent>
              </div>
            )}
          </div>
        ))}
        <br />
        <PromptComponent
          addHistoryLine={addHistoryLine}
          history={history}
          clearHistory={clearHistory}
        ></PromptComponent>
      </div>
    </div>
  );
}

export default ConsoleComponent;
