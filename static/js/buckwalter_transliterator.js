/* START: GLOBAL */

var a2s = null;
var s2a = null;

/* END: GLOBAL */

/* START: MAIN */

$(document).ready(function() {
  loadConstants();
  $('#transliterate-it').on('click', doTransliteration);
});

/* END: MAIN */

/* BEGIN: TRANSLITERATION */

function doTransliteration() {
	inputText = getInputText();
  outputText = '';

	if ($('#to-buckwalter').is(':checked')) {
		for (var i = 0; i < inputText.length; ++i) {
	    if (a2s.hasOwnProperty(inputText.charAt(i)) == true) {
	      outputText += a2s[inputText.charAt(i)];
	    } else {
	      outputText += inputText.charAt(i);
	    }
	  }
	} else if ($('#from-buckwalter').is(':checked')) {
		for (var i = 0; i < inputText.length; ++i) {
	    if (s2a.hasOwnProperty(inputText.charAt(i)) == true) {
	      outputText += s2a[inputText.charAt(i)];
	    } else {
	      outputText += inputText.charAt(i);
	    }
	  }
	}

  setInputText(outputText);
};

/* END: TRANSLITERATION */

/* BEGIN: CONSTANTS */

function loadConstants() {
  get(Flask.url_for('static', {'filename': 'json/a2s.json'})).then(function(response) {
    a2s = JSON.parse(response);
  });
  get(Flask.url_for('static', {'filename': 'json/s2a.json'})).then(function(response) {
    s2a = JSON.parse(response);
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

function setInputText(text) {
  $('#input').val(text);
};

/* END: HELPERS */
