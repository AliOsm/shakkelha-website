/* START: GLOBAL */

var ARABIC_LETTERS_LIST = null;
var DIACRITICS_LIST = null;
var CHARACTERS_MAPPING = null;
var CLASSES_LIST = null;
var CLASSES_MAPPING = null;
var REV_CLASSES_MAPPING = null;
var CHARS_NUM = 50;
var CLASSES_NUM = 15;

/* END: GLOBAL */

/* START: MAIN */

$(document).ready(function() {
  $('.progress .progress-bar').css("width", "0%");
  $('#diacritize-it').on("click", doPrediction);
  loadMappings();
});

/* END: MAIN */

/* BEGIN: PREDICTION */

function doPrediction() {
  if ($('#basic-model').is(':checked')) {
    predict('feed_forward_models', '1_basic_model');
  } else if($('#100-hot-model').is(':checked')) {
    predict('feed_forward_models', '2_100_hot_model');
  } else if($('#embeddings-model').is(':checked')) {
    predict('feed_forward_models', '3_embeddings_model');
  }
};

async function predict(modelType, modelName) {
  $('.progress .progress-bar').css("width", "0%");
  var inputText = await getInputText();
  var arabicLettersCount = await countArabicLetters(inputText);
  if ($('#diacritize-it').text() === 'شَكِّلْهَا') {
    setInputText('جاري تشكيل ' + arabicLettersCount.toString() + ' من الحروف العربية...');
  } else {
    setInputText('Diacritizing ' + arabicLettersCount.toString() + ' Arabic characters...');
  }

  var model = await loadModel(modelType, modelName);
  var outputPredicted = await predictOutput(inputText, model, modelName, arabicLettersCount);
  setInputText(outputPredicted);
  model = null;
  inputText = null;
  outputPredicted = null;
};

async function loadModel(modelType, modelName) {
  const model = await tf.loadModel('models/' + modelType + '/' + modelName + '/model.json');
  return model;
};

async function predictOutput(inputText, model, modelName, arabicLettersCount) {
  outputPredicted = '';
  predictedCount = 0;

  for (var i = 0; i < inputText.length; ++i) {
    if (DIACRITICS_LIST.indexOf(inputText.charAt(i)) != -1) {
      continue;
    }

    outputPredicted += await inputText.charAt(i);

    if (ARABIC_LETTERS_LIST.indexOf(inputText.charAt(i)) == -1) {
      continue;
    }

    // Prepare before context
    var before = [];
    for (var idxb = i - 1; idxb >= 0; --idxb) {
      if (before.length >= CHARS_NUM) {
        break;
      }

      if (DIACRITICS_LIST.indexOf(inputText.charAt(idxb)) != -1) {
        continue;
      }

      if (CHARACTERS_MAPPING.hasOwnProperty(inputText.charAt(idxb)) == true) {
        before.push(CHARACTERS_MAPPING[inputText.charAt(idxb)]);
      } else {
        before.push(0);
      }
    }
    before = before.reverse();
    var before_need = CHARS_NUM - before.length;

    // Prepare after context
    var after = [];
    for (var idxa = i; idxa < inputText.length; ++idxa) {
      if (after.length >= CHARS_NUM) {
        break;
      }

      if (DIACRITICS_LIST.indexOf(inputText.charAt(idxa)) != -1) {
        continue;
      }

      if (CHARACTERS_MAPPING.hasOwnProperty(inputText.charAt(idxa)) == true) {
        after.push(CHARACTERS_MAPPING[inputText.charAt(idxa)]);
      } else {
        after.push(0);
      }
    }
    var after_need = CHARS_NUM - after.length;

    // Merge contexts
    x = [];

    // Append before padding
    for (j = 0; j < before_need; ++j) {
      x.push(1);
    }

    // Concatenate before and after contexts
    x = x.concat(before);
    x = x.concat(after);

    // Append after padding
    for (j = 0; j < after_need; ++j) {
      x.push(1);
    }

    // Predict
    if (modelName === '100_hot_model') {
      prediction = model.predict(tf.reshape(tf.oneHot(x, Object.keys(CHARACTERS_MAPPING).length + 2).flatten(), [1, (Object.keys(CHARACTERS_MAPPING).length + 2) * 100]));
    } else {
      prediction = model.predict(tf.tensor2d(x, [1, 2 * CHARS_NUM]));
    }
    max_prediction = tf.argMax(prediction, 1).dataSync();

    predictedCount += 1;
    $('.progress .progress-bar').css("width", Math.ceil(predictedCount / arabicLettersCount * 100).toString() + "%");
    await sleep(0);

    if (max_prediction[0] == 0) {
      continue;
    }

    outputPredicted += REV_CLASSES_MAPPING[max_prediction[0]];
  }

  return outputPredicted;
};

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

/* BEGIN: MAPPING */

function loadMappings() {
  get('json/ARABIC_LETTERS_LIST.json').then(function(response) {
    ARABIC_LETTERS_LIST = JSON.parse(response);
  });
  get('json/DIACRITICS_LIST.json').then(function(response) {
    DIACRITICS_LIST = JSON.parse(response);
  });
  get('json/CHARACTERS_MAPPING.json').then(function(response) {
    CHARACTERS_MAPPING = JSON.parse(response);
  });
  get('json/CLASSES_LIST.json').then(function(response) {
    CLASSES_LIST = JSON.parse(response);
  });
  get('json/CLASSES_MAPPING.json').then(function(response) {
    CLASSES_MAPPING = JSON.parse(response);
  });
  get('json/REV_CLASSES_MAPPING.json').then(function(response) {
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

/* END: MAPPING */

/* START: HELPERS */

function getInputText() {
  return $('#input').val();
};

function setInputText(text) {
  $('#input').val(text);
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/* END: HELPERS */
