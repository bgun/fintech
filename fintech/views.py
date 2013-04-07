from flask import render_template, redirect, url_for, jsonify, request

import pymongo as pg
import datetime

from fintech import app

@app.route("/")
def index():
    data = {
        "test": "asdf"
    }
    #return render_template("main.html", data=jsonify(data))
    return render_template("main.html", data=data)


@app.route("/api/<collection>")
def api(collection):
    client = pg.MongoClient("mongodb://gunho:this123is01928gunho23@fintech.m0.mongolayer.com:27017/fintech")
    db = client.fintech

    startdate = request.args.get("startdate", None)
    enddate = request.args.get("enddate", None)
    if None in (startdate, enddate):
        return "ERROR. Need `startdate` & `enddate`. Savvy?"

    results = db[collection].find({"date": {"$gt": startdate, "$lt": enddate}})
    
    client.close()

    # haxxx
    final = []
    for r in list(results):
        del r["_id"]
        final.append(r)

    return jsonify({"results":list(final)})


