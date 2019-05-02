/* START: GLOBAL */

var ARABIC_LETTERS_LIST = null;
var DIACRITICS_LIST = null;
var CHARACTERS_MAPPING = null;
var REV_CLASSES_MAPPING = null;

/* END: GLOBAL */

/* START: MAIN */

$(document).ready(function() {
  loadConstants();
  setInputText('', 'rtl');
  $('#diacritize-it').on("click", predict);
});

/* END: MAIN */

/* BEGIN: PREDICTION */

function predict() {
  var inputText = getInputText();
  var arabicLettersCount = countArabicLetters(inputText);
  setInputText('Diacritizing ' + arabicLettersCount.toString() + ' Arabic characters...', 'ltr');

  let message = {
    encoded: mapInput(inputText)
  }

  $.post("/predict", JSON.stringify(message), function(response) {
    setInputText(buildPrediction(inputText, response.predictions), 'rtl');
  });
};

function mapInput(inputText) {
  mappedInput = [CHARACTERS_MAPPING['<SOS>']]
  for (var i = 0; i < inputText.length; ++i) {
    if (DIACRITICS_LIST.indexOf(inputText.charAt(i)) != -1) {
      continue;
    }

    if (CHARACTERS_MAPPING.hasOwnProperty(inputText.charAt(i)) == true) {
      mappedInput.push(CHARACTERS_MAPPING[inputText.charAt(i)]);
    } else {
      mappedInput.push(CHARACTERS_MAPPING['<UNK>']);
    }
  }
  mappedInput.push(CHARACTERS_MAPPING['<EOS>']);

  return mappedInput;
};

function buildPrediction(inputText, predictions) {
  var output = ''
  var prediction = -1

  for (var i = 0; i < inputText.length; ++i) {
    if (DIACRITICS_LIST.indexOf(inputText.charAt(i)) != -1) {
      continue;
    }

    output += inputText.charAt(i);
    prediction += 1;

    if (ARABIC_LETTERS_LIST.indexOf(inputText.charAt(i)) == -1 || REV_CLASSES_MAPPING[predictions[prediction]].includes('<')) {
      continue;
    }

    output += REV_CLASSES_MAPPING[predictions[prediction]];
  }

  return output;
}

function countArabicLetters(inputText) {
  var counter = 0;
  for (var i = 0; i < inputText.length; ++i) {
    if (ARABIC_LETTERS_LIST.indexOf(inputText.charAt(i)) != -1) {
      counter += 1;
    }
  }
  return counter;
};

/* END: PREDICTION */

/* BEGIN: CONSTANTS */

function loadConstants() {
  get(Flask.url_for('static', {'filename': 'json/ARABIC_LETTERS_LIST.json'})).then(function(response) {
    ARABIC_LETTERS_LIST = JSON.parse(response);
  });
  get(Flask.url_for('static', {'filename': 'json/DIACRITICS_LIST.json'})).then(function(response) {
    DIACRITICS_LIST = JSON.parse(response);
  });
  get(Flask.url_for('static', {'filename': 'json/CHARACTERS_MAPPING.json'})).then(function(response) {
    CHARACTERS_MAPPING = JSON.parse(response);
  });
  get(Flask.url_for('static', {'filename': 'json/REV_CLASSES_MAPPING.json'})).then(function(response) {
    REV_CLASSES_MAPPING = JSON.parse(response);
  });
};

function get(filePath) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', filePath);

    req.onload = function() {
      if (req.status == 200) {
        resolve(req.response);
      }
      else {
        reject(Error(req.statusText));
      }
    };

    req.onerror = function() {
      reject(Error('Network Error'));
    };

    req.send();
  });
};

/* END: CONSTANTS */

/* START: HELPERS */

function getInputText() {
  return $('#input').val();
};

function setInputText(text, dir) {
  $('#input').css({'direction': dir});
  $('#input').val(text);
};

/* END: HELPERS */
