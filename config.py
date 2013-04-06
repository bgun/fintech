import os

SECRET_KEY=os.environ.get("SECRET_KEY")
HOST=os.environ.get("HOST")
PORT=int(os.environ.get("PORT"))

MONGOHQ_URL=os.environ.get("MONGOHQ_URL")

DEBUG=os.environ.get("DEBUG", False)

del os
