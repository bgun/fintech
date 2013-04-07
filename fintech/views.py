from flask import render_template, redirect, url_for, jsonify

from fintech import app

@app.route("/")
def index():
    data = {
        "test": "asdf"
    }
    #return render_template("main.html", data=jsonify(data))
    return render_template("main.html", data=data)
