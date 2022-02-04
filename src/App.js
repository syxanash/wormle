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

const jsConfetti = new JSConfetti();

const findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) !== index);

function App() {
  const [wordsList, setWordsList] = useState(_.shuffle(_.get(wordsListFile, 'words')));
  const [colorSequence, setColorSequence] = useState(Array(MAX_WORD_LENGTH).fill(0));
  const [olderWords, setOlderWords] = useState([]);
  const [olderColorSequences, setOlderColorSequences] = useState([]);
  const [choosenWord, setChoosenWord] = useState('');

  const isCombinationCorrect = useMemo(() => {
    return _.every(colorSequence, (sequence) => sequence === COLOR_STATUSES.GREEN);
  }, [colorSequence]);

  const guessButtonDisabled = useMemo(() => {
    return wordsList.length === 0 || choosenWord.length < MAX_WORD_LENGTH || isCombinationCorrect;
  }, [wordsList, choosenWord, isCombinationCorrect]);

  useEffect(() => {
    const currentIteration = olderColorSequences.length;

    let choosenWord = _.first(wordsList);

    if (currentIteration === 0) {
      // yeah I'm sure there's a good regex for this but I don't know any atm :)
      const goodFirstWords = wordsList.filter((word) => {
        return word.includes('e')
          && word.includes('a')
          && word.includes('r')
          && (word.includes('i') || word.includes('o') || word.includes('t'))
					&& findDuplicates(word.split('')).length === 0;
      });

      choosenWord = _.sample(goodFirstWords);
    }

    // choose a word that doesn't have duplicates for the first 2 guesses
    while (choosenWord !== undefined &&
      findDuplicates(choosenWord.split('')).length !== 0 &&
      currentIteration < 2) {
      choosenWord = _.sample(wordsList);
    }

    setChoosenWord(choosenWord);
  }, [olderColorSequences, wordsList]);

  useEffect(() => {
    if (isCombinationCorrect || wordsList.length === 1) {
      jsConfetti.addConfetti({
        confettiColors: [
          '#462066', '#FFB85F', '#FF7A5A', '#00AAA0', '#8ED2C9', '#FCF4D9',
        ],
      });
    }
  }, [isCombinationCorrect, wordsList]);

  const startOver = useCallback(() => {
    const newWordsList = _.shuffle(_.get(wordsListFile, 'words'));

    setWordsList(newWordsList);
    setColorSequence(Array(MAX_WORD_LENGTH).fill(0));
    setOlderWords([]);
    setOlderColorSequences([]);
    setChoosenWord(_.first(newWordsList));
  }, []);

  const guessWord = useCallback(() => {
    if (wordsList.length === 0) {
      return;
    }

    if (!isCombinationCorrect) {
      setOlderWords([...olderWords, choosenWord]);
      setOlderColorSequences([...olderColorSequences, colorSequence]);
    }

    const wordsListClone = _.clone(wordsList);
    const charsAllowed = [];
    const wordsToDelete = [];

    colorSequence.forEach((color, index) => {
      if (color !== COLOR_STATUSES.BLACK) {
        charsAllowed.push(choosenWord[index]);
      }
    });

    colorSequence.forEach((color, index) => {
      const tempChar = choosenWord[index];

      if (color === COLOR_STATUSES.GREEN) {
        wordsListClone.forEach((currentWord) => {
          if (currentWord[index] !== tempChar) {
            wordsToDelete.push(currentWord);
          }
        });
      } else if (color === COLOR_STATUSES.YELLOW) {
        wordsListClone.forEach((currentWord) => {
          if (!currentWord.includes(tempChar)) {
            wordsToDelete.push(currentWord);
          }

          if (currentWord[index] === tempChar) {
            wordsToDelete.push(currentWord);
          }
        });
      } else if (color === COLOR_STATUSES.BLACK) {
        wordsListClone.forEach((currentWord) => {
          if (currentWord.includes(tempChar) && !charsAllowed.includes(tempChar)) {
            wordsToDelete.push(currentWord);
          }

          if (charsAllowed.includes(tempChar) && currentWord[index] === tempChar) {
            wordsToDelete.push(currentWord);
          }
        });
      }
    });

    setWordsList(wordsListClone.filter((word) => !wordsToDelete.includes(word)));

    // remove the yellows from the color sequence but keep the greens
    const newColorSequence = colorSequence.map(color => color === COLOR_STATUSES.YELLOW ? COLOR_STATUSES.BLACK : color);
    setColorSequence(newColorSequence);
  }, [wordsList, isCombinationCorrect, colorSequence, olderWords, choosenWord, olderColorSequences]);

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
        <input
          type="text"
          className="nes-input"
          style={ { maxWidth: '700px' } }
          onChange={ changeChoosenWord }
          value={ choosenWord || '' }
        />
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
    const liComponents = olderWords.map((word, i) => {
      const tempWord = word.toUpperCase();

      const highlightColor = ['black', '#f7d51d', '#4aa52e'];

      const spansComponents = tempWord.split('').map((char, index) => {
        return <React.Fragment key={ `char_${index}` }>
          <span style={ { color: highlightColor[olderColorSequences[i][index]] } }>{ char }</span>
        </React.Fragment>;
      });

      return <li key={ `li_${i}` }>{spansComponents}</li>;
    });

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
  }, [olderColorSequences, olderWords]);

  const pickWord = useCallback((wordPicked) => {
    setChoosenWord(wordPicked);
  }, []);

  const populateTextArea = useCallback(() => {
    if (isCombinationCorrect) {
      return <p>Congrats the word of the day was {choosenWord}!</p>;
    }

    const wordComponent = wordsList.map((word, index) => {
      // eslint-disable-next-line react/jsx-no-bind
      const classNames = `single-word ${word === choosenWord ? 'choosen-word' : ''}`;
      return <div key={ `word_${index}` } className={ classNames } onClick={ () => pickWord(word) }>
        <span>{ word }</span>
      </div>;
    });

    return (
      wordsList.length === 0
        ? <p>no more words :(</p>
        : <div className="words-container">{wordComponent}</div>
    );
  }, [choosenWord, isCombinationCorrect, pickWord, wordsList]);

  return (
    <div className="app-container">
      <div className="nes-balloon from-left">
        <p><i>'cause cheating is always the last resort!</i></p>
      </div>
      <h1><span style={ { color: 'green' } }>WOR</span>M<span style={ { color: 'green' } }>LE</span><span role="img" aria-label="worm">🐛</span></h1>
      <hr />
      <h3>Words available:</h3>
      <div className="nes-container is-dark wrap-container">
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
