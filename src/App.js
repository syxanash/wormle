import React, {
  useCallback, useEffect, useState, useMemo
} from 'react';
import _ from 'lodash';
import JSConfetti from 'js-confetti';

import './App.css';
import 'nes.css/css/nes.min.css';
import wordsListFile from './assets/wordlist.json';

const MAX_WORD_LENGTH = 5;
const COLOR_STATUSES = {
  'BLACK': 0,
  'YELLOW': 1,
  'GREEN': 2,
};

function App() {
  const [wordsList, setWordsList] = useState(_.get(wordsListFile, 'words'));
  const [colorSequence, setColorSequence] = useState(Array(MAX_WORD_LENGTH).fill(0));
  const [olderWords, setOlderWords] = useState([]);
  const [choosenWord, setChoosenWord] = useState('');

  const jsConfetti = useMemo(() => new JSConfetti(), []);

  const isCombinationCorrect = useMemo(() => {
    return _.every(colorSequence, (sequence) => sequence === COLOR_STATUSES.GREEN);
  }, [colorSequence]);

  const guessButtonDisabled = useMemo(() => {
    return wordsList.length === 0 || choosenWord.length < MAX_WORD_LENGTH || isCombinationCorrect;
  }, [wordsList, choosenWord, isCombinationCorrect]);

  useEffect(() => {
    const choosenWord = _.first(_.shuffle(wordsList));
    setChoosenWord(choosenWord);
  }, [wordsList]);

  useEffect(() => {
    if (isCombinationCorrect) {
      jsConfetti.addConfetti({
        confettiColors: [
          '#462066', '#FFB85F', '#FF7A5A', '#00AAA0', '#8ED2C9', '#FCF4D9',
        ],
      });
    }
  }, [isCombinationCorrect, jsConfetti]);

  const startOver = useCallback(() => {
    const newWordsList = _.get(wordsListFile, 'words');

    setWordsList(_.get(wordsListFile, 'words'));
    setColorSequence(Array(MAX_WORD_LENGTH).fill(0));
    setOlderWords([]);
    setChoosenWord(_.first(_.shuffle(newWordsList)));
  }, []);

  const guessWord = useCallback(() => {
    if (wordsList.length === 0) {
      return;
    }

    if (!isCombinationCorrect) {
      setOlderWords([...olderWords, choosenWord]);
    }

    const wordsListClone = _.clone(wordsList);
    const charsAllowed = [];
    const wordsToDelete = [];

    _.each(colorSequence, (color, index) => {
      if (color !== COLOR_STATUSES.BLACK) {
        charsAllowed.push(choosenWord[index]);
      }
    });

    _.each(colorSequence, (color, index) => {
      const tempChar = choosenWord[index];

      if (color === COLOR_STATUSES.GREEN) {
        _.each(wordsListClone, (currentWord) => {
          if (currentWord[index] !== tempChar) {
            wordsToDelete.push(currentWord);
          }
        });
      } else if (color === COLOR_STATUSES.YELLOW) {
        _.each(wordsListClone, (currentWord) => {
          if (!currentWord.includes(tempChar)) {
            wordsToDelete.push(currentWord);
          }

          if (currentWord[index] === tempChar) {
            wordsToDelete.push(currentWord);
          }
        });
      } else if (color === COLOR_STATUSES.BLACK) {
        _.each(wordsListClone, (currentWord) => {
          if (currentWord.includes(tempChar) && !charsAllowed.includes(tempChar)) {
            wordsToDelete.push(currentWord);
          }
        });
      }
    });

    setWordsList(wordsListClone.filter((word) => !wordsToDelete.includes(word)));
    setChoosenWord(_.first(_.shuffle(wordsListClone)));
  }, [wordsList, olderWords, choosenWord, colorSequence, isCombinationCorrect]);

  const changeChoosenWord = useCallback((newValue) => {
    const inputValue = newValue.target.value;
    if (inputValue.length <= MAX_WORD_LENGTH) {
      setChoosenWord(inputValue.toLowerCase());
    }
  }, []);

  const changeSequence = useCallback((index, value) => {
    const clonedSequence = _.clone(colorSequence);
    clonedSequence[index] = value;

    setColorSequence(clonedSequence);
  }, [colorSequence]);

  const generateSequence = useCallback(() => {
    const buttonStyle = [
      'is-normal',
      'is-warning',
      'is-success'
    ];

    const colorSequenceButtons = Array(MAX_WORD_LENGTH).fill(0).map((_, i) => {
      const newValue = (colorSequence[i] + 1) % Object.keys(COLOR_STATUSES).length;

      const isSequenceButtonDisabled = i > choosenWord.length - 1;
      const textValue = isSequenceButtonDisabled ? '' : choosenWord[i].toUpperCase();

      const sequenceButtonStyle = isSequenceButtonDisabled
        ? 'is-disabled'
        : buttonStyle[colorSequence[i]];

      return (
        <button
          disabled={ isSequenceButtonDisabled }
          key={ `sequenceButton${i}` }
          type="button"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={ () => changeSequence(i, newValue) }
          className={ `nes-btn ${sequenceButtonStyle}` }
          style={ { width: '50px', height: '50px' } }
        >{textValue}</button>
      );
    });

    return colorSequenceButtons;    
  }, [changeSequence, colorSequence, choosenWord]);

  const interactivePart = useCallback(() => {
    const wordInput = (
      <React.Fragment><br /><h3>Try with:</h3><div className="nes-field">
        <input type="text" className="nes-input" onChange={ changeChoosenWord } value={ choosenWord || '' } />
      </div></React.Fragment>
    );

    return (
      <React.Fragment>
        { isCombinationCorrect ? null : wordInput }
        <br />
        <h3>Change color sequence:</h3>
        { generateSequence() }
        <br />
      </React.Fragment>
    );
  }, [changeChoosenWord, choosenWord, generateSequence, isCombinationCorrect]);

  const generatePreviousWords = useCallback(() => {
    const liComponents = olderWords.map((word, i) => <li key={ `li_${i}` }>{word.toUpperCase()}</li>);

    return (
      <React.Fragment>
        <br />
        <h3>Previously entered:</h3>
        <div className="lists">
          <ul className="nes-list is-disc">
            {liComponents}
          </ul>
        </div>
      </React.Fragment>
    );
  }, [olderWords]);

  const populateTextArea = useCallback(() => {
    if (isCombinationCorrect) {
      return <p>Congrats the word of the day was {choosenWord}!</p>;
    }

    return (
      <p>
        {wordsList.length === 0 ? 'no more words :(' : wordsList.join(',\t')}
      </p>
    );
  }, [choosenWord, isCombinationCorrect, wordsList]);

  return (
    <div className='app-container'>
      <div className="nes-balloon from-left">
        <p><i>'cause cheating is always the last resort!</i></p>
      </div>
      <h1>WORMLE<i className="nes-icon trophy is-sm"></i></h1>
      <hr />
      <h3>Words available:</h3>
      <div className="nes-container is-dark" style={ { maxWidth: '800px', height: '300px', overflow: 'scroll' } }>
        { populateTextArea() }
      </div>
      { olderWords.length === 0 ? null : generatePreviousWords() }
      { wordsList.length === 0 ? null : interactivePart() }
      <br />
      <h3>then</h3>
      <button disabled={ guessButtonDisabled } className={ `nes-btn ${ guessButtonDisabled ? 'is-disabled' : 'is-primary' }` } onClick={ guessWord }>FIND WORDS</button>
      <br /><br />
      <button className="nes-btn is-error" onClick={ startOver }>START OVER</button>
    </div>
  );
}

export default App;
