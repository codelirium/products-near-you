# -*- coding: utf-8 -*-

from flask import Blueprint, current_app, jsonify


api = Blueprint('api', __name__)


def data_path(filename):
    data_path = current_app.config['DATA_PATH']
    return u"%s/%s" % (data_path, filename)


@api.route('/search', methods=['GET'])
def search():
    return jsonify({'products': []})
