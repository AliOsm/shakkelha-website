import numpy as np
import tensorflow.compat.v1 as tf

tf.disable_v2_behavior()
tf.compat.v1.enable_eager_execution()

from flask import Flask
from flask import request
from flask import jsonify
from flask import render_template
from flask import redirect
from flask_jsglue import JSGlue

from keras.models import load_model
from optimizer import NormalizedOptimizer

from helpers import split_list


app = Flask(__name__)
jsglue = JSGlue(app)


# Destroy cache for development mode
# @app.after_request
# def add_header(response):
# 	response.cache_control.max_age = 0
# 	if 'Cache-Control' not in response.headers:
# 		response.headers['Cache-Control'] = 'no-store'
# 	return response


def setup_model():
	print(' * Loading Keras model...')

	global graph
	global model

	graph = tf.get_default_graph()
	model = load_model('static/model/model.ckpt', custom_objects={'NormalizedOptimizer': NormalizedOptimizer})

	print(' * Model loaded!')
setup_model()


@app.route('/')
def home():
	return render_template('home.html')


@app.route('/buckwalter_transliterator')
def buckwalter_transliterator():
	return render_template('buckwalter_transliterator.html')


@app.route('/index.ar.html')
def index_ar_html():
	return redirect('/')


@app.route('/predict', methods=['POST'])
def predict():
	global graph
	global model

	message = request.get_json(force=True)
	encoded = message['encoded']

	if len(encoded) > 5000:
		response = {
			'predictions': [-1]
		}

		return jsonify(response)
	else:
		newline_id = 4
		encoded = list(split_list(encoded, newline_id))

		predictions = []
		for e in encoded:
			if predictions != []:
				predictions.append(0)

			if len(e) == 2:
				continue

			predictions.extend(list(np.argmax(model.predict(np.array([e])).squeeze()[1:-1], axis=-1)))
		predictions = [int(prediction) for prediction in predictions]

		response = {
			'predictions': predictions
		}

		return jsonify(response)
