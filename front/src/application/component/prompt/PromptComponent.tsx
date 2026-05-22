import React, { useEffect, useRef, useState } from 'react';
import './PromptComponent.css';
import NameComponent from '../name/NameComponent';
import HistoryLine from '../../model/HistoryLine';
import ResponseComponent from '../response/ResponseComponent';
import {
  isArrowWithShiftDown,
  isCtrlCTyped,
  isDownTyped,
  isEnterDown,
  isTabShiftTyped,
  isTabTyped,
  isUpTyped,
  removeAllBehave,
} from '../../../domain/utils/keyboard-utils';
import { adviseService, consoleService } from '../../initializer/initializer';

function PromptComponent(props: any) {
  let [isLoading, setIsLoading] = useState(false);
  let [commandLine, setCommandLine] = useState('');
  let [indexHistoryCommandPicker, setIndexHistoryCommandPicker] = useState(0);
  let [indexAdvisePicker, setIndexAdvisePicker] = useState(0);
  let [adviseModeActivated, setAdviseModeActivated] = useState(false);
  let [adviseArray, setAdviseArray] = useState<string[]>([]);
  let [valueToAdvise, setValueToAdvise] = useState<string>('');
  const refToScrollDown = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  let addHistoryLine = props.addHistoryLine;
  let clearHistory = props.clearHistory;
  let history: HistoryLine[] = props.history;
  useEffect(() => {
    if (history.length > 0) {
      scrollDown();
    }
    if (history.length === 0) {
      resetHistoryPicker();
    }
  }, [history.length]);
  useEffect(() => {
    if (!adviseModeActivated) {
      resetAdviseMode();
    }
  }, [adviseModeActivated]);
  useEffect(() => {
    textAreaRef.current!.focus();
  }, [isLoading]);
  let scrollDown = () => {
    refToScrollDown.current?.scrollIntoView({
      block: 'end',
    });
  };

  let resetAdviseMode = () => {
    setIndexAdvisePicker(0);
    setAdviseArray([]);
    setValueToAdvise('');
  };

  const resetHistoryPicker = () => {
    setIndexHistoryCommandPicker(0);
  };

  let onChangeCommandLine = (e: any) => {
    setCommandLine(e.target.value);
  };

  let retrievePreviousCommand = () => {
    let indexHistoryCommandPickerValue = indexHistoryCommandPicker;
    if (indexHistoryCommandPicker > 0) {
      indexHistoryCommandPickerValue = indexHistoryCommandPickerValue - 1;
      setCommandLine(history[indexHistoryCommandPickerValue].command);
    }
    setIndexHistoryCommandPicker(indexHistoryCommandPickerValue);
  };

  let retrieveNextCommand = () => {
    let indexHistoryCommandPickerValue = indexHistoryCommandPicker;
    if (indexHistoryCommandPicker < history.length - 1) {
      indexHistoryCommandPickerValue = indexHistoryCommandPickerValue + 1;
      setCommandLine(history[indexHistoryCommandPickerValue].command);
    }
    if (indexHistoryCommandPicker === history.length - 1) {
      indexHistoryCommandPickerValue = indexHistoryCommandPickerValue + 1;
      setCommandLine('');
    }
    setIndexHistoryCommandPicker(indexHistoryCommandPickerValue);
  };

  let advise = () => {
    let valueToAdviseValue = valueToAdvise;
    if (!adviseModeActivated) {
      valueToAdviseValue = commandLine;
      setValueToAdvise(valueToAdviseValue);
      const adviseArray = adviseService.adviseCommandsWhoStartWith(valueToAdviseValue);
      setAdviseArray(adviseArray);
      setAdviseModeActivated(true);
    }
    const newCommandLineValue = adviseService.adviseACommandWhoStartWith(valueToAdviseValue, indexAdvisePicker);
    setCommandLine(newCommandLineValue + ' ');
    const indexTabulationNewValue = indexAdvisePicker + 1;
    setIndexAdvisePicker(indexTabulationNewValue);
    scrollDown();
  };

  let deactivateAdviseMode = () => {
    setAdviseModeActivated(false);
  };

  let giveUp = () => {
    const length = history.length;
    addHistoryLine(new HistoryLine(commandLine, undefined));
    setIndexHistoryCommandPicker(length + 1);
    setCommandLine('');
  };

  const serverError = () => {
    return "<div class='error'>The command line is not available because server is down.</div>";
  };

  let submit = () => {
    setIsLoading(true);
    const length = history.length;
    if (commandLine.split(' ')[0] === 'clear') {
      clearHistory();
      setCommandLine('');
      setIsLoading(false);
    } else
      consoleService
        .submitCommand(commandLine)
        .then((response) => addHistoryLine(new HistoryLine(commandLine, response)))
        .catch(() => addHistoryLine(new HistoryLine(commandLine, serverError())))
        .finally(() => {
          setIndexHistoryCommandPicker(length + 1);
          setCommandLine('');
          setIsLoading(false);
        });
  };

  let onKeyDown = (e: any) => {
    if (isArrowWithShiftDown(e)) {
      removeAllBehave(e);
    }
    if (isUpTyped(e)) {
      removeAllBehave(e);
      retrievePreviousCommand();
    }
    if (isDownTyped(e)) {
      removeAllBehave(e);
      retrieveNextCommand();
    }
    if (isTabTyped(e)) {
      removeAllBehave(e);
      advise();
    }
    if (!isTabTyped(e)) {
      deactivateAdviseMode();
    }
    if (isTabShiftTyped(e)) {
      removeAllBehave(e);
    }
    if (isCtrlCTyped(e)) {
      removeAllBehave(e);
      giveUp();
    }
    if (isEnterDown(e)) {
      removeAllBehave(e);
      submit();
    }
  };

  const separateByTab = (string1: string, string2: string): string => {
    return `${string1}&nbsp&nbsp&nbsp&nbsp${string2}`;
  };

  return (
    <div>
      <div className="prompt-container">
        <NameComponent />
        <textarea
          id={'prompt'}
          className="prompt"
          autoCapitalize="none"
          autoComplete="off"
          rows={1}
          onKeyDown={onKeyDown}
          value={commandLine}
          onChange={onChangeCommandLine}
          disabled={isLoading}
          ref={textAreaRef}
        />
      </div>
      {adviseModeActivated && adviseArray.length > 0 && (
        <ResponseComponent>{adviseArray.reduce(separateByTab, '')}</ResponseComponent>
      )}
      <div ref={refToScrollDown}></div>
    </div>
  );
}

export default PromptComponent;
