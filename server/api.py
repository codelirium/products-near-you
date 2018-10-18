# -*- coding: utf-8 -*-

from flask import Blueprint, current_app, request
from math import radians, cos, sin, asin, sqrt
import pandas as pd


api = Blueprint('api', __name__)


def data_path(filename):
    data_path = current_app.config['DATA_PATH']
    return u"%s/%s" % (data_path, filename)


def create_product_model():
    taggings = pd.merge(pd.read_csv(data_path('taggings.csv')),
                        pd.read_csv(data_path('shops.csv')),
                        left_on='shop_id',
                        right_on='id')
    taggings = pd.merge(taggings,
                        pd.read_csv(data_path('tags.csv')),
                        left_on='tag_id',
                        right_on='id')
    taggings = taggings.drop(columns=['id_x', 'tag_id', 'id_y', 'id'])

    products = pd.merge(pd.read_csv(data_path('products.csv')),
                        taggings,
                        on='shop_id')
    return products.drop(columns=['id', 'shop_id'])


def haversine_distance(longitude_source, latitude_source, longitude_destination, latitude_destination):
    """
        Calculate the great circle distance between two points
        on the earth (specified in decimal degrees)
    """

    # Convert decimal degrees to radians.
    longitude_source,     \
    latitude_source,      \
    longitude_destination,\
    latitude_destination = map(radians, [longitude_source,
                                         latitude_source,
                                         longitude_destination,
                                         latitude_destination])

    dlon = longitude_destination - longitude_source
    dlat = latitude_destination - latitude_source

    a = sin(dlat / 2) ** 2 + cos(latitude_source) * cos(latitude_destination) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))

    # Radius of earth in meters. Use 3956 for miles.
    r = 6371 * 1000

    return float(c * r)


def is_in_stock(model):
    return model[model.quantity > 0]


def is_tagged(model, tags):
    if len(str(tags)) > 0:
        return model[model['tag'].isin(str(tags).split(','))]
    return model


def deduplicate(model):
    return model.drop_duplicates(subset=['title', 'name'])


def is_nearby(model, longitude, latitude, radius):
    model['is_nearby'] = model.apply(lambda row: haversine_distance(float(row['lng']),
                                                                    float(row['lat']),
                                                                    float(longitude),
                                                                    float(latitude)) <= float(radius), axis=1)
    return model[model.is_nearby].drop(columns=['is_nearby'])


def topmost_popular(model, count):
    return model.sort_values(by='popularity', ascending=False).head((int(count)))


def to_json(model):
    return (model.groupby(['title', 'popularity', 'quantity', 'tag'], as_index=False)
            .apply(lambda row: row[['name', 'lng', 'lat']].to_dict('records')[0])
            .reset_index()
            .rename(columns={0: 'shop'})
            .to_json(orient='records'))


@api.route('/search', methods=['GET'])
def search():
    # The order of actions is optimised for speed.
    products = create_product_model()
    products = is_in_stock(products)
    products = is_tagged(products, request.args['tags'])
    products = deduplicate(products)
    products = is_nearby(products, request.args['longitude'], request.args['latitude'], request.args['radius'])
    products = topmost_popular(products, request.args['count'])
    products = to_json(products)
    return products


@api.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response
