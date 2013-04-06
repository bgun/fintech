from flask import render_template, redirect, url_for

from fintech import app

@app.route("/")
def index():
    return "workin'"
