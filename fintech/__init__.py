from flask import Flask
from pymongo import MongoClient


app = Flask(__name__)
app.config.from_object('config')


# client = MongoClient(app.config["MONGOHQ_URL"])


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


from fintech.views import *
